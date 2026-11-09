// Formatare românească: punct la mii, virgulă zecimală.
function group(intStr: string) {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
export function fmtNum(x: number, dec = 0): string {
  if (!isFinite(x)) return "∞";
  const neg = x < 0 || Object.is(x, -0);
  const [i, d] = Math.abs(x).toFixed(dec).split(".");
  const s = group(i) + (d ? "," + d : "");
  return neg && Number(s.replace(/\./g, "").replace(",", ".")) !== 0 ? "−" + s : s;
}
export const fmtPct = (x: number, dec = 0) => fmtNum(x * 100, dec) + "%";
export const fmtPp = (x: number, dec = 1) => (x > 0 ? "+" : "") + fmtNum(x * 100, dec) + " pp";
export const fmtRon = (x: number, dec = 0) => fmtNum(x, dec) + " RON";
export const fmtSigned = (x: number, dec = 2) => (x > 0 ? "+" : "") + fmtNum(x, dec);

const LUNI = ["ian.", "feb.", "mar.", "apr.", "mai", "iun.", "iul.", "aug.", "sept.", "oct.", "nov.", "dec."];
export function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}
export function fmtDateLong(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${LUNI[m - 1]} ${y}`;
}
export function fmtMonthYear(t: number) {
  const d = new Date(t);
  return `${LUNI[d.getUTCMonth()].replace(".", "")} ${String(d.getUTCFullYear()).slice(2)}`;
}
