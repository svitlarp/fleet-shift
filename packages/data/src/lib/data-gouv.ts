const API_BASE = "https://www.data.gouv.fr/api/1";

interface DataGouvResource {
  id: string;
  last_modified: string;
}

interface DataGouvDataset {
  resources: DataGouvResource[];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isDataset(data: unknown): data is DataGouvDataset {
  return (
    isRecord(data) &&
    Array.isArray(data.resources) &&
    data.resources.every(
      (r) =>
        isRecord(r) &&
        typeof r.id === "string" &&
        typeof r.last_modified === "string",
    )
  );
}

async function fetchDataset(datasetId: string): Promise<DataGouvDataset> {
  const url = `${API_BASE}/datasets/${encodeURIComponent(datasetId)}/`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`data.gouv.fr API ${String(res.status)} for ${url}`);
  }

  const data: unknown = await res.json();
  if (!isDataset(data)) {
    throw new Error(`Unexpected data.gouv.fr response shape for ${url}`);
  }
  return data;
}

/** Last update ISO-string */
export async function fetchSourceUpdatedAt(
  datasetId: string,
  resourceId: string,
): Promise<string> {
  const dataset = await fetchDataset(datasetId);
  const resource = dataset.resources.find((r) => r.id === resourceId);

  if (!resource) {
    throw new Error(`Resource ${resourceId} not found in dataset ${datasetId}`);
  }
  return resource.last_modified;
}