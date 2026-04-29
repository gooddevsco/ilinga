import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Badge } from '@ilinga/ui';

export const Credits = (): JSX.Element => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Credits</h1>
      <p className="text-sm text-[color:var(--color-fg-muted)]">
        Spend on synthesis pipelines and report renders. Plan allowance resets monthly; top-ups
        never expire.
      </p>
    </div>
    <section className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>Balance</CardHeader>
        <CardBody>
          <p className="text-3xl font-semibold">30</p>
          <p className="text-xs text-[color:var(--color-fg-subtle)]">Free plan allowance</p>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>This month</CardHeader>
        <CardBody>
          <p className="text-sm">Used 0 of 30</p>
          <Badge tone="info" className="mt-2">
            On track
          </Badge>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>Auto top-up</CardHeader>
        <CardBody>
          <p className="text-sm text-[color:var(--color-fg-muted)]">Off</p>
          <Link to="/settings/billing" className="mt-2 inline-block text-sm underline">
            Configure
          </Link>
        </CardBody>
      </Card>
    </section>
  </div>
);
