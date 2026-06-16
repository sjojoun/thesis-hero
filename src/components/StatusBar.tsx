import React from 'react';
import type { ProcessProgress } from '@/types';

interface StatusBarProps {
  progress: ProcessProgress | null;
}

const statusConfig: Record<string, { emoji: string; bg: string; text: string }> = {
  idle: { emoji: '⏳', bg: 'bg-gray-50', text: 'text-gray-400' },
  parsing: { emoji: '🔍', bg: 'bg-blue-50', text: 'text-blue-700' },
  generating: { emoji: '⚙️', bg: 'bg-brand-50', text: 'text-brand-700' },
  done: { emoji: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  error: { emoji: '❌', bg: 'bg-red-50', text: 'text-red-700' },
};

export const StatusBar: React.FC<StatusBarProps> = ({ progress }) => {
  if (!progress) return null;

  const cfg = statusConfig[progress.status] ?? statusConfig.idle;

  return (
    <div className={`
      rounded-xl px-5 py-4 animate-fade-in
      ${cfg.bg} ${cfg.text}
    `}>
      <div className="flex items-start gap-3">
        <span className="text-lg leading-none mt-0.5">{cfg.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{progress.message}</p>

          {/* 解析统计 */}
          {progress.stats && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs opacity-75">
              <span>共 {progress.stats.totalParagraphs} 段 / Para</span>
              {progress.stats.h1Count > 0 && <span>{progress.stats.h1Count} 章 / Ch</span>}
              {progress.stats.h2Count > 0 && <span>{progress.stats.h2Count} 节 / Sec</span>}
              {progress.stats.h3Count > 0 && <span>{progress.stats.h3Count} 条 / Sub</span>}
              {progress.stats.imageCount > 0 && <span>{progress.stats.imageCount} 图 / Img</span>}
              {progress.stats.referenceCount > 0 && <span>{progress.stats.referenceCount} 参考文献 / Ref</span>}
            </div>
          )}

          {/* 处理中动画 */}
          {(progress.status === 'parsing' || progress.status === 'generating') && (
            <div className="flex gap-1 mt-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse-soft" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse-soft" style={{ animationDelay: '0.2s' }} />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse-soft" style={{ animationDelay: '0.4s' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
