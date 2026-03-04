export function formatPopulation(pop: number): string {
  return pop.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}
