import React, { useRef, useEffect, useState, useCallback } from 'react';
// @ts-ignore — docx-preview has no types
import * as docxPreview from 'docx-preview';

type PreviewMode = 'a4' | 'word' | 'pdf';

interface Props {
  html: string;
  outputBlob: Blob | null;
  fileName: string;
}

export const PaperPreview: React.FC<Props> = ({ html, outputBlob, fileName }) => {
  const [mode, setMode] = useState<PreviewMode>('a4');
  const [wordRendered, setWordRendered] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const wordContainerRef = useRef<HTMLDivElement>(null);
  const a4Ref = useRef<HTMLDivElement>(null);

  // ── 方案一：A4 纸张仿真 ──
  const a4StyleTag = `
    <style>
      /* A4 纸容器 */
      .preview-scroll { overflow-y: auto; max-height: 70vh; }
      .a4-stack { display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 20px 10px; }
      .a4-sheet {
        background: #fff; width: 210mm; min-height: 297mm;
        padding: 2.54cm 3.18cm;
        box-shadow: 0 2px 8px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.04);
        box-sizing: border-box; position: relative;
        font-family: "SimSun", "Times New Roman", serif;
        font-size: 12pt; line-height: 1.8; color: #000; text-align: justify;
        word-break: break-all;
      }
      .a4-sheet h1, .a4-sheet h2, .a4-sheet h3 { font-family: "SimHei", sans-serif; }
      .a4-sheet h1 { font-size: 16pt; text-align: center; margin: 12pt 0; }
      .a4-sheet h2 { font-size: 14pt; margin: 10pt 0; }
      .a4-sheet h3 { font-size: 12pt; margin: 8pt 0; }
      .a4-sheet p { text-indent: 2em; margin: 0 0 4pt; }
      .a4-sheet table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 10pt; }
      .a4-sheet table td, .a4-sheet table th { border: 1px solid #000; padding: 4pt 6pt; }
      .a4-sheet img { max-width: 100%; height: auto; }
      @media screen and (max-width: 768px) {
        .a4-sheet { width: 100%; min-height: auto; padding: 12px 16px; }
      }
    </style>
  `;

  // ── 方案二：docx-preview 渲染 Word ──
  useEffect(() => {
    if (mode !== 'word' || !outputBlob || !wordContainerRef.current || wordRendered) return;
    const container = wordContainerRef.current!;
    container.innerHTML = '<p class="text-sm text-gray-400 text-center py-8">⏳ 正在渲染 Word 文档...</p>';

    docxPreview.renderAsync(outputBlob, container, undefined, {
      className: 'docx-preview',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
    }).then(() => {
      setWordRendered(true);
      // 给渲染出来的 A4 页加一些样式
      const sheets = container.querySelectorAll('.docx-wrapper');
      sheets.forEach((s: Element) => {
        (s as HTMLElement).style.margin = '0 auto 20px';
        (s as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.12)';
      });
    }).catch((err: Error) => {
      container.innerHTML = `<p class="text-sm text-red-500 text-center py-8">❌ 渲染失败: ${err.message}</p>`;
    });
  }, [mode, outputBlob, wordRendered]);

  // ── 方案三：html2pdf 生成 PDF 预览 ──
  const handleGeneratePdf = useCallback(async () => {
    if (!html || pdfGenerating) return;
    setPdfGenerating(true);
    setMode('pdf');
    try {
      const html2pdf = (await import('html2pdf.js')).default;

      // 清理 HTML：BOM + XML 非法字符 + 孤立代理对
      let clean = html.trim().replace(/^\uFEFF/, '');
      clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
      clean = clean.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '\uFFFD');
      clean = clean.replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD');

      const container = document.createElement('div');
      container.innerHTML = a4StyleTag + `<div class="a4-sheet">${clean}</div>`;
      container.style.cssText = `
        font-family: "SimSun","Times New Roman",serif; font-size:12pt; line-height:1.8;
        padding:0; margin:0; width:210mm;
      `;
      document.body.appendChild(container);
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';

      const worker = html2pdf().set({
        margin: [25.4, 31.8, 25.4, 31.8],
        filename: `${fileName.replace('.docx', '')}_preview.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      });

      const blobUrl = await worker.from(container).output('bloburl');
      document.body.removeChild(container);
      setPdfUrl(blobUrl);
    } catch (err) {
      console.error('PDF 生成失败:', err);
      setPdfUrl('');
    } finally {
      setPdfGenerating(false);
    }
  }, [html, fileName, pdfGenerating]);

  return (
    <div className="space-y-3">
      {/* ── 模式切换 ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-gray-800 text-sm">👁️ 排版预览</h3>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {([
            ['a4', '📄 A4纸'],
            ['word', '📝 Word渲染'],
            ['pdf', '📕 PDF'],
          ] as [PreviewMode, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => {
                if (m === 'pdf') { handleGeneratePdf(); return; }
                setMode(m);
              }}
              className={`px-3 py-1 text-xs rounded-md transition-colors font-medium ${
                mode === m ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {pdfGenerating && <span className="text-xs text-brand-600 animate-pulse">生成中...</span>}
        {mode === 'pdf' && pdfUrl && (
          <a
            href={pdfUrl}
            download={`${fileName.replace('.docx', '')}_preview.pdf`}
            className="text-xs text-brand-600 hover:text-brand-800 underline ml-auto"
          >
            📥 下载 PDF
          </a>
        )}
      </div>

      {/* ── 方案一：A4 纸张 ── */}
      {mode === 'a4' && (
        <div
          ref={a4Ref}
          className="preview-scroll rounded-xl border border-gray-200 bg-gray-100"
          style={{ maxHeight: '70vh' }}
        >
          <div
            className="a4-stack"
            dangerouslySetInnerHTML={{
              __html: a4StyleTag + `<div class="a4-sheet">${html}</div>`,
            }}
          />
        </div>
      )}

      {/* ── 方案二：Word 渲染 ── */}
      {mode === 'word' && (
        <div className="rounded-xl border border-gray-200 bg-gray-100" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {!outputBlob ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-3xl mb-3">📭</div>
              <p className="text-sm">请先点击「开始排版」生成 Word 文档</p>
            </div>
          ) : (
            <div
              ref={wordContainerRef}
              className="py-5"
              style={{ minHeight: 400 }}
            />
          )}
        </div>
      )}

      {/* ── 方案三：PDF 预览 ── */}
      {mode === 'pdf' && (
        <div className="rounded-xl border border-gray-200 overflow-hidden" style={{ height: '80vh' }}>
          {pdfGenerating ? (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <div className="animate-spin text-3xl mb-3">⚙️</div>
                <p className="text-sm text-gray-500">正在生成 PDF 预览...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title="PDF 预览"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <p className="text-sm text-red-400">PDF 生成失败，请重试</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
