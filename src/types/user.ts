export type PlayStyle =
  | "ball_handler"
  | "shooter"
  | "facilitator"
  | "big"
  | "slasher"
  | "defender";

export type SkillLevel = "casual" | "intermediate" | "competitive";

export const PLAY_STYLE_LABELS: Record<PlayStyle, string> = {
  ball_handler: "Ball Handler",
  shooter: "Shooter",
  facilitator: "Facilitator",
  big: "Big",
  slasher: "Slasher",
  defender: "Defender",
};

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  casual: "Casual",
  intermediate: "Intermediate",
  competitive: "Competitive",
};

export type UserProfile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  play_style: PlayStyle[] | null;
  skill_level: SkillLevel | null;
  username_updated_at: string | null;
  username_change_count: number;
  created_at: string;
  updated_at: string;
};
