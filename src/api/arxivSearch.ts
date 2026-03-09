import { requestUrl } from 'obsidian';
import { PaperInfo } from '../types';

export async function searchArxiv(query: string): Promise<PaperInfo[]> {
  const url =
    `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}` +
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
