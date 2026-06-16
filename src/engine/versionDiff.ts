/**
 * ⚖️ 版本对比引擎 (Version Diff)
 * 对比排版前后两段 HTML，高亮新增/删除内容。
 * 使用 npm 包 diff 进行单词级差异分析。
 */
import { diffWords, diffLines } from 'diff';

export interface DiffChunk {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export interface DiffResult {
  /** HTML 格式的高亮对比结果 */
  html: string;
  /** 原始差异块（用于自定义渲染） */
  chunks: DiffChunk[];
  /** 统计信息 */
  stats: {
    added: number;
    removed: number;
    unchanged: number;
  };
}

/**
 * 单词级对比，返回带高亮的 HTML 字符串
 */
export function diffWordsHighlight(oldText: string, newText: string): DiffResult {
  const diffs = diffWords(oldText, newText);

  let html = '';
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (const part of diffs) {
    if (part.added) {
      html += `<span class="diff-added" style="color: #166534; background-color: #dcfce7; padding: 1px 2px;">${escapeHtml(part.value)}</span>`;
      added += part.value.length;
    } else if (part.removed) {
      html += `<span class="diff-removed" style="color: #991b1b; background-color: #fee2e2; text-decoration: line-through; padding: 1px 2px;">${escapeHtml(part.value)}</span>`;
      removed += part.value.length;
    } else {
      html += `<span class="diff-unchanged" style="color: #374151;">${escapeHtml(part.value)}</span>`;
      unchanged += part.value.length;
    }
  }

  return {
    html: `<pre class="diff-result" style="white-space: pre-wrap; word-break: break-all; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.6; padding: 16px; border-radius: 12px; background: #f9fafb;">${html}</pre>`,
    chunks: diffs.map(p => ({
      value: p.value,
      added: p.added || false,
      removed: p.removed || false,
    })),
    stats: { added, removed, unchanged },
  };
}

/**
 * 行级对比（适合较大块的差异查看）
 */
export function diffLinesHighlight(oldText: string, newText: string): DiffResult {
  const diffs = diffLines(oldText, newText, { ignoreWhitespace: false });

  let html = '';
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (const part of diffs) {
    if (part.added) {
      html += `<div class="diff-line-added" style="background-color: #dcfce7; border-left: 3px solid #22c55e; padding: 2px 8px;">+ ${escapeHtml(part.value)}</div>`;
      added += part.value.length;
    } else if (part.removed) {
      html += `<div class="diff-line-removed" style="background-color: #fee2e2; border-left: 3px solid #ef4444; padding: 2px 8px;">- ${escapeHtml(part.value)}</div>`;
      removed += part.value.length;
    } else {
      html += `<div class="diff-line-unchanged" style="padding: 2px 8px;">  ${escapeHtml(part.value)}</div>`;
      unchanged += part.value.length;
    }
  }

  return {
    html: `<pre class="diff-result" style="white-space: pre-wrap; word-break: break-all; font-family: 'Courier New', monospace; font-size: 13px; line-height: 
1.6; padding: 16px; border-radius: 12px; background: #f9fafb; text-align: left;">${html}</pre>`,
    chunks: diffs.map(p => ({
      value: p.value,
      added: p.added || false,
      removed: p.removed || false,
    })),
    stats: { added, removed, unchanged },
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
