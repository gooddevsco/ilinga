import { Badge, Card, CardBody, CardHeader } from '@ilinga/ui';

const components = [
  { name: 'API', status: 'operational' as const },
  { name: 'Web app', status: 'operational' as const },
  { name: 'Render workers', status: 'operational' as const },
  { name: 'Email delivery', status: 'operational' as const },
  { name: 'Object storage', status: 'operational' as const },
];

export const Status = (): JSX.Element => (
  <div className="space-y-6">
    <h1 className="text-3xl font-semibold tracking-tight">Status</h1>
    <p className="text-sm text-[color:var(--color-fg-muted)]">
      Live operational status. Subscribe to incidents at <code>status.ilinga.com</code>.
    </p>
    <div className="grid gap-3 md:grid-cols-2">
      {components.map((c) => (
        <Card key={c.name}>
          <CardHeader>
            <span className="flex items-center justify-between">
              <span>{c.name}</span>
              <Badge tone={c.status === 'operational' ? 'success' : 'warning'}>
                {c.status}
              </Badge>
            </span>
          </CardHeader>
          <CardBody>
            <p className="text-xs text-[color:var(--color-fg-subtle)]">No incidents in 90 days.</p>
          </CardBody>
        </Card>
      ))}
    </div>
  </div>
);
