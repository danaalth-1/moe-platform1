/*
# Revoke EXECUTE on handle_new_user from anon and authenticated

1. Security
- The `handle_new_user` function is a trigger that runs automatically on new
  user signup. It should NOT be callable directly via the REST API by anon
  or authenticated users.
- Revoke EXECUTE from public, anon, and authenticated roles.
- The trigger still works because it runs as the function owner (postgres).
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;