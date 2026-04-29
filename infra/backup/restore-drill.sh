#!/usr/bin/env bash
# Weekly restore drill. Pulls the most recent backup, restores to a
# scratch Cockroach cluster, runs sanity SQL, reports status.
set -euo pipefail

R2_BUCKET="${IL_BACKUP_BUCKET:?missing}"
R2_ENDPOINT="${IL_BACKUP_ENDPOINT:?missing}"
DRILL_DB_URL="${IL_DRILL_DB_URL:?missing}"

latest="$(aws s3 ls "s3://${R2_BUCKET}/" --endpoint-url "${R2_ENDPOINT}" \
  | sort | tail -n1 | awk '{print $4}')"
echo "restoring ${latest}"

aws s3 cp "s3://${R2_BUCKET}/${latest}" "/tmp/${latest}" \
  --endpoint-url "${R2_ENDPOINT}"

work="/var/tmp/ilinga-drill"
mkdir -p "${work}"
tar -xzf "/tmp/${latest}" -C "${work}"

cockroach sql --url "${DRILL_DB_URL}" --execute "RESTORE DATABASE ilinga FROM 'nodelocal://1/...'"
cockroach sql --url "${DRILL_DB_URL}" --execute "SELECT count(*) FROM ilinga.public.users"
echo "drill ok"
