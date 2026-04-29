/**
 * Hand-curated OpenAPI 3.1 surface — kept tightly in sync with the routes by
 * the test suite (Phase 19 introduces a generator to enforce schemas match
 * the zod Body schemas; for now this is the canonical reference).
 */

export const openapiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Ilinga API',
    version: '1.0.0',
    description: 'Public REST API for Ilinga. EU-only at GA.',
  },
  servers: [{ url: 'https://api.ilinga.com' }],
  paths: {
    '/v1/internal/healthz': { get: { responses: { '200': { description: 'OK' } } } },
    '/v1/auth/magic-link/request': {
      post: {
        summary: 'Request a magic link',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/MagicLinkRequest' } } },
        },
        responses: { '200': { description: 'Always 200 (anti-enumeration)' } },
      },
    },
    '/v1/auth/me': {
      get: { security: [{ session: [] }], responses: { '200': { description: 'Current user' } } },
    },
    '/v1/tenants': {
      post: {
        security: [{ session: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTenant' } } },
        },
        responses: { '201': { description: 'Created' } },
      },
      get: { security: [{ session: [] }], responses: { '200': { description: 'List my tenants' } } },
    },
    '/v1/ventures': {
      post: { security: [{ session: [] }], responses: { '201': { description: 'Created' } } },
    },
    '/v1/synthesis/tenant/{tid}/cycles/{cid}/start': {
      post: {
        security: [{ session: [] }],
        parameters: [{ in: 'path', name: 'tid', required: true, schema: { type: 'string' } }, { in: 'path', name: 'cid', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Synthesis started' } },
      },
    },
    '/v1/reports/tenant/{tid}/render': {
      post: { security: [{ session: [] }], responses: { '200': { description: 'Report rendered' } } },
    },
    '/v1/billing/tenant/{tid}/balance': {
      get: { security: [{ session: [] }], responses: { '200': { description: 'Credit balance' } } },
    },
    '/v1/webhooks/dodo': {
      post: { responses: { '200': { description: 'Webhook accepted' } } },
    },
    '/v1/api-tokens/tenant/{tid}': {
      post: { security: [{ session: [] }], responses: { '201': { description: 'PAT issued' } } },
      get: { security: [{ session: [] }], responses: { '200': { description: 'List PATs' } } },
    },
  },
  components: {
    securitySchemes: {
      session: { type: 'apiKey', in: 'cookie', name: 'il_session' },
      pat: { type: 'http', scheme: 'bearer', bearerFormat: 'il_pat_…' },
    },
    schemas: {
      MagicLinkRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          purpose: { type: 'string', enum: ['signup', 'signin', 'tenant_invite', 'email_change_verify', 'account_recovery', 'step_up'] },
        },
      },
      CreateTenant: {
        type: 'object',
        required: ['displayName'],
        properties: { displayName: { type: 'string', minLength: 2, maxLength: 80 } },
      },
    },
  },
} as const;
