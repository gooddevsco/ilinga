import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Field, Input, useToast } from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';

export const VentureNew = (): JSX.Element => {
  const { current } = useTenant();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [geos, setGeos] = useState('');
  const [thesis, setThesis] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  if (!current) {
    return (
      <p className="text-sm text-[color:var(--color-fg-muted)]">No workspace selected.</p>
    );
  }

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await api.post<{ venture: { id: string } }>(`/v1/ventures`, {
        tenantId: current.id,
        name,
        industry: industry || undefined,
        geos: geos
          .split(',')
          .map((g) => g.trim().toUpperCase())
          .filter((g) => g.length === 2),
        brief: { thesis },
      });
      toast.push({ variant: 'success', title: 'Venture created' });
      navigate(`/ventures/${r.venture.id}`);
    } catch (err) {
      toast.push({
        variant: 'error',
        title: 'Could not create venture',
        body: `Status ${(err as ApiError).status}.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New venture</h1>
      <Field label="Name" htmlFor="vname">
        <Input
          id="vname"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Northwind Cargo"
        />
      </Field>
      <Field label="Industry" htmlFor="vind" hint="Free-form for now (auto-detect lands later).">
        <Input
          id="vind"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="logistics"
        />
      </Field>
      <Field label="Geos" htmlFor="vgeos" hint="Comma-separated ISO-3166-1 alpha-2 codes (e.g. DE, FR, NL).">
        <Input
          id="vgeos"
          value={geos}
          onChange={(e) => setGeos(e.target.value)}
          placeholder="DE, FR, NL"
        />
      </Field>
      <Field label="Thesis" htmlFor="vthesis">
        <textarea
          id="vthesis"
          rows={5}
          value={thesis}
          onChange={(e) => setThesis(e.target.value)}
          placeholder="What is the thesis you want to test?"
          className="block w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3 text-sm"
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" loading={submitting}>
          Create venture
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate('/ventures')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
