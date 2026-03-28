export type FriendshipStatus = "pending" | "accepted" | "declined";

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
};

export type FriendProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  skill_level: string | null;
  play_style: string[] | null;
};

export type FriendWithProfile = Friendship & {
  friend: FriendProfile;
};

export type FriendActivity = {
  friendship_id: string;
  friend_id: string;
  friend_username: string;
  friend_avatar_url: string | null;
  court_id: string;
  court_name: string;
  court_address: string | null;
  checked_in_at: string;
  expires_at: string;
};

export type UserSearchResult = {
  id: string;
  username: string;
  avatar_url: string | null;
  skill_level: string | null;
  friendship_status: FriendshipStatus | null;
  friendship_id: string | null;
  is_requester: boolean | null;
};
