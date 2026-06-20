#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

PROJECT_FOLDER="${1:?Usage: export-activity-stats.sh <project-folder>}"
DB_CONTAINER="lutra-db"
DB_USER="postgres"
DB_NAME="lutra-db"
STATS_FILE="$PROJECT_FOLDER/data/visitor-activity-stats.csv"

mkdir -p "$(dirname "$STATS_FILE")"

for _ in $(seq 1 30); do
  if docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if [ ! -f "$STATS_FILE" ]; then
  echo "distanceMeters,durationSeconds,effortScore" > "$STATS_FILE"
fi

SCHEMA_READY=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c \
  "SELECT to_regclass('public.activities') IS NOT NULL;" \
  2>/dev/null | tr -d '[:space:]')

if [ "$SCHEMA_READY" != "t" ]; then
  echo "export-activity-stats: activities table not present yet, skipping."
  exit 0
fi

docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -F',' -c \
  "SELECT \"distanceMeters\", \"durationSeconds\", \"effortScore\" FROM activities WHERE companion_id IS NOT NULL;" \
  >> "$STATS_FILE"

docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "DELETE FROM companions;" >/dev/null
