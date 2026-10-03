-- No signed-in user or visitor can read or write stamp keys through the API.
-- The server uses a separate key that skips these rules.

create policy stamp_keys_deny
  on public.stamp_keys
  for all
  to anon, authenticated
  using (false)
  with check (false);
