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

With `OTP_PROVIDER="dev"` the OTP is `OTP_BYPASS_CODE` (`123456`). The dev code is never accepted on a
production deploy (`VERCEL_ENV=production` on Vercel, `APP_ENV=production` on AWS).

### Production OTP (MSG91)

Set `OTP_PROVIDER="msg91"`, `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID` (a DLT-approved OTP template with an
`##OTP##` variable) and optionally `MSG91_SENDER_ID`. Do not set `OTP_BYPASS_CODE` in production.
If no provider is configured in production, OTP login returns 503 and password login still works.

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

## AWS deploy (EC2 + Docker + GitHub Actions)

Every push to `main` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml):

1. lint + tests
2. builds the [Dockerfile](Dockerfile) and pushes `<registry>/<repo>:<commit sha>` (and `:latest`) to Amazon ECR
3. `prisma migrate deploy` against Supabase
4. copies [deploy/](deploy) to `/opt/pgdoor` on the EC2 host, writes `.env` from the `PROD_ENV` secret, and runs
   `docker compose up -d` (the app plus Caddy, which terminates HTTPS with an automatic Let's Encrypt certificate)

[.github/workflows/cron.yml](.github/workflows/cron.yml) replaces the Vercel cron and calls `/api/cron/commute`
on the 1st of every month.

Build locally: `docker build --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 -t pgdoor .` then
`docker run --rm -p 3000:3000 --env-file .env pgdoor`. `docker run --env-file` keeps quotes as part of the
value, so remove the `"..."` around values first (Compose on the server strips them itself), and use a
`DATABASE_URL` the container can reach (`host.docker.internal` instead of `localhost`).

### One-time setup

Examples use `ap-northeast-2` (Seoul, the same region as the Supabase database, so every query stays
in-region) and account id `123456789012`; substitute your own.

**1. ECR repository**

```bash
aws ecr create-repository --repository-name pgdoor --region ap-northeast-2
aws ecr put-lifecycle-policy --repository-name pgdoor --region ap-northeast-2 --lifecycle-policy-text \
  '{"rules":[{"rulePriority":1,"selection":{"tagStatus":"any","countType":"imageCountMoreThan","countNumber":20},"action":{"type":"expire"}}]}'
```

**2. GitHub OIDC role (lets Actions push to ECR without long-lived keys)**

In IAM, add the identity provider `token.actions.githubusercontent.com` (audience `sts.amazonaws.com`) if it
doesn't exist yet, then create a role `pgdoor-github-deploy` with this trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike": { "token.actions.githubusercontent.com:sub": "repo:7UpadhyayKrishna/pgDoor:*" }
    }
  }]
}
```

and this permission policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "ecr:GetAuthorizationToken", "Resource": "*" },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability", "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer",
        "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload", "ecr:PutImage"
      ],
      "Resource": "arn:aws:ecr:ap-northeast-2:123456789012:repository/pgdoor"
    }
  ]
}
```

**3. EC2 instance**

- Ubuntu 24.04, `t3.small` or larger, 20 GB disk. Attach an Elastic IP.
- Security group inbound: 22, 80 and 443 from anywhere (GitHub Actions deploys over SSH from changing IPs;
  Ubuntu on EC2 only accepts key logins).
- IAM instance profile with the managed policy `AmazonEC2ContainerRegistryReadOnly` (the host pulls from ECR
  with it; no AWS keys live on the server).
- Point your domain's DNS `A` records (`pgdoor.in` and `www.pgdoor.in`) at the Elastic IP before the first
  deploy, otherwise Caddy can't issue the certificate.

Then on the instance:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
sudo snap install aws-cli --classic
sudo mkdir -p /opt/pgdoor && sudo chown ubuntu:ubuntu /opt/pgdoor
# log out and back in so the docker group applies
```

Create a deploy SSH key (on your machine) and authorize it on the instance:

```bash
ssh-keygen -t ed25519 -f pgdoor-deploy -N ""
ssh-copy-id -i pgdoor-deploy.pub ubuntu@<elastic-ip>   # or append it to ~/.ssh/authorized_keys
```

**4. GitHub repository settings** (Settings → Secrets and variables → Actions)

Variables (not secret; `NEXT_PUBLIC_*` end up in the browser bundle anyway):

| Name | Example |
| --- | --- |
| `AWS_REGION` | `ap-northeast-2` |
| `ECR_REGISTRY` | `123456789012.dkr.ecr.ap-northeast-2.amazonaws.com` |
| `ECR_REPOSITORY` | `pgdoor` |
| `NEXT_PUBLIC_APP_URL` | `https://www.pgdoor.in` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | browser key |
| `NEXT_PUBLIC_PRELAUNCH` | `true` |

Secrets:

| Name | Value |
| --- | --- |
| `AWS_ROLE_ARN` | `arn:aws:iam::123456789012:role/pgdoor-github-deploy` |
| `EC2_HOST` | Elastic IP or hostname |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | contents of the private key `pgdoor-deploy` |
| `DIRECT_URL` | Supabase direct connection string (port 5432), used for migrations |
| `CRON_SECRET` | same value as in `PROD_ENV` |
| `PROD_ENV` | the full production `.env`, see below |

`PROD_ENV` (one `KEY=value` per line):

```bash
# bare domain; Caddy serves www.pgdoor.in and redirects pgdoor.in to it
DOMAIN=pgdoor.in
APP_ENV=production
DATABASE_URL=postgresql://...:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...:5432/postgres
SESSION_SECRET=<long random string>
CRON_SECRET=<long random string>
OTP_PROVIDER=msg91
MSG91_AUTH_KEY=...
MSG91_TEMPLATE_ID=...
MSG91_SENDER_ID=...
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=pg-photos
GOOGLE_MAPS_API_KEY=...
GOOGLE_MAPS_EMBED_API=false
```

`APP_ENV=production` is required: it is what blocks the dev OTP bypass outside Vercel. `NEXT_PUBLIC_*` values
are baked in at build time, so changing one (e.g. `NEXT_PUBLIC_PRELAUNCH=false` on launch day) means updating
the variable and re-running the **Deploy to AWS** workflow (Actions → Run workflow).

### Operating the server

```bash
cd /opt/pgdoor
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
```

Roll back by re-running an older successful deploy run, or set `APP_IMAGE` in `/opt/pgdoor/.env` to an older
`:<sha>` tag and run `docker compose -f docker-compose.prod.yml up -d`.

## URLs

- `/` destination + commute search home
- `/pgs` map + list explore (supports `destLat` / `destLng` / `commuteMax` / `mode`)
- `/pgs/gurgaon` city results
- `/pg/[slug]` listing
- `/owners` owner landing
- `/owners/dashboard` owner ops
- `/admin` moderation
