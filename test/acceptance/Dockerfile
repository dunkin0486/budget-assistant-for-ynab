# Runs the Worker locally via `wrangler dev` for black-box acceptance
# testing (see ../../Makefile's acceptance-tests target). Not used for
# real deploys -- that's `wrangler deploy` directly, from
# .github/workflows/deploy.yml. wrangler dev's local mode emulates
# KV/Durable Objects itself; no real Cloudflare account is needed for
# anything this suite exercises.
FROM node:22-slim

# The install-script allowlist recorded in package.json's "allowScripts"
# needs a recent-enough npm to honor it non-interactively.
RUN npm install -g npm@latest

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json wrangler.jsonc ./
COPY src ./src

EXPOSE 8787
CMD ["npx", "wrangler", "dev", "--ip", "0.0.0.0", "--port", "8787"]
