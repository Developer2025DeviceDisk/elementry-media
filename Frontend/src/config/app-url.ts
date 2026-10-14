// Resolve once in next.config.ts so server and browser bundles use the same site URL.
export function resolveAppUrl({
  appUrl,
  productionDomain,
  deploymentDomain,
}: {
  appUrl?: string;
  productionDomain?: string;
  deploymentDomain?: string;
}): string {
  const explicit = appUrl?.trim();
  if (explicit) return explicit;
  const domain = productionDomain?.trim() || deploymentDomain?.trim();
  return domain ? `https://${domain}` : 'http://localhost:3001';
}
