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
}
