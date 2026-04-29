#!/usr/bin/env bash
# Cockroach -> R2 versioned bucket nightly dump.
# Run from cron at 02:00 UTC; rotated by R2 lifecycle (30d, 90d, 365d tiers).
set -euo pipefail

DB_URL="${IL_DB_URL:?missing IL_DB_URL}"
R2_BUCKET="${IL_BACKUP_BUCKET:?missing IL_BACKUP_BUCKET}"
R2_ENDPOINT="${IL_BACKUP_ENDPOINT:?missing IL_BACKUP_ENDPOINT}"

ts="$(date -u +%Y%m%d-%H%M%S)"
work="/var/tmp/ilinga-backup-${ts}"
mkdir -p "${work}"

# Stream a logical dump
cockroach sql --url "${DB_URL}" --execute "BACKUP DATABASE ilinga TO 'nodelocal://1/${ts}'"

# Pack the nodelocal directory and stream to R2 with sse-c
tar -czf "${work}/${ts}.tar.gz" -C "${work}" .
aws s3 cp "${work}/${ts}.tar.gz" "s3://${R2_BUCKET}/${ts}.tar.gz" \
  --endpoint-url "${R2_ENDPOINT}" \
  --storage-class STANDARD

rm -rf "${work}"
echo "backup ${ts} ok"
