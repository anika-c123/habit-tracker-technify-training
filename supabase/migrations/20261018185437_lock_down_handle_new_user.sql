-- handle_new_user() should only ever run as the sign-up trigger. Postgres lets
-- everyone execute new functions by default, which exposes it at
-- /rest/v1/rpc/handle_new_user. The trigger keeps working without these grants.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
