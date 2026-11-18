# Render PostgreSQL setup (Phase A)

No paid resource is created automatically by this repository.

1. In Render, create a paid PostgreSQL database in the same region as the existing web service.
2. Copy its internal database URL from the database's **Connect** panel.
3. Add that URL to the `play-create-learn-repeat` web service as the secret environment variable `DATABASE_URL`.
4. Keep `DATABASE_URL` server-only. Never prefix it with `NEXT_PUBLIC_`.
5. From a trusted shell with `DATABASE_URL` configured, run `npm run db:migrate`, `npm run db:seed`, and `npm run db:verify`.
6. Run migrations as a controlled pre-deploy task. Do not use `drizzle-kit push` against production.
7. Configure logical exports outside the short point-in-time recovery window and test restoration before enabling checkout.

`npm run db:generate` creates versioned SQL locally and needs no database credentials. The catalog seed is transactional and idempotent. Seeded editions remain `publishable = false` until their real protected assets are verified.
