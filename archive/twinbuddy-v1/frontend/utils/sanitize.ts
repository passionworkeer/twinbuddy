/**
 * 安全工具集：防御 XSS 等前端安全风险
 *
 * 设计原则：
 * - AI/persona 内容使用 sanitizePersonaText（允许基本格式标签）
 * - 用户上传的文件名使用 sanitizeFilename（仅做字符替换）
 * - 所有 {xxx} JSX 插值均通过本模块消毒，保留纵深防御
 */

import DOMPurify from 'dompurify';

/**
 * 消毒 AI 生成的 persona 内容
 * 允许基本格式标签，移除所有脚本、事件处理器和危险属性
 *
 * 允许的标签：p br strong em b i span（均为语义/格式标签）
 * 允许的属性：class（仅样式类名）
 *
 * @param text AI 原始输出文本，可能包含格式标签
 * @returns 消毒后的安全文本
 */
export function sanitizePersonaText(text: string): string {
  if (!text) return '';
  if (typeof window === 'undefined') {
    // SSR 环境下跳过消毒（DOMPurify 依赖 window）
    return text;
  }
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'span'],
    ALLOWED_ATTR: ['class'],
    // 强制移除所有事件处理器和 javascript: URL
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}

/**
 * 消毒文件名（用于 UI 显示）
 * 移除文件系统不允许的字符，防止显示问题
 *
 * @param filename 原始文件名
 * @returns 清理后的文件名
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';
  return filename
    .replace(/[<>:"|?*\\/\x00-\x1f]/g, '_') // 替换非法文件系统字符
    .replace(/\.{2,}/g, '.')                // 防止路径遍历 (..)
    .replace(/^_+/, '')                      // 移除头部下划线
    .substring(0, 100);                      // 长度限制
}

/**
 * 消毒纯文本（不允许任何 HTML 标签）
 * 用于文件名、标签名等必须为纯文本的场景
 *
 * @param text 任意输入
 * @returns 仅含纯文本的字符串
 */
export function sanitizePlainText(text: string): string {
  if (!text) return '';
  if (typeof window === 'undefined') return text;
  // strip all HTML — 最严格模式
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
