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
  backgroundPattern?: 'solid' | 'dots' | 'grid' | 'lines'; // 填充纹理
  patternColor?: string;     // 纹理颜色
  textColor: string;         // 文字颜色
  borderColor: string;       // 边框颜色
  roughness: number;         // 粗糙度 0-2
  opacity: number;           // 透明度 0-100
  roundness: number;         // 圆角 0-3
}
