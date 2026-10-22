import type { BookPage, ProductRef } from './types.js';

export type CopyCandidateTarget =
  | { kind: 'title'; current: string; description: string; styleLabel: string; product?: ProductRef }
  | { kind: 'product-name'; current: string; product: ProductRef }
  | { kind: 'story'; current: string; product: ProductRef }
  | { kind: 'page-note'; current: string; page: BookPage };

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, 3);
}

export function createCopyCandidates(target: CopyCandidateTarget): string[] {
  if (target.kind === 'title') {
    const hook = target.description.trim().replace(/[。！？!?,，]/g, '').slice(0, 14) || '今天也要好好吃饭';
    const productName = target.product?.officialName ?? '我的本命';
    return unique([
      `${hook}｜我的麦门菜单册`,
      `${target.styleLabel}档案：${productName}`,
      `今天的快乐，由${productName}负责`,
    ]);
  }

  if (target.kind === 'product-name') {
    const official = target.product.officialName;
    return unique([
      target.current || `${official}快乐版`,
      `今天必须${official}`,
      `${official}｜我的固定节目`,
    ]);
  }

  if (target.kind === 'story') {
    const official = target.product.officialName;
    return unique([
      target.current || `每次想吃${official}，都像给今天按下了重启。`,
      `它不是随便一餐，是我给忙碌生活留的一个小彩蛋：${official}。`,
      `如果今天只能认真记住一件事，那就记住这份${official}带来的快乐。`,
    ]);
  }

  const chapter = target.page.title ?? target.page.content.chapterLabel ?? '这一页';
  return unique([
    target.current || `${chapter}，把普通的一餐写成值得翻回来的片段。`,
    `关于${chapter}：不必解释，喜欢本身就是理由。`,
    `${chapter}｜今天也给自己留一口热乎的快乐。`,
  ]);
}
