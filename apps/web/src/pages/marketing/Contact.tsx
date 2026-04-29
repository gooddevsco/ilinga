import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Field, Input, Textarea, useToast } from '@ilinga/ui';
import { useFormPersist } from '../../lib/useFormPersist';

interface FormState {
  email: string;
  topic: string;
  message: string;
}

export const Contact = (): JSX.Element => {
  const { restore, clear } = useFormPersist<FormState>('contact', {
    email: '',
    topic: 'general',
    message: '',
  });
  const [form, setForm] = useState<FormState>(restore ?? { email: '', topic: 'general', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();

  if (done) {
    return (
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Thanks — message sent</h1>
        <p className="mt-3 text-sm text-[color:var(--color-fg-muted)]">
          We typically reply within one business day.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        // No server endpoint yet — Phase 4 simulates send via toast + clear.
        await new Promise((r) => setTimeout(r, 600));
        toast.push({
          variant: 'success',
          title: 'Message received',
          body: 'We will reply soon.',
        });
        clear();
        setSubmitting(false);
        setDone(true);
      }}
    >
      <h1 className="text-3xl font-semibold tracking-tight">Contact us</h1>
      <Field label="Your email" htmlFor="email">
        <Input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </Field>
      <Field label="Topic" htmlFor="topic">
        <select
          id="topic"
          value={form.topic}
          onChange={(e) => setForm({ ...form, topic: e.target.value })}
          className="block h-10 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 text-sm"
        >
          <option value="general">General</option>
          <option value="enterprise">Enterprise pricing</option>
          <option value="security">Security & DPA</option>
          <option value="bug">Report a bug</option>
        </select>
      </Field>
      <Field label="Message" htmlFor="message">
        <Textarea
          id="message"
          required
          rows={6}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </Field>
      <Button type="submit" loading={submitting}>
        Send message
      </Button>
    </form>
  );
};
