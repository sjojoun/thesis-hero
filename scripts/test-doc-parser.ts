/**
 * 详细调试: .doc 解析器
 */
import { readFileSync, existsSync } from 'fs';
import { read, find } from 'cfb';
import { extractDocText, isActuallyDocx } from '../src/engine/docParser';

const base = 'C:/Users/21018/Desktop';
const path = `${base}/test-chinese.doc`;

const buf = readFileSync(path);
const data = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
console.log('── 逐层调试 ──');
console.log('文件大小:', buf.length);

// 1. CFB
const cfb = read(data, { type: 'buffer' });
console.log('FullPaths:', JSON.stringify(cfb.FullPaths));

// 2. WordDocument
const wd = find(cfb, 'WordDocument');
if (!wd) { console.log('NO WordDocument'); process.exit(1); }
const wdC = wd.content as Uint8Array;
console.log('WordDocument 大小:', wdC.length);

// 3. FIB magic
const magic = (wdC[1] << 8) | wdC[0];
console.log('FIB magic: 0x' + magic.toString(16));

// 4. lidFE
const lidFE = (wdC[0x40] | (wdC[0x41] << 8)) >>> 0;
console.log('lidFE: 0x' + lidFE.toString(16));

// 5. ccpText
const ccpText = (wdC[0x4C] | (wdC[0x4D] << 8) | (wdC[0x4E] << 16) | (wdC[0x4F] << 24)) >>> 0;
console.log('ccpText:', ccpText);

// 6. fcClx/lcbClx
const fcClx = (wdC[0x01A2] | (wdC[0x01A3] << 8) | (wdC[0x01A4] << 16) | (wdC[0x01A5] << 24)) >>> 0;
const lcbClx = (wdC[0x01A6] | (wdC[0x01A7] << 8) | (wdC[0x01A8] << 16) | (wdC[0x01A9] << 24)) >>> 0;
console.log('fcClx:', fcClx, 'lcbClx:', lcbClx);

// 7. 1Table
const tbl = find(cfb, '1Table');
if (!tbl) { console.log('NO 1Table'); }
else {
  const tblC = Buffer.from(tbl.content);
  console.log('1Table 大小:', tblC.length);
  console.log('1Table[0..20]:', Array.from(tblC.slice(0, 21)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
}

// 8. 手动解码
const wdRaw = Buffer.from(wd.content);
const gbkSlice = wdRaw.slice(512, 512 + ccpText);
const gbkDecoded = new TextDecoder('gbk').decode(gbkSlice);
console.log('\n手动 GBK 解码(512..' + (512+ccpText) + '):');
console.log('  长度:', gbkDecoded.length, 'chars');
console.log('  前100字:', gbkDecoded.slice(0, 100));

// 9. docParser 结果
console.log('\n── docParser 结果 ──');
const result = extractDocText(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
console.log('  chars:', result.charCount);
console.log('  paragraphs:', result.paragraphCount);
console.log('  text[0:100]:', result.text.slice(0, 100));

// 10. 检查 Piece Table 过程
console.log('\n── 手动 Piece Table ──');
const clx = tblC.slice(fcClx, fcClx + lcbClx);
console.log('  CLX size:', clx.length);
console.log('  CLX hex:', Array.from(clx).map(b => b.toString(16).padStart(2,'0')).join(' '));

let off = 0;
while (off < clx.length && clx[off] !== 0x01) off++;
console.log('  0x01 at offset:', off);
off++;
const cbG = clx[off++];
console.log('  cbGrpprl:', cbG);
off += cbG;
console.log('  after GrpPrl at:', off, 'byte:', clx[off]?.toString(16));
if (clx[off] === 0x02) off++;
const lcb = (clx[off] | (clx[off+1]<<8) | (clx[off+2]<<16) | (clx[off+3]<<24)) >>> 0;
console.log('  lcb:', lcb);
off += 4;
const cp0 = (clx[off] | (clx[off+1]<<8) | (clx[off+2]<<16) | (clx[off+3]<<24)) >>> 0;
console.log('  CP[0]:', cp0);
off += 4;
const cp1 = (clx[off] | (clx[off+1]<<8) | (clx[off+2]<<16) | (clx[off+3]<<24)) >>> 0;
console.log('  CP[1]:', cp1);
off += 4;
const fc0 = (clx[off] | (clx[off+1]<<8) | (clx[off+2]<<16) | (clx[off+3]<<24)) >>> 0;
console.log('  FC[0]:', fc0);
off += 4;
const flag = clx[off];
console.log('  flag:', flag.toString(16), '(ANSI=' + ((flag & 1) !== 0) + ')');
console.log('  piece: fc=' + fc0 + ' count=' + (cp1-cp0) + ' isAnsi=' + ((flag & 1) !== 0));
