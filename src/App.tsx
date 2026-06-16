import React, { useState, useCallback } from 'react';
import type { TemplateConfig, CoverMeta } from '@/types';
import { NJUST_CONFIG } from '@/types';
import { processPaper } from '@/engine/formattingEngine';
import { DEFAULT_COVER_META } from '@/engine/coverGenerator';
import { usePaperProcessor } from '@/hooks/usePaperProcessor';

import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { FileUploader } from '@/components/FileUploader';
import { TemplateSelector } from '@/components/TemplateSelector';
import { ParamPanel } from '@/components/ParamPanel';
import { StatusBar } from '@/components/StatusBar';
import { ActionBar } from '@/components/ActionBar';
import { CommerceBanner } from '@/components/CommerceBanner';
import { AboutSection } from '@/components/AboutSection';
import { ToolBox } from '@/components/ToolBox';
import { CoverForm } from '@/components/CoverForm';
import { CoverPreview } from '@/components/CoverPreview';

const hasCoverInfo = (meta: CoverMeta): boolean => {
  return !!(meta.title || meta.author || meta.studentId || meta.advisor);
};

const App: React.FC = () => {
  // ── 状态 ──
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState<TemplateConfig>(NJUST_CONFIG);
  const [error, setError] = useState<string | null>(null);
  const [paperHtml, setPaperHtml] = useState<string>('');
  const [htmlVersion, setHtmlVersion] = useState(0);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputFileName, setOutputFileName] = useState<string>('');
  const [coverMeta, setCoverMeta] = useState<CoverMeta>(DEFAULT_COVER_META);
  const { progress, isProcessing, updateProgress, reset: resetProgress } = usePaperProcessor();

  const outputReady = progress?.status === 'done' && outputBlob !== null;

  // ── 文件选择 ──
  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    setError(null);
    setPaperHtml('');
    setOutputBlob(null);
    setOutputFileName('');
    resetProgress();
  }, [resetProgress]);

  const handleFileError = useCallback((msg: string) => {
    setError(msg);
    setFile(null);
    resetProgress();
  }, [resetProgress]);

  // ── 模板切换 ──
  const handleConfigChange = useCallback((c: TemplateConfig) => {
    setConfig(c);
    if (progress?.status === 'done' || progress?.status === 'error') {
      resetProgress();
      setOutputBlob(null);
      setOutputFileName('');
    }
  }, [progress, resetProgress]);

  // ── 排版（生成预览，不自动下载） ──
  const handleFormat = useCallback(async () => {
    if (!file || isProcessing) return;
    setError(null);
    setOutputBlob(null);

    try {
      const cover = hasCoverInfo(coverMeta) ? coverMeta : undefined;

      const blob = await processPaper(file, config, updateProgress, (html) => {
        setPaperHtml(html);
      }, cover);

      updateProgress({ status: 'done', message: '排版完成 ✓ 请预览后下载' });

      const baseName = file.name.replace(/\.docx?$/i, '');
      setOutputBlob(blob);
      setOutputFileName(`formatted_${baseName}.docx`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '发生未知错误，请重试';
      setError(msg);
      updateProgress({ status: 'error', message: msg });
      console.error('[App] 排版失败:', err);
    }
  }, [file, config, coverMeta, isProcessing, updateProgress]);

  // ── 下载 ──
  const handleDownload = useCallback(() => {
    if (!outputBlob || !outputFileName) return;

    const objectUrl = URL.createObjectURL(outputBlob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = outputFileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 200);
  }, [outputBlob, outputFileName]);

  // ── 重置 ──
  const handleReset = useCallback(() => {
    setFile(null);
    setError(null);
    setPaperHtml('');
    setHtmlVersion(0);
    setOutputBlob(null);
    setOutputFileName('');
    resetProgress();
  }, [resetProgress]);

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── 欢迎区 ── */}
        <section className="text-center space-y-2 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            上传初稿，一键排版
          </h2>
          <p className="text-sm sm:text-base text-gray-500 max-w-lg mx-auto">
            Upload your draft, format it with one click.
            <br />
            选择模板或手动微调参数，排版后网页预览，确认无误再下载 Word。
            全程浏览器本地处理，论文绝不离开你的电脑。
          </p>
        </section>

        {/* ── 主工作区：左右分栏 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 左侧：上传 + 封面 + 状态 + 按钮 — 占 2 列 */}
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardContent>
                <FileUploader
                  file={file}
                  onFileSelect={handleFileSelect}
                  onError={handleFileError}
                  disabled={isProcessing}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <TemplateSelector
                  current={config}
                  onChange={handleConfigChange}
                  disabled={isProcessing}
                />
              </CardContent>
            </Card>

            {/* 封面信息表单 */}
            <Card>
              <CardContent className="max-h-[480px] overflow-y-auto">
                <CoverForm
                  value={coverMeta}
                  onChange={setCoverMeta}
                  disabled={isProcessing}
                />
              </CardContent>
            </Card>

            {progress && progress.status !== 'idle' && <StatusBar progress={progress} />}
            {error && (
              <div className="rounded-xl px-5 py-4 bg-red-50 text-red-700 text-sm animate-fade-in">
                ❌ {error}
              </div>
            )}
            <ActionBar
              hasFile={file !== null}
              progress={progress}
              outputReady={outputReady}
              onFormat={handleFormat}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </div>

          {/* 右侧：参数微调面板 — 占 3 列 */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                排版参数微调  /  Fine-Tune
              </h3>
              <span className="text-[11px] text-gray-400">
                修改后实时生效 · 滚动下方查看更多
              </span>
            </div>
            <ParamPanel
              config={config}
              onChange={handleConfigChange}
              disabled={isProcessing}
            />

            {/* 封面实时预览 */}
            <Card>
              <CardContent>
                <CoverPreview meta={coverMeta} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── 步骤指示器 ── */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 py-2">
          {[
            { step: 1, label: '上传 / Upload', done: !!file },
            { step: 2, label: '模板 / Template', done: !!file },
            { step: 3, label: '参数 / Params', done: false },
            { step: 4, label: '排版 / Format', active: isProcessing || outputReady, done: outputReady },
            { step: 5, label: '下载 / Download', active: outputReady, done: false },
          ].map((s, i) => (
            <React.Fragment key={s.step}>
              <div className="flex items-center gap-1.5">
                <span className={`
                  inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold
                  ${s.done ? 'bg-emerald-100 text-emerald-700' :
                    s.active ? 'bg-brand-100 text-brand-700' :
                    'bg-gray-100 text-gray-400'}
                `}>
                  {s.done ? '✓' : s.step}
                </span>
                <span className={`text-[11px] ${s.done ? 'text-emerald-600' : s.active ? 'text-brand-600' : 'text-gray-400'} hidden sm:inline`}>
                  {s.label}
                </span>
              </div>
              {i < 4 && (
                <div className={`w-6 sm:w-10 h-px ${s.done ? 'bg-emerald-200' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── 论文工具箱（始终显示） ── */}
        <div className="animate-fade-in" key={`toolbox-${htmlVersion}`}>
          <ToolBox
            html={paperHtml}
            onHtmlUpdate={(newHtml) => {
              setPaperHtml(newHtml);
              setHtmlVersion(v => v + 1);
            }}
            config={config}
            file={file}
            outputBlob={outputBlob}
            outputFileName={outputFileName}
          />
        </div>

        {/* ── 商业化展示 ── */}
        <section>
          <CommerceBanner />
        </section>

        {/* ── 关于我们 ── */}
        <AboutSection />

        {/* ── Footer ── */}
        <footer className="text-center text-xs text-gray-400 pb-8">
          <p>
            毕设救星 · 论文排版助手 / Thesis Hero &copy; {new Date().getFullYear()} &nbsp;|&nbsp;
            扬州铭玄数崇物联科技有限公司 &nbsp;|&nbsp;
            <a href="mailto:yzmxsc@163.com" className="text-brand-500 hover:text-brand-600 transition-colors">
              yzmxsc@163.com
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default App;
