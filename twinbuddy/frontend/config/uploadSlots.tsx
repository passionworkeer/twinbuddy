import { FileJson, FileText, MessageSquare, Image as ImageIcon } from 'lucide-react';
import type { FileSlotConfig } from '../types/persona';

export const SLOTS: FileSlotConfig[] = [
  {
    type: 'douyin_json',
    label: '抖音数据',
    description: '从抖音开放平台导出的 JSON 文件',
    accepted: '.json,application/json',
    icon: <FileJson className="h-5 w-5" />,
    optional: true,
  },
  {
    type: 'mbti_txt',
    label: 'MBTI 测试结果',
    description: '16Personalities 或类似测试的 TXT 导出',
    accepted: '.txt,text/plain',
    icon: <FileText className="h-5 w-5" />,
    optional: true,
  },
  {
    type: 'chat_logs',
    label: '聊天记录',
    description: '微信 / QQ / Telegram 导出的 TXT 或 JSON',
    accepted: '.txt,.json,text/plain,application/json',
    icon: <MessageSquare className="h-5 w-5" />,
    optional: true,
  },
  {
    type: 'photo',
    label: '个人照片',
    description: '用于生成 AI Avatar（仅支持人像）',
    accepted: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp',
    icon: <ImageIcon className="h-5 w-5" />,
    optional: true,
  },
];

export const STEPS = [
  { id: 1, title: '上传数据', subtitle: '选择你愿意分享的内容' },
  { id: 2, title: '生成人格', subtitle: 'AI 分析并构建你的数字孪生' },
  { id: 3, title: '找搭子', subtitle: '发现灵魂契合的旅行伙伴' },
];
