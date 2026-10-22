import type { MbtiType, ProductRef, ZodiacSign } from './types.js';

export interface MbtiOption {
  id: MbtiType;
  label: string;
  mood: string;
}

export interface MbtiPlan {
  productIds: string[];
  title: string;
  description: string;
}

export interface ZodiacOption {
  id: ZodiacSign;
  label: string;
}

export interface ZodiacPlan {
  productIds: string[];
  title: string;
  text: string;
}

export const mbtiOptions: MbtiOption[] = [
  { id: 'INTJ', label: 'INTJ 建筑师', mood: '精准、克制、讲究效率' },
  { id: 'INTP', label: 'INTP 逻辑学家', mood: '好奇、实验、喜欢新组合' },
  { id: 'ENTJ', label: 'ENTJ 指挥官', mood: '果断、能量满格、要吃得痛快' },
  { id: 'ENTP', label: 'ENTP 辩论家', mood: '玩梗、猎奇、拒绝无聊' },
  { id: 'INFJ', label: 'INFJ 提倡者', mood: '细腻、治愈、需要一点仪式感' },
  { id: 'INFP', label: 'INFP 调停者', mood: '浪漫、柔软、偏爱小确幸' },
  { id: 'ENFJ', label: 'ENFJ 主人公', mood: '热情、分享、照顾大家的快乐' },
  { id: 'ENFP', label: 'ENFP 竞选者', mood: '明亮、跳脱、上新就是召唤' },
  { id: 'ISTJ', label: 'ISTJ 物流师', mood: '稳定、经典、可靠不踩雷' },
  { id: 'ISFJ', label: 'ISFJ 守卫者', mood: '温柔、熟悉、舒服最重要' },
  { id: 'ESTJ', label: 'ESTJ 总经理', mood: '高效、饱足、组合要完整' },
  { id: 'ESFJ', label: 'ESFJ 执政官', mood: '热闹、分享、大家都喜欢' },
  { id: 'ISTP', label: 'ISTP 鉴赏家', mood: '利落、酥脆、动手拆解快乐' },
  { id: 'ISFP', label: 'ISFP 探险家', mood: '感官、好看、今天换个口味' },
  { id: 'ESTP', label: 'ESTP 企业家', mood: '刺激、爽快、马上获得快乐' },
  { id: 'ESFP', label: 'ESFP 表演者', mood: '闪亮、甜蜜、快乐要有现场感' },
];

const mbtiKeywords: Record<MbtiType, string[]> = {
  INTJ: ['安格斯', '牛', '咖啡', '经典'], INTP: ['组合', '任选', '上新', '芝士'],
  ENTJ: ['套餐', '巨无霸', '牛', '鸡'], ENTP: ['上新', '辣', '蘸酱', '限定'],
  INFJ: ['芝士', '奶', '甜', '咖啡'], INFP: ['派', '奶昔', '甜', '饮'],
  ENFJ: ['分享', '双人', '多人', '套餐'], ENFP: ['上新', '限定', '奶昔', '玩具'],
  ISTJ: ['经典', '套餐', '可乐', '薯条'], ISFJ: ['鸡', '薯', '饮', '套餐'],
  ESTJ: ['套餐', '三件套', '四件套', '双人'], ESFJ: ['分享', '多人', '甜', '饮'],
  ISTP: ['炸鸡', '脆', '辣', '鸡'], ISFP: ['奶昔', '芝士', '蓝莓', '新品'],
  ESTP: ['辣', '炸鸡', '鸡腿', '酥脆'], ESFP: ['奶昔', '甜', '限量', '上新'],
};

export const zodiacOptions: ZodiacOption[] = [
  { id: '白羊座', label: '♈ 白羊座' }, { id: '金牛座', label: '♉ 金牛座' }, { id: '双子座', label: '♊ 双子座' },
  { id: '巨蟹座', label: '♋ 巨蟹座' }, { id: '狮子座', label: '♌ 狮子座' }, { id: '处女座', label: '♍ 处女座' },
  { id: '天秤座', label: '♎ 天秤座' }, { id: '天蝎座', label: '♏ 天蝎座' }, { id: '射手座', label: '♐ 射手座' },
  { id: '摩羯座', label: '♑ 摩羯座' }, { id: '水瓶座', label: '♒ 水瓶座' }, { id: '双鱼座', label: '♓ 双鱼座' },
];

