# Vanworks Admin Panel

A modern admin panel for Vanworks — manage **Orders**, **Van Models**, and **Users** — built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Supabase (Auth + Postgres + Storage).

The UI uses a subtle blue-grey theme with dedicated layouts for auth pages, the dashboard (with a left sidebar), and shareable order-detail pages.

---

## Features

- **Authentication (Supabase)**
  - Email/password sign in & sign up
  - Email confirmation, forgot password, reset password
  - "Remember me" (persisted email on the device)
  - Admin **approval** flow (new users land in *Pending approval* until an admin enables them)
- **Dashboard** with quick stats and a left-side menu for **Orders**, **Van Models**, **Users**.
- **Users**
  - Photo, full name, email, role badge, approval status
  - Search, multi-column sort, role select (admin/user), approve/revoke
- **Van Models**
  - Card grid + **New Model** button
  - Editor with three tabs:
    - **Info** — image upload, model name, base price
    - **Sales Form** — section-based specs (Interior, Kitchen, Electrical, Wall Color, Floor Color, Cabin Add-Ons, Misc Add-Ons, HVAC, Garage, Exterior, Exterior Add-Ons). Wall/floor colors include per-item images. Add-ons & colors render as checkboxes on orders.
    - **Build Form** — section-based specs (Interior Package, HVAC, Windows, Sleeping, Lighting, Kitchen, Water System, Storage, Electrical, Safety Package, Exterior)
- **Orders**
  - Card grid with model filter + sort (Most Recent / Model A–Z)
  - **New Order** modal → pick model & customer → opens the detail page in a **new tab**
  - Order detail (shareable URL):
    - Sales form pre-populated with model defaults; checkboxes for colors & add-ons; **Overall** block (fabric color, floor color, main price, add-ons price, total) and **Notes**
    - Build form pre-populated with model defaults; **Other Add-Ons** section mirroring whichever sales add-ons are checked; custom extras; **Notes**
    - Copy share link button
- Beautiful, responsive UI; dark scrollbar-friendly; sonner toasts; keyboard accessible.

---

## Tech stack

- **Next.js 14** App Router + Server Components
- **TypeScript**, **Tailwind CSS**, **Radix Primitives**
- **Supabase** — Auth + Postgres + Storage (`@supabase/ssr`)
- **Sonner** for toasts, **Lucide** icons

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a new project.
2. Open **SQL editor** → paste & run the contents of [`supabase/schema.sql`](./supabase/schema.sql). This creates all tables, RLS policies, the auto-profile trigger, helper functions, and the `vanworks` Storage bucket.
3. In **Authentication → URL Configuration**, set:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/**`
4. In **Authentication → Providers → Email**, enable **Confirm email**.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your project values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Bootstrap the first admin

After running the SQL, every signup will:
1. Trigger a `profiles` row creation
2. Default to `role = 'user'`, `approved = false`

To promote your first account to admin & approve it, run in SQL editor:

```sql
update public.profiles
set role = 'admin', approved = true
where email = 'you@yourdomain.com';
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

---

## Project structure

```
src/
├── app/
│   ├── (auth)/                  # login, signup, forgot/reset password, pending-approval
│   ├── (dashboard)/             # dashboard layout with sidebar
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── van-models/[id]/
│   │   └── orders/
│   ├── (order)/orders/[id]/     # standalone shareable order detail
│   ├── auth/confirm/route.ts    # email link verifier
│   └── auth/error/page.tsx
├── components/
│   ├── ui/                      # Button, Input, Card, Tabs, Dialog, Checkbox, ...
│   ├── layout/                  # Sidebar, Topbar
│   ├── brand/logo.tsx
│   └── image-upload.tsx
├── lib/
│   ├── supabase/                # client.ts, server.ts, middleware.ts, types.ts
│   ├── storage.ts               # Supabase Storage upload helper
│   ├── constants.ts             # section definitions
│   └── utils.ts
└── middleware.ts                # session refresh + redirects
```

---

## Notes on data model

- `sales_specs.section` uses keys like `WALL_COLOR`, `CABIN_ADDONS`, etc. (see `src/lib/constants.ts`). Colors & add-ons drive the **checkboxes** on order pages.
- `orders` stores the computed `main_price`, `addons_price`, and `total` to keep historical totals stable even if model prices change later.
- `order_sales_selections` is wiped & re-inserted on save (simpler than diffing — these tables are small per order).
- `order_build_extras` stores custom build extras that aren't tied to model specs.

---

## License

Proprietary © Vanworks.
