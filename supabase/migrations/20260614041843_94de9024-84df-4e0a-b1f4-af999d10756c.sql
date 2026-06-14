
REVOKE EXECUTE ON FUNCTION public.handle_emission_log() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_challenge_complete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
