/**
 * 📄 .doc (Word 97-2003) 二进制格式解析引擎 v2
 *
 * 基于 MS-DOC 规范，通过 CFB (Compound File Binary / OLE2) 提取正文文本。
 *
 * v2 改进：
 *  - GBK/GB2312 中文编码自动检测（ANSI Piece 优先用 GBK）
 *  - 伪 .doc 检测（ZIP 头 → 实际是 .docx）
 *  - Piece Table 边界保护 + 损坏恢复
 *  - 编码质量评分 → 自动回退
 *  - 加密文档安全拒绝
 *
 * 局限性：仅提取纯文本（无格式保留），段落按 \r 分割。
 */

import { read, find, type CFB$Container } from 'cfb';

// ── 常量 ──
const WORDDOCUMENT_STREAM = 'WordDocument';
const TABLE_1_STREAM = '1Table';
const TABLE_0_STREAM = '0Table';

/** .docx 伪装的 .doc：ZIP 魔数 PK\x03\x04 */
const ZIP_MAGIC = 0x04034b50;
/** OLE2 魔数 D0CF11E0 */
const OLE2_MAGIC = 0xe011cfd0;

interface FibBase {
  ccpText: number;
  ccpFtn: number;
  ccpHdd: number;
  ccpAtn: number;
  fcClx: number;
  lcbClx: number;
  /** Far East language ID (0x0804=简体中文) */
  lidFE: number;
}

export interface DocExtractResult {
  text: string;
  html: string;
  charCount: number;
  paragraphCount: number;
  encrypted: boolean;
  /** 是否为伪 .doc（实际是 .docx 被错误命名） */
  isActuallyDocx: boolean;
}

/**
 * 快速检测：该文件是否实际是 .docx（ZIP 格式）
 */
export function isActuallyDocx(data: Uint8Array): boolean {
  if (data.length < 4) return false;
  return readU32LE(data, 0) === ZIP_MAGIC;
}

/**
 * 从 .doc ArrayBuffer 提取文本
 */
export function extractDocText(arrayBuffer: ArrayBuffer): DocExtractResult {
  const data = new Uint8Array(arrayBuffer);

  // ── 步骤 0：OLE2 魔数校验 ──
  if (data.length < 8 || readU32LE(data, 0) !== OLE2_MAGIC) {
    if (readU32LE(data, 0) === ZIP_MAGIC) {
      return {
        text: '', html: '', charCount: 0, paragraphCount: 0,
        encrypted: false, isActuallyDocx: true,
      };
    }
    throw new Error('无法识别文件格式（非 .doc 非 .docx），请检查文件是否损坏');
  }

  // ── 步骤 1：解析 OLE2 容器 ──
  let cfb: CFB$Container;
  try {
    cfb = read(data, { type: 'buffer' });
  } catch (err) {
    throw new Error('OLE2 容器解析失败: ' + (err as Error).message);
  }

  // ── 步骤 2：读取 WordDocument 流 ──
  const wordDocStream = find(cfb, WORDDOCUMENT_STREAM);
  if (!wordDocStream) {
    throw new Error('.doc 文件中未找到 WordDocument 流');
  }
  const wdContent = new Uint8Array(wordDocStream.content);

  // ── 步骤 3：解析 FIB ──
  const fib = readFib(wdContent);
  if (!fib) {
    throw new Error('无法解析 FIB 头（文档可能已损坏或加密）');
  }

  if (fib.ccpText === 0) {
    return {
      text: '', html: '', charCount: 0, paragraphCount: 0,
      encrypted: false, isActuallyDocx: false,
    };
  }

  // ── 步骤 4：读取 Table 流 → Piece Table ──
  const tableStream = find(cfb, TABLE_1_STREAM) || find(cfb, TABLE_0_STREAM);

  if (tableStream) {
    const tableContent = new Uint8Array(tableStream.content);
    try {
      const result = extractViaPieceTable(wdContent, tableContent, fib);
      if (result.charCount > 0) return result;
    } catch {
      // Piece Table 失败 → 降级
    }
  }

  // ── 降级：启发式扫描 ──
  return heuristicExtract(wdContent, fib);
}

// ═══════════════════════════════════════════════════════
// FIB 解析
// ═══════════════════════════════════════════════════════

