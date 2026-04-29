# Runbook — KMS KEK rotation

The platform KEK is in `IL_KMS_KEK_HEX` (32 bytes hex). Tenant DEKs are
wrapped with the KEK; rotation re-wraps every DEK without touching
ciphertexts.

## Quarterly rotation steps

1. Generate the next KEK: `openssl rand -hex 32`.
2. Set `IL_KMS_KEK_HEX_NEXT` on every API + worker host.
3. Run the rotation script:
   ```
   pnpm --filter @ilinga/db exec tsx src/scripts/rotate-kek.ts
   ```
4. Confirm `tenant_deks.kek_version = 2` for every row.
5. Promote: `IL_KMS_KEK_HEX = IL_KMS_KEK_HEX_NEXT`.
6. Restart PM2.

## Compromise response

If the KEK leaks: rotate immediately, rotate every webhook secret + AI
endpoint key (force the tenant to re-enter), notify affected customers
within 4 hours.
