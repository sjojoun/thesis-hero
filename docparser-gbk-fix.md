# docParser & PDF 编码修复（第二轮）

## 修复的 Bug

### Bug 1: `readClx` 将合法 offset=0 判为无效 🐛
- **文件**: `src/engine/docParser.ts:264`
- **原代码**: `if (fcClx <= 0 || lcbClx <= 0) return null;`
- **修复**: `if (fcClx < 0 || fcClx + lcbClx > tableContent.length) return null;`
- **影响**: fcClx=0 时（CLX 在 Table 流起始位置）Piece Table 路径被跳过，退化为启发式扫描，丢失精度

### Bug 2: HTML 含 XML 非法字符 → PDF 生成失败 🐛
- **修复**: `buildResult()` 和 `handleGeneratePdf()` 中增加三层清理：
  1. BOM (`\uFEFF`) 剥离
  2. XML 非法控制字符 (`\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F`) 移除
  3. 孤立代理对 (`\uD800-\uDFFF`) → `U+FFFD`

### Bug 3: CFB Buffer 共享内存 → TextDecoder 乱码 🐛（上一轮已修）
- `wdContent` / `tableContent` 改为 `new Uint8Array(content)` 强制拷贝

## 改动文件
| 文件 | 改动 |
|------|------|
| `src/engine/docParser.ts` | readClx 条件修复 + buildResult 增强清理 |
| `src/components/PaperPreview.tsx` | PDF 生成前 HTML 清理 + A4 样式注入 |

## 验证
- TypeScript: ✅ 零错误
- Vite build: ✅ 6.34s
- .doc 解析: ✅ 346 字符 / 11 段落 / 中文正常
- dev server: `http://localhost:5174/`
