import type { BookPage, MenuBook, ProductRef } from '../domain/types.js';

interface ExportProduct {
  source: ProductRef['source'];
  productId: string;
  officialName: string;
  category?: string;
  tags: string[];
  currentPrice?: number;
  currency?: string;
  priceCheckedAt?: string;
}

interface ExportBook {
  schemaVersion: 1;
  bookId: string;
  title: string;
  authorNickname: string;
  themeId: string;
  description: string;
  revision: number;
  updatedAt: string;
  products: ExportProduct[];
  pages: Array<Pick<BookPage, 'id' | 'type' | 'templateId' | 'title' | 'productIds' | 'content'>>;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function exportProduct(product: ProductRef): ExportProduct {
  const result: ExportProduct = {
    source: product.source,
    productId: product.productId,
    officialName: product.officialName,
    tags: [...product.tags],
  };
  if (product.category) result.category = product.category;
  if (product.price) {
    result.currentPrice = product.price.amount;
    result.currency = product.price.currency;
    result.priceCheckedAt = product.price.checkedAt;
  }
  return result;
}

export function toExportBook(book: MenuBook): ExportBook {
  return {
    schemaVersion: 1,
    bookId: book.bookId,
    title: book.title,
    authorNickname: book.authorNickname,
    themeId: book.themeId,
    description: book.description,
    revision: book.revision,
    updatedAt: book.updatedAt,
    products: book.products.map(({ product }) => exportProduct(product)),
    pages: book.pages.map((page) => ({
      id: page.id,
      type: page.type,
      templateId: page.templateId,
      ...(page.title ? { title: page.title } : {}),
      productIds: [...page.productIds],
      content: { ...page.content },
    })),
  };
}

function productById(book: MenuBook): Map<string, ProductRef> {
  return new Map(book.products.map(({ product }) => [product.productId, product]));
}

function renderPageHtml(book: MenuBook, page: BookPage): string {
  const products = productById(book);
  const productMarkup = page.productIds
    .map((productId) => products.get(productId))
    .filter((product): product is ProductRef => Boolean(product))
    .map((product) => `<li><strong>${escapeHtml(product.officialName)}</strong><small>${escapeHtml(product.category ?? '菜单商品')}</small></li>`)
    .join('');
  const contentMarkup = Object.entries(page.content)
    .map(([key, value]) => `<p><b>${escapeHtml(key)}</b>${escapeHtml(value)}</p>`)
    .join('');
  return `<article class="page page-${escapeHtml(page.type)}"><span class="eyebrow">MY McMENU / ${escapeHtml(page.type)}</span><h2>${escapeHtml(page.title ?? page.type)}</h2><div class="page-content">${contentMarkup}</div>${productMarkup ? `<ul>${productMarkup}</ul>` : ''}</article>`;
}

export function buildBookHtml(book: MenuBook): string {
  const safe = toExportBook(book);
  const pages = book.pages.map((page) => renderPageHtml(book, page)).join('');
  const serialized = escapeHtml(JSON.stringify(safe));
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(book.title)} · My McMenu</title>
<style>
:root{--ink:#202a28;--paper:#f3ecdc;--red:#e1492d;--yellow:#f5bd45;--muted:#6c716b}*{box-sizing:border-box}body{margin:0;padding:40px;background:var(--ink);color:var(--ink);font-family:Arial,"Microsoft Yahei",sans-serif}.book{max-width:900px;margin:auto}.masthead{padding:28px 34px;color:var(--paper);background:var(--red)}.masthead small{font:11px monospace;letter-spacing:.12em}.masthead h1{font-size:clamp(42px,8vw,90px);line-height:.9;margin:35px 0 20px;letter-spacing:-.08em}.masthead p{max-width:460px;line-height:1.6}.page{position:relative;min-height:560px;margin:24px 0;padding:46px 54px;background:var(--paper);box-shadow:12px 12px 0 rgba(0,0,0,.18)}.page:before{content:"";position:absolute;left:0;top:0;bottom:0;width:10px;background:repeating-linear-gradient(var(--red) 0 20px,transparent 20px 29px)}.eyebrow{color:var(--red);font:11px monospace;letter-spacing:.1em}.page h2{font-size:clamp(36px,6vw,74px);line-height:.92;letter-spacing:-.07em;margin:50px 0 28px}.page-content{color:var(--muted);line-height:1.7}.page-content p{display:flex;gap:18px;border-bottom:1px solid #c9c0af;padding:12px 0}.page-content b{min-width:90px;color:var(--red);font:11px monospace}ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;list-style:none;padding:0;margin-top:35px}li{padding:16px;background:#e9dfcb}li strong,li small{display:block}li small{color:var(--muted);font-size:11px;margin-top:8px}.foot{color:var(--paper);font:11px monospace;text-align:center;line-height:1.6;padding:18px}.hidden-data{display:none}
</style>
</head>
<body><main class="book"><header class="masthead"><small>FAN-MADE / NOT OFFICIAL</small><h1>${escapeHtml(book.title)}</h1><p>${escapeHtml(book.description)}</p><small>BY ${escapeHtml(book.authorNickname)} · REV.${String(book.revision).padStart(2, '0')}</small></header>${pages}<footer class="foot">真实商品事实来自麦当劳 MCP 快照或明确标注的演示数据。<br>本导出不包含 Token、地址、订单或私密配置。</footer><script type="application/json" class="hidden-data">${serialized}</script></main></body></html>`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadBookHtml(book: MenuBook): void {
  downloadBlob(new Blob([buildBookHtml(book)], { type: 'text/html;charset=utf-8' }), `${book.title || 'my-mcmenu'}.html`);
}

function drawWrappedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  let line = '';
  let cursor = y;
  for (const character of text) {
    const candidate = line + character;
    if (context.measureText(candidate).width > maxWidth && line) {
      context.fillText(line, x, cursor);
      line = character;
      cursor += lineHeight;
    } else {
      line = candidate;
    }
  }
  if (line) {
    context.fillText(line, x, cursor);
    cursor += lineHeight;
  }
  return cursor;
}

export async function downloadPagePng(book: MenuBook, pageIndex: number): Promise<void> {
  const page = book.pages[pageIndex] ?? book.pages[0];
  if (!page) return;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available in this browser');

  context.fillStyle = '#f3ecdc';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#e1492d';
  context.fillRect(0, 0, 18, canvas.height);
  context.fillStyle = '#6c716b';
  context.font = '18px monospace';
  context.fillText(`MY McMENU / ${String(pageIndex + 1).padStart(2, '0')} · FAN-MADE`, 75, 78);
  context.strokeStyle = '#c9c0af';
  context.beginPath();
  context.moveTo(75, 106);
  context.lineTo(1125, 106);
  context.stroke();

  context.fillStyle = '#e1492d';
  context.font = 'bold 22px monospace';
  context.fillText(page.type.toUpperCase(), 75, 190);
  context.fillStyle = '#202a28';
  context.font = 'bold 76px Arial';
  let cursor = drawWrappedText(context, page.title ?? page.type, 75, 290, 900, 82);
  context.fillStyle = '#6c716b';
  context.font = '24px Arial';
  for (const value of Object.values(page.content)) {
    cursor += 24;
    cursor = drawWrappedText(context, value, 75, cursor, 900, 38);
  }

  const products = productById(book);
  for (const productId of page.productIds) {
    const product = products.get(productId);
    if (!product) continue;
    cursor += 30;
    context.fillStyle = '#e9dfcb';
    context.fillRect(75, cursor - 28, 1000, 72);
    context.fillStyle = '#202a28';
    context.font = 'bold 26px Arial';
    context.fillText(product.officialName, 98, cursor + 4);
    context.fillStyle = '#e1492d';
    context.font = '17px monospace';
    context.fillText(product.category ?? '菜单商品', 98, cursor + 31);
    cursor += 72;
  }

  context.fillStyle = '#202a28';
  context.font = '18px monospace';
  context.fillText(`BY ${book.authorNickname} · REV.${String(book.revision).padStart(2, '0')}`, 75, 1415);
  context.fillStyle = '#6c716b';
  context.font = '16px Arial';
  context.fillText('真实商品事实与个人创作内容分开保存。', 75, 1450);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Unable to create PNG');
  downloadBlob(blob, `${book.title || 'my-mcmenu'}-page-${pageIndex + 1}.png`);
}
