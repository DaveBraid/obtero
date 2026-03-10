export interface PaperInfo {
  title: string;
  journal: string;
  date: string;
  authors: string[];
  institutions: string[];
  arxivId?: string;
  doi?: string;
  abstract?: string;
  source?: 'arxiv' | 'ieee';
  field?: string; // 领域/研究方向
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
