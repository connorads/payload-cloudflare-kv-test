# Payload Cloudflare KV Test

This repo tests [PR #14715](https://github.com/payloadcms/payload/pull/14715) which adds a Cloudflare KV adapter to Payload CMS.

It is based on the [Payload Cloudflare template](https://github.com/payloadcms/payload/tree/main/templates/with-cloudflare-d1) with the addition of:

- `@connorads/kv-cloudflare` - the Cloudflare KV adapter (published from the PR branch)
- KV namespace binding in `wrangler.jsonc`
- KV configuration in `payload.config.ts`

## Deploy Your Own

### Prerequisites

1. A Cloudflare account with Workers Paid plan
2. Wrangler CLI installed (`pnpm add -g wrangler`)

### Setup

1. **Authenticate with Cloudflare**

   ```bash
   pnpm wrangler login
   ```

2. **Create Cloudflare Resources**

   Each command outputs the IDs you'll need for `wrangler.jsonc`.

   ```bash
   # Create D1 database
   pnpm wrangler d1 create my-payload-db
   # Output: database_id = "abc123..."

   # Create KV namespace (production)
   pnpm wrangler kv:namespace create PAYLOAD_KV
   # Output: id = "def456..."

   # Create KV namespace (preview/dev)
   pnpm wrangler kv:namespace create PAYLOAD_KV --preview
   # Output: preview_id = "ghi789..."

   # Create R2 bucket
   pnpm wrangler r2 bucket create my-payload-bucket
   ```

3. **Update `wrangler.jsonc`** with your resource IDs from above:
   - `name` - your worker name
   - `d1_databases[0].database_id` - your D1 database ID
   - `d1_databases[0].database_name` - your D1 database name
   - `kv_namespaces[0].id` - your KV namespace ID
   - `kv_namespaces[0].preview_id` - your KV preview namespace ID
   - `r2_buckets[0].bucket_name` - your R2 bucket name

4. **Set the Payload Secret**

   ```bash
   pnpm wrangler secret put PAYLOAD_SECRET
   # Enter a random string (generate with: openssl rand -hex 32)
   ```

5. **Deploy**

   The deploy script runs database migrations against D1 and then deploys the app, so D1 and KV must be created and configured in `wrangler.jsonc` first.

   ```bash
   pnpm run deploy
   ```

   This runs:
   - `deploy:database` - runs Payload migrations on D1
   - `deploy:app` - builds with OpenNext and deploys to Cloudflare

## Local Development

```bash
pnpm install
pnpm dev
```

Wrangler will automatically bind your services for local development.
