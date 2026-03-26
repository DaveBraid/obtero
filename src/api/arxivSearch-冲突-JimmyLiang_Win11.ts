import { requestUrl } from 'obsidian';
import { PaperInfo } from '../types';

/**
 * 检测输入是否为 arXiv ID
 * 支持格式：1706.03762, arXiv:1706.03762, arxiv:1706.03762
 * 也支持旧格式：math.GT/0309136
 */
function isArxivId(input: string): { isId: boolean; id: string } {
  const trimmed = input.trim();
  
  // 移除 arXiv: 或 arxiv: 前缀
  const withoutPrefix = trimmed.replace(/^(arXiv|arxiv):/i, '');
  
  // 检查新格式：YYMM.NNNNN 或 YYMM.NNNNNvN（版本）
  const newFormat = /^\d{4}\.\d{4,5}(v\d+)?$/.test(withoutPrefix);
  
  // 检查旧格式：category/NNNNNNN
  const oldFormat = /^[a-z-]+(\.[A-Z]{1,2})?\/\d{7}$/.test(withoutPrefix);
  
  if (newFormat || oldFormat) {
    return { isId: true, id: withoutPrefix };
  }
  
  return { isId: false, id: '' };
}

export async function searchArxiv(query: string): Promise<PaperInfo[]> {
  // 检测是否为 arXiv ID
  const { isId, id } = isArxivId(query);
  
  let searchQuery: string;
  if (isId) {
    // 使用 id: 前缀精确搜索 arXiv ID
    searchQuery = `id:${id}`;
  } else {
    // 使用 all: 进行全文搜索
    searchQuery = `all:${query}`;
  }
  
  const url =
    `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(searchQuery)}` +
    `&start=0&max_results=10`;
  const response = await requestUrl({ url });

  const parser = new DOMParser();
  const doc = parser.parseFromString(response.text, 'application/xml');

  return Array.from(doc.querySelectorAll('entry')).map(entry => {
    const title =
      entry.querySelector('title')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const published = entry.querySelector('published')?.textContent?.trim() ?? '';
    const date = published.substring(0, 10);

    const authors = Array.from(entry.querySelectorAll('author name')).map(
      n => n.textContent?.trim() ?? ''
    );
    const institutions = Array.from(
      entry.getElementsByTagNameNS('http://arxiv.org/schemas/atom', 'affiliation')
    ).map(n => n.textContent?.trim() ?? '');

    const journalRefEl = entry.getElementsByTagNameNS(
      'http://arxiv.org/schemas/atom',
      'journal_ref'
    )[0];
    const journal = journalRefEl?.textContent?.trim() || 'arXiv';
    const arxivId = entry.querySelector('id')?.textContent?.trim() ?? '';
    const abstract =
      entry.querySelector('summary')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

    return {
      title,
      journal,
      date,
      authors,
      institutions,
      arxivId,
      abstract,
      source: 'arxiv' as const,
    };
  });
}
