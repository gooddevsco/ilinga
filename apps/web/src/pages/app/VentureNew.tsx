import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '@ilinga/ui';

export const VentureNew = (): JSX.Element => (
  <div className="space-y-4">
    <h1 className="text-2xl font-semibold tracking-tight">New venture</h1>
    <Card>
      <CardHeader>Phase milestone</CardHeader>
      <CardBody>
        <p className="text-sm text-[color:var(--color-fg-muted)]">
          The full venture-creation flow (brief, geos, industry auto-detect, artifacts,
          competitors) lands in Phase 6. This page exists today so the app shell never has a
          dead link.
        </p>
        <Link
          to="/ventures"
          className="mt-4 inline-block text-sm underline"
        >
          Back to ventures
        </Link>
      </CardBody>
    </Card>
  </div>
);
