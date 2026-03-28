import { supabase, getSupabaseEnvStatus } from "./supabase";
import type {
  Friendship,
  FriendWithProfile,
  FriendActivity,
  UserSearchResult,
  FriendshipStatus,
} from "@/src/types/friends";

export type UserPublicProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  skill_level: string | null;
  play_style: string[] | null;
  created_at: string;
  friendship_id: string | null;
  friendship_status: FriendshipStatus | null;
  is_requester: boolean | null;
};

async function getAuthUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export type ActiveCheckIn = {
  court_id: string;
  court_name: string;
  court_address: string | null;
  checked_in_at: string;
};

export async function getUserActiveCheckIn(
  userId: string
): Promise<ActiveCheckIn | null> {
  const env = getSupabaseEnvStatus();
  if (!env.configured || !supabase) return null;

  const { data: checkIn } = await supabase
    .from("check_ins")
    .select("court_id, created_at, expires_at")
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!checkIn) return null;

  const { data: court } = await supabase
    .from("courts")
    .select("id, name, address")
    .eq("id", checkIn.court_id)
    .single();

  if (!court) return null;

  return {
    court_id: court.id,
    court_name: court.name,
    court_address: court.address,
    checked_in_at: checkIn.created_at,
  };
}

export async function getUserPublicProfile(
  targetId: string
): Promise<UserPublicProfile | null> {
  const env = getSupabaseEnvStatus();
  if (!env.configured || !supabase) return null;

  const userId = await getAuthUserId();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, skill_level, play_style, created_at")
    .eq("id", targetId)
    .single();

  if (error || !profile?.username) return null;

  let friendship_id: string | null = null;
  let friendship_status: FriendshipStatus | null = null;
  let is_requester: boolean | null = null;

  if (userId && userId !== targetId) {
    const { data: f } = await supabase
      .from("friendships")
      .select("id, requester_id, status")
      .or(
        `and(requester_id.eq.${userId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${userId})`
      )
      .maybeSingle();

    if (f) {
      friendship_id = f.id;
      friendship_status = f.status as FriendshipStatus;
      is_requester = f.requester_id === userId;
    }
  }

  return {
    id: profile.id,
    username: profile.username,
    avatar_url: profile.avatar_url,
    skill_level: profile.skill_level,
    play_style: profile.play_style,
    created_at: profile.created_at,
    friendship_id,
    friendship_status,
    is_requester,
  };
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const env = getSupabaseEnvStatus();
  if (!env.configured || !supabase) return [];

  const userId = await getAuthUserId();
  if (!userId) return [];

  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, skill_level")
    .ilike("username", `%${trimmed}%`)
    .neq("id", userId)
    .not("username", "is", null)
    .limit(20);

  if (error || !profiles || profiles.length === 0) return [];

  const profileIds = profiles.map((p) => p.id);

  const { data: friendships } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .or(
      `requester_id.in.(${profileIds.join(",")}),addressee_id.in.(${profileIds.join(",")})`
    );

  const friendshipMap = new Map<
    string,
    { id: string; status: FriendshipStatus; is_requester: boolean }
  >();
  if (friendships) {
    for (const f of friendships) {
      const otherId =
        f.requester_id === userId ? f.addressee_id : f.requester_id;
      if (profileIds.includes(otherId)) {
        friendshipMap.set(otherId, {
          id: f.id,
          status: f.status as FriendshipStatus,
          is_requester: f.requester_id === userId,
        });
      }
    }
  }

  return profiles.map((p) => ({
    id: p.id,
    username: p.username as string,
    avatar_url: p.avatar_url,
    skill_level: p.skill_level,
    friendship_status: friendshipMap.get(p.id)?.status ?? null,
    friendship_id: friendshipMap.get(p.id)?.id ?? null,
    is_requester: friendshipMap.get(p.id)?.is_requester ?? null,
  }));
}

export async function sendFriendRequest(
  addresseeId: string
): Promise<Friendship | null> {
  const env = getSupabaseEnvStatus();
  if (!env.configured || !supabase) return null;

  const userId = await getAuthUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("friendships")
    .insert({ requester_id: userId, addressee_id: addresseeId })
    .select()
    .single();

  if (error) return null;
  return data as Friendship;
}

export async function acceptFriendRequest(
  friendshipId: string
): Promise<boolean> {
  const env = getSupabaseEnvStatus();
  if (!env.configured || !supabase) return false;

  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", friendshipId);

  return !error;
}

export async function declineFriendRequest(
  friendshipId: string
): Promise<boolean> {
  const env = getSupabaseEnvStatus();
  if (!env.configured || !supabase) return false;

  const { error } = await supabase
    .from("friendships")
    .update({ status: "declined", updated_at: new Date().toISOString() })
    .eq("id", friendshipId);

  return !error;
}

export async function removeFriend(friendshipId: string): Promise<boolean> {
  const env = getSupabaseEnvStatus();
  if (!env.configured || !supabase) return false;

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  return !error;
}

