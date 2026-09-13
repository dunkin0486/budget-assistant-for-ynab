.PHONY: test acceptance-tests

# Unit tests (src/**/*.test.ts) -- fast, no Docker, no network.
test:
	npm test

# Black-box tests against a real `wrangler dev` instance running in Docker
# (test/acceptance/Dockerfile) -- catches routing/config regressions the
# unit tests can't, using the real workerd runtime. No real YNAB account
# or Cloudflare credentials needed; see test/acceptance/server.acceptance.test.ts
# for what it deliberately does and doesn't cover.
acceptance-tests:
	@set -e; \
	trap 'docker rm -f budget-assistant-acceptance >/dev/null 2>&1 || true' EXIT; \
	docker build -t budget-assistant-acceptance -f test/acceptance/Dockerfile . ; \
	docker rm -f budget-assistant-acceptance >/dev/null 2>&1 || true; \
	docker run -d --rm --name budget-assistant-acceptance -p 8787:8787 budget-assistant-acceptance >/dev/null; \
	echo "Waiting for the Worker to come up..."; \
	for i in $$(seq 1 30); do \
		if curl -s -o /dev/null "http://localhost:8787/"; then break; fi; \
		if [ "$$i" = "30" ]; then echo "Worker never came up" >&2; exit 1; fi; \
		sleep 1; \
	done; \
	npx vitest run --config test/acceptance/vitest.config.ts
