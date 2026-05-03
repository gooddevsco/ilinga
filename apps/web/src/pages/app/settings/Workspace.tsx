import { useState } from 'react';
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, useToast } from '@ilinga/ui';
import { api, type ApiError } from '../../../lib/api';
import { useTenant } from '../../../lib/tenant';

interface PatchBody {
  displayName?: string;
  industry?: string | null;
  countryCode?: string | null;
  brandLogoUrl?: string | null;
  brandAccentHex?: string | null;
  customDomain?: string | null;
}

export const SettingsWorkspace = (): JSX.Element => {
  const { current, refresh } = useTenant();
  const [displayName, setDisplayName] = useState(current?.displayName ?? '');
  const [industry, setIndustry] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [brandAccentHex, setBrandAccentHex] = useState('#0f172a');
  const [customDomain, setCustomDomain] = useState('');
  const [domainState, setDomainState] = useState<'idle' | 'pending' | 'verified'>('idle');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const toast = useToast();

  if (!current) return <p className="text-sm text-[color:var(--color-fg-muted)]">No workspace.</p>;

  const patch = async (key: keyof PatchBody, body: PatchBody): Promise<void> => {
    setSubmitting(key);
    try {
      await api.patch(`/v1/tenants/${current.id}`, body);
      toast.push({ variant: 'success', title: 'Saved' });
      await refresh();
    } catch (e) {
      toast.push({
        variant: 'error',
        title: 'Could not save',
        body: `Status ${(e as ApiError).status}`,
      });
    } finally {
      setSubmitting(null);
    }
  };

  const verifyDomain = async (): Promise<void> => {
    if (!customDomain) return;
    setSubmitting('customDomainVerify');
    try {
      await api.post(`/v1/tenants/${current.id}/custom-domain/verify`);
      setDomainState('verified');
      toast.push({ variant: 'success', title: 'Domain verified' });
    } catch {
      toast.push({ variant: 'error', title: 'Verification failed' });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>Workspace</CardHeader>
        <CardBody>
          <div className="space-y-3">
            <Field label="Display name" htmlFor="ws-name">
              <Input
                id="ws-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </Field>
            <Field label="Industry (free-form)" htmlFor="ws-ind">
              <Input
                id="ws-ind"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="logistics"
              />
            </Field>
            <Field label="Primary country (ISO-3166-1 alpha-2)" htmlFor="ws-country">
              <Input
                id="ws-country"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                placeholder="GB"
                maxLength={2}
              />
            </Field>
            <Button
              loading={submitting === 'displayName'}
              onClick={() =>
                patch('displayName', {
                  displayName,
                  industry: industry || null,
                  countryCode: countryCode || null,
                })
              }
            >
              Save workspace
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Brand</CardHeader>
        <CardBody>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Logo URL" htmlFor="ws-logo">
              <Input
                id="ws-logo"
                type="url"
                value={brandLogoUrl}
                onChange={(e) => setBrandLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </Field>
            <Field label="Accent colour (#RRGGBB)" htmlFor="ws-accent">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandAccentHex}
                  onChange={(e) => setBrandAccentHex(e.target.value)}
                  className="h-10 w-12 rounded border border-[color:var(--color-border)]"
                  aria-label="Accent colour"
                />
                <Input
                  id="ws-accent"
                  value={brandAccentHex}
                  onChange={(e) => setBrandAccentHex(e.target.value)}
                  pattern="^#[0-9a-fA-F]{6}$"
                />
              </div>
            </Field>
          </div>
          <Button
            className="mt-3"
            loading={submitting === 'brandAccentHex'}
            onClick={() =>
              patch('brandAccentHex', {
                brandLogoUrl: brandLogoUrl || null,
                brandAccentHex,
              })
            }
          >
            Save brand
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Custom domain</CardHeader>
        <CardBody>
          <p className="text-sm text-[color:var(--color-fg-muted)]">
            Point a CNAME for your domain to <code>portal.ilinga.com</code>, then click verify.
            We&apos;ll issue a TLS certificate on demand.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Input
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
              placeholder="ventures.acme.com"
            />
            <Button
              variant="secondary"
              loading={submitting === 'customDomain'}
              onClick={async () => {
                await patch('customDomain', { customDomain: customDomain || null });
                setDomainState('pending');
              }}
            >
              Save
            </Button>
            <Button
              loading={submitting === 'customDomainVerify'}
              onClick={verifyDomain}
              disabled={!customDomain}
            >
              Verify DNS
            </Button>
          </div>
          {domainState !== 'idle' && (
            <Badge tone={domainState === 'verified' ? 'success' : 'warning'} className="mt-3">
              {domainState}
            </Badge>
          )}
        </CardBody>
      </Card>
    </section>
  );
};
