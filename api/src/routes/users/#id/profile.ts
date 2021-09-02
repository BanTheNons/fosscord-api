import { Router, Request, Response } from "express";
import { User } from "../../../../../util/dist";

const router: Router = Router();

router.get("/", async (req: Request, res: Response) => {
	const user = await User.getPublicUser(req.params.id, { relations: ["connected_accounts"] });

    res.json({
        connected_accounts: user.user_data.connected_accounts,
        premium_guild_since: new Date(1), // TODO
        premium_since: new Date(1), // TODO
        user: {
            username: user.username,
            discriminator: user.discriminator,
            id: user.id,
            public_flags: user.public_flags,
            avatar: user.avatar,
            accent_color: user.accent_color,
            banner: user.banner,
            bio: req.user_bot ? null : user.bio,
            bot: user.bot
        }
    });
});

export default router;
