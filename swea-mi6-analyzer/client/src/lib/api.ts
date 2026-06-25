import type { AnalysisRecord } from "./swea-data";

const BASE = "/api/records";

export async function apiLoadRecords(): Promise<AnalysisRecord[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error("Failed to load records");
  const rows = await res.json();
  // Map DB columns back to AnalysisRecord shape
  return rows.map(rowToRecord);
}

export async function apiSaveRecord(record: AnalysisRecord): Promise<void> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error("Failed to save record");
}

export async function apiDeleteRecord(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete record");
}

export async function apiGetRecord(id: string): Promise<AnalysisRecord | undefined> {
  const res = await fetch(`${BASE}/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error("Failed to fetch record");
  return rowToRecord(await res.json());
}

function rowToRecord(row: Record<string, unknown>): AnalysisRecord {
  return {
    id:         row.id as string,
    pair:       row.pair as string,
    timeframe:  row.timeframe as string,
    date:       row.date as string,
    indicators: row.indicators as AnalysisRecord["indicators"],
    verdict:    row.verdict as AnalysisRecord["verdict"],
    chartImage: row.chart_image as string | undefined,
    notes:      row.notes as string | undefined,
  };
}
