import type {
  InventoryItem,
  ItemClassSummary,
  PlayerItemSearchResult,
  PlayerPosition,
  PlayerRecord,
  PlayerStatEntry,
  SqlJsDatabase,
  SqlValue
} from '../types';

const textDecoder = new TextDecoder();

export function readPlayers(database: SqlJsDatabase): PlayerRecord[] {
  const result = database.exec('SELECT ID, UID, Alive, Data FROM Players ORDER BY UID ASC');

  if (result.length === 0) {
    return [];
  }

  return result[0].values.map(([id, uid, alive, data]) => parsePlayerRecord({
    id: Number(id),
    uid: typeof uid === 'string' ? uid : '',
    alive: Boolean(alive),
    data: toUint8Array(data),
    hasData: false,
    characterName: null,
    blobVersion: null,
    position: null,
    stats: [],
    items: []
  }));
}

export function countAllItems(items: InventoryItem[]): number {
  return items.reduce((total, item) => total + 1 + countAllItems(item.children), 0);
}

export function summarizeItemsByClassname(items: InventoryItem[]): ItemClassSummary[] {
  const counts = new Map<string, number>();

  const visit = (item: InventoryItem): void => {
    counts.set(item.classname, (counts.get(item.classname) ?? 0) + 1);

    item.children.forEach(visit);
  };

  items.forEach(visit);

  return [...counts.entries()]
    .map(([classname, count]) => ({ classname, count }))
    .sort((left, right) => right.count - left.count || left.classname.localeCompare(right.classname));
}

export function searchItemsAcrossPlayers(players: PlayerRecord[], searchTerm: string): PlayerItemSearchResult[] {
  const normalizedTerm = searchTerm.trim().toLowerCase();

  if (!normalizedTerm) {
    return [];
  }

  const results = players
    .filter((player) => player.alive)
    .map((player) => ({
      uid: player.uid,
      id: player.id,
      alive: player.alive,
      characterName: player.characterName,
      count: countMatchingItems(player.items, normalizedTerm)
    }))
    .filter((result) => result.count > 0);

  return results.sort((left, right) => {
    const countDiff = right.count - left.count;

    if (countDiff !== 0) {
      return countDiff;
    }

    const leftName = left.characterName ?? '';
    const rightName = right.characterName ?? '';
    const nameDiff = leftName.localeCompare(rightName);

    if (nameDiff !== 0) {
      return nameDiff;
    }

    return left.uid.localeCompare(right.uid);
  });
}

function countMatchingItems(items: InventoryItem[], normalizedTerm: string): number {
  return items.reduce((total, item) => {
    const matches = item.classname.toLowerCase().includes(normalizedTerm) ? 1 : 0;
    return total + matches + countMatchingItems(item.children, normalizedTerm);
  }, 0);
}

function parsePlayerRecord(record: PlayerRecord): PlayerRecord {
  if (record.data.length === 0) {
    return record;
  }

  const reader = createReader(record.data);
  const position = parsePlayerPosition(reader.readBytes(16));
  const characterName = reader.readString(reader.readUint8()) || null;
  const stats = parsePlayerStats(reader.readBytes(reader.readUint16()));
  const blobVersion = reader.readUint16();

  const topLevelItemCount = reader.readUint32();
  const items: InventoryItem[] = [];

  for (let index = 0; index < topLevelItemCount; index += 1) {
    items.push(parseItem(reader, record.uid));
  }

  return {
    ...record,
    hasData: true,
    characterName,
    blobVersion,
    position,
    stats,
    items
  };
}

function parsePlayerPosition(bytes: Uint8Array): PlayerPosition {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  return {
    x: view.getFloat32(2, true),
    y: view.getFloat32(6, true),
    z: view.getFloat32(10, true),
    facingDegrees: normalizeDegrees((view.getUint16(14, true) / 65536) * 360)
  };
}

function parsePlayerStats(bytes: Uint8Array): PlayerStatEntry[] {
  if (bytes.length === 0) {
    return [];
  }

  const reader = createReader(bytes);
  reader.readUint16();
  reader.readUint16();
  reader.readUint32();

  const statCount = reader.readUint16();
  const stats: PlayerStatEntry[] = [];

  for (let index = 0; index < statCount; index += 1) {
    const key = reader.readString(reader.readUint8());
    const value = reader.readFloat32();
    stats.push({ key, value });
  }

  return stats;
}

function parseItem(reader: BinaryReader, ownerUid: string): InventoryItem {
  reader.readUint32();
  const classname = reader.readString(reader.readUint8());
  reader.readBytes(6);
  const slot = reader.readString(reader.readUint8());
  const customDataLength = reader.readInt32();
  const guidBytes = reader.readBytes(16);
  const payloadLength = Math.max(customDataLength - 16, 0);
  reader.readBytes(payloadLength);

  const childrenCount = reader.readUint32();
  const children: InventoryItem[] = [];

  for (let index = 0; index < childrenCount; index += 1) {
    children.push(parseItem(reader, ownerUid));
  }

  return {
    classname,
    slot,
    parent: ownerUid,
    persistentGuid: dotnetGuidFromBytes(guidBytes),
    children
  };
}

interface BinaryReader {
  readBytes(length: number): Uint8Array;
  readUint8(): number;
  readUint16(): number;
  readUint32(): number;
  readInt32(): number;
  readFloat32(): number;
  readString(length: number): string;
}

function createReader(bytes: Uint8Array): BinaryReader {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;

  const ensureReadable = (length: number): void => {
    if (offset + length > bytes.length) {
      throw new Error('The uploaded file contains a player record with unexpected binary data.');
    }
  };

  return {
    readBytes(length) {
      ensureReadable(length);
      const chunk = bytes.slice(offset, offset + length);
      offset += length;
      return chunk;
    },
    readUint8() {
      ensureReadable(1);
      const value = view.getUint8(offset);
      offset += 1;
      return value;
    },
    readUint16() {
      ensureReadable(2);
      const value = view.getUint16(offset, true);
      offset += 2;
      return value;
    },
    readUint32() {
      ensureReadable(4);
      const value = view.getUint32(offset, true);
      offset += 4;
      return value;
    },
    readInt32() {
      ensureReadable(4);
      const value = view.getInt32(offset, true);
      offset += 4;
      return value;
    },
    readFloat32() {
      ensureReadable(4);
      const value = view.getFloat32(offset, true);
      offset += 4;
      return value;
    },
    readString(length) {
      return textDecoder.decode(this.readBytes(length));
    }
  };
}

function normalizeDegrees(value: number): number {
  const normalized = value % 360;
  return normalized >= 0 ? normalized : normalized + 360;
}

function dotnetGuidFromBytes(bytes: Uint8Array): string {
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0'));

  return [
    hex.slice(3, 4).concat(hex.slice(2, 3), hex.slice(1, 2), hex.slice(0, 1)).join(''),
    hex.slice(5, 6).concat(hex.slice(4, 5)).join(''),
    hex.slice(7, 8).concat(hex.slice(6, 7)).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join('')
  ].join('-').toUpperCase();
}

function toUint8Array(value: SqlValue): Uint8Array {
  if (value == null) {
    return new Uint8Array();
  }

  if (value instanceof Uint8Array) {
    return value;
  }

  if (Array.isArray(value)) {
    return Uint8Array.from(value);
  }

  if (typeof value === 'string' || typeof value === 'number') {
    throw new Error('The uploaded file does not contain player data in the expected format.');
  }

  throw new Error('The uploaded file does not contain player data in the expected format.');
}
