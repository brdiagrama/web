import { parseSqlSchema } from '@/domain/sql/parser';

self.onmessage = (event: MessageEvent<{ id: number; sql: string }>) => {
  const { id, sql } = event.data;

  try {
    const schema = parseSqlSchema(sql);
    self.postMessage({ id, success: true, schema });
  } catch (error: any) {
    self.postMessage({
      id,
      success: false,
      error: {
        line: error.location?.start?.line || 1,
        message: error.message || 'Erro de sintaxe no SQL',
        type: 'error',
      },
    });
  }
};

