export interface PaperInfo {
  title: string;
  journal?: string;
  date?: string;
  authors: string[];
  institutions?: string[];
  arxivId?: string;
  doi?: string;
  abstract?: string;
  source?: 'arxiv' | 'ieee' | 'semantic_scholar';
  field?: string; // 领域/研究方向
  // 兼容旧字段
  venue?: string;
  year?: string;
  publishDate?: string;
  affiliations?: string[];
  url?: string;
}

// 领域卡片样式
export interface FieldStyle {
  name: string;              // 领域名称
  backgroundColor: string;   // 背景颜色
  backgroundPattern?: 'solid' | 'dots' | 'grid' | 'lines' | 'cross-hatch'; // 填充纹理
  patternColor?: string;     // 纹理颜色
  textColor: string;
  titleTextColor?: string;
  metaTextColor?: string;         // 文字颜色
  borderColor: string;       // 边框颜色
  roughness: number;         // 粗糙度 0-2
  opacity: number;           // 透明度 0-100
  roundness: number;         // 圆角 0-3

  // 字体设置
  titleFontSize: number;     // 标题字体大小
  titleFontFamily: number;   // 标题字体家族
  metaFontSize: number;      // 元信息字体大小
  metaFontFamily: number;    // 元信息字体家族

  // 卡片尺寸
  cardWidth: number;         // 卡片宽度
  cardHeight: number;        // 卡片高度

  // 标题对齐
  titleAlignment: 'left' | 'center';  // 标题对齐方式
}

export type PaperCategory = 'to-read' | 'roughly-read' | 'carefully-read';

export const CATEGORY_LABELS: Record<PaperCategory, string> = {
  'to-read': '待阅读',
  'roughly-read': '已粗阅读',
  'carefully-read': '已精读',
};

export const CATEGORY_BG_COLORS: Record<PaperCategory, string> = {
  'to-read': '#fff9db',
  'roughly-read': '#d3f9d8',
  'carefully-read': '#d0ebff',
};

export const CATEGORY_STROKE_COLORS: Record<PaperCategory, string> = {
  'to-read': '#e67700',
  'roughly-read': '#2f9e44',
  'carefully-read': '#1971c2',
};

export const CATEGORY_ICONS: Record<PaperCategory, string> = {
  'to-read': '📌',
  'roughly-read': '📖',
  'carefully-read': '✅',
};
