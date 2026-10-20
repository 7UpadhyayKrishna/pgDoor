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
