import { Router, Request, Response } from "express";
import { Role, Guild, Snowflake, Config, User, Member, Channel } from "@fosscord/util";
import { check } from "./../../util/instanceOf";
import { GuildCreateSchema } from "../../schema/Guild";
import { DiscordApiErrors } from "../../util/Constants";

const router: Router = Router();

//TODO: create default channel

router.post("/", check(GuildCreateSchema), async (req: Request, res: Response) => {
	const body = req.body as GuildCreateSchema;

	if (req.user_id !== process.env.INSTANCE_OWNER_ID) {
		const { maxGuilds } = Config.get().limits.user;
		const guild_count = await Member.count({ id: req.user_id });
		if (guild_count >= maxGuilds) {
			throw DiscordApiErrors.MAXIMUM_GUILDS.withParams(maxGuilds);
		}
	}

	const guild_id = Snowflake.generate();

	const [guild, role] = await Promise.all([
		Guild.insert({
			name: body.name,
			region: Config.get().regions.default,
			owner_id: req.user_id,
			afk_timeout: 300,
			default_message_notifications: 0,
			explicit_content_filter: 0,
			features: [],
			id: guild_id,
			max_members: 250000,
			max_presences: 250000,
			max_video_channel_users: 25,
			presence_count: 0,
			member_count: 0, // will automatically be increased by addMember()
			mfa_level: 0,
			preferred_locale: "en-US",
			premium_subscription_count: 0,
			premium_tier: 0,
			system_channel_flags: 0,
			unavailable: false,
			verification_level: 0,
			welcome_screen: {
				enabled: false,
				description: "No description",
				welcome_channels: []
			},
			widget_enabled: false
		}),
		Role.insert({
			id: guild_id,
			guild_id: guild_id,
			color: 0,
			hoist: false,
			managed: false,
			mentionable: false,
			name: "@everyone",
			permissions: String("2251804225"),
			position: 0
		})
	]);

	if (!body.channels || !body.channels.length) body.channels = [{ id: "01", type: 0, name: "general" }];

	const ids = new Map();

	body.channels.forEach((x) => {
		if (x.id) {
			ids.set(x.id, Snowflake.generate());
		}
	});

	await Promise.all(
		body.channels?.map((x) => {
			var id = ids.get(x.id) || Snowflake.generate();

			// TODO: should we abort if parent_id is a category? (to disallow sub category channels)
			var parent_id = ids.get(x.parent_id);

			return Channel.createChannel({ ...x, guild_id, id, parent_id }, req.user_id, {
				keepId: true,
				skipExistsCheck: true,
				skipPermissionCheck: true,
				skipEventEmit: true
			});
		})
	);

	await Member.addToGuild(req.user_id, guild_id);
	if (process.env.INSTANCE_OWNER_ID) Member.addToGuild(process.env.INSTANCE_OWNER_ID, guild.id);

	res.status(201).json({ id: guild_id });
});

export default router;
