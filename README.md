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

## URLs

- `/` search-first home
- `/pgs/gurgaon` city results
- `/pg/[slug]` listing
- `/owners` owner landing
- `/owners/dashboard` owner ops
- `/admin` moderation
