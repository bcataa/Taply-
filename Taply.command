#!/bin/bash
# Double-click pe Mac: deschide Terminal și pornește Taply (conturi + parole)

cd "$(dirname "$0")"
URL="http://localhost:8001/landing.html"

echo "Pornesc Taply..."
echo "Server: $URL"
echo "Oprește cu Ctrl+C sau închide fereastra."
echo ""

if ! command -v node &>/dev/null; then
  echo "Node.js nu e instalat. Instalează-l de pe https://nodejs.org"
  read -p "Apasă Enter pentru a închide."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Instalez dependențele..."
  npm install
fi

(sleep 2 && (p=$(cat .taply-port 2>/dev/null); [ -n "$p" ] && open "http://localhost:$p/landing.html" || open "http://localhost:8001/landing.html")) &
node server.js
