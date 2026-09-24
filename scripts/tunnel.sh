#!/usr/bin/env bash
set -e

PORT="${1:-3000}"
LOG_FILE="/tmp/cloudflared.log"

if ! command -v cloudflared &> /dev/null; then
  echo "Downloading cloudflared..."
  curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared 2>/dev/null || curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared
  chmod +x /usr/local/bin/cloudflared 2>/dev/null || chmod +x /tmp/cloudflared
fi

BIN="$(command -v cloudflared 2>/dev/null || echo '/tmp/cloudflared')"

echo "Starting Cloudflare Tunnel on port $PORT..."
killall cloudflared 2>/dev/null || true
nohup "$BIN" tunnel --protocol http2 --url "http://localhost:$PORT" > "$LOG_FILE" 2>&1 &

for i in {1..12}; do
  sleep 1
  URL="$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' "$LOG_FILE" | head -n 1 || true)"
  if [ -n "$URL" ]; then
    break
  fi
done

if [ -n "$URL" ]; then
  echo "============================================="
  echo "🎉 Cloudflare Tunnel is LIVE & PUBLIC!"
  echo "Public URL: $URL"
  echo "Local Target: http://localhost:$PORT"
  echo "============================================="
else
  echo "Tunnel log output:"
  cat "$LOG_FILE"
fi
