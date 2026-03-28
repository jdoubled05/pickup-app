import { supabase, getSupabaseEnvStatus } from "./supabase";
import type {
  Friendship,
  FriendWithProfile,
  FriendActivity,
  UserSearchResult,
  FriendshipStatus,
} from "@/src/types/friends";

async function getAuthUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
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

  // Friends use their UUID as anonymous_user_id (set via migrateAnonymousData on sign-in)
  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("anonymous_user_id, court_id, created_at, expires_at")
    .in("anonymous_user_id", friendIds)
    .gt("expires_at", new Date().toISOString());

  if (!checkIns || checkIns.length === 0) return [];

  const checkedInIds = [...new Set(checkIns.map((c) => c.anonymous_user_id))];
  const courtIds = [...new Set(checkIns.map((c) => c.court_id))];

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

  return checkIns
    .map((ci) => {
      const profile = profileMap.get(ci.anonymous_user_id);
      const court = courtMap.get(ci.court_id);
      if (!profile?.username || !court) return null;
      return {
        friendship_id: friendshipIdMap.get(ci.anonymous_user_id) ?? "",
        friend_id: ci.anonymous_user_id,
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
