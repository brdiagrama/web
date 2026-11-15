import { parseSqlSchema, type SqlDialect } from '@/domain/sql/parser';

self.onmessage = (event: MessageEvent<{ id: number; sql: string; dialect?: SqlDialect }>) => {
  const { id, sql, dialect } = event.data;

  try {
    const schema = parseSqlSchema(sql, dialect);
    self.postMessage({ id, success: true, schema });
  } catch (error: any) {
    self.postMessage({
      id,
      success: false,
      error: {
        line: error.line || error.location?.start?.line || 1,
        location: error.location,
        message: error.message || 'Erro de sintaxe no SQL',
        type: 'error',
      },
    });
  }
};

