import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Skeleton,
  Textarea,
  useToast,
} from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';

interface Venture {
  id: string;
  name: string;
  industry: string | null;
  geos: string[];
  brief: { thesis?: string; wedge?: string; asks?: string };
}

export const VentureEdit = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const { current } = useTenant();
  const [venture, setVenture] = useState<Venture | null>(null);
  const [thesis, setThesis] = useState('');
  const [wedge, setWedge] = useState('');
  const [asks, setAsks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!current || !id) return;
    api.get<{ venture: Venture }>(`/v1/ventures/tenant/${current.id}/${id}`).then((r) => {
      setVenture(r.venture);
      setThesis(r.venture.brief.thesis ?? '');
      setWedge(r.venture.brief.wedge ?? '');
      setAsks(r.venture.brief.asks ?? '');
    });
  }, [current, id]);

  if (!current) return <p className="text-sm text-[color:var(--color-fg-muted)]">No workspace.</p>;
  if (!venture) return <Skeleton height={200} />;

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/v1/ventures/tenant/${current.id}/${venture.id}/brief`, {
        brief: { thesis, wedge, asks },
      });
      toast.push({ variant: 'success', title: 'Brief updated' });
      navigate(`/ventures/${venture.id}`);
    } catch (e2) {
      toast.push({
        variant: 'error',
        title: 'Could not save',
        body: `Status ${(e2 as ApiError).status}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4">
      <Link to={`/ventures/${venture.id}`} className="text-xs text-[color:var(--color-fg-muted)]">
        ← Venture
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Edit brief</h1>

      <Card>
        <CardHeader>Thesis</CardHeader>
        <CardBody>
          <Textarea rows={5} value={thesis} onChange={(e) => setThesis(e.target.value)} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Wedge</CardHeader>
        <CardBody>
          <Field
            label="The smallest valuable thing you can ship"
            htmlFor="wedge"
            hint="Optional, but synthesis pulls strongly from this."
          >
            <Textarea
              id="wedge"
              rows={4}
              value={wedge}
              onChange={(e) => setWedge(e.target.value)}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Asks</CardHeader>
        <CardBody>
          <Field
            label="Whatever you need from a reader"
            htmlFor="asks"
            hint="e.g. 'looking for an early user in mid-mile freight'."
          >
            <Input id="asks" value={asks} onChange={(e) => setAsks(e.target.value)} />
          </Field>
        </CardBody>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" loading={submitting}>
          Save
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(`/ventures/${venture.id}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
