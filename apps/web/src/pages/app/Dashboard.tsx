import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, EmptyState } from '@ilinga/ui';
import { useAuth } from '../../lib/auth';

export const Dashboard = (): JSX.Element => {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-[color:var(--color-fg-muted)]">
          User {user?.userId.slice(0, 8)}…
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>Quick start</CardHeader>
          <CardBody>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                <Link to="/ventures/new" className="underline">
                  Create your first venture
                </Link>
              </li>
              <li>
                <Link to="/settings/team" className="underline">
                  Invite teammates
                </Link>
              </li>
              <li>
                <Link to="/settings/ai" className="underline">
                  Add an AI endpoint (BYO)
                </Link>
              </li>
              <li>
                <Link to="/credits" className="underline">
                  Top up credits
                </Link>
              </li>
            </ol>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Recent activity</CardHeader>
          <CardBody>
            <EmptyState
              title="No activity yet"
              body="Start a venture and your team's actions will show up here."
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Last sign-in</CardHeader>
          <CardBody>
            <p className="text-sm text-[color:var(--color-fg-muted)]">Just now.</p>
          </CardBody>
        </Card>
      </section>
    </div>
  );
};
