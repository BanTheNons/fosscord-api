import { Schema, model, Types, Document } from "mongoose";
import db from "../util/Database";
import { ChannelModel } from "./Channel";
import { EmojiModel } from "./Emoji";
import { MemberModel } from "./Member";
import { RoleModel } from "./Role";

export interface GuildDocument extends Document, Guild {
	id: string;
}

export interface Guild {
	id: string;
	afk_channel_id?: string;
	afk_timeout?: number;
	application_id?: string;
	banner?: string;
	default_message_notifications?: number;
	description?: string;
	discovery_splash?: string;
	explicit_content_filter?: number;
	features: string[];
	icon?: string;
	large?: boolean;
	max_members?: number; // e.g. default 100.000
	max_presences?: number;
	max_video_channel_users?: number; // ? default: 25, is this max 25 streaming or watching
	member_count?: number;
	presence_count?: number; // users online
	// members?: Member[]; // * Members are stored in a seperate collection
	// roles: Role[]; // * Role are stored in a seperate collection
	// channels: GuildChannel[]; // * Channels are stored in a seperate collection
	// emojis: Emoji[];  // * Emojis are stored in a seperate collection
	// voice_states: []; // * voice_states are stored in a seperate collection
    //TODO:
	presences?: object[];
	mfa_level?: number;
	name: string;
	owner_id: string;
	preferred_locale?: string; // only community guilds can choose this
	premium_subscription_count?: number;
	premium_tier?: number; // nitro boost level
	public_updates_channel_id?: string;
	region?: string;
	rules_channel_id?: string;
	splash?: string;
	system_channel_flags?: number;
	system_channel_id?: string;
	unavailable?: boolean;
	vanity_url?: {
		code: string;
		uses: number;
	};
	verification_level?: number;
	welcome_screen: {
		enabled: boolean;
		description: string;
		welcome_channels: { 
		description: string;
	    emoji_id?: string;
	    emoji_name: string;
	    channel_id: string }[];
	};
	widget_channel_id?: string;
	widget_enabled?: boolean;
}

export const GuildSchema = new Schema({
	id: { type: String, required: true },
	afk_channel_id: String,
	afk_timeout: Number,
	application_id: String,
	banner: String,
	default_message_notifications: Number,
	description: String,
	discovery_splash: String,
	explicit_content_filter: Number,
	features: { type: [String], default: [] },
	icon: String,
	large: Boolean,
	max_members: { type: Number, default: 100000 },
	max_presences: Number,
	max_video_channel_users: { type: Number, default: 25 },
	member_count: Number,
	presences: { type: [Object], default: [] },
	presence_count: Number,
	mfa_level: Number,
	name: { type: String, required: true },
	owner_id: { type: String, required: true },
	preferred_locale: String,
	premium_subscription_count: Number,
	premium_tier: Number,
	public_updates_channel_id: String,
	region: String,
	rules_channel_id: String,
	splash: String,
	system_channel_flags: Number,
	system_channel_id: String,
	unavailable: Boolean,
	vanity_url: {
		code: String,
		uses: Number
	},
	verification_level: Number,
	voice_states: { type: [Object], default: [] },
	welcome_screen: {
		enabled: Boolean,
		description: String,
		welcome_channels: [{ 
		description: String,
	    emoji_id: String,
	    emoji_name: String,
	    channel_id: String }],
	},
	widget_channel_id: String,
	widget_enabled: Boolean,
});

GuildSchema.virtual("channels", {
	ref: ChannelModel,
	localField: "id",
	foreignField: "guild_id",
	justOne: false,
	autopopulate: true,
});

GuildSchema.virtual("roles", {
	ref: RoleModel,
	localField: "id",
	foreignField: "guild_id",
	justOne: false,
	autopopulate: true,
});

// nested populate is needed for member users: https://gist.github.com/yangsu/5312204
GuildSchema.virtual("members", {
	ref: MemberModel,
	localField: "id",
	foreignField: "guild_id",
	justOne: false,
});

GuildSchema.virtual("emojis", {
	ref: EmojiModel,
	localField: "id",
	foreignField: "guild_id",
	justOne: false,
	autopopulate: true,
});

GuildSchema.virtual("joined_at", {
	ref: MemberModel,
	localField: "id",
	foreignField: "guild_id",
	justOne: true,
}).get((member: any, virtual: any, doc: any) => {
	return member?.joined_at;
});

// @ts-ignore
export const GuildModel = db.model<GuildDocument>("Guild", GuildSchema, "guilds");
