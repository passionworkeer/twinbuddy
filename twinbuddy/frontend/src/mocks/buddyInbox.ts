export interface BuddyInboxItem {
  id: string;
  nickname: string;
  mbti: string;
  city: string;
  matchScore: number;
  status: '协商完成' | '等待你决定' | '继续观察';
  summary: string;
  highlights: string[];
}

export const buddyInbox: BuddyInboxItem[] = [
  {
    id: 'buddy-001',
    nickname: '小满',
    mbti: 'ENFJ',
    city: '深圳',
    matchScore: 87,
    status: '等待你决定',
    summary: '预算和节奏都贴近，数字分身认为可以直接进入 6 轮盲选。',
    highlights: ['周末短途', '愿意做攻略', '吃饭不纠结'],
  },
  {
    id: 'buddy-002',
    nickname: '阿杰',
    mbti: 'INTP',
    city: '广州',
    matchScore: 81,
    status: '协商完成',
    summary: '行程风格一致，但社交强度差一档，建议先看详细报告再决定。',
    highlights: ['深度慢游', '预算稳定', '拍照随缘'],
  },
  {
    id: 'buddy-003',
    nickname: 'Momo',
    mbti: 'ISFP',
    city: '珠海',
    matchScore: 76,
    status: '继续观察',
    summary: '目的地偏好高度重叠，不过作息差异明显，适合先轻聊。',
    highlights: ['国内游', '美食导向', '情绪稳定'],
  },
  {
    id: 'buddy-004',
    nickname: '栗子',
    mbti: 'ESFJ',
    city: '佛山',
    matchScore: 83,
    status: '等待你决定',
    summary: '很会照顾同行体验，预算与节奏都稳定，适合第一次见面的轻量短途。',
    highlights: ['照顾型', '预算稳定', '细节控'],
  },
  {
    id: 'buddy-005',
    nickname: 'Ryan',
    mbti: 'ENTP',
    city: '深圳',
    matchScore: 79,
    status: '协商完成',
    summary: '点子很多、路线灵活，适合你想要一点新鲜感但不想完全失控的时候。',
    highlights: ['点子多', '路线灵活', '愿意尝鲜'],
  },
  {
    id: 'buddy-006',
    nickname: '南枝',
    mbti: 'INFP',
    city: '广州',
    matchScore: 74,
    status: '继续观察',
    summary: '情绪价值很高，审美和拍照都在线，但对行程效率的要求更低。',
    highlights: ['审美在线', '温柔型', '拍照细腻'],
  },
];
