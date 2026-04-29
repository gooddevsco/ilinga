import { Card, CardBody, CardHeader } from '@ilinga/ui';

export const SettingsAi = (): JSX.Element => (
  <Card>
    <CardHeader>AI endpoints</CardHeader>
    <CardBody>
      <p className="text-sm text-[color:var(--color-fg-muted)]">
        Bring-your-own AI endpoint management lands in the next wave; the schema and the
        decryption pipeline already exist.
      </p>
    </CardBody>
  </Card>
);
