import { useEffect, useMemo, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { createCopyCandidates, type CopyCandidateTarget } from '../domain/creative-copy.js';
import { applyMenuBookEdits, type MenuBookEdit } from '../domain/menu-book-editor.js';
import { createMenuBook } from '../domain/menu-book.js';
import { downloadBookHtml, downloadPagePng } from '../export/book-export.js';
import type { BookPage, BookProfile, CustomProduct, MbtiType, MenuBook, ProductRef, ZodiacSign } from '../domain/types.js';
import { buildMbtiPlan, buildZodiacPlan, mbtiOptions, zodiacOptions, type MbtiPlan, type ZodiacPlan } from '../domain/personalization.js';
import { loadMenuBook, saveMenuBook } from '../storage/menu-book-storage.js';
import { fetchFrequentProductIds } from './live-history.js';
import { fetchLiveCatalog } from './live-catalog.js';
import { getCatalog } from './catalog.js';

 type Stage = 'onboarding' | 'workshop' | 'reader';
 type SourceMode = 'mcp-live' | 'mock';
 type StyleId = 'joyful' | 'retro' | 'notebook' | 'minimal';
 type McpStatus = { status: 'loading' | 'ready' | 'error'; message?: string; count?: number; checkedAt?: string };
 type EditorTarget = { kind: 'book' } | { kind: 'page'; pageId: string } | { kind: 'product'; productId: string };

 const styleOptions: Array<{ id: StyleId; label: string; note: string; mark: string }> = [
   { id: 'joyful', label: '快乐玩梗', note: '大字、红签、今天就要开心', mark: 'HA' },
   { id: 'retro', label: '复古杂志', note: '旧报纸网格，留一点油墨味', mark: '77' },
   { id: 'notebook', label: '可爱手账', note: '贴纸感、软边框、碎碎念', mark: '♡' },
   { id: 'minimal', label: '极简酷感', note: '留白、细线、只留本命', mark: '—' },
 ];

 const pageLabels: Record<BookPage['type'], string> = {
   cover: '封面',
   contents: '目录',
   'product-story': '本命餐品',
   combo: '快乐搭配',
   daily: '今日特刊',
   'back-cover': '封底',
 };

 function sourceLabel(source: SourceMode): string {
   return source === 'mcp-live' ? '官方 MCP · 实时读取' : '演示数据 · Mock';
 }

 function formatPrice(product: ProductRef): string {
   return product.price ? `¥${product.price.amount.toFixed(1)}` : '价格未核验';
 }

 function initials(product: ProductRef): string {
   return product.officialName.replace(/[“”《》（）()\s]/g, '').slice(0, 2) || '麦门';
 }

 function makeTitleCandidates(description: string, style: StyleId, product?: ProductRef): string[] {
   const trimmed = description.trim();
   const hook = trimmed ? trimmed.replace(/[。！？!?,，]/g, '').slice(0, 12) : '今天也要好好吃饭';
   const productHook = product?.officialName ?? '我的本命';
   const styleLabel = styleOptions.find((item) => item.id === style)?.label ?? '快乐玩梗';
   return [
     `${hook}｜我的麦门菜单册`,
     `${styleLabel}档案：${productHook}`,
     `今天的快乐，由${productHook}负责`,
   ];
 }

 function inferStyleFromTone(value: string): StyleId | null {
   if (/(复古|怀旧|胶片|报纸|旧时|经典)/.test(value)) return 'retro';
   if (/(可爱|手账|治愈|软乎|萌|少女|碎碎念)/.test(value)) return 'notebook';
   if (/(极简|克制|冷静|酷|利落|高级|留白)/.test(value)) return 'minimal';
   if (/(开心|快乐|搞笑|玩梗|热闹|庆典|兴奋)/.test(value)) return 'joyful';
   return null;
 }

 export default function App() {
   const [book, setBook] = useState<MenuBook | null>(() => loadMenuBook());
   const [stage, setStage] = useState<Stage>(() => (loadMenuBook() ? 'reader' : 'onboarding'));
   const [sourceMode, setSourceMode] = useState<SourceMode>('mcp-live');
   const [selectedIds, setSelectedIds] = useState<string[]>([]);
   const [style, setStyle] = useState<StyleId>('joyful');
   const [description, setDescription] = useState('我是薯条脑袋，喜欢把每一次点餐都变成小型庆典。');
   const [authorNickname, setAuthorNickname] = useState('薯条脑袋');
   const [selectedTitle, setSelectedTitle] = useState('');
   const [liveProducts, setLiveProducts] = useState<ProductRef[]>([]);
   const [frequentProductIds, setFrequentProductIds] = useState<string[]>([]);
   const [frequentStatus, setFrequentStatus] = useState<'not-loaded' | 'loading' | 'ready' | 'error'>('not-loaded');
   const [frequentMessage, setFrequentMessage] = useState('尚未读取历史订单');
   const [mbti, setMbti] = useState<MbtiType | ''>('');
   const [zodiac, setZodiac] = useState<ZodiacSign | ''>('');
   const [mcpStatus, setMcpStatus] = useState<McpStatus>({ status: 'loading' });
   const [mcpRefreshKey, setMcpRefreshKey] = useState(0);
   const [activePage, setActivePage] = useState(0);
   const [history, setHistory] = useState<MenuBook[]>([]);
   const [editorOpen, setEditorOpen] = useState(false);
   const [editorTarget, setEditorTarget] = useState<EditorTarget>({ kind: 'book' });
   const [toast, setToast] = useState('');
   const [isExporting, setIsExporting] = useState(false);

   const catalog = useMemo(
     () => sourceMode === 'mock' ? getCatalog('mock') : liveProducts,
     [liveProducts, sourceMode],
   );
   const selectedProducts = useMemo(
     () => selectedIds.map((id) => catalog.find((product) => product.productId === id)).filter((product): product is ProductRef => Boolean(product)),
     [catalog, selectedIds],
   );
   const titleCandidates = useMemo(
     () => makeTitleCandidates(description, style, selectedProducts[0]),
     [description, selectedProducts, style],
   );
   const mbtiPlan = useMemo(() => mbti ? buildMbtiPlan(catalog, mbti) : null, [catalog, mbti]);
   const zodiacPlan = useMemo(() => zodiac ? buildZodiacPlan(catalog, zodiac) : null, [catalog, zodiac]);

   useEffect(() => {
     if (sourceMode === 'mock') {
       setMcpStatus({ status: 'ready', count: getCatalog('mock').length });
       return undefined;
     }
     const controller = new AbortController();
     setMcpStatus({ status: 'loading' });
     fetchLiveCatalog(controller.signal)
       .then((result) => {
         if (controller.signal.aborted) return;
         setLiveProducts(result.products);
         setMcpStatus({ status: 'ready', count: result.products.length, checkedAt: result.checkedAt });
       })
       .catch((error: unknown) => {
         if (controller.signal.aborted) return;
         setLiveProducts([]);
         setMcpStatus({ status: 'error', message: error instanceof Error ? error.message : '官方 MCP 商品查询失败，请重试。' });
       });
     return () => controller.abort();
   }, [mcpRefreshKey, sourceMode]);

   useEffect(() => {
     if (book) saveMenuBook(book);
   }, [book]);

   useEffect(() => {
     if (!toast) return undefined;
     const timer = window.setTimeout(() => setToast(''), 2600);
     return () => window.clearTimeout(timer);
   }, [toast]);

   useEffect(() => {
     const nextIds = catalog.slice(0, 3).map((product) => product.productId);
     setSelectedIds(nextIds);
     setSelectedTitle(makeTitleCandidates(description, style, catalog[0])[2] ?? '我的麦门菜单册');
   }, [catalog]);

   useEffect(() => {
     if (stage !== 'reader') return undefined;
     const onKeyDown = (event: KeyboardEvent) => {
       if (event.key === 'ArrowRight') setActivePage((page) => Math.min(page + 1, 5));
       if (event.key === 'ArrowLeft') setActivePage((page) => Math.max(page - 1, 0));
       if (event.key === 'Escape') setStage('workshop');
     };
     window.addEventListener('keydown', onKeyDown);
     return () => window.removeEventListener('keydown', onKeyDown);
   }, [stage]);

   async function loadFrequentProducts(): Promise<void> {
     setFrequentStatus('loading');
     setFrequentMessage('正在读取历史订单中的餐品编码…');
     try {
       const result = await fetchFrequentProductIds();
       const matched = result.productIds.filter((id) => catalog.some((product) => product.productId === id));
       setFrequentProductIds(matched);
       setFrequentStatus('ready');
       setFrequentMessage(matched.length > 0 ? `已匹配 ${matched.length} 个常点餐品` : '历史订单未匹配到当前门店在售餐品');
     } catch (error) {
       setFrequentProductIds([]);
       setFrequentStatus('error');
       setFrequentMessage(error instanceof Error ? error.message : '历史订单读取失败');
     }
   }

   function toggleProduct(productId: string): void {
     setSelectedIds((current) => {
       if (current.includes(productId)) return current.filter((id) => id !== productId);
       if (current.length >= 8) return current;
       return [...current, productId];
     });
   }

   function commitEdits(edits: MenuBookEdit[], message = '已保存到这本菜单册'): void {
     if (!book || edits.length === 0) return;
     try {
       const next = applyMenuBookEdits(book, edits);
       setHistory((current) => [...current, book].slice(-20));
       setBook(next);
       setToast(message);
     } catch (error) {
       setToast(error instanceof Error ? error.message : '这次修改没有保存');
     }
   }

   function openEditor(target: EditorTarget): void {
     setEditorTarget(target);
     setEditorOpen(true);
   }

   function undoLastEdit(): void {
     const previous = history.at(-1);
     if (!previous) return;
     setBook(previous);
     setHistory((current) => current.slice(0, -1));
     setToast('已撤销最近一次修改');
   }

   function exportHtml(): void {
     if (!book) return;
     downloadBookHtml(book);
     setToast('整本 HTML 已准备下载');
   }

   async function exportPng(): Promise<void> {
     if (!book) return;
     setIsExporting(true);
     try {
       await downloadPagePng(book, activePage);
       setToast('当前页 PNG 已准备下载');
     } catch (error) {
       setToast(error instanceof Error ? error.message : 'PNG 导出失败');
     } finally {
       setIsExporting(false);
     }
   }

   function openWorkshopFromBook(): void {
     if (book) {
       const savedStyle = styleOptions.some((option) => option.id === book.themeId) ? book.themeId as StyleId : 'joyful';
       setStyle(savedStyle);
       setDescription(book.description);
       setAuthorNickname(book.authorNickname);
       setSelectedTitle(book.title);
     }
     setEditorOpen(false);
     setStage('workshop');
   }

   function generateBook(): void {
     if (selectedProducts.length < 3 || selectedProducts.length > 8) return;
     const profile: BookProfile = {
       frequentProductIds: frequentProductIds.filter((id) => selectedProducts.some((product) => product.productId === id)),
       frequentSource: sourceMode === 'mock' ? 'mock' : frequentStatus === 'ready' ? 'mcd-mcp-order-list' : 'not-loaded',
     };
     if (mbti) {
       profile.mbti = mbti;
       if (mbtiPlan) {
         profile.comboProductIds = mbtiPlan.productIds;
         profile.comboTitle = mbtiPlan.title;
         profile.comboDescription = mbtiPlan.description;
       }
     }
     if (zodiac) {
       profile.zodiac = zodiac;
       if (zodiacPlan) {
         profile.dailyProductIds = zodiacPlan.productIds;
         profile.horoscopeTitle = zodiacPlan.title;
         profile.horoscopeText = zodiacPlan.text;
       }
     }
     const nextBook = createMenuBook({
       products: selectedProducts,
       title: selectedTitle,
       authorNickname: authorNickname.trim() || '麦门创作者',
       themeId: style,
       description: description.trim() || '一本由真实餐品和个人故事共同完成的菜单册。',
       profile,
     });
     setHistory([]);
     setBook(nextBook);
     setActivePage(0);
     setToast('六页菜单册已生成');
     setStage('reader');
   }

   const themeClass = `theme-${book?.themeId ?? style}`;
   return (
     <main className={`app-shell ${themeClass}`} data-source={sourceMode}>
       <header className="global-bar">
         <button className="brand-lockup" onClick={() => setStage('onboarding')} aria-label="回到首页">
           <span className="brand-mark">MM</span>
           <span>MY McMENU</span>
         </button>
         <div className="global-bar__right">
           <span className="fan-badge">FAN-MADE / 1024</span>
           {stage !== 'onboarding' && <span className="progress-label">{stage === 'workshop' ? '01 / 02 创作工坊' : '02 / 02 翻阅菜单册'}</span>}
         </div>
       </header>

       {stage === 'onboarding' && <Onboarding onStart={() => setStage('workshop')} />}
       {stage === 'workshop' && (
         <Workshop
           sourceMode={sourceMode}
           catalog={catalog}
           selectedIds={selectedIds}
           style={style}
           description={description}
           authorNickname={authorNickname}
           selectedTitle={selectedTitle}
           titleCandidates={titleCandidates}
           onSourceChange={setSourceMode}
           onToggleProduct={toggleProduct}
           onStyleChange={setStyle}
           onDescriptionChange={(value) => { setDescription(value); const inferredStyle = inferStyleFromTone(value); if (inferredStyle) setStyle(inferredStyle); }}
           onAuthorChange={setAuthorNickname}
           onTitleChange={setSelectedTitle}
           onGenerate={generateBook}
           mcpStatus={mcpStatus}
           onRetryMcp={() => setMcpRefreshKey((value) => value + 1)}
           frequentStatus={frequentStatus}
           frequentMessage={frequentMessage}
           frequentProductIds={frequentProductIds}
           onLoadFrequent={loadFrequentProducts}
           mbti={mbti}
           zodiac={zodiac}
           onMbtiChange={setMbti}
           onZodiacChange={setZodiac}
           mbtiPlan={mbtiPlan}
           zodiacPlan={zodiacPlan}
         />
       )}
       {stage === 'reader' && book && (
         <>
           <Reader
             book={book}
             activePage={activePage}
             sourceMode={sourceMode}
             onPageChange={setActivePage}
             onBack={openWorkshopFromBook}
             onEdit={() => openEditor(activePage === 0 ? { kind: 'book' } : activePage === 1 ? { kind: 'page', pageId: 'contents' } : { kind: 'product', productId: book.pages[activePage]?.productIds[0] ?? book.products[0]?.product.productId ?? '' })}
             onEditBook={() => openEditor({ kind: 'book' })}
             onEditPage={() => openEditor({ kind: 'page', pageId: book.pages[activePage]?.id ?? 'cover' })}
             onExportHtml={exportHtml}
             onExportPng={exportPng}
             onUndo={undoLastEdit}
             canUndo={history.length > 0}
             isExporting={isExporting}
           />
           {editorOpen && <EditorDrawer book={book} target={editorTarget} onClose={() => setEditorOpen(false)} onCommit={commitEdits} />}
         </>
       )}
       {toast && <div className="toast" role="status">{toast}</div>}
     </main>
   );
 }

 function mcpSnapshotProductsIds(): string[] {
   return ['9900016076', '9900016075', '6352'];
 }

 function Onboarding({ onStart }: { onStart: () => void }) {
   return (
     <section className="onboarding page-section">
       <div className="onboarding__copy">
         <p className="eyebrow"><span className="eyebrow-dot" /> 一册只属于你的麦门记忆</p>
         <h1>把喜欢的<br /><em>那一口</em>，<br />编成一本书。</h1>
         <p className="lede">真实菜单做底稿，个人故事做封面。给喜欢的餐品起一个只有你会叫的名字，再把它翻成六页菜单册。</p>
         <button className="primary-button" onClick={onStart}>创造我的麦门菜单册 <span>↗</span></button>
         <p className="fine-print">粉丝创作 · 非官方商品命名 · 约 3 分钟完成初稿</p>
       </div>
       <div className="onboarding__stage" aria-label="菜单册预览">
         <div className="floating-note note-top">真实商品<br /><strong>个人表达</strong></div>
         <div className="preview-book">
           <div className="preview-book__tab">NO. 001</div>
           <div className="preview-book__stamp">MM</div>
           <p className="preview-book__kicker">我的麦门菜单册</p>
           <h2>今天的快乐，<br /><span>由我负责。</span></h2>
           <div className="preview-book__scribble">吃饭是小事<br />但快乐不是。</div>
           <div className="preview-book__footer"><span>FAN-MADE</span><span>2026</span></div>
         </div>
         <div className="preview-card">
           <span>01 / 06</span>
           <strong>本命餐品</strong>
           <i>+ 翻开看看</i>
         </div>
         <div className="floating-note note-bottom">可翻阅<br /><strong>可保存</strong></div>
       </div>
     </section>
   );
 }

 interface WorkshopProps {
   sourceMode: SourceMode;
   catalog: ProductRef[];
   selectedIds: string[];
   style: StyleId;
   description: string;
   authorNickname: string;
   selectedTitle: string;
   titleCandidates: string[];
   onSourceChange: (source: SourceMode) => void;
   onToggleProduct: (productId: string) => void;
   onStyleChange: (style: StyleId) => void;
   onDescriptionChange: (description: string) => void;
   onAuthorChange: (nickname: string) => void;
   onTitleChange: (title: string) => void;
   onGenerate: () => void;
   mcpStatus: McpStatus;
   onRetryMcp: () => void;
   frequentStatus: 'not-loaded' | 'loading' | 'ready' | 'error';
   frequentMessage: string;
   frequentProductIds: string[];
   onLoadFrequent: () => Promise<void>;
   mbti: MbtiType | '';
   zodiac: ZodiacSign | '';
   onMbtiChange: (value: MbtiType | '') => void;
   onZodiacChange: (value: ZodiacSign | '') => void;
   mbtiPlan: MbtiPlan | null;
   zodiacPlan: ZodiacPlan | null;
 }

 function Workshop(props: WorkshopProps) {
   const canGenerate = props.selectedIds.length >= 3 && props.selectedIds.length <= 8 && (props.sourceMode === 'mock' || props.mcpStatus.status === 'ready');
   return (
     <section className="workshop page-section">
       <div className="workshop__intro">
         <p className="eyebrow"><span className="eyebrow-dot" /> 创作工坊</p>
         <h1>先选你的<br /><em>快乐证据。</em></h1>
         <p className="lede">从真实菜单里挑 3–8 个喜欢的商品，再告诉我你今天想用什么语气吃饭。</p>
         <div className="source-switch" aria-label="数据来源">
           <span>数据来源</span>
           <button className={props.sourceMode === 'mcp-live' ? 'is-active' : ''} onClick={() => props.onSourceChange('mcp-live')}>官方 MCP 实时</button>
           <button className={props.sourceMode === 'mock' ? 'is-active' : ''} onClick={() => props.onSourceChange('mock')}>演示数据</button>
         </div>
         <p className="source-caption">{sourceLabel(props.sourceMode)} · {props.sourceMode === 'mcp-live' ? '门店 1450398 / 到店自取' : '无 Token 也可预览'}</p>
         {props.sourceMode === 'mcp-live' && props.mcpStatus.status === 'loading' && <p className="mcp-status mcp-status--loading" role="status">正在调用官方 MCP，读取门店实时餐品…</p>}
         {props.sourceMode === 'mcp-live' && props.mcpStatus.status === 'ready' && <p className="mcp-status mcp-status--ready" role="status">已读取 {props.mcpStatus.count ?? 0} 个真实餐品 · 仅保留官方字段</p>}
         {props.sourceMode === 'mcp-live' && props.mcpStatus.status === 'error' && <div className="mcp-status mcp-status--error" role="alert"><strong>官方 MCP 暂时不可用</strong><span>{props.mcpStatus.message}</span><button onClick={props.onRetryMcp}>重试实时查询</button></div>}
       </div>

       <div className="workshop__form">
         <section className="form-block">
           <div className="form-heading"><span>01</span><div><h2>挑 3–8 个本命</h2><p>你选中的会成为这本书的真实商品底稿。</p></div><strong>{props.selectedIds.length} / 8</strong></div>
           <div className="product-picker">
             {props.sourceMode === 'mcp-live' && props.mcpStatus.status === 'loading' && <div className="product-loading" role="status"><span className="product-loading__pulse" />正在从官方 MCP 获取餐品列表</div>}
             {props.sourceMode === 'mcp-live' && props.mcpStatus.status === 'error' && <div className="product-empty">实时商品未加载。请先重试 MCP 查询，或切换到演示数据预览。</div>}
             {props.catalog.map((product, index) => {
               const selected = props.selectedIds.includes(product.productId);
               return (
                 <button key={product.productId} className={`picker-card ${selected ? 'is-selected' : ''}`} onClick={() => props.onToggleProduct(product.productId)} aria-pressed={selected}>
                   <span className="picker-card__number">{String(index + 1).padStart(2, '0')}</span>
                   <span className="picker-card__avatar">{initials(product)}</span>
                   <span className="picker-card__name">{product.officialName}</span>
                   <span className="picker-card__meta">{product.category ?? '演示菜单'} · {formatPrice(product)}</span>
                   {selected && <span className="picker-card__check">✓</span>}
                 </button>
               );
             })}
           </div>
         </section>

         <section className="form-block split-block">
           <div>
             <div className="form-heading"><span>02</span><div><h2>选择书籍风格 / 主题</h2><p>你的语气会自动推荐主题，也可以手动切换；风格不会改变商品事实。</p></div></div>
             <div className="style-picker">
               {styleOptions.map((option) => (
                 <button key={option.id} className={`style-card style-card--${option.id} ${props.style === option.id ? 'is-selected' : ''}`} onClick={() => props.onStyleChange(option.id)} aria-pressed={props.style === option.id}>
                   <span className={`style-card__art style-card__art--${option.id}`} aria-hidden="true"><i /><i /><i /></span><strong>{option.label}</strong><small>{option.note}</small>
                 </button>
               ))}
             </div>
           </div>
           <div className="prompt-panel">
             <div className="form-heading"><span>03</span><div><h2>留一句你的话</h2><p>不用写得漂亮，像你就好。</p></div></div>
             <textarea value={props.description} onChange={(event) => props.onDescriptionChange(event.target.value)} maxLength={80} aria-label="个人描述" />
             <div className="prompt-panel__footer"><label>封面署名 <input value={props.authorNickname} onChange={(event) => props.onAuthorChange(event.target.value)} maxLength={20} /></label><span>{props.description.length} / 80</span></div>
           </div>
         </section>

         <section className="form-block personalization-grid">
           <div className="personalization-panel">
             <div className="form-heading"><span>04</span><div><h2>本命餐品 / 我的常点</h2><p>可主动授权读取历史订单；只提取可匹配的餐品编码。</p></div></div>
             <button className="secondary-button" onClick={props.onLoadFrequent} disabled={props.frequentStatus === 'loading'}>{props.frequentStatus === 'loading' ? '读取中…' : props.frequentStatus === 'ready' ? '重新读取常点' : '读取我的常点餐品'}</button>
             <p className={`personalization-status personalization-status--${props.frequentStatus}`}>{props.frequentMessage}</p>
             {props.frequentStatus === 'ready' && <p className="personalization-hint">生成后“本命餐品”优先使用已匹配的常点商品。</p>}
           </div>
           <div className="personalization-panel">
             <div className="form-heading"><span>05</span><div><h2>MBTI 快乐搭配</h2><p>用性格偏好挑选一组让自己快乐的真实餐品。</p></div></div>
             <select className="preference-select" value={props.mbti} onChange={(event) => props.onMbtiChange(event.target.value as MbtiType | '')} aria-label="选择 MBTI">
               <option value="">选择你的 MBTI（可选）</option>
               {mbtiOptions.map((option) => <option key={option.id} value={option.id}>{option.label} · {option.mood}</option>)}
             </select>
             {props.mbtiPlan && <div className="preference-preview"><strong>{props.mbtiPlan.title}</strong><span>{props.mbtiPlan.description}</span></div>}
           </div>
           <div className="personalization-panel">
             <div className="form-heading"><span>06</span><div><h2>星座今日特刊</h2><p>娱乐性运势文案，用于生成今天的特刊主题。</p></div></div>
             <select className="preference-select" value={props.zodiac} onChange={(event) => props.onZodiacChange(event.target.value as ZodiacSign | '')} aria-label="选择星座">
               <option value="">选择你的星座（可选）</option>
               {zodiacOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
             </select>
             {props.zodiacPlan && <div className="preference-preview preference-preview--zodiac"><strong>{props.zodiacPlan.title}</strong><span>{props.zodiacPlan.text}</span></div>}
           </div>
         </section>

         <section className="form-block title-block">
           <div className="form-heading"><span>07</span><div><h2>选一个书名</h2><p>这是创作候选，不会改动官方餐品名称。</p></div></div>
           <div className="title-picker">
             {props.titleCandidates.map((title) => <button key={title} className={props.selectedTitle === title ? 'is-selected' : ''} onClick={() => props.onTitleChange(title)}>{title}<span>{props.selectedTitle === title ? '已选' : '选择'}</span></button>)}
           </div>
         </section>

         <div className="workshop__actions"><span>{canGenerate ? '准备好了，下一步会生成六页初稿。' : '至少选择 3 个商品才能继续。'}</span><button className="primary-button" disabled={!canGenerate} onClick={props.onGenerate}>生成我的菜单册 <span>↗</span></button></div>
       </div>
     </section>
   );
 }

 interface ReaderProps {
   book: MenuBook;
   activePage: number;
   sourceMode: SourceMode;
   onPageChange: (page: number) => void;
   onBack: () => void;
   onEdit: () => void;
   onEditBook: () => void;
   onEditPage: () => void;
   onExportHtml: () => void;
   onExportPng: () => Promise<void>;
   onUndo: () => void;
   canUndo: boolean;
   isExporting: boolean;
 }

 function Reader({ book, activePage, sourceMode, onPageChange, onBack, onEdit, onEditBook, onEditPage, onExportHtml, onExportPng, onUndo, canUndo, isExporting }: ReaderProps) {
   const page = (book.pages[activePage] ?? book.pages[0])!;
   const productMap = new Map(book.products.map((item) => [item.product.productId, item]));
   const pageProducts = page.productIds.map((id) => productMap.get(id)).filter((product): product is CustomProduct => Boolean(product));
   const touchStartX = useRef<number | null>(null);
   const previous = () => onPageChange(Math.max(activePage - 1, 0));
   const next = () => onPageChange(Math.min(activePage + 1, book.pages.length - 1));
   const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
     touchStartX.current = event.changedTouches[0]?.clientX ?? null;
   };
   const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
     const start = touchStartX.current;
     const end = event.changedTouches[0]?.clientX;
     touchStartX.current = null;
     if (start === null || end === undefined) return;
     const delta = end - start;
     if (Math.abs(delta) < 44) return;
     if (delta < 0) next();
     if (delta > 0) previous();
   };

   return (
     <section className="reader page-section">
       <aside className="reader-index">
         <div className="reader-index__label">MENU / INDEX</div>
         <ol>
           {book.pages.map((item, index) => <li key={item.id}><button className={activePage === index ? 'is-active' : ''} onClick={() => onPageChange(index)}><span>{String(index + 1).padStart(2, '0')}</span>{pageLabels[item.type]}</button></li>)}
         </ol>
         <div className="reader-index__foot"><span>BOOK ID</span><strong>{book.bookId.slice(0, 8).toUpperCase()}</strong></div>
       </aside>

       <article className={`paper paper--${page.type}`} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
         <div className="paper__topline"><span>MY McMENU / {String(activePage + 1).padStart(2, '0')}</span><span>{sourceLabel(sourceMode)}</span><button className="paper-theme-link" onClick={onBack}>调整风格 / 继续创作 ↗</button></div>
         <div className={`paper-theme-art paper-theme-art--${book.themeId}`} aria-hidden="true"><span>{styleOptions.find((option) => option.id === book.themeId)?.label ?? '我的主题'}</span></div>
         <PageContent page={page} book={book} products={pageProducts} onPageChange={onPageChange} />
         <div className="paper__pager"><button onClick={previous} disabled={activePage === 0} aria-label="上一页">←</button><span>{String(activePage + 1).padStart(2, '0')} / 06</span><button onClick={next} disabled={activePage === 5} aria-label="下一页">→</button></div>
       </article>

       <aside className="reader-note">
         <button className="text-button" onClick={onBack}>← 返回风格与创作工坊</button>
         <div className="reader-note__sticker">FAN<br />MADE</div>
         <p>这本菜单册把官方商品事实和你的私人叫法分开保存。</p>
         <div className="reader-note__actions">
           <button className="reader-action" onClick={onEdit}>编辑本页</button>
           <button className="reader-action" onClick={onEditBook}>编辑书本</button>
           <button className="reader-action" onClick={onEditPage}>编辑章节</button>
           <button className="reader-action" onClick={onExportPng} disabled={isExporting}>{isExporting ? '生成 PNG…' : '导出当前页 PNG'}</button>
           <button className="reader-action" onClick={onExportHtml}>导出整本 HTML</button>
           <button className="reader-action reader-action--quiet" onClick={onUndo} disabled={!canUndo}>撤销最近修改</button>
         </div>
         <div className="reader-note__rule" /><span>主题</span><strong>{styleOptions.find((option) => option.id === book.themeId)?.label ?? book.themeId}</strong><span>修订</span><strong>REV.{String(book.revision).padStart(2, '0')}</strong><small>用键盘 ← → 翻页<br />手机上左右滑动翻页</small>
       </aside>
     </section>
   );
 }

 function PageContent({ page, book, products, onPageChange }: { page: BookPage; book: MenuBook; products: CustomProduct[]; onPageChange: (page: number) => void }) {
   const profile = book.profile;
   if (page.type === 'cover') return <div className="cover-content"><span className="cover-content__kicker">{page.content.eyebrow}</span><h1>{book.title}</h1><p>{book.description}</p><div className="cover-content__seal">MM<br /><small>MY MENU</small></div><div className="cover-content__author">BY <strong>{book.authorNickname}</strong><span>{profile?.mbti ? `${profile.mbti} / ` : ''}{profile?.zodiac ?? '2026'} / FAN EDITION</span></div></div>;
   if (page.type === 'contents') return <div className="contents-content"><span className="chapter-kicker">CHAPTER MAP / {styleOptions.find((option) => option.id === book.themeId)?.label ?? 'MY STYLE'}</span><h1>翻开之前，<br /><em>先看目录。</em></h1><div className="contents-list">{book.pages.slice(2, 5).map((item, index) => <button key={item.id} onClick={() => onPageChange(index + 2)}><span>0{index + 3}</span><strong>{pageLabels[item.type]}</strong><i>{item.content.chapterLabel ?? item.content.source ?? '一页私人记录'}</i></button>)}</div><p className="margin-note">{page.content.note}</p></div>;
   if (page.type === 'back-cover') return <div className="back-cover-content"><div className="back-cover-content__giant">再<br />来<br />一<br />页</div><p>{page.content.note}</p><div className="back-cover-content__footer"><span>{profile?.mbti ? `MBTI ${profile.mbti}` : 'MY McMENU'}</span><span>{profile?.zodiac ? `${profile.zodiac} / ` : ''}FAN-MADE / NOT OFFICIAL</span></div></div>;
   const specialNote = page.type === 'product-story'
     ? <div className="page-callout page-callout--favorite"><strong>{page.content.source ?? '本命餐品'}</strong><span>{profile?.frequentSource === 'mcd-mcp-order-list' ? '按历史订单匹配' : '未授权历史订单时使用候选商品'}</span></div>
     : page.type === 'combo'
       ? <div className="page-callout page-callout--combo"><strong>{page.content.mbti ?? 'MBTI 未选择'}</strong><span>{page.content.reason ?? '选择性格后生成快乐搭配理由。'}</span></div>
       : <div className="page-callout page-callout--daily"><strong>{page.content.zodiac ?? '星座未选择'}</strong><span>{page.content.horoscopeTitle ?? '今日特刊'}</span><p>{page.content.horoscopeText ?? '选择星座后，这里会显示娱乐性今日运势。'}</p></div>;
   return <div className="spread-content"><div className="spread-content__header"><span className="chapter-kicker">{page.content.chapterLabel ?? pageLabels[page.type]}</span><h1>{page.title}</h1><p>{page.content.note ?? page.content.source}</p></div>{specialNote}<div className={`spread-products spread-products--${Math.min(products.length, 3)}`}>{products.map((customProduct, index) => { const product = customProduct.product; return <article className={`story-card ${customProduct.hidden ? 'is-hidden-product' : ''}`} key={product.productId}><div className={`story-card__visual ${product.imageUrl ? 'story-card__visual--image' : ''}`} style={product.imageUrl ? { backgroundImage: `linear-gradient(180deg, rgba(32,42,40,.08), rgba(32,42,40,.72)), url("${product.imageUrl}")` } : undefined}><span>{String(index + 1).padStart(2, '0')}</span><strong>{initials(product)}</strong></div><div className="story-card__body"><span>{product.category ?? '演示菜单'}</span><h2>{customProduct.customName}</h2><small className="official-name">官方：{product.officialName}</small><div><b>{formatPrice(product)}</b><small>{product.source === 'mcd-mcp' ? 'MCP 实时读取' : '演示数据'}</small></div></div></article>; })}</div>{page.type === 'product-story' && <p className="margin-note">官方名称保留在事实层；昵称和故事属于你的创作层。</p>}</div>;
 }

 function EditorDrawer({ book, target, onClose, onCommit }: { book: MenuBook; target: EditorTarget; onClose: () => void; onCommit: (edits: MenuBookEdit[], message?: string) => void }) {
   const [selectedProductId, setSelectedProductId] = useState(target.kind === 'product' ? target.productId : book.products[0]?.product.productId ?? '');
   const product = book.products.find((item) => item.product.productId === selectedProductId);
   const page = target.kind === 'page' ? book.pages.find((item) => item.id === target.pageId) : undefined;
   const [title, setTitle] = useState(book.title);
   const [description, setDescription] = useState(book.description);
   const [author, setAuthor] = useState(book.authorNickname);
   const [pageTitle, setPageTitle] = useState(page?.title ?? '');
   const [contentKey, setContentKey] = useState(Object.keys(page?.content ?? {})[0] ?? 'note');
   const [contentValue, setContentValue] = useState(page?.content[contentKey] ?? '');
   const [customName, setCustomName] = useState(product?.customName ?? '');
   const [story, setStory] = useState(product?.personalStory ?? '');
   const [productDescription, setProductDescription] = useState(product?.customDescription ?? '');
   const [tags, setTags] = useState(product?.tags.join('、') ?? '');
   const [productHidden, setProductHidden] = useState(product?.hidden ?? false);

   useEffect(() => {
     const nextProduct = book.products.find((item) => item.product.productId === selectedProductId);
     setCustomName(nextProduct?.customName ?? '');
     setStory(nextProduct?.personalStory ?? '');
     setProductDescription(nextProduct?.customDescription ?? '');
     setTags(nextProduct?.tags.join('、') ?? '');
     setProductHidden(nextProduct?.hidden ?? false);
   }, [book.revision, selectedProductId, book.products]);

   useEffect(() => {
     setPageTitle(page?.title ?? '');
     const nextKey = Object.keys(page?.content ?? {})[0] ?? 'note';
     setContentKey(nextKey);
     setContentValue(page?.content[nextKey] ?? '');
   }, [book.revision, page?.id]);

   const copyTarget: CopyCandidateTarget | null = target.kind === 'book'
     ? { kind: 'title', current: title, description, styleLabel: '快乐玩梗', ...(product ? { product: product.product } : {}) }
     : target.kind === 'product' && product
       ? { kind: 'story', current: story, product: product.product }
       : target.kind === 'page' && page
         ? { kind: 'page-note', current: contentValue, page }
         : null;
   const candidates = copyTarget ? createCopyCandidates(copyTarget) : [];

   function saveBook(): void {
     onCommit([
       { kind: 'book', field: 'title', value: title },
       { kind: 'book', field: 'description', value: description },
       { kind: 'book', field: 'authorNickname', value: author },
     ], '书本信息已保存');
   }

   function savePage(): void {
     if (!page) return;
     onCommit([
       { kind: 'page', pageId: page.id, field: 'title', value: pageTitle },
       { kind: 'page', pageId: page.id, field: 'content', contentKey, value: contentValue },
     ], '页面文案已保存');
   }

   function saveProduct(): void {
     if (!product) return;
     onCommit([
       { kind: 'product', productId: product.product.productId, field: 'customName', value: customName },
       { kind: 'product', productId: product.product.productId, field: 'personalStory', value: story },
       { kind: 'product', productId: product.product.productId, field: 'customDescription', value: productDescription },
       { kind: 'product', productId: product.product.productId, field: 'tags', value: tags.split(/[、,，]/) },
       { kind: 'product', productId: product.product.productId, field: 'hidden', value: productHidden },
     ], '餐品创作内容已保存');
   }

   return <aside className="editor-drawer" aria-label="菜单册编辑器"><div className="editor-drawer__header"><div><span className="chapter-kicker">EDIT / PRIVATE LAYER</span><h2>{target.kind === 'book' ? '编辑这本书' : target.kind === 'page' ? '编辑这一页' : '编辑这件餐品'}</h2></div><button className="drawer-close" onClick={onClose} aria-label="关闭编辑器">×</button></div>
     {target.kind === 'book' && <div className="drawer-fields"><label>书名<input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>个人宣言<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label><label>封面署名<input value={author} onChange={(event) => setAuthor(event.target.value)} /></label><CandidateList candidates={candidates} onChoose={(value) => setTitle(value)} label="书名灵感（本地候选）" /><button className="primary-button drawer-save" onClick={saveBook}>保存书本修改</button></div>}
     {target.kind === 'page' && page && <div className="drawer-fields"><label>章节标题<input value={pageTitle} onChange={(event) => setPageTitle(event.target.value)} /></label><label>编辑字段<select value={contentKey} onChange={(event) => { setContentKey(event.target.value); setContentValue(page.content[event.target.value] ?? ''); }}>{Object.keys(page.content).map((key) => <option key={key} value={key}>{key}</option>)}</select></label><label>页面文案<textarea value={contentValue} onChange={(event) => setContentValue(event.target.value)} /></label><CandidateList candidates={candidates} onChoose={setContentValue} label="页面文案灵感（本地候选）" /><button className="primary-button drawer-save" onClick={savePage}>保存页面修改</button></div>}
     {target.kind === 'product' && <div className="drawer-fields"><label>选择餐品<select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>{book.products.map((item) => <option key={item.product.productId} value={item.product.productId}>{item.customName} · {item.product.officialName}</option>)}</select></label>{product && <><div className="official-lock"><span>官方事实（锁定）</span><strong>{product.product.officialName}</strong><small>ID {product.product.productId} · {product.product.source === 'mcd-mcp' ? 'MCP 快照' : '演示数据'}</small></div><label>我的餐品昵称<input value={customName} onChange={(event) => setCustomName(event.target.value)} /></label><label>我的故事<textarea value={story} onChange={(event) => setStory(event.target.value)} /></label><label>我的补充说明<textarea value={productDescription} onChange={(event) => setProductDescription(event.target.value)} /></label><label>标签（用顿号分隔）<input value={tags} onChange={(event) => setTags(event.target.value)} /></label><label className="switch-line"><input type="checkbox" checked={productHidden} onChange={(event) => setProductHidden(event.target.checked)} /> 在菜单册中隐藏这件餐品</label><CandidateList candidates={candidates} onChoose={setStory} label="故事灵感（本地候选）" /><button className="primary-button drawer-save" onClick={saveProduct}>保存餐品修改</button></>}</div>}
   </aside>;
 }

 function CandidateList({ candidates, onChoose, label }: { candidates: string[]; onChoose: (value: string) => void; label: string }) {
   if (candidates.length === 0) return null;
   return <div className="candidate-list"><span>{label}</span>{candidates.map((candidate, index) => <button key={`${candidate}-${index}`} onClick={() => onChoose(candidate)}>{candidate}<small>采用</small></button>)}</div>;
 }
