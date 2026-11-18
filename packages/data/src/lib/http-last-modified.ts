export async function fetchLastModifiedHeader(url: string): Promise<string> {
  const res = await fetch(url, {
    method: "HEAD",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HEAD ${url} -> ${String(res.status)}`);

  const value = res.headers.get("last-modified");
  if (!value) throw new Error(`No Last-Modified header for ${url}`);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid Last-Modified "${value}" for ${url}`);
  }
  return date.toISOString();
}