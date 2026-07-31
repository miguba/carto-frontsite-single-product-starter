export function resolveContentImage(
  value: string | undefined,
  mediaBaseUrl: string,
) {
  if (!value || !mediaBaseUrl) return value || '';

  const normalized = value.replace(/^\/+/, '');
  if (!normalized.startsWith('i/')) return value;

  return `${mediaBaseUrl.replace(/\/$/, '')}/${normalized}`;
}
