#!/bin/bash
# Pornește Taply (server Node + conturi/parole).
# Pe Mac: NU dublu-click pe acest fișier (se deschide ca text).
# Folosește: dublu-click pe „Taply.command” SAU din Terminal: ./start.sh

cd "$(dirname "$0")"
PORT=8001
URL="http://localhost:$PORT/landing.html"

echo "Pornesc Taply..."
echo "Server: $URL"
echo "Oprește cu Ctrl+C"
echo ""

if ! command -v node &>/dev/null; then
  echo "Node.js nu e instalat. Instalează-l de pe https://nodejs.org"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Instalez dependențele (npm install)..."
  npm install
fi

(sleep 2 && (p=$(cat .taply-port 2>/dev/null); [ -n "$p" ] && open "http://localhost:$p/landing.html" || open "$URL")) &
node server.js
