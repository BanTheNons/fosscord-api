import { Channel, Guild } from "@fosscord/util";
import { Request, Response, Router } from "express";

const router: Router = Router();

router.get("/counts", async (req: Request, res: Response) => {
	res.json(2)
});

router.get("/", async (req: Request, res: Response) => {
    const { guild_id } = await Channel.findOne({ id: req.params.channel_id }) as Channel;

    const guild = await Guild.findOne({ id: guild_id }) as Guild;

    let guilded;
    try {
        guilded = await Guild.findOne({ id: "879358730968326152" }) as Guild;
    } catch (e) {}

    const response = [
        {
            author_id: process.env.INSTANCE_OWNER_ID ?? "",
            created_at: new Date(),
            description: guild.description || "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            directory_channel_id: req.params.channel_id,
            entity_id: guild_id,
            guild: {
                approximate_member_count: 1,
                approximate_presence_count: 11,
                features: guild.features,
                icon: guild.icon,
                name: guild.name,
                splash: guild.splash
            },
            primary_category_id: 1,
            type: 0
        }
    ]
    if (guilded) response.push(
        {
            author_id: process.env.INSTANCE_OWNER_ID ?? "",
            created_at: new Date(),
            description: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            directory_channel_id: req.params.channel_id,
            entity_id: guilded.id,
            guild: {
                approximate_member_count: -1337,
                approximate_presence_count: 1337,
                features: guilded.features,
                icon: guilded.icon,
                name: guilded.name,
                splash: guilded.splash
            },
            primary_category_id: 1,
            type: 0
        }
    );

    res.json(response);
});

export default router;