function readFib(data: Uint8Array): FibBase | null {
  if (data.length < 64) return null;

  // Magic: 0xA5EC (Word 文档), 0xA5DC (Word 6.0/95)
  const magic = (data[1] << 8) | data[0];
  if (magic !== 0xA5EC && magic !== 0xA5DC) return null;

  // fEncrypted — FIB offset 0x0A bit 8
  const flags = readU16LE(data, 0x0A);
  if (flags & 0x0100) {
    throw new Error('.doc 文件已加密，请在 Word 中取消密码保护后重试');
  }

  // nFib (FIB version) at offset 0x0002 — 影响字段偏移
  const nFib = readU16LE(data, 0x0002);

  // lidFE (Far East language) at offset 0x0040
  const lidFE = readU16LE(data, 0x0040);

  // ccpText — 偏移取决于 nFib
  let ccpOffset: number;
  if (nFib <= 0x006D) {
    // Word 6.0/95: no fibRgLw97
    return {
      ccpText: readU32LE(data, 0x0018) || 0,
      ccpFtn: 0, ccpHdd: 0, ccpAtn: 0,
      fcClx: readU32LE(data, 0x004C) || 0,
      lcbClx: readU32LE(data, 0x0050) || 0,
      lidFE: 0,
    };
  }

  // Word 97+ : fibRgLw97 从 0x0044 开始
  ccpOffset = 0x004C;

  const ccpText = readU32LE(data, ccpOffset);
  const ccpFtn = readU32LE(data, ccpOffset + 4);
  const ccpHdd = readU32LE(data, ccpOffset + 8);
  const ccpAtn = readU32LE(data, ccpOffset + 24);

  // fcClx / lcbClx — fibRgFcLcb97 从固定偏移
  // fcClx97 at fibRgFcLcb97[26] = 0x01A2
  const fcClx = readU32LE(data, 0x01A2);
  const lcbClx = readU32LE(data, 0x01A6);

  if (ccpText === 0 && ccpFtn === 0) return null;

  return { ccpText, ccpFtn, ccpHdd, ccpAtn, fcClx, lcbClx, lidFE };
}

// ═══════════════════════════════════════════════════════
// Piece Table 解析
// ═══════════════════════════════════════════════════════

interface PieceDescriptor {
  fc: number;
  count: number;
  isAnsi: boolean;
}

function extractViaPieceTable(
  wdContent: Uint8Array,
  tableContent: Uint8Array,
  fib: FibBase
): DocExtractResult {
  const clx = readClx(tableContent, fib.fcClx, fib.lcbClx);
  if (!clx || clx.length < 8) {
    return heuristicExtract(wdContent, fib);
  }

  const pieces = readPieceTable(clx);
  if (pieces.length === 0 || pieces.every(p => p.count <= 0)) {
    return heuristicExtract(wdContent, fib);
  }

  // 编码器：中文 .doc 的 ANSI → GBK；西文 → CP1252
  const isChineseDoc = (fib.lidFE === 0x0804 || fib.lidFE === 0x0404);

  // 第一轮：按 FIB 语言标记选择 ANSI 解码器
  const primaryAnsiDec = new TextDecoder(isChineseDoc ? 'gbk' : 'windows-1252');
  const unicodeDec = new TextDecoder('utf-16le');
  const fallbackAnsiDec = new TextDecoder(isChineseDoc ? 'windows-1252' : 'gbk');

  let text = '';
  let replacementCount = 0;

  for (let pi = 0; pi < pieces.length; pi++) {
    const piece = pieces[pi];
    if (piece.count <= 0) continue;

    if (piece.isAnsi) {
      // ANSI: 1 byte per char
      const byteLen = piece.count;
      const end = Math.min(piece.fc + byteLen, wdContent.length);
      if (end <= piece.fc) continue;
      const slice = wdContent.slice(piece.fc, end);

      const decoded = primaryAnsiDec.decode(slice, { stream: pi < pieces.length - 1 });
      // 统计替换字符
      for (let i = 0; i < decoded.length; i++) {
        if (decoded.charCodeAt(i) === 0xFFFD) replacementCount++;
      }
      text += decoded;
    } else {
      // Unicode: 2 bytes per char
      const byteLen = piece.count * 2;
      const end = Math.min(piece.fc + byteLen, wdContent.length);
      if (end <= piece.fc) continue;
      const slice = wdContent.slice(piece.fc, end);

      const decoded = unicodeDec.decode(slice, { stream: pi < pieces.length - 1 });
      for (let i = 0; i < decoded.length; i++) {
        if (decoded.charCodeAt(i) === 0xFFFD) replacementCount++;
      }
      text += decoded;
    }
  }

  // 编码质量检查：替换字符 >30% → 用备选编码重试
  if (text.length > 0 && replacementCount / text.length > 0.30) {
    text = '';
    replacementCount = 0;
    for (let pi = 0; pi < pieces.length; pi++) {
      const piece = pieces[pi];
      if (piece.count <= 0) continue;

      if (piece.isAnsi) {
        const byteLen = piece.count;
        const end = Math.min(piece.fc + byteLen, wdContent.length);
        if (end <= piece.fc) continue;
        text += fallbackAnsiDec.decode(wdContent.slice(piece.fc, end), { stream: pi < pieces.length - 1 });
      } else {
        const byteLen = piece.count * 2;
        const end = Math.min(piece.fc + byteLen, wdContent.length);
        if (end <= piece.fc) continue;
        text += unicodeDec.decode(wdContent.slice(piece.fc, end), { stream: pi < pieces.length - 1 });
      }
    }
  }

  // 如果 Piece Table 提取结果异常少，尝试启发式
  if (text.trim().length < 10 && fib.ccpText > 100) {
    return heuristicExtract(wdContent, fib);
  }

  return buildResult(text);
}

