# The MurDough Matrix — Setup Guide

Follow these steps once to get the app live and shared between two devices.

---

## Step 1 — Create a free Supabase account

1. Go to https://supabase.com and click **Start for free**
2. Sign up with GitHub or email
3. Click **New project**, give it a name (e.g. "murdough-matrix"), pick a region close to you, and set a database password (save it somewhere)
4. Wait ~1 minute for the project to be ready

---

## Step 2 — Create the database tables

In your Supabase project, click **SQL Editor** in the left sidebar, paste the SQL below, and click **Run**.

> Two trusted people share one anon key for this app (see note in Step 3), so every policy below is intentionally permissive ("Allow all"). See the "Locking this down" section at the end for ways to tighten it without breaking the app.

```sql
-- Baby log
create table baby_log (
  id         bigint generated always as identity primary key,
  ts         text not null,
  amount     text,
  notes      text,
  breast     boolean default false,
  formula    boolean default false,
  wet        boolean default false,
  bm         boolean default false,
  guppy      boolean default false,
  tmj        boolean default false,
  tummy      boolean default false,
  pumped     boolean default false,
  d3         boolean default false,
  created_at timestamptz default now()
);
alter table baby_log enable row level security;
create policy "Allow all" on baby_log for all using (true) with check (true);

-- Blood pressure log
create table bp_log (
  id         bigint generated always as identity primary key,
  ts         text not null,
  sys        int not null,
  dia        int not null,
  created_at timestamptz default now()
);
alter table bp_log enable row level security;
create policy "Allow all" on bp_log for all using (true) with check (true);

-- Shared note (single row, overwritten in place)
create table shared_note (
  id         bigint generated always as identity primary key,
  note       text,
  created_at timestamptz default now()
);
alter table shared_note enable row level security;
create policy "Allow all" on shared_note for all using (true) with check (true);

-- Stream (two-way call) presence — WebRTC signalling itself runs over a
-- Supabase Realtime broadcast channel, not this table. This table just
-- tracks whether someone is currently live.
create table stream_session (
  id         bigint generated always as identity primary key,
  active     boolean default false,
  updated_at timestamptz default now()
);
alter table stream_session enable row level security;
create policy "Allow all" on stream_session for all using (true) with check (true);
insert into stream_session (active) values (false);

-- Monitor presence — same idea as stream_session, plus who's currently
-- broadcasting and how many viewers are connected. Per-viewer state
-- (talking indicator, etc.) is handled live over Realtime and never
-- written to the database.
create table monitor_session (
  id           bigint generated always as identity primary key,
  active       boolean default false,
  monitor_id   text,
  viewer_count int default 0,
  updated_at   timestamptz default now()
);
alter table monitor_session enable row level security;
create policy "Allow all" on monitor_session for all using (true) with check (true);
insert into monitor_session (active, viewer_count) values (false, 0);
```

> The app only ever **updates** the single row in `stream_session` and `monitor_session` — it never inserts a new one — so each table needs exactly one seed row, which the `insert` lines above create. If you ever truncate or recreate these tables, re-run the matching `insert` line or Stream/Monitor presence checks will silently do nothing.
>
> If your project already has these tables from an earlier version of the app, only run the `create table` / `insert` lines for tables you're missing — Supabase will error on tables or rows that already exist, which is safe to ignore.

### Storage bucket for Media

The Media tab doesn't use a database table — uploaded photos/videos go straight into a Supabase **Storage** bucket. Create one bucket named `media` (Step 3 below) and set its access policy to allow the anon key to read/write, the same trust tradeoff as the "Allow all" table policies above.

---

## Step 3 — Get your API keys and create a storage bucket

1. In Supabase, go to **Project Settings → API**
2. Copy the **Project URL** (looks like `https://abcdefgh.supabase.co`)
3. Copy the **anon / public** key (long string starting with `eyJ...`)
4. Go to **Storage** in the left sidebar and create a new bucket named `media`. Make it **public**, or add a storage policy allowing the anon key to `select`/`insert`/`delete` — otherwise Media tab uploads and the gallery will fail with a permissions error.

The app has these values hardcoded directly in `index.html` rather than entered per-device — this is intentional for a two-person shared app, so there's no separate config step needed on each device. If you regenerate your Supabase project or anon key, update the `SB_URL` and `SB_KEY` constants near the top of the `<script>` block in `index.html`.

---

## Step 4 — Host the app on GitHub Pages

1. Push `index.html`, `manifest.json`, `sw.js`, `_headers`, and your `icons/` folder to the `murdough-matrix` repo on GitHub
2. In the repo, go to **Settings → Pages**
3. Under **Build and deployment → Source**, choose **Deploy from a branch**
4. Pick the branch (e.g. `main`) and `/ (root)` as the folder, then **Save**
5. GitHub gives you a live URL: `https://<your-username>.github.io/murdough-matrix/`
6. Share that URL with the other person

Pushing a new commit to that branch redeploys automatically — usually live within a minute or two.

---

## Step 5 — Add to home screen (recommended)

### On iPhone/iPad:
1. Open the app URL in **Safari**
2. Tap the Share button (box with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Tap Add — it now works like a real app

### On Android:
1. Open the app URL in **Chrome**
2. Tap the three-dot menu
3. Tap **Add to Home screen**

### On desktop Chrome:
1. Open the app URL
2. Click the install icon (⊕) in the address bar
3. Click Install

---

## Updating the app

Use the **Check for update** button in the Settings tab — it unregisters the service worker, clears the cache, and reloads, so both devices pick up the latest pushed-to-GitHub version without needing to manually clear browser data.

---

## Locking this down (optional, for the curious)

The "Allow all" policies mean anyone with the anon key (visible in the page source) can read and write every table. For two trusted people sharing one link, this is a reasonable tradeoff for simplicity — there's no login step, and both people are meant to see and edit everything. If you ever want tighter rules without adding real user accounts, options include:

- **Restrict by HTTP origin/referrer at the Supabase edge level** (doesn't stop someone with the raw key + URL, but blocks casual scraping from other origins)
- **Add a Supabase Edge Function** as a thin authenticated proxy in front of the REST endpoints, instead of calling PostgREST directly from the browser
- **Add real Supabase Auth** (e.g. magic link for just the two of you) and rewrite policies to check `auth.uid()` instead of `true`

These are all bigger changes than the current app architecture assumes (no login UI exists today), so only worth doing if the trust model changes.

---

## Troubleshooting

**"Could not load" error** — double-check your Supabase URL and key in `index.html` are correct (no trailing slash on the URL), and that all four tables from Step 2 exist with their seed rows.

**Entries not showing** — make sure the SQL from Step 2 ran successfully for the relevant table, especially the Row Level Security policy.

**Changes not syncing** — the app auto-refreshes every 30 seconds, or tap the ↻ button manually.

**Media uploads failing** — confirm the `media` storage bucket exists and is named exactly `media`.
