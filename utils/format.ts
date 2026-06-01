export function fmt(n: number): string {
  const v = Math.round(n * 100) / 100;
  const [int, dec] = v.toFixed(2).split('.');
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec === '00' ? intFmt : `${intFmt}.${dec}`;
}