function readClx(tableContent: Uint8Array, fcClx: number, lcbClx: number): Uint8Array | null {
  if (fcClx < 0 || fcClx + lcbClx > tableContent.length) return null;
  if (lcbClx <= 0) return null;
  return tableContent.slice(fcClx, fcClx + lcbClx);
}

/**
 * 解析 Piece Table（Prc 结构）
 *
 * CLX 布局: [GrPrc (var)] [0x01] [cbGrpprl] [GrpPrl] [0x02] [lcb] [Pcdt]
 * Pcdt 布局: [CP[0..n] (n+1)*4] [FC[0..n] (n+1)*4] [PrcFlags[n]*1]
 */
function readPieceTable(clx: Uint8Array): PieceDescriptor[] {
  // 找到 0x01 标记（Prc 开始）
  let offset = 0;
  while (offset < clx.length - 4 && clx[offset] !== 0x01) {
    offset++;
  }
  if (offset >= clx.length - 4) return [];

  offset++; // 跳过 0x01

  // cbGrpprl
  if (offset >= clx.length) return [];
  const cbGrpprl = clx[offset++];
  offset += cbGrpprl;

  // 0x02 (Pcdt)
  if (offset >= clx.length - 5) return [];
  if (clx[offset] !== 0x02) {
    // 有些变体没有 0x02 分隔，直接就是 Pcdt 数据
    // offset 不前进，尝试直接解析
  } else {
    offset++;
  }

  // lcb (4 bytes)
  if (offset + 4 > clx.length) return [];
  const lcb = readU32LE(clx, offset);
  offset += 4;
  if (lcb < 12 || offset + lcb > clx.length) return [];

  const pcdtEnd = offset + lcb;

  // Piece 数量: (lcb - 4) / 9 = (lcb - 4) / (sizeof(CP) + sizeof(FC) + sizeof(flags))
  // 但第一个 CP 总是 0
  // 结构: CP[0..n] = (n+1) * 4, FC[0..n-1] = n * 4, flags[0..n-1] = n * 1
  // lcb = (n+1)*4 + n*4 + n = 4n + 4 + 4n + n = 9n + 4
  // n = (lcb - 4) / 9
  const n = Math.floor((lcb - 4) / 9);
  if (n <= 0) return [];

  // 读取 CP 数组 (n+1 个 u32)
  const cpStart = offset;
  const cps: number[] = [];
  for (let i = 0; i <= n; i++) {
    if (offset + 4 > pcdtEnd) break;
    cps.push(readU32LE(clx, offset));
    offset += 4;
  }
  // 确保有 n+1 个 CP
  while (cps.length <= n) cps.push(0);

  // 读取 FC 数组 (n 个 u32)
  const fcs: number[] = [];
  for (let i = 0; i < n; i++) {
    if (offset + 4 > pcdtEnd) break;
    fcs.push(readU32LE(clx, offset));
    offset += 4;
  }

  // 读取 flags (n 个 byte)
  const flagBase = offset;

  const pieces: PieceDescriptor[] = [];
  for (let i = 0; i < n && i < fcs.length; i++) {
    const charCount = (cps[i + 1] ?? 0) - (cps[i] ?? 0);
    if (charCount <= 0) continue;

    const fc = fcs[i];
    const flag = (flagBase + i < pcdtEnd) ? clx[flagBase + i] : 0;
    const isAnsi = (flag & 0x01) !== 0;

    // 边界保护：ANSI 字符偏移 + 字符数 不超出 WordDocument 流范围
    if (fc > 0xFFFFFF) continue; // 明显非法的偏移

    pieces.push({ fc, count: charCount, isAnsi });
  }

  // 按 fc 升序排列（确保 Piece 按文档顺序）
  pieces.sort((a, b) => a.fc - b.fc);

  return pieces;
}

