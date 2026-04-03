export interface CheckIn {
  id: string;
  court_id: string;
  anonymous_user_id: string;
  user_id: string | null;
  created_at: string;
  expires_at: string;
}

export interface CheckInInsert {
  court_id: string;
  anonymous_user_id: string;
  user_id?: string | null;
}

export interface ActiveCheckInsResponse {
  court_id: string;
  count: number;
  is_user_checked_in: boolean;
}

export interface CheckInHistoryItem {
  id: string;
  court_id: string;
  court_name: string;
  court_address: string | null;
  checked_in_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface CheckInDetailFriend {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

export interface CheckInDetailData {
  id: string;
  court_id: string;
  court_name: string;
  court_address: string | null;
  checked_in_at: string;
  expires_at: string;
  is_active: boolean;
  /** null = can't determine (created_at not yet in DB) */
  is_manual_checkout: boolean | null;
  friends_at_court: CheckInDetailFriend[];
}
