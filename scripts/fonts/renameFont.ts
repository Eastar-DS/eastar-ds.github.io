// SFNT(TrueType · OpenType) 글꼴의 name 표에서 글꼴 이름만 바꿉니다.
// OFL의 예약 글꼴 이름(Reserved Font Name)이 있는 글꼴을 줄여 쓰면(수정본) 그 이름을 쓸 수 없어서 씁니다.
// 가변 글꼴의 다른 표(fvar · gvar 등)는 건드리지 않고 그대로 옮깁니다.

interface NameRecord {
  platformID: number;
  encodingID: number;
  languageID: number;
  nameID: number;
  value: string;
}

interface RenameFontParams {
  /** woff2가 아닌 SFNT 바이트 */
  sfnt: Uint8Array;
  /** 새 글꼴 이름. 예: "Blog Sans" */
  familyName: string;
  /** 이름에서 지울 원래 이름들. 예: ["Pretendard"] */
  reservedNames: string[];
}

// 글꼴 이름이 들어가는 name ID: 1 family, 3 unique, 4 full, 6 PostScript, 16 typographic family,
// 18 compatible full, 21 WWS family, 25 variations PostScript prefix. 0(저작권) · 7(상표) · 13(라이선스)은 그대로 둡니다
const FAMILY_NAME_IDS = new Set([1, 3, 4, 16, 18, 21]);
const POSTSCRIPT_NAME_IDS = new Set([6, 25]);

const isUtf16 = (record: Pick<NameRecord, "platformID">) =>
  record.platformID === 0 || record.platformID === 3;

const decodeString = (bytes: Uint8Array, record: Pick<NameRecord, "platformID">) => {
  if (!isUtf16(record)) return String.fromCharCode(...bytes);

  let value = "";
  for (let index = 0; index + 1 < bytes.length; index += 2) {
    value += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
  }

  return value;
};

const encodeString = (value: string, record: Pick<NameRecord, "platformID">) => {
  if (!isUtf16(record)) return Uint8Array.from(value, (character) => character.charCodeAt(0) & 0xff);

  const bytes = new Uint8Array(value.length * 2);
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    bytes[index * 2] = code >> 8;
    bytes[index * 2 + 1] = code & 0xff;
  }

  return bytes;
};

interface TableRecord {
  tag: string;
  data: Uint8Array;
}

const readTables = (sfnt: Uint8Array) => {
  const view = new DataView(sfnt.buffer, sfnt.byteOffset, sfnt.byteLength);
  const numTables = view.getUint16(4);
  const tables: TableRecord[] = [];

  for (let index = 0; index < numTables; index += 1) {
    const recordOffset = 12 + index * 16;
    const tag = String.fromCharCode(...sfnt.subarray(recordOffset, recordOffset + 4));
    const offset = view.getUint32(recordOffset + 8);
    const length = view.getUint32(recordOffset + 12);
    tables.push({ tag, data: sfnt.slice(offset, offset + length) });
  }

  return { version: view.getUint32(0), tables };
};

/** 글꼴의 name 표를 읽습니다 */
export const readNames = (sfnt: Uint8Array) => {
  const name = readTables(sfnt).tables.find((table) => table.tag === "name");

  if (!name) return [];

  const view = new DataView(name.data.buffer, name.data.byteOffset, name.data.byteLength);
  const count = view.getUint16(2);
  const storageOffset = view.getUint16(4);

  return Array.from({ length: count }, (_, index) => {
    const base = 6 + index * 12;
    const record = {
      platformID: view.getUint16(base),
      encodingID: view.getUint16(base + 2),
      languageID: view.getUint16(base + 4),
      nameID: view.getUint16(base + 6),
    };
    const length = view.getUint16(base + 8);
    const offset = storageOffset + view.getUint16(base + 10);
    const nameRecord: NameRecord = {
      ...record,
      value: decodeString(name.data.subarray(offset, offset + length), record),
    };

    return nameRecord;
  });
};

