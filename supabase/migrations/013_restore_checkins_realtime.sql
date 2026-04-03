-- Migration 013: Restore check_ins realtime publication
--
-- Migration 005 did DROP TABLE courts CASCADE, which dropped check_ins (FK
-- dependency) and silently removed it from the supabase_realtime publication.
-- When check_ins was recreated, it was not added back.
--
-- This restores realtime so the friends activity feed and court check-in
-- counts update automatically without requiring a pull-to-refresh.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'check_ins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;
  END IF;
END $$;
