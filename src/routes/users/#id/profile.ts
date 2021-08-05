import { Router, Request, Response } from "express";
import { getPublicUser } from "../../../util/User";

const router: Router = Router();

router.get("/", async (req: Request, res: Response) => {
	const user = await getPublicUser(req.params.id, { user_data: true })

    res.json({
        connected_accounts: user.user_data.connected_accounts,
        premium_guild_since: null, // TODO
        premium_since: null, // TODO
        user: {
            username: user.username,
            discriminator: user.discriminator,
            id: user.id,
            public_flags: user.public_flags,
            avatar: user.avatar,
            bio: req.user_bot ? null : user.bio,
        }
    });
});

export default router;
