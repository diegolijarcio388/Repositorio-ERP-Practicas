import mysql from "mysql2/promise";

type QueryablePool = {
  query: <T = unknown>(sql: string, params?: unknown[]) => Promise<[T, unknown]>;
  getConnection: () => Promise<mysql.PoolConnection>;
};

let pool: QueryablePool | null = null;

const getDatabaseUrl = (): string => {
  const runtimeEnv = (globalThis as { process?: { env?: Record<string, string> } })
    .process?.env;
  const candidate =
    runtimeEnv?.MYSQL_URL ??
    runtimeEnv?.DATABASE_URL ??
    import.meta.env.MYSQL_URL ??
    import.meta.env.DATABASE_URL;
  if (!candidate) {
    throw new Error("MYSQL_URL no configurado.");
  }
  return candidate;
};

export const getMySqlPool = (): QueryablePool => {
  if (!pool) {
    pool = mysql.createPool({
      uri: getDatabaseUrl(),
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
      timezone: "Z",
      dateStrings: true,
    }) as unknown as QueryablePool;
  }
  return pool;
};

export const withTransaction = async <T>(
  fn: (connection: mysql.PoolConnection) => Promise<T>,
): Promise<T> => {
  const connection = await getMySqlPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
