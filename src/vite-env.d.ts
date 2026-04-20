/// <reference types="vite/client" />

import type { SqlJsModule } from './types';

declare global {
  interface Window {
    initSqlJs: () => Promise<SqlJsModule>;
  }
}

export {};
