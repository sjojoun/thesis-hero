/**
 * 🎨 我的模板库引擎 (Template Library)
 * 基于 localStorage 的本地模板管理器。
 * 支持保存、读取、列表、删除自定义排版模板。
 */
import type { TemplateConfig } from '@/types';

const STORAGE_KEY = 'paperFormatter_templates';

export interface StoredTemplate {
  id: string;
  name: string;
  description?: string;
  config: TemplateConfig;
  createdAt: string;     // ISO timestamp
  updatedAt: string;
}

export const TemplateLibrary = {
  /** 保存/更新模板 */
  saveTemplate(
    id: string,
    name: string,
    config: TemplateConfig,
    description?: string,
  ): void {
    const templates = this.getAllTemplates();
    const now = new Date().toISOString();
    const existing = templates[id];

    templates[id] = {
      id,
      name,
      description: description ?? existing?.description ?? '',
      config,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  },

  /** 读取单个模板 */
  getTemplate(id: string): StoredTemplate | null {
    const templates = this.getAllTemplates();
    return templates[id] ?? null;
  },

  /** 读取所有模板 */
  getAllTemplates(): Record<string, StoredTemplate> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  /** 列出模板数组（按更新时间倒序） */
  listTemplates(): StoredTemplate[] {
    const templates = this.getAllTemplates();
    return Object.values(templates).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  },

  /** 删除模板 */
  deleteTemplate(id: string): void {
    const templates = this.getAllTemplates();
    delete templates[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  },

  /** 导出所有模板为 JSON 字符串（备份用） */
  exportToJSON(): string {
    return JSON.stringify(this.getAllTemplates(), null, 2);
  },

  /** 从 JSON 字符串导入模板（合并，不覆盖已存在 ID） */
  importFromJSON(json: string): number {
    try {
      const incoming = JSON.parse(json);
      const existing = this.getAllTemplates();
      let count = 0;
      for (const [id, tpl] of Object.entries(incoming)) {
        if (!existing[id as string]) {
          existing[id as string] = tpl as StoredTemplate;
          count++;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      return count;
    } catch {
      return 0;
    }
  },

  /** 清空所有模板 */
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
