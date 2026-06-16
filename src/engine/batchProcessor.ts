/**
 * 📋 批量处理引擎 (Batch Processing)
 * 并发处理多个论文文件，打包 zip 下载。
 * 需要 jszip 外部库。
 */
import JSZip from 'jszip';

export interface BatchProgress {
  current: number;
  total: number;
  fileName: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  message?: string;
}

export type BatchProcessFn = (file: File) => Promise<Blob>;

/**
 * 批量处理文件 → 打包 zip
 */
export async function batchProcessAndDownload(
  files: File[],
  processFn: BatchProcessFn,
  onProgress?: (progress: BatchProgress) => void,
  options?: {
    prefix?: string;        // 文件名前缀，默认 "已排版_"
    zipName?: string;       // zip 包名，默认 "batch-processed.zip"
  },
): Promise<{ blob: Blob; name: string }> {
  const {
    prefix = '已排版_',
    zipName = 'batch-processed.zip',
  } = options ?? {};

  const zip = new JSZip();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress: BatchProgress = {
      current: i + 1,
      total: files.length,
      fileName: file.name,
      status: 'processing',
    };

    onProgress?.(progress);

    try {
      const processed = await processFn(file);
      zip.file(`${prefix}${file.name}`, processed);
      onProgress?.({ ...progress, status: 'done' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误';
      onProgress?.({ ...progress, status: 'error', message: msg });
      // 将原始文件加入 zip（或在错误文件中加入错误信息）
      zip.file(`ERROR_${file.name}`, `处理失败: ${msg}\n原始文件无法转换，已保留在下方文件夹。`);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });

  // 触发浏览器下载
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = zipName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 200);

  return { blob, name: zipName };
}