export async function getSentRequests(): Promise<FriendWithProfile[]> {
  const env = getSupabaseEnvStatus();
  if (!env.configured || !supabase) return [];

  const userId = await getAuthUserId();
  if (!userId) return [];

  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status, created_at, updated_at")
    .eq("requester_id", userId)
    .eq("status", "pending");

  if (error || !friendships || friendships.length === 0) return [];

  const addresseeIds = friendships.map((f) => f.addressee_id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, skill_level, play_style")
    .in("id", addresseeIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  return friendships
    .map((f) => {
      const profile = profileMap.get(f.addressee_id);
      if (!profile) return null;
      return {
        ...f,
        status: f.status as FriendshipStatus,
        friend: {
          id: profile.id,
          username: profile.username ?? "",
          avatar_url: profile.avatar_url,
          skill_level: profile.skill_level,
          play_style: profile.play_style,
        },
      };
    })
    .filter((f): f is FriendWithProfile => f !== null);
}

export async function getFriends(): Promise<FriendWithProfile[]> {
  const env = getSupabaseEnvStatus();
  if (!env.configured || !supabase) return [];

  const userId = await getAuthUserId();
  if (!userId) return [];

  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status, created_at, updated_at")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq("status", "accepted");

  if (error || !friendships || friendships.length === 0) return [];

  const friendIds = friendships.map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, skill_level, play_style")
    .in("id", friendIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  return friendships
    .map((f) => {
      const friendId = f.requester_id === userId ? f.addressee_id : f.requester_id;
      const profile = profileMap.get(friendId);
      if (!profile) return null;
      return {
        ...f,
        status: f.status as FriendshipStatus,
        friend: {
          id: profile.id,
          username: profile.username ?? "",
          avatar_url: profile.avatar_url,
          skill_level: profile.skill_level,
          play_style: profile.play_style,
        },
      };
    })
    .filter((f): f is FriendWithProfile => f !== null);
}

export async function getPendingRequests(): Promise<FriendWithProfile[]> {
  const env = getSupabaseEnvStatus();
  if (!env.configured || !supabase) return [];

  const userId = await getAuthUserId();
  if (!userId) return [];

  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status, created_at, updated_at")
    .eq("addressee_id", userId)
    .eq("status", "pending");

  if (error || !friendships || friendships.length === 0) return [];

  const requesterIds = friendships.map((f) => f.requester_id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, skill_level, play_style")
    .in("id", requesterIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  return friendships
    .map((f) => {
      const profile = profileMap.get(f.requester_id);
      if (!profile) return null;
      return {
        ...f,
        status: f.status as FriendshipStatus,
        friend: {
          id: profile.id,
          username: profile.username ?? "",
          avatar_url: profile.avatar_url,
          skill_level: profile.skill_level,
          play_style: profile.play_style,
        },
      };
    })
    .filter((f): f is FriendWithProfile => f !== null);
}

export async function getFriendActivity(): Promise<FriendActivity[]> {
  const env = getSupabaseEnvStatus();
  if (!env.configured || !supabase) return [];

  const userId = await getAuthUserId();
  if (!userId) return [];

  const { data: friendships } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq("status", "accepted");

  if (!friendships || friendships.length === 0) return [];

  const friendIds = friendships.map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id
  );

  // Match on user_id (new typed column) OR anonymous_user_id (UUID stored as text,
  // for check-ins made before migration 011 or with older app versions).
  const orFilter = friendIds
    .map((id) => `user_id.eq.${id},anonymous_user_id.eq.${id}`)
    .join(",");

  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("user_id, anonymous_user_id, court_id, created_at, expires_at")
    .or(orFilter)
    .gt("expires_at", new Date().toISOString());

  if (!checkIns || checkIns.length === 0) return [];

  // Resolve the friend's UUID from whichever column matched
  const resolvedCheckIns = checkIns.map((ci) => ({
    ...ci,
    friend_id: (ci.user_id ?? ci.anonymous_user_id) as string,
  }));

  const checkedInIds = [...new Set(resolvedCheckIns.map((c) => c.friend_id))];
  const courtIds = [...new Set(resolvedCheckIns.map((c) => c.court_id))];

  const [{ data: profiles }, { data: courts }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", checkedInIds),
    supabase
      .from("courts")
      .select("id, name, address")
      .in("id", courtIds),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const courtMap = new Map((courts ?? []).map((c) => [c.id, c]));
  const friendshipIdMap = new Map(
    friendships.map((f) => [
      f.requester_id === userId ? f.addressee_id : f.requester_id,
      f.id,
    ])
  );

  return resolvedCheckIns
    .map((ci) => {
      const friendId = ci.friend_id;
      const profile = profileMap.get(friendId);
      const court = courtMap.get(ci.court_id);
      if (!profile?.username || !court) return null;
      return {
        friendship_id: friendshipIdMap.get(friendId) ?? "",
        friend_id: friendId,
        friend_username: profile.username,
        friend_avatar_url: profile.avatar_url,
        court_id: ci.court_id,
        court_name: court.name,
        court_address: court.address,
        checked_in_at: ci.created_at,
        expires_at: ci.expires_at,
      } as FriendActivity;
    })
    .filter((a): a is FriendActivity => a !== null);
}

export function subscribeToFriendActivity(
  callback: (activity: FriendActivity[]) => void
): () => void {
  const env = getSupabaseEnvStatus();
  if (!env.configured || !supabase) return () => {};

  getFriendActivity().then(callback);

  const channel = supabase
    .channel("friend-activity")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "check_ins" },
      () => getFriendActivity().then(callback)
    )
    .subscribe();

  return () => channel.unsubscribe();
}

export function subscribeToFriendRequests(
  callback: (requests: FriendWithProfile[]) => void
): () => void {
  const env = getSupabaseEnvStatus();
  if (!env.configured || !supabase) return () => {};

  getPendingRequests().then(callback);

  const channel = supabase
    .channel("friend-requests")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "friendships" },
      () => getPendingRequests().then(callback)
    )
    .subscribe();

  return () => channel.unsubscribe();
}
