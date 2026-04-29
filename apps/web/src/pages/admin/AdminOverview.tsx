import { Card, CardBody, CardHeader } from '@ilinga/ui';

export const AdminOverview = (): JSX.Element => (
  <div className="grid gap-3 md:grid-cols-3">
    <Card>
      <CardHeader>Audit chain</CardHeader>
      <CardBody>
        <p className="text-sm text-[color:var(--color-fg-muted)]">
          Run <code>pnpm audit:verify</code> to verify the hash-chained log against the database.
          Failure indicates tampering — escalate to Sev 1.
        </p>
      </CardBody>
    </Card>
    <Card>
      <CardHeader>Retention sweep</CardHeader>
      <CardBody>
        <p className="text-sm text-[color:var(--color-fg-muted)]">
          The retention worker hard-deletes ventures and tenants past their grace window
          (30d / 7d). The workers app boots it automatically.
        </p>
      </CardBody>
    </Card>
    <Card>
      <CardHeader>Backups</CardHeader>
      <CardBody>
        <p className="text-sm text-[color:var(--color-fg-muted)]">
          Nightly Cockroach dumps to R2; weekly restore drill confirms RPO ≤ 24h.
        </p>
      </CardBody>
    </Card>
  </div>
);
