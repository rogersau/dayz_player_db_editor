export interface PlayerRecord {
  id: number;
  uid: string;
  alive: boolean;
  data: Uint8Array;
  characterName: string | null;
  items: InventoryItem[];
}

export interface InventoryItem {
  classname: string;
  slot: string;
  parent: string;
  persistentGuid: string;
  children: InventoryItem[];
}

export interface SqlJsDatabase {
  close(): void;
  exec(sql: string): SqlJsQueryResult[];
}

export interface SqlJsQueryResult {
  columns: string[];
  values: SqlValue[][];
}

export type SqlValue = number | string | Uint8Array | null;

export interface SqlJsModule {
  Database: new (data?: Uint8Array) => SqlJsDatabase;
}

export interface AppState {
  players: PlayerRecord[];
  filteredPlayers: PlayerRecord[];
  selectedUid: string | null;
}
