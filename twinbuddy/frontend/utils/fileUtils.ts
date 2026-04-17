import type { ParsedFileSummary } from '../types/persona';

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** Mock parser — replace with real parsing when backend is ready */
export function mockParse(file: File, slotType: string): ParsedFileSummary {
  let summary = '';
  if (slotType === 'douyin_json') {
    summary = '检测到 127 条视频互动数据，识别出 8 个兴趣标签';
  } else if (slotType === 'mbti_txt') {
    summary = 'MBTI: INFP-T（调停者型），得分 A = 72%, T = 65%';
  } else if (slotType === 'chat_logs') {
    summary = '解析出 3,421 条消息，平均每日活跃度 82%';
  } else if (slotType === 'photo') {
    summary = '人脸检测成功，提取风格特征：温暖色调、户外场景偏好';
  } else {
    summary = `文件已接收，大小 ${formatBytes(file.size)}`;
  }
  return {
    filename: file.name,
    size: file.size,
    summary,
    preview: slotType === 'photo' ? URL.createObjectURL(file) : undefined,
  };
}
