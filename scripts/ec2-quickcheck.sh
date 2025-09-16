#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-80}"
PUBLIC_HOST="${2:-}"

echo "[quickcheck] port=${PORT} public_host=${PUBLIC_HOST:-(none)}"

step() { echo; echo "==> $*"; }

step "Process listening on :$PORT"
if command -v ss >/dev/null 2>&1; then
  sudo ss -lntp 2>/dev/null | grep -E ":${PORT} " || echo "no process listening on :$PORT"
else
  sudo netstat -lntp 2>/dev/null | grep -E ":${PORT} " || echo "no process listening on :$PORT"
fi

step "Local curl http://127.0.0.1:$PORT"
curl -sv --max-time 5 "http://127.0.0.1:$PORT" >/dev/null || echo "local curl failed"

step "OS firewall status (ufw/firewalld)"
if command -v ufw >/dev/null 2>&1; then
  sudo ufw status || true
fi
if command -v firewall-cmd >/dev/null 2>&1; then
  sudo firewall-cmd --state || true
  sudo firewall-cmd --list-all || true
fi

step "Nginx config test"
if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t || true
else
  echo "nginx not installed"
fi

if [[ -n "${PUBLIC_HOST}" ]]; then
  step "DNS resolution for ${PUBLIC_HOST}"
  if command -v dig >/dev/null 2>&1; then
    dig +short A "${PUBLIC_HOST}" || true
    dig +short AAAA "${PUBLIC_HOST}" || true
  else
    getent hosts "${PUBLIC_HOST}" || true
  fi

  step "External curl http://${PUBLIC_HOST}:${PORT}"
  curl -sv --connect-timeout 5 "http://${PUBLIC_HOST}:${PORT}" >/dev/null || echo "external curl failed"
fi

step "IP/route snapshot"
ip -brief a || true
ip route || true

echo; echo "[quickcheck] done"

