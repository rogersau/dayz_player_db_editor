import type { SqlJsModule } from '../types';

let sqlModulePromise: Promise<SqlJsModule> | null = null;
let scriptLoadPromise: Promise<void> | null = null;

export async function getSqlModule(): Promise<SqlJsModule> {
  await ensureSqlScript();

  if (sqlModulePromise === null) {
    sqlModulePromise = window.initSqlJs();
  }

  return sqlModulePromise;
}

function ensureSqlScript(): Promise<void> {
  if (typeof window.initSqlJs === 'function') {
    return Promise.resolve();
  }

  if (scriptLoadPromise !== null) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${import.meta.env.BASE_URL}vendor/sql.js/sql-asm.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load the bundled sql.js runtime.'));
    document.head.append(script);
  });

  return scriptLoadPromise;
}
