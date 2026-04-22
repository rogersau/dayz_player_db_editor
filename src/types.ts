export interface PlayerRecord {
  id: number;
  uid: string;
  alive: boolean;
  data: Uint8Array;
  hasData: boolean;
  characterName: string | null;
  blobVersion: number | null;
  position: PlayerPosition | null;
  stats: PlayerStatEntry[];
  items: InventoryItem[];
}

export interface PlayerPosition {
  x: number;
  y: number;
  z: number;
  facingDegrees: number;
}

export interface PlayerStatEntry {
  key: string;
  value: number;
}

export interface InventoryItem {
  classname: string;
  slot: string;
  parent: string;
  persistentGuid: string;
  children: InventoryItem[];
}

export interface ItemClassSummary {
  classname: string;
  count: number;
}

export interface PlayerItemSearchResult {
  uid: string;
  id: number;
  alive: boolean;
  characterName: string | null;
  count: number;
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
