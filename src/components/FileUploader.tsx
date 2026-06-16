import React, { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { formatFileSize } from '@/lib/utils';

interface FileUploaderProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onError: (error: string) => void;
  disabled: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  file,
  onFileSelect,
  onError,
  disabled,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateAndSet = useCallback(
    (f: File | null) => {
      if (!f) return;

      const valid =
        f.name.toLowerCase().endsWith('.docx') ||
        f.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      if (!valid) {
        onError('请上传 .docx 格式的 Word 文档。若为 .doc 文件，请在 Word / WPS 中另存为 .docx 后再上传（后续版本将支持 .doc 直接上传）');
        if (inputRef.current) inputRef.current.value = '';
        return;
      }

      onFileSelect(f);
    },
    [onFileSelect, onError]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      validateAndSet(e.target.files?.[0] ?? null);
    },
    [validateAndSet]
  );

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files?.[0];
    validateAndSet(dropped ?? null);
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full rounded-2xl border-2 border-dashed
        transition-all duration-200 cursor-pointer
        ${isDragOver ? 'upload-zone-active' : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50/30'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${file ? 'bg-brand-50/20 border-brand-200' : 'bg-white'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center py-10 px-6">
        {file ? (
          <>
            {/* 已选文件展示 */}
            <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-400 mt-1">{formatFileSize(file.size)}</p>
            <p className="text-xs text-brand-500 mt-2 font-medium">
              点击或拖拽替换文件 / Click or drag to replace
            </p>
          </>
        ) : (
          <>
            {/* 空状态 */}
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">
              拖拽 .docx 文件到此处，或点击上传
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Drag & drop your .docx here, or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-2">
              仅支持 Word 2007+ (.docx) 格式
            </p>
            <p className="text-[10px] text-gray-300 mt-0.5">
              .doc 文件请先另存为 .docx / Save .doc as .docx first
            </p>
          </>
        )}
      </div>
    </div>
  );
};
