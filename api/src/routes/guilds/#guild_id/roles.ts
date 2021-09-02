import { Request, Response, Router } from "express";
import {
	Role,
	getPermission,
	Snowflake,
	Member,
	GuildRoleCreateEvent,
	GuildRoleUpdateEvent,
	GuildRoleDeleteEvent,
	emitEvent,
	Config
} from "@fosscord/util";
import { HTTPError } from "lambert-server";

import { check } from "../../../util/instanceOf";
import { RoleModifySchema } from "../../../schema/Roles";
import { DiscordApiErrors } from "../../../util/Constants";

const router: Router = Router();

router.get("/", async (req: Request, res: Response) => {
	const guild_id = req.params.guild_id;

	await Member.IsInGuildOrFail(req.user_id, guild_id);

	const roles = await Role.find({ guild_id: guild_id });

	return res.json(roles);
});

router.post("/", check(RoleModifySchema), async (req: Request, res: Response) => {
	const guild_id = req.params.guild_id;
	const body = req.body as RoleModifySchema;

	const perms = await getPermission(req.user_id, guild_id);
	perms.hasThrow("MANAGE_ROLES");

	const role_count = await Role.count({ guild_id });
	const { maxRoles } = Config.get().limits.guild;

	if (role_count > maxRoles) throw DiscordApiErrors.MAXIMUM_ROLES.withParams(maxRoles);

	const role = {
		position: 0,
		hoist: false,
		color: 0, // default value
		...body,
		id: Snowflake.generate(),
		guild_id: guild_id,
		managed: false,
		permissions: String(perms.bitfield & (body.permissions || 0n)),
		tags: undefined
	};

	await Promise.all([
		Role.insert(role),
		emitEvent({
			event: "GUILD_ROLE_CREATE",
			guild_id,
			data: {
				guild_id,
				role: role
			}
		} as GuildRoleCreateEvent)
	]);

	res.json(role);
});

router.delete("/:role_id", async (req: Request, res: Response) => {
	const guild_id = req.params.guild_id;
	const { role_id } = req.params;
	if (role_id === guild_id) throw new HTTPError("You can't delete the @everyone role");

	const permissions = await getPermission(req.user_id, guild_id);
	permissions.hasThrow("MANAGE_ROLES");

	await Promise.all([
		Role.delete({
			id: role_id,
			guild_id: guild_id
		}),
		emitEvent({
			event: "GUILD_ROLE_DELETE",
			guild_id,
			data: {
				guild_id,
				role_id
			}
		} as GuildRoleDeleteEvent)
	]);

	res.sendStatus(204);
});

// TODO: check role hierarchy

router.patch("/:role_id", check(RoleModifySchema), async (req: Request, res: Response) => {
	const { role_id, guild_id } = req.params;
	const body = req.body as RoleModifySchema;

	const perms = await getPermission(req.user_id, guild_id);
	perms.hasThrow("MANAGE_ROLES");

	const role = new Role({ ...body, id: role_id, guild_id, permissions: String(perms.bitfield & (body.permissions || 0n)) });

	await Promise.all([
		role.save(),
		emitEvent({
			event: "GUILD_ROLE_UPDATE",
			guild_id,
			data: {
				guild_id,
				role
			}
		} as GuildRoleUpdateEvent)
	]);

	res.json(role);
});

export default router;