// ═══════════════════════════════════════════════════════
// 启发式降级提取
// ═══════════════════════════════════════════════════════

function heuristicExtract(wdContent: Uint8Array, fib: FibBase): DocExtractResult {
  // 策略 A: Unicode (UTF-16LE) 扫描
  let unicodeText = '';
  const startOffset = Math.min(512, wdContent.length);
  const endScan = Math.min(wdContent.length, startOffset + fib.ccpText * 2 + 4096);

  for (let i = startOffset; i < endScan - 1; i += 2) {
    const code = (wdContent[i + 1] << 8) | wdContent[i];
    if (code === 0x000D || code === 0x000A) {
      unicodeText += '\n';
    } else if (code >= 0x0020 && code < 0xFFFE && code !== 0x0019) {
      unicodeText += String.fromCharCode(code);
    } else if (code === 0) {
      unicodeText += ' ';
    }
  }

  // 策略 B: GBK (单字节) 扫描（中文 .doc 常见）
  // 从偏移 512 开始，每个字节解读为 GBK
  let gbkText = '';
  try {
    const gbkSlice = wdContent.slice(startOffset, Math.min(wdContent.length, startOffset + fib.ccpText + 4096));
    const gbkDecoded = new TextDecoder('gbk').decode(gbkSlice);
    // 过滤控制字符
    gbkText = gbkDecoded.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      .replace(/\u0019/g, '')
      .replace(/\r/g, '\n');
  } catch {
    // GBK 解码失败则放弃
  }

  // 选择可读字符更多的结果
  const unicodeReadable = countReadable(unicodeText);
  const gbkReadable = countReadable(gbkText);

  let text: string;
  if (gbkReadable > unicodeReadable * 1.5) {
    text = gbkText;
  } else if (unicodeReadable > gbkReadable * 1.5) {
    text = unicodeText;
  } else {
    // 接近 → 选更长的
    text = gbkText.length > unicodeText.length ? gbkText : unicodeText;
  }

  // 清理
  text = text.replace(/\n{3,}/g, '\n\n').replace(/[ ]{2,}/g, ' ').trim();

  return buildResult(text);
}

/** 统计 CJK + ASCII 可读字符数 */
function countReadable(s: string): number {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    // CJK Unified (4E00-9FFF), CJK Ext-A (3400-4DBF), ASCII, common symbols
    if ((c >= 0x4E00 && c <= 0x9FFF) ||
        (c >= 0x3400 && c <= 0x4DBF) ||
        (c >= 0x3000 && c <= 0x303F) || // CJK punctuation
        (c >= 0xFF00 && c <= 0xFFEF) || // fullwidth
        (c >= 0x20 && c <= 0x7E) ||     // ASCII printable
        c === 0x0A || c === 0x0D) {     // newline
      count++;
    }
  }
  return count;
}

// ═══════════════════════════════════════════════════════
// 结果构建
// ═══════════════════════════════════════════════════════

function buildResult(text: string): DocExtractResult {
  // 强力清理：BOM + 控制字符 + 孤立代理对
  let cleaned = text
    .replace(/^\uFEFF/, '')                         // 剥离 BOM
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // XML 非法
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '\uFFFD')  // 孤立高代理
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD')  // 孤立低代理
    .replace(/\u0019/g, '')                          // 特殊格式标记
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // 段落拆分
  const paragraphs = cleaned.split(/\n/).filter(p => p.trim().length > 0);

  // HTML
  const html = paragraphs.length > 0
    ? paragraphs.map(p => `<p>${escapeHtml(p.trim())}</p>`).join('\n')
    : cleaned ? `<p>${escapeHtml(cleaned)}</p>` : '';

  return {
    text: cleaned,
    html,
    charCount: cleaned.length,
    paragraphCount: paragraphs.length,
    encrypted: false,
    isActuallyDocx: false,
  };
}

// ═══════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════

function readU32LE(data: Uint8Array, offset: number): number {
  return (
    data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    (data[offset + 3] << 24)
  ) >>> 0;
}

function readU16LE(data: Uint8Array, offset: number): number {
  return (data[offset] | (data[offset + 1] << 8)) >>> 0;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
