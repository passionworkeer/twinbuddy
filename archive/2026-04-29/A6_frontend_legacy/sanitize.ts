export function sanitizePersonaText(text: string): string {
  if (typeof window === 'undefined') return text;
  try {
    const DOMPurify = require('dompurify');
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: ['p','br','strong','em','b','i','span'], ALLOWED_ATTR: ['class'] });
  } catch { return text; }
}
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[<>:"|?*]/g, '_').substring(0, 100);
}
