# Baby Log — Setup Guide

Follow these steps once to get the app live and shared between devices.

---

## Step 1 — Create a free Supabase account

1. Go to https://supabase.com and click **Start for free**
2. Sign up with GitHub or email
3. Click **New project**, give it a name (e.g. "baby-log"), pick a region close to you, and set a database password (save it somewhere)
4. Wait ~1 minute for the project to be ready

---

## Step 2 — Create the database table

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Paste and run this SQL:

```sql
create table baby_log (
  id         bigint generated always as identity primary key,
  ts         text not null,
  amount     text,
  notes      text,
  wet        boolean default false,
  bm         boolean default false,
  pumped     boolean default false,
  exercises  boolean default false,
  tummy      boolean default false,
  created_at timestamptz default now()
);

alter table baby_log enable row level security;

create policy "Allow all" on baby_log
  for all using (true) with check (true);
```

3. Click **Run** — you should see "Success"

---

## Step 3 — Get your API keys

1. In Supabase, go to **Project Settings → API**
2. Copy the **Project URL** (looks like `https://abcdefgh.supabase.co`)
3. Copy the **anon / public** key (long string starting with `eyJ...`)

---

## Step 4 — Host the app on Netlify

1. Go to https://netlify.com and sign up for free
2. Click **Add new site → Deploy manually**
3. Drag and drop the entire `baby-log-pwa` folder onto the page
4. Netlify gives you a live URL like `https://amazing-name-123.netlify.app`
5. Share that URL with anyone who needs to use the app

---

## Step 5 — First launch

1. Open the app URL in your browser
2. Enter your **Supabase URL** and **anon key** in the config fields and tap Save
3. Start logging!

The config is saved to your device's local storage — you only need to enter it once per device.

---

## Step 6 — Add to home screen (optional but recommended)

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

## Sharing with others

Send them the Netlify URL and your Supabase URL + anon key.
They enter those once on their device and all entries are shared in real time.

The log view shows the last 24 hours of entries. The CSV download includes all entries ever recorded.

---

## Troubleshooting

**"Could not load" error** — double-check your Supabase URL and key are correct (no trailing slash on the URL).

**Entries not showing** — make sure the SQL from Step 2 ran successfully, especially the Row Level Security policy.

**Changes not syncing** — the app auto-refreshes every 30 seconds, or tap the ↻ button manually.
