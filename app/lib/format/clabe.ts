export function maskClabe(clabe: string): string {
  const lastFour = clabe.slice(-4);
  const masked = "•".repeat(Math.max(clabe.length - 4, 0));
  return `${masked} ${lastFour}`;
}
