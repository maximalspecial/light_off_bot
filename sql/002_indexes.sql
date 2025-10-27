create index if not exists idx_daily_mode_date_queue on daily_mode(date, queue);
create index if not exists idx_jobs_run_at on jobs(run_at);
create index if not exists idx_addresses_user on addresses(user_id);
create index if not exists idx_subs_user_active on subs(user_id) where active;
