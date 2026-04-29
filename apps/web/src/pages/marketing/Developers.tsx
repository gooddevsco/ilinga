export const Developers = (): JSX.Element => (
  <div className="space-y-4">
    <h1 className="text-3xl font-semibold tracking-tight">Developers</h1>
    <p className="text-sm text-[color:var(--color-fg-muted)]">
      Public REST API, webhooks, and a TypeScript SDK. The OpenAPI 3.1 spec lands in Phase 15.
    </p>
    <ul className="list-disc space-y-2 pl-5 text-sm">
      <li>
        OpenAPI:&nbsp;
        <a href="/v1/openapi.json" className="underline">
          /v1/openapi.json
        </a>{' '}
        (live in Phase 15)
      </li>
      <li>SDK: <code>@ilinga/sdk</code> (typed wrapper, generated from OpenAPI)</li>
      <li>Webhooks: signed via HMAC-SHA256, secret rotation with 24h grace</li>
    </ul>
  </div>
);
