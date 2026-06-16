/**
 * 💧 水印添加引擎 (Watermarking)
 * 在前端用 Canvas 生成半透明斜铺水印图，转为 Base64 或利用
 * docx 页眉段落模拟水印效果。
 */
import {
  Paragraph, TextRun, Header, SectionType, AlignmentType,
} from 'docx';

export interface WatermarkOptions {
  text: string;
  /** 水印颜色 rgba，默认 rgba(128,128,128,0.15) */
  color?: string;
  /** 字体大小 px，默认 40 */
  fontSize?: number;
  /** 旋转角度（度），默认 -30 */
  rotation?: number;
  /** 水平间距 px，默认 200 */
  gapX?: number;
  /** 垂直间距 px，默认 200 */
  gapY?: number;
  /** 输出宽度 */
  width?: number;
  /** 输出高度 */
  height?: number;
}

export interface WatermarkResult {
  /** docx 中可用的页眉定义（模拟水印） */
  header: Header;
  /** Canvas 生成的 Base64 背景图（用于预览） */
  base64Css: string;
}

const DEFAULTS: Required<WatermarkOptions> = {
  text: '内部资料',
  color: 'rgba(128,128,128,0.15)',
  fontSize: 40,
  rotation: -30,
  gapX: 200,
  gapY: 200,
  width: 800,
  height: 800,
};

/**
 * 用 Canvas 生成水印背景图片 → Base64
 */
export function generateWatermarkCanvas(
  opts: WatermarkOptions
): { canvas: HTMLCanvasElement; base64: string; base64Css: string } {
  const o: Required<WatermarkOptions> = { ...DEFAULTS, ...opts };
  const canvas = document.createElement('canvas');
  canvas.width = o.width;
  canvas.height = o.height;
  const ctx = canvas.getContext('2d')!;

  // 透明背景
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 计算网格中每行文字
  ctx.font = `${o.fontSize}px "Microsoft YaHei", "SimHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(o.text);
  const textWidth = metrics.width;
  const textHeight = o.fontSize;

  // 间距使用用户设定
  const stepX = textWidth + o.gapX + 60;
  const stepY = textHeight + o.gapY + 20;

  for (let y = textHeight; y < canvas.height + textHeight; y += stepY) {
    for (let x = 0; x < canvas.width + stepX; x += stepX) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((o.rotation * Math.PI) / 180);
      ctx.fillStyle = o.color;
      ctx.fillText(o.text, 0, 0);
      ctx.restore();
    }
  }

  const base64 = canvas.toDataURL('image/png');
  const base64Css = `url(${base64})`;
  return { canvas, base64, base64Css };
}

/**
 * 生成 docx 页眉（带水印文字，铺满半透明效果）
 * 注：docx 原生不支持 CSS 背景水印，此处利用页眉段落 + 浅色文字模拟。
 * 适合对 PDF 导出无特殊要求的场景。
 */
export function buildWatermarkHeader(opts: WatermarkOptions): Header {
  const o: Required<WatermarkOptions> = { ...DEFAULTS, ...opts };
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 20, after: 20 },
        children: [
          new TextRun({
            text: Array(8).fill(`  ${o.text}  `).join('·'),
            color: o.color.replace(/rgba?\(.*?\)/, '888888'),
            size: 16,
            italics: true,
            font: { eastAsia: '宋体', ascii: 'Times New Roman', hAnsi: 'Times New Roman' },
          }),
        ],
      }),
    ],
  });
}