const zodiacRules: Record<ZodiacSign, { title: string; text: string; keywords: string[] }> = {
  白羊座: { title: '行动力回满', text: '今天适合先吃一口再出发，热乎、酥脆和一点辣会把节奏拉回正轨。', keywords: ['辣', '鸡', '炸', '酥脆'] },
  金牛座: { title: '慢慢享受', text: '今天的好运藏在熟悉的满足里，选一份扎实组合，把快乐放慢一点。', keywords: ['套餐', '牛', '薯', '经典'] },
  双子座: { title: '好奇心在线', text: '今天适合尝试新口味，越有反差的小搭配，越容易收获惊喜。', keywords: ['上新', '任选', '芝士', '限定'] },
  巨蟹座: { title: '被温柔照顾', text: '今天适合选择熟悉又有安全感的味道，给自己留一份不需要解释的安慰。', keywords: ['鸡', '奶', '饮', '套餐'] },
  狮子座: { title: '主角登场', text: '今天值得一份有存在感的主打餐品，明亮、饱足、拍照也要好看。', keywords: ['巨无霸', '牛', '分享', '上新'] },
  处女座: { title: '秩序感加分', text: '今天适合选择搭配完整、每一口都有安排的组合，稳稳获得满足。', keywords: ['套餐', '三件套', '四件套', '经典'] },
  天秤座: { title: '平衡刚刚好', text: '今天适合一份主食配一份清爽饮品，在丰盛和轻盈之间找到漂亮平衡。', keywords: ['饮', '鸡', '芝士', '组合'] },
  天蝎座: { title: '深度快乐', text: '今天适合浓郁、酥脆和有一点神秘感的味道，把情绪认真吃完。', keywords: ['辣', '蘸酱', '炸鸡', '浓郁'] },
  射手座: { title: '快乐出发', text: '今天适合尝试限定和新口味，把菜单当作一张小小的探索地图。', keywords: ['上新', '限定', '奶昔', '玩具'] },
  摩羯座: { title: '稳步补能', text: '今天先把能量补好，再处理重要的事；完整套餐是可靠的后援。', keywords: ['套餐', '牛', '咖啡', '三件套'] },
  水瓶座: { title: '灵感跳出来', text: '今天适合不按常规组合，给自己一个意外但合理的快乐答案。', keywords: ['任选', '组合', '上新', '芝士'] },
  双鱼座: { title: '柔软有光', text: '今天适合甜一点、香一点的温柔收尾，把小小的幸福安排进日程。', keywords: ['派', '奶昔', '甜', '蓝莓'] },
};

function scoreProduct(product: ProductRef, keywords: string[]): number {
  const text = `${product.officialName} ${product.category ?? ''} ${product.tags.join(' ')}`;
  return keywords.reduce((score, keyword) => score + (text.includes(keyword) ? 3 : 0), 0);
}

function selectByKeywords(products: ProductRef[], keywords: string[], limit = 3): ProductRef[] {
  return products
    .map((product, index) => ({ product, score: scoreProduct(product, keywords), index }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map(({ product }) => product);
}

export function buildMbtiPlan(products: ProductRef[], mbti: MbtiType): MbtiPlan {
  const option = mbtiOptions.find((item) => item.id === mbti)!;
  const selected = selectByKeywords(products, mbtiKeywords[mbti]);
  return {
    productIds: selected.map((product) => product.productId),
    title: `${mbti} · ${option.label.replace(`${mbti} `, '')}快乐搭配`,
    description: `${option.mood}。这组搭配优先选择“${mbtiKeywords[mbti].slice(0, 3).join('、')}”相关的真实餐品。`,
  };
}

export function buildZodiacPlan(products: ProductRef[], zodiac: ZodiacSign): ZodiacPlan {
  const rule = zodiacRules[zodiac];
  const selected = selectByKeywords(products, rule.keywords);
  return {
    productIds: selected.map((product) => product.productId),
    title: `${zodiac} · 今日${rule.title}`,
    text: `娱乐性星座运势｜${rule.text}`,
  };
}
