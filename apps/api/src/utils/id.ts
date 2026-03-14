export function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createJoinCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
