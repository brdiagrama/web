import type { DatabaseSchema } from '@/domain/models/databaseSchema';
import { parseSqlSchema } from '@/domain/sql/parser';

export interface SqlParseError {
  line: number;
  message: string;
  type: 'error';
}

interface PendingRequest {
  resolve: (schema: DatabaseSchema) => void;
  reject: (error: SqlParseError) => void;
}

let workerInstance: Worker | null = null;
let currentRequestId = 0;
const pendingRequests = new Map<number, PendingRequest>();

function getWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }

  if (!workerInstance) {
    workerInstance = new Worker(new URL('../workers/sqlParser.worker.ts', import.meta.url), {
      type: 'module',
    });

    workerInstance.onmessage = (event: MessageEvent) => {
      const { id, success, schema, error } = event.data;
      const pending = pendingRequests.get(id);

      if (!pending) return;

      pendingRequests.delete(id);

      if (success) {
        pending.resolve(schema);
      } else {
        pending.reject(error);
      }
    };

    workerInstance.onerror = () => {
      pendingRequests.forEach((pending) => {
        pending.reject({
          line: 1,
          message: 'Falha no processamento em segundo plano do SQL',
          type: 'error',
        });
      });
      pendingRequests.clear();
    };
  }

  return workerInstance;
}

export function parseSqlAsync(sql: string): Promise<DatabaseSchema> {
  const worker = getWorker();

  if (!worker) {
    return Promise.resolve().then(() => parseSqlSchema(sql));
  }

  return new Promise<DatabaseSchema>((resolve, reject) => {
    const id = ++currentRequestId;

    // Cancela requisições pendentes anteriores para não processar SQLs obsoletos
    pendingRequests.clear();
    pendingRequests.set(id, { resolve, reject });

    worker.postMessage({ id, sql });
  });
}
