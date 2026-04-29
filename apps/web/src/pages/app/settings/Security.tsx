import { Card, CardBody, CardHeader } from '@ilinga/ui';

export const SettingsSecurity = (): JSX.Element => (
  <Card>
    <CardHeader>Security</CardHeader>
    <CardBody>
      <ul className="space-y-1 text-sm">
        <li>Auth: magic link + Google OAuth (passwords are not used).</li>
        <li>Sessions: 24h sliding, 30d absolute, idle timeout warns at 23h.</li>
        <li>CSRF: double-submit cookie + header on every write.</li>
        <li>New-device alerts: emailed with a one-click revoke link.</li>
        <li>Audit log: hash-chained, verifiable via pnpm audit:verify.</li>
      </ul>
    </CardBody>
  </Card>
);
