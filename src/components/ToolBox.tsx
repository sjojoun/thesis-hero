/**
 * 🔧 论文工具箱 — 18 合 1 选项卡容器
 * 将所有辅助工具收纳进统一 Tab 界面，展开/收起。
 */
import React, { useState, useEffect, useMemo } from 'react';
import type { TemplateConfig, CoverMeta } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import { extractTocEntries, buildTocParagraphs, type TocEntry } from '@/engine/tocGenerator';
import { renumberFiguresAndTables, countFiguresAndTables } from '@/engine/figureNumbering';
import { reformatCitations, type CitationStyle, type FormatResult } from '@/engine/citationFormatter';
import { buildCoverParagraphs } from '@/engine/coverGenerator';
import { createBlindReviewVersion, type BlindReviewOptions } from '@/engine/blindReview';
import { generateWatermarkCanvas } from '@/engine/watermark';
import { buildStructureTree, flattenTree } from '@/engine/structureTree';
import { checkFormatting, DEFAULT_RULES } from '@/engine/formatChecker';
import { analyzeWordCount } from '@/engine/wordCount';
import { TemplateLibrary, type StoredTemplate } from '@/engine/templateManager';
import { diffWordsHighlight } from '@/engine/versionDiff';
import { separateFonts, FONT_SEPARATION_CSS } from '@/engine/fontSeparator';
import { buildPageConfig, type PageConfig } from '@/engine/pageHeaderFooter';
import { convertToThreeLineTables, splitLongTables, THREE_LINE_TABLE_CSS } from '@/engine/threeLineTable';
import { numberFormulas, FORMULA_CSS, type FormulaEntry } from '@/engine/formulaNumbering';
import { buildReferenceMap, updateCrossReferences, annotateRefLabels, type CrossRef } from '@/engine/crossReference';
import { PaperPreview } from '@/components/PaperPreview';

// ── Tab 定义 ──
const TABS = [
  '👁️ 预览',
  '📑 目录', '🔢 图表', '📚 引文', '📄 封面',
  '🕶️ 盲审', '💧 水印', '🌳 结构', '📝 检查',
  '📊 统计', '📋 批量', '⚖️ 对比', '🎨 模板',
  '🔠 字体', '📐 页码', '📊 三线表', '➗ 公式', '🔗 引用',
];

interface Props {
  html: string;
  onHtmlUpdate: (html: string) => void;
  config: TemplateConfig;
  file: File | null;
  outputBlob?: Blob | null;
  outputFileName?: string;
}

