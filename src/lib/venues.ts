function range(prefix: string, start: number, end: number): string[] {
  const result: string[] = [];
  for (let i = start; i <= end; i += 1) result.push(`${prefix} ${i}`);
  return result;
}

export const VENUE_OPTIONS: string[] = [
  ...range("ROB Room", 1, 28),
  ...range("NLB Room", 1, 2),
  ...range("NFB Room", 1, 7),
  ...range("JCRC Room", 1, 2),
];
