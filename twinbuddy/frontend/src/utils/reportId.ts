export function createReportId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const suffix = Math.random().toString(16).slice(2, 10);
  return `report-${Date.now()}-${suffix}`;
}
