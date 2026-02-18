export interface CheckIn {
  id: string;
  court_id: string;
  anonymous_user_id: string;
  created_at: string;
  expires_at: string;
}

export interface CheckInInsert {
  court_id: string;
  anonymous_user_id: string;
}

export interface ActiveCheckInsResponse {
  court_id: string;
  count: number;
  is_user_checked_in: boolean;
}
