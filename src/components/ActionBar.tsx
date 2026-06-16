import React from 'react';
import { Button } from '@/components/ui/Button';
import type { ProcessProgress } from '@/types';

interface ActionBarProps {
  hasFile: boolean;
  progress: ProcessProgress | null;
  outputReady: boolean;
  onFormat: () => void;
  onDownload: () => void;
  onReset: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  hasFile,
  progress,
  outputReady,
  onFormat,
  onDownload,
  onReset,
}) => {
  const isProcessing =
    progress?.status === 'parsing' || progress?.status === 'generating';

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
      <Button
        variant="primary"
        size="lg"
        onClick={onFormat}
        disabled={!hasFile || isProcessing}
        loading={isProcessing}
        className="flex-1 sm:flex-initial text-base"
      >
        {isProcessing
          ? '处理中 / Processing...'
          : outputReady
          ? '🔄 重新排版 / Re-format'
          : '开始排版 / Format'}
      </Button>
      <Button
        variant="secondary"
        size="lg"
        onClick={onDownload}
        disabled={!outputReady}
        className="flex-1 sm:flex-initial text-base"
      >
        {outputReady ? '📥 下载 Word / Download' : '📥 排版后可下载'}
      </Button>
      <Button
        variant="ghost"
        size="md"
        onClick={onReset}
        disabled={isProcessing}
        className="text-sm"
      >
        重置 / Reset
      </Button>
    </div>
  );
};