const buildNameTable = (records: NameRecord[]) => {
  const sorted = [...records].sort(
    (a, b) =>
      a.platformID - b.platformID ||
      a.encodingID - b.encodingID ||
      a.languageID - b.languageID ||
      a.nameID - b.nameID,
  );
  const strings = sorted.map((record) => encodeString(record.value, record));
  const storageOffset = 6 + sorted.length * 12;
  const table = new Uint8Array(storageOffset + strings.reduce((sum, bytes) => sum + bytes.length, 0));
  const view = new DataView(table.buffer);

  view.setUint16(0, 0);
  view.setUint16(2, sorted.length);
  view.setUint16(4, storageOffset);

  let stringOffset = 0;
  sorted.forEach((record, index) => {
    const base = 6 + index * 12;
    const bytes = strings[index];
    view.setUint16(base, record.platformID);
    view.setUint16(base + 2, record.encodingID);
    view.setUint16(base + 4, record.languageID);
    view.setUint16(base + 6, record.nameID);
    view.setUint16(base + 8, bytes.length);
    view.setUint16(base + 10, stringOffset);
    table.set(bytes, storageOffset + stringOffset);
    stringOffset += bytes.length;
  });

  return table;
};

const checksum = (data: Uint8Array) => {
  const padded = new Uint8Array(Math.ceil(data.length / 4) * 4);
  padded.set(data);
  const view = new DataView(padded.buffer);
  let sum = 0;

  for (let offset = 0; offset < padded.length; offset += 4) {
    sum = (sum + view.getUint32(offset)) >>> 0;
  }

  return sum;
};

const buildSfnt = (version: number, tables: TableRecord[]) => {
  const sorted = [...tables].sort((a, b) => (a.tag < b.tag ? -1 : 1));
  const numTables = sorted.length;
  const entrySelector = Math.floor(Math.log2(numTables));
  const searchRange = 2 ** entrySelector * 16;
  const headerLength = 12 + numTables * 16;
  const offsets: number[] = [];
  let cursor = headerLength;

  sorted.forEach((table) => {
    offsets.push(cursor);
    cursor += Math.ceil(table.data.length / 4) * 4;
  });

  const font = new Uint8Array(cursor);
  const view = new DataView(font.buffer);
  view.setUint32(0, version);
  view.setUint16(4, numTables);
  view.setUint16(6, searchRange);
  view.setUint16(8, entrySelector);
  view.setUint16(10, numTables * 16 - searchRange);

  sorted.forEach((table, index) => {
    const data = table.data;
    if (table.tag === "head") new DataView(data.buffer, data.byteOffset).setUint32(8, 0);

    const recordOffset = 12 + index * 16;
    font.set(Uint8Array.from(table.tag, (character) => character.charCodeAt(0)), recordOffset);
    view.setUint32(recordOffset + 4, checksum(data));
    view.setUint32(recordOffset + 8, offsets[index]);
    view.setUint32(recordOffset + 12, data.length);
    font.set(data, offsets[index]);
  });

  const headIndex = sorted.findIndex((table) => table.tag === "head");
  if (headIndex >= 0) {
    view.setUint32(offsets[headIndex] + 8, (0xb1b0afba - checksum(font)) >>> 0);
  }

  return font;
};

/** 글꼴 이름을 바꾼 새 SFNT를 돌려줍니다. 원래 이름이 들어간 글꼴 이름 기록만 바꿉니다 */
const renameFont = ({ sfnt, familyName, reservedNames }: RenameFontParams) => {
  const { version, tables } = readTables(sfnt);
  const postScriptName = familyName.replaceAll(" ", "");
  const replaceReserved = (value: string, replacement: string) =>
    reservedNames.reduce((result, reserved) => result.replaceAll(reserved, replacement), value);
  const records = readNames(sfnt).map((record) => {
    if (FAMILY_NAME_IDS.has(record.nameID)) {
      return { ...record, value: replaceReserved(record.value, familyName) };
    }
    if (POSTSCRIPT_NAME_IDS.has(record.nameID)) {
      return { ...record, value: replaceReserved(record.value, postScriptName) };
    }

    return record;
  });
  const renamedTables = tables.map((table) =>
    table.tag === "name" ? { ...table, data: buildNameTable(records) } : table,
  );

  return buildSfnt(version, renamedTables);
};

export default renameFont;
