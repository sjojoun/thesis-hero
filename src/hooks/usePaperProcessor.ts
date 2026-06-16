/**
 * usePaperProcessor.ts — 排版流程状态管理 Hook
 */

import { useState, useCallback } from 'react';
import type { TemplateConfig, ProcessProgress } from '@/types';

interface UsePaperProcessorReturn {
  /** 当前进度 */
  progress: ProcessProgress | null;
  /** 是否处理中 */
  isProcessing: boolean;
  /** 开始处理 */
  startProcessing: () => void;
  /** 更新进度 */
  updateProgress: (p: ProcessProgress) => void;
  /** 重置 */
  reset: () => void;
}

export const usePaperProcessor = (): UsePaperProcessorReturn => {
  const [progress, setProgress] = useState<ProcessProgress | null>(null);

  const isProcessing =
    progress?.status === 'parsing' || progress?.status === 'generating';

  const startProcessing = useCallback(() => {
    setProgress({ status: 'parsing', message: '准备处理...' });
  }, []);

  const updateProgress = useCallback((p: ProcessProgress) => {
    setProgress(p);
  }, []);

  const reset = useCallback(() => {
    setProgress(null);
  }, []);

  return { progress, isProcessing, startProcessing, updateProgress, reset };
};
