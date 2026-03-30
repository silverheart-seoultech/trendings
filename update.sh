#!/bin/bash
# AI Agent Trends - Auto Update Script
# Run this via cron: */30 * * * * /path/to/update.sh >> /path/to/update.log 2>&1

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "$(date '+%Y-%m-%d %H:%M:%S') Starting update..."
echo "========================================"

# Activate virtual env if exists
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

# Run crawler
python3 crawler/fetch_trends.py

echo "$(date '+%Y-%m-%d %H:%M:%S') Update complete!"
