export interface DatabasePool {
  query: (sql: string, params?: unknown[]) => Promise<unknown>;
}

export function createDbPool(connectionString = process.env.DATABASE_URL) {
  return {
    async query(sql: string, params: unknown[] = []) {
      return { sql, params, connectionString };
    }
  } satisfies DatabasePool;
}
