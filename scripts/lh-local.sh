#!/usr/bin/env bash
# scripts/lh-local.sh — Run Lighthouse CI against a local production build.
#
# Usage:
#   pnpm lh:local          # full build + check
#   pnpm lh:local --skip-build  # reuse existing .next/ (fast re-run)
#
# The script starts `next start` on port 3001 (avoids clashing with dev server
# on 3000), runs LHCI collect + assert, then kills the server.

set -euo pipefail

PORT=3001
SKIP_BUILD=false

for arg in "$@"; do
  [[ "$arg" == "--skip-build" ]] && SKIP_BUILD=true
done

# ── Build ──────────────────────────────────────────────────────────────────────
if [[ "$SKIP_BUILD" == "false" ]]; then
  echo "▶ Building…"
  pnpm next build
else
  echo "▶ Skipping build (--skip-build)"
  [[ -d ".next" ]] || { echo "✗ .next/ not found — run without --skip-build first"; exit 1; }
fi

# ── Start server ───────────────────────────────────────────────────────────────
echo "▶ Starting next start on port $PORT…"
PORT=$PORT pnpm next start --port $PORT &
SERVER_PID=$!

# Wait until the server is ready (max 30s)
for i in $(seq 1 30); do
  curl -s "http://localhost:$PORT/" > /dev/null 2>&1 && break
  sleep 1
done

curl -s "http://localhost:$PORT/" > /dev/null 2>&1 || {
  echo "✗ Server did not start on port $PORT"
  kill $SERVER_PID 2>/dev/null
  exit 1
}
echo "  Server ready on port $PORT (pid $SERVER_PID)"

# ── LHCI ───────────────────────────────────────────────────────────────────────
STATUS=0
pnpm lhci autorun --config=.lighthouserc.local.json || STATUS=$?

# ── Teardown ───────────────────────────────────────────────────────────────────
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null || true

exit $STATUS
