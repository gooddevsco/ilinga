import { Link } from 'react-router-dom';

const plans = [
  { code: 'free', name: 'Free', price: '$0', credits: '30/mo', seats: '1', cta: 'Start free' },
  { code: 'studio', name: 'Studio', price: '$49', credits: '500/mo', seats: '3', cta: 'Pick Studio' },
  { code: 'pro', name: 'Pro', price: '$149', credits: '2,000/mo', seats: '8', cta: 'Pick Pro' },
  { code: 'firm', name: 'Firm', price: '$399', credits: '10,000/mo', seats: '25', cta: 'Pick Firm' },
];

export const Pricing = (): JSX.Element => (
  <div>
    <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
    <p className="mt-2 max-w-2xl text-sm text-[color:var(--color-fg-muted)]">
      Plans include monthly credits used by synthesis pipelines and report renders. Bring your
      own AI keys to redirect token spend off our bill onto yours. Enterprise is custom — get in
      touch.
    </p>
    <table className="mt-8 w-full text-sm">
      <thead className="text-left text-xs uppercase tracking-wide text-[color:var(--color-fg-subtle)]">
        <tr>
          <th className="py-2">Plan</th>
          <th className="py-2">Monthly</th>
          <th className="py-2">Credits</th>
          <th className="py-2">Seats</th>
          <th className="py-2"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[color:var(--color-border)]">
        {plans.map((p) => (
          <tr key={p.code}>
            <td className="py-3 font-medium">{p.name}</td>
            <td className="py-3">{p.price}</td>
            <td className="py-3">{p.credits}</td>
            <td className="py-3">{p.seats}</td>
            <td className="py-3 text-right">
              <Link
                to={`/sign-up?plan=${p.code}`}
                className="inline-flex h-9 items-center rounded-md border border-[color:var(--color-border)] px-4"
              >
                {p.cta}
              </Link>
            </td>
          </tr>
        ))}
        <tr>
          <td className="py-3 font-medium">Enterprise</td>
          <td className="py-3">Custom</td>
          <td className="py-3">Custom</td>
          <td className="py-3">Custom</td>
          <td className="py-3 text-right">
            <Link
              to="/help/contact?topic=enterprise"
              className="inline-flex h-9 items-center rounded-md border border-[color:var(--color-border)] px-4"
            >
              Talk to us
            </Link>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);