export const ToolBox: React.FC<Props> = ({ html, onHtmlUpdate, config, file, outputBlob, outputFileName = '' }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [open, setOpen] = useState(true);

  // ── 各工具状态 ──
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([]);
  const [figTableCount, setFigTableCount] = useState({ figCount: 0, tableCount: 0 });
  const [figTableRenumbered, setFigTableRenumbered] = useState(false);
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('GB7714');
  const [citationResult, setCitationResult] = useState<FormatResult | null>(null);
  const [coverMeta, setCoverMeta] = useState<CoverMeta>({
    bilingual: true,
    school: '南京理工大学',
    college: '继续教育学院',
    thesisType: '毕业设计说明书（论文）',
    thesisTypeEn: 'Graduation Project Report (Thesis)',
    title: '',
    titleEn: '',
    author: '',
    studentId: '',
    major: '',
    advisor: '',
    coAdvisors: [],
    offCampusAdvisor: '',
    submitDate: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月`,
  });
  const [blindWords, setBlindWords] = useState('');
  const [blindResult, setBlindResult] = useState<{ masked: number; removedSections: string[] } | null>(null);
  const [watermarkText, setWatermarkText] = useState('内部评审');
  const [watermarkBg, setWatermarkBg] = useState('');
  const [structureTree, setStructureTree] = useState<any[]>([]);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [wordCountResult, setWordCountResult] = useState<any>(null);
  const [templates, setTemplates] = useState<StoredTemplate[]>([]);
  const [diffLeft, setDiffLeft] = useState('');
  const [diffRight, setDiffRight] = useState('');
  const [diffHtml, setDiffHtml] = useState('');

  // ★ 新增：5 大高级排版状态
  const [fontResult, setFontResult] = useState<{ affectedNodes: number; wrappedSpans: number } | null>(null);
  const [pageConfigState, setPageConfigState] = useState<PageConfig>({
    paperTitle: '',
    mainMatterStartHeading: '引言',
    useOddEvenHeaders: true,
  });
  const [pageCss, setPageCss] = useState('');
  const [tripleTableResult, setTripleTableResult] = useState<{ tableCount: number; css: string } | null>(null);
  const [formulaResult, setFormulaResult] = useState<{ formulas: FormulaEntry[] } | null>(null);
  const [crossRefResult, setCrossRefResult] = useState<{ fixedCount: number; errorCount: number; refs: CrossRef[] } | null>(null);

  // ── 初始化所有需要 HTML 的工具 ──
  useEffect(() => {
    if (!html) return;
    setTocEntries(extractTocEntries(html));
    setFigTableCount(countFiguresAndTables(html));
  }, [html]);

  useEffect(() => {
    setTemplates(TemplateLibrary.listTemplates());
  }, []);

  // ── 各工具处理函数 ──
  const handleRenumber = () => {
    const result = renumberFiguresAndTables(html);
    onHtmlUpdate(result.html);
    setFigTableRenumbered(true);
    setFigTableCount({ figCount: result.figCount, tableCount: result.tableCount });
  };

  const handleCitationReformat = () => {
    const result = reformatCitations(html, citationStyle);
    setCitationResult(result);
  };

  const handleBlind = () => {
    const words = blindWords.split(/[,\n、]/).map(s => s.trim()).filter(Boolean);
    const result = createBlindReviewVersion(html, { sensitiveWords: words });
    onHtmlUpdate(result.html);
    setBlindResult({ masked: result.masked.length, removedSections: result.removedSections });
  };

  const handleWatermark = () => {
    const { base64Css } = generateWatermarkCanvas({ text: watermarkText });
    setWatermarkBg(base64Css);
  };

  const handleStructure = () => {
    const tree = buildStructureTree(html);
    setStructureTree(flattenTree(tree));
  };

  const handleCheck = () => {
    const result = checkFormatting(html, DEFAULT_RULES);
    setCheckResult(result);
  };

  const handleWordCount = () => {
    const result = analyzeWordCount(html);
    setWordCountResult(result);
  };

  const handleDiff = () => {
    const result = diffWordsHighlight(diffLeft, diffRight);
    setDiffHtml(result.html);
  };

  // ★ 新增：5 大高级排版处理函数
  const handleFontSeparation = () => {
    const result = separateFonts(html);
    // 注入字体分离 CSS
    const styleEl = document.getElementById('tnr-font-style') || document.createElement('style');
    styleEl.id = 'tnr-font-style';
    styleEl.textContent = FONT_SEPARATION_CSS;
    if (!document.getElementById('tnr-font-style')) document.head.appendChild(styleEl);
    onHtmlUpdate(result.html);
    setFontResult({ affectedNodes: result.affectedNodes, wrappedSpans: result.wrappedSpans });
  };

  const handlePageConfig = () => {
    const result = buildPageConfig(pageConfigState);
    setPageCss(result.css);
    // 注入页眉页脚样式
    const existing = document.querySelector('style[data-page-config]');
    if (existing) existing.remove();
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-page-config', '');
    styleEl.textContent = result.css.replace(/<style[^>]*>|<\/style>/g, '');
    document.head.appendChild(styleEl);
  };

  const handleThreeLineTable = () => {
    const result = convertToThreeLineTables(html);
    const splitHtml = splitLongTables(result.html);
    onHtmlUpdate(splitHtml);
    setTripleTableResult({ tableCount: result.tableCount, css: result.css });
    // 注入三线表 CSS
    const existing = document.querySelector('style[data-triple-table]');
    if (existing) existing.remove();
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-triple-table', '');
    styleEl.textContent = THREE_LINE_TABLE_CSS;
    document.head.appendChild(styleEl);
  };

  const handleFormulaNumbering = () => {
    const result = numberFormulas(html);
    onHtmlUpdate(result.html);
    setFormulaResult({ formulas: result.formulas });
    // 注入公式 CSS
    const existing = document.querySelector('style[data-formula-css]');
    if (existing) existing.remove();
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-formula-css', '');
    styleEl.textContent = FORMULA_CSS;
    document.head.appendChild(styleEl);
  };

  const handleCrossRefSync = () => {
    // 1. 先给图表/公式补充 ref-label 属性
    const annotated = annotateRefLabels(html);
    // 2. 更新引用
    const result = updateCrossReferences(annotated);
    onHtmlUpdate(result.html);
    setCrossRefResult({ fixedCount: result.fixedCount, errorCount: result.errorCount, refs: result.refs });
  };

  // ── 渲染 ──
  return (
    <section className="space-y-3">
      <Button
        variant="secondary"
        onClick={() => setOpen(!open)}
        className="w-full justify-between text-sm"
      >
        <span className="flex items-center gap-2">
          <span className="text-base">🔧</span>
          论文工具箱 · 18 项工具
        </span>
        <span className={`transform transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </Button>

      {open && (
        <>
          {!html && (
            <div className="text-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-xl">
              <div className="text-3xl mb-3">📁</div>
              <p className="text-sm text-gray-500 font-medium">请先上传论文并点击「开始排版」</p>
              <p className="text-xs text-gray-400 mt-1">排版完成后即可使用 18 项工具箱功能</p>
            </div>
          )}
          <Card className="border-gray-200">
            <CardContent className="p-0">
              {/* Tab 导航栏 */}
              <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                {TABS.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                      activeTab === i
                        ? 'bg-white text-brand-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Tab 内容 */}
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {/* ── 0: 预览 ── */}
                {activeTab === 0 && (
                  <PaperPreview
                    html={html}
                    outputBlob={outputBlob ?? null}
                    fileName={outputFileName}
                  />
                )}

                {/* ── 1: 目录生成 ── */}
                {activeTab === 1 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">📑 目录自动生成</h3>
                    <p className="text-xs text-gray-500">
                      从正文扫描到 <b>{tocEntries.length}</b> 个标题（h1/h2/h3）
                    </p>
                    <div className="border rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
                      {tocEntries.map((e, i) => (
                        <div
                          key={i}
                          className="text-sm py-0.5 border-b border-gray-100 last:border-0 flex justify-between"
                          style={{ paddingLeft: `${(e.level - 1) * 16}px` }}
                        >
                          <span>
                            <span className={`inline-block w-5 text-center text-[10px] font-bold mr-1 ${
                              e.level === 1 ? 'text-brand-600' : e.level === 2 ? 'text-amber-600' : 'text-gray-500'
                            }`}>
                              H{e.level}
                            </span>
                            {e.text}
                          </span>
                          <span className="text-gray-300 text-[10px]">·······</span>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" variant="primary" onClick={() => onHtmlUpdate(html)}>应用到排版</Button>
                  </div>
                )}

                {/* ── 2: 图表编号 ── */}
                {activeTab === 2 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">🔢 图表自动编号</h3>
                    <p className="text-xs text-gray-500">
                      检测到 图 <b>{figTableCount.figCount}</b> 个 · 表 <b>{figTableCount.tableCount}</b> 个
                      {figTableRenumbered && <span className="text-green-600 ml-2">✅ 已重编号</span>}
                    </p>
                    <p className="text-xs text-gray-400">格式支持：图 X、图X-Y、表 X、表X-Y</p>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleRenumber}
                      disabled={figTableCount.figCount + figTableCount.tableCount === 0}
                    >
                      重新编号
                    </Button>
                  </div>
                )}

                {/* ── 3: 参考文献 ── */}
                {activeTab === 3 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">📚 参考文献格式化</h3>
                    <div className="flex gap-2 flex-wrap">
                      {(['GB7714', 'APA', 'MLA'] as CitationStyle[]).map(s => (
                        <button
                          key={s}
                          onClick={() => setCitationStyle(s)}
                          className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                            citationStyle === s
                              ? 'bg-brand-100 text-brand-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {s === 'GB7714' ? 'GB/T 7714' : s === 'APA' ? 'APA 7th' : 'MLA 9th'}
                        </button>
                      ))}
                    </div>
                    <Button size="sm" variant="primary" onClick={handleCitationReformat}>格式化引用</Button>
                    {citationResult && (
                      <div className="border rounded-lg p-3 bg-gray-50 text-xs space-y-1 max-h-48 overflow-y-auto">
                        <p>检测到 <b>{citationResult.entries.length}</b> 条引用，解析 <b>{citationResult.parsed.length}</b> 条</p>
                        {citationResult.warnings.slice(0, 10).map((w: string, i: number) => (
                          <div key={i} className="text-gray-600">{w}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── 4: 封面生成 ── */}
                {activeTab === 4 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">📄 封面生成</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(coverMeta).map(key => (
                        <input
                          key={key}
                          type="text"
                          placeholder={key}
                          value={(coverMeta as any)[key]}
                          onChange={e => setCoverMeta((prev: CoverMeta) => ({ ...prev, [key]: e.target.value }))}
                          className="px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-brand-400 focus:border-brand-400 outline-none"
                        />
                      ))}
                    </div>
                    <Button size="sm" variant="primary" onClick={() => {}}>
                      生成封面
                    </Button>
                  </div>
                )}

                {/* ── 5: 盲审 ── */}
                {activeTab === 5 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">🕶️ 盲审脱敏</h3>
                    <textarea
                      value={blindWords}
                      onChange={e => setBlindWords(e.target.value)}
                      placeholder="输入敏感词，用逗号分隔..."
                      className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-brand-400 outline-none min-h-[80px] resize-y"
                    />
                    <Button size="sm" variant="primary" onClick={handleBlind}>脱敏处理</Button>
                    {blindResult && (
                      <div className="text-xs text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        已处理 <b>{blindResult.masked}</b> 处敏感信息
                        {blindResult.removedSections.length > 0 && (
                          <p className="mt-1 text-red-500">已移除：{blindResult.removedSections.join('、')}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── 6: 水印 ── */}
                {activeTab === 6 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">💧 水印</h3>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={e => setWatermarkText(e.target.value)}
                      className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-brand-400 outline-none"
                      placeholder="水印文字"
                    />
                    <Button size="sm" variant="primary" onClick={handleWatermark}>应用水印</Button>
                    {watermarkBg && (
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <div
                          className="h-48 rounded border"
                          style={{ backgroundImage: watermarkBg, backgroundRepeat: 'repeat' }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* ── 7: 结构树 ── */}
                {activeTab === 7 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">🌳 结构树</h3>
                    <Button size="sm" variant="primary" onClick={handleStructure}>扫描结构</Button>
                    {structureTree.length > 0 && (
                      <div className="border rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto text-xs">
                        {structureTree.map((n, i) => (
                          <div
                            key={i}
                            className="py-0.5 flex items-center gap-1"
                            style={{ paddingLeft: `${n.depth * 16}px` }}
                          >
                            <span className={`text-[10px] font-bold ${
                              n.level === 1 ? 'text-brand-600' : n.level === 2 ? 'text-amber-600' : 'text-gray-400'
                            }`}>
                              H{n.level}
                            </span>
                            {n.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── 8: 格式检查 ── */}
                {activeTab === 8 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">📝 格式规范检查</h3>
                    <Button size="sm" variant="primary" onClick={handleCheck}>运行检查</Button>
                    {checkResult && (
                      <div className="space-y-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          checkResult.status === 'green' ? 'bg-green-100 text-green-700' :
                          checkResult.status === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {checkResult.status === 'green' ? '✅ 全部通过' :
                           checkResult.status === 'yellow' ? '⚠ 有警告' : '❌ 有错误'}
                        </span>
                        {checkResult.issues?.map((issue: any, i: number) => (
                          <div key={i} className={`text-xs p-2 rounded-lg ${
                            issue.level === 'error' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                          }`}>
                            <b>{issue.rule}</b>: {issue.elementText} — 当前 <code>{issue.current}</code>，期望 <code>{issue.expected}</code>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── 9: 字数统计 ── */}
                {activeTab === 9 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">📊 字数统计</h3>
                    <Button size="sm" variant="primary" onClick={handleWordCount}>统计字数</Button>
                    {wordCountResult && (
                      <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
                        {wordCountResult.sections?.map((s: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-gray-600">{s.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-brand-500 rounded-full"
                                  style={{ width: `${Math.min(100, (s.count / (wordCountResult.total || 1)) * 100)}%` }}
                                />
                              </div>
                              <span className="text-gray-400 w-12 text-right">{s.count}</span>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-gray-200 flex justify-between text-xs font-bold">
                          <span>合计</span>
                          <span>{wordCountResult.total} 字</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── 10: 批量处理 ── */}
                {activeTab === 10 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">📋 批量处理</h3>
                    <p className="text-xs text-gray-500">上传多个 .docx 文件，批量应用当前模板格式</p>
                    <label className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-brand-300 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept=".docx"
                        onChange={() => {}}
                        className="hidden"
                      />
                      <div className="text-center">
                        <div className="text-2xl mb-2">📤</div>
                        <p className="text-xs text-gray-400">拖拽或点击选择多个文件</p>
                      </div>
                    </label>
                  </div>
                )}

                {/* ── 11: 版本对比 ── */}
                {activeTab === 11 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">⚖️ 版本差异对比</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <textarea
                        value={diffLeft}
                        onChange={e => setDiffLeft(e.target.value)}
                        placeholder="粘贴旧版本文本..."
                        className="px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-brand-400 outline-none min-h-[120px] resize-y"
                      />
                      <textarea
                        value={diffRight}
                        onChange={e => setDiffRight(e.target.value)}
                        placeholder="粘贴新版本文本..."
                        className="px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-brand-400 outline-none min-h-[120px] resize-y"
                      />
                    </div>
                    <Button size="sm" variant="primary" onClick={handleDiff}>对比差异</Button>
                    {diffHtml && (
                      <div
                        className="border rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto text-xs"
                        dangerouslySetInnerHTML={{ __html: diffHtml }}
                      />
                    )}
                  </div>
                )}

                {/* ── 12: 模板管理 ── */}
                {activeTab === 12 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">🎨 模板管理</h3>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const tplId = `tpl_${Date.now().toString(36)}`;
                        TemplateLibrary.saveTemplate(tplId, `模板_${Date.now().toString(36)}`, config);
                        setTemplates(TemplateLibrary.listTemplates());
                      }}
                    >
                      💾 保存当前参数为模板
                    </Button>
                    {templates.length === 0 ? (
                      <p className="text-xs text-gray-400">暂无自定义模板</p>
                    ) : (
                      <div className="space-y-1">
                        {templates.map((t, i) => (
                          <div key={i} className="flex items-center justify-between text-xs py-2 px-3 bg-gray-50 rounded-lg">
                            <span>{t.name}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                TemplateLibrary.deleteTemplate(t.name);
                                setTemplates(TemplateLibrary.listTemplates());
                              }}
                            >🗑</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── 13: 中英文字体分离 ── */}
                {activeTab === 13 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">🔠 中英文字体自动分离</h3>
                    <p className="text-xs text-gray-500">
                      中文保持宋体 · 英文/数字/半角标点自动应用 Times New Roman
                    </p>
                    <p className="text-xs text-gray-400">通过 DOM TreeWalker 遍历文本节点，仅对 TextNode 操作，不破坏 HTML 结构</p>
                    <Button size="sm" variant="primary" onClick={handleFontSeparation}>执行字体分离</Button>
                    {fontResult && (
                      <div className="text-xs bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
                        <p className="text-green-700">✅ 已处理 <b>{fontResult.affectedNodes}</b> 个文本节点</p>
                        <p className="text-green-600">包裹 <b>{fontResult.wrappedSpans}</b> 处英文/数字</p>
                        <code className="block mt-1 text-[11px] bg-green-100/50 p-2 rounded">
                          .font-tnr {'{'} font-family: "Times New Roman"; {'}'}<br/>
                          body.font-simsun {'{'} font-family: SimSun; {'}'}
                        </code>
                      </div>
                    )}
                  </div>
                )}

                {/* ── 14: 页眉页脚与双轨页码 ── */}
                {activeTab === 14 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">📐 复杂页眉页脚 & 双轨页码</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">论文题目</label>
                        <input
                          type="text"
                          value={pageConfigState.paperTitle}
                          onChange={e => setPageConfigState(p => ({ ...p, paperTitle: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-brand-400 outline-none"
                          placeholder="论文题目"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">正文起始标题</label>
                        <input
                          type="text"
                          value={pageConfigState.mainMatterStartHeading}
                          onChange={e => setPageConfigState(p => ({ ...p, mainMatterStartHeading: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-brand-400 outline-none"
                          placeholder="如：引言"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={pageConfigState.useOddEvenHeaders}
                        onChange={e => setPageConfigState(p => ({ ...p, useOddEvenHeaders: e.target.checked }))}
                      />
                      启用奇偶页异构页眉
                    </label>
                    <Button size="sm" variant="primary" onClick={handlePageConfig}>应用页码配置</Button>
                    {pageCss && (
                      <div className="text-xs bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                        <p className="text-blue-700 font-medium">✅ 配置已注入</p>
                        <p className="text-blue-600">前置部分 → 罗马数字 (I, II, III)</p>
                        <p className="text-blue-600">正文部分 → 阿拉伯数字 (1, 2, 3)</p>
                        <p className="text-blue-500 mt-1">导出 PDF 时自动应用 @page 规则</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── 15: 智能三线表 ── */}
                {activeTab === 15 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">📊 智能三线表 & 跨页续表</h3>
                    <p className="text-xs text-gray-500">去除所有竖线和内部横线 · 加粗顶底线 · 五号宋体</p>
                    <p className="text-xs text-gray-400">超长表格自动跨页拆分，后续页自动添加「（续）」表头</p>
                    <Button size="sm" variant="primary" onClick={handleThreeLineTable}>一键转三线表</Button>
                    {tripleTableResult && (
                      <div className="text-xs bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
                        <p className="text-green-700">✅ 已转换 <b>{tripleTableResult.tableCount}</b> 个表格</p>
                        <p className="text-green-600">
                          三线表：顶线 1.5pt 粗 · 表头下线 1pt 细 · 底线 1.5pt 粗
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── 16: 公式自动编号 ── */}
                {activeTab === 16 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">➗ 公式自动编号 & 排版对齐</h3>
                    <p className="text-xs text-gray-500">
                      识别 $$...$$ 公式块 → 按章节自动编号 → 主体居中 + 编号右对齐
                    </p>
                    <p className="text-xs text-gray-400">编号格式：(章节.序号) 如 (2.3) 表示第2章第3个公式</p>
                    <Button size="sm" variant="primary" onClick={handleFormulaNumbering}>扫描并编号公式</Button>
                    {formulaResult && (
                      <div className="space-y-2">
                        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                          ✅ 检测到 <b>{formulaResult.formulas.length}</b> 个公式，已自动编号
                        </p>
                        {formulaResult.formulas.length > 0 && (
                          <div className="border rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
                            {formulaResult.formulas.map((f, i) => (
                              <div key={i} className="text-xs px-3 py-1.5 border-b border-gray-100 last:border-0 flex justify-between">
                                <span className="text-gray-600 font-mono">{f.id}</span>
                                <span className="text-brand-600 font-bold">{f.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── 17: 动态交叉引用同步 ── */}
                {activeTab === 17 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">🔗 动态交叉引用同步</h3>
                    <p className="text-xs text-gray-500">
                      扫描正文 <code className="bg-gray-200 px-1 rounded">.cross-ref[data-target]</code> 标记 → 匹配图/表/公式最新编号 → 无感同步
                    </p>
                    <p className="text-xs text-gray-400">图表编号变动后，正文引用自动更新 · 点击引用可跳转到目标元素</p>
                    <Button size="sm" variant="primary" onClick={handleCrossRefSync}>同步交叉引用</Button>
                    {crossRefResult && (
                      <div className="space-y-2">
                        <div className="text-xs bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-green-700">✅ 同步了 <b>{crossRefResult.fixedCount}</b> 处引用</p>
                          {crossRefResult.errorCount > 0 && (
                            <p className="text-red-600 mt-1">⚠ <b>{crossRefResult.errorCount}</b> 处引用目标丢失</p>
                          )}
                        </div>
                        {crossRefResult.refs.length > 0 && (
                          <div className="border rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
                            {crossRefResult.refs.map((ref, i) => (
                              <div key={i} className={`text-xs px-3 py-1.5 border-b border-gray-100 last:border-0 flex justify-between ${
                                ref.valid ? '' : 'bg-red-50'
                              }`}>
                                <span className="text-gray-500 font-mono">{ref.target}</span>
                                <span className={ref.valid ? 'text-green-600' : 'text-red-600'}>
                                  {ref.valid ? '✓' : '[丢失]'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
};
