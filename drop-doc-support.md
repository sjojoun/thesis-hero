# 剥离 .doc 兼容 → 仅限 .docx

## 改动文件

| 文件 | 改动 |
|------|------|
| `src/components/FileUploader.tsx` | accept 仅 `.docx`；拖拽提示更新；错误提示引导"另存为 .docx" |
| `src/engine/formattingEngine.ts` | 移除 `extractDocText`/`isActuallyDocx` 导入；删除全部 .doc 分支；.doc 文件直接抛错误并提示另存为 |

## 用户可见变化

- 上传区：仅显示"拖拽 .docx 文件"、"仅支持 Word 2007+ (.docx)"
- 空状态副标题：灰色小字「.doc 文件请先另存为 .docx（后续版本将支持）」
- 拖入 .doc 文件时：Toast 提示 `请上传 .docx 格式...若为 .doc 文件，请在 Word / WPS 中另存为 .docx 后再上传（后续版本将支持 .doc 直接上传）`
- 若绕过前端传入 .doc（开发者模式）：引擎层直接抛 `暂不支持 .doc 格式...（后续版本将支持 .doc）`

## 构建

- TS: ✅ 零错误
- Vite: ✅ 6.05s
- Bundle: 1133KB JS (↓41KB)、319KB gzip
- dev server: `localhost:5174`

## 保留

`src/engine/docParser.ts` 文件保留不动，后续版本启用时再接入。
