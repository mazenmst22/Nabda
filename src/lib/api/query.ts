export const staleTime = {
  availability: 30_000,
  directory: 5 * 60_000,
  patientRecord: 0,
  operational: 0,
  configuration: 30_000,
} as const;

export function withQuery(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
