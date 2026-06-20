#!/usr/bin/env bash
# Runs before each exhibition startup: archives visitor activity stats, then
# resets the database for the next visitor (keeps the 3 oldest companions,
# wipes all activities).
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

PROJECT_FOLDER="${1:?Usage: exhibition-db-rollover.sh <project-folder>}"
DB_CONTAINER="lutra-db"
DB_USER="postgres"
DB_NAME="lutra-db"
STATS_FILE="$PROJECT_FOLDER/data/visitor-activity-stats.csv"

mkdir -p "$(dirname "$STATS_FILE")"

# Wait for Postgres to accept connections (container may have just (re)started).
for _ in $(seq 1 30); do
  if docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if [ ! -f "$STATS_FILE" ]; then
  echo "distanceMeters,durationSeconds,effortScore" > "$STATS_FILE"
fi

# On a brand-new database (first ever boot, or after a reset) the backend
# hasn't run yet to create the schema via TypeORM synchronize. There's
# nothing to export or clean up in that case, so skip without failing.
SCHEMA_READY=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c \
  "SELECT (to_regclass('public.activities') IS NOT NULL) AND (to_regclass('public.companions') IS NOT NULL);" \
  2>/dev/null | tr -d '[:space:]')

if [ "$SCHEMA_READY" != "t" ]; then
  echo "exhibition-db-rollover: activities/companions tables not present yet, skipping export and cleanup."
  exit 0
fi

# Append distance/duration/effort for every activity tied to a companion,
# i.e. one created by an actual visitor session.
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -F',' -c \
  "SELECT \"distanceMeters\", \"durationSeconds\", \"effortScore\" FROM activities WHERE companion_id IS NOT NULL;" \
  >> "$STATS_FILE"

# Reset for the next visitor: keep only the 3 oldest companions, drop the rest.
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
  "DELETE FROM companions WHERE id NOT IN (SELECT id FROM companions ORDER BY \"createdAt\" ASC LIMIT 3);"

# All activities have been archived above, so the table can be fully cleared.
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
  "TRUNCATE TABLE activities;"
