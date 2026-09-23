export const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export const num = (v) => Math.max(0, Number(v) || 0);

export function formatCompact(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1)} M`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(0)} Jt`;
  return idr.format(value);
}

