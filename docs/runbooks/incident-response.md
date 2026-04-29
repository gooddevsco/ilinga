# Runbook — incident response

## Severity ladder

| Sev | Symptom                                                | Pager target |
| --- | ------------------------------------------------------ | ------------ |
| 1   | Customer-facing outage (api.ilinga.com 5xx > 5%)       | primary on-call |
| 2   | Degraded service (slow renders, queue depth doubling)  | primary on-call |
| 3   | Internal-only impact (n8n disabled, retention paused)  | next business day |

## Sev 1 first 10 minutes

1. Acknowledge page. Open `https://status.ilinga.com` — post `investigating`.
2. Check Caddy access logs: `journalctl -u caddy -n 200`.
3. Check API health: `curl https://api.ilinga.com/v1/internal/healthz`.
4. PM2: `pm2 list`, `pm2 logs ilinga-api --lines 200`.
5. Cockroach: open the admin UI and check unavailable ranges.
6. R2: AWS-console-equivalent for the bucket — confirm GETs.
7. If a recent deploy: `pm2 reload ilinga-api` to the previous version (tag).
8. Communicate every 15 minutes on status page.

## Audit chain alarm

If `pnpm audit:verify` exits non-zero:

1. Stop ingest of new audit rows by pausing the relevant routes via the
   feature flag `audit_ingest`.
2. Capture the broken row + its neighbours via direct Cockroach query.
3. Determine whether a backup exists from before the break.
4. Restore audit_log from the last verified backup, then resume ingest.
5. File a Sev 1 — tampering implies prior compromise.
