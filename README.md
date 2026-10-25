# pgDoor

PG discovery marketplace for NCR. Seekers find a PG in under 3 minutes; owners list in under 5.

## Stack

Next.js 15 App Router · Tailwind · Prisma · PostgreSQL

## Local setup

```bash
# Docker (preferred)
docker compose up -d

# or Homebrew Postgres if Docker is unavailable
# brew services start postgresql@16

cp .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Dev OTP is `123456`.

| Role | Phone |
| --- | --- |
| Admin | 9999999999 |
| Owner | 9876543210 |
| Seeker | 8888888888 |

## Prelaunch mode (owner onboarding)

`NEXT_PUBLIC_PRELAUNCH="true"` hides the seeker marketplace until launch (1 Jan 2027):

- `/` is a "coming soon" page for tenants with all pgDoor features and a Free PG listing section.
- `/owners` is the owner landing page ("List your PG for free").
- Seeker pages (`/pgs`, `/pg/*`, `/compare`, `/saved`, `/account`, ...) redirect to `/`, and seeker APIs return 404.
- Owners can list at `/owners/register` (OTP at the end) and manage listings under `/owners/*`.
- Admins still see the whole site.

On launch day set it to `"false"` and redeploy.

The listing form needs cities, areas and amenities in the database. For a real (non-demo) database run
`npm run db:seed:reference`, which loads only that reference data and no demo PGs or users.

## Listing photos (Supabase Storage)

1. In Supabase, create a **public** Storage bucket named `pg-photos`.
2. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server only) and `SUPABASE_STORAGE_BUCKET`.

Without these, local dev stores uploads under `public/uploads`; production uploads are disabled.

## Google Maps (location-first search)

Enable in Google Cloud:

1. **Server key** (`GOOGLE_MAPS_API_KEY`): Places API (New), Routes API, Maps Embed API, Maps Static API. The legacy Places / Distance Matrix endpoints are not used and can't be enabled on new projects.
2. **Browser key** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`): Maps JavaScript API (restrict by HTTP referrer)

For local dev both can be the same unrestricted key.

Destination search example:

`/pgs?destLat=28.4940&destLng=77.0881&destLabel=Cyber%20City&commuteMax=20&mode=transit&budgetMax=10000`

## URLs

- `/` destination + commute search home
- `/pgs` map + list explore (supports `destLat` / `destLng` / `commuteMax` / `mode`)
- `/pgs/gurgaon` city results
- `/pg/[slug]` listing
- `/owners` owner landing
- `/owners/dashboard` owner ops
- `/admin` moderation
