import { requestUrl } from 'obsidian';
import { PaperInfo } from '../types';
import { isRateLimitError, SearchRateLimitError } from './requestGuards';

interface IEEEAuthor {
  full_name?: string;
  affiliation?: string;
}

interface IEEEArticle {
  title?: string;
  publication_title?: string;
  publication_date?: string;
  doi?: string;
  abstract?: string;
  authors?: { authors?: IEEEAuthor[] };
}

interface IEEEResponse {
  articles?: IEEEArticle[];
}

export async function searchIEEE(query: string, apiKey: string): Promise<PaperInfo[]> {
  if (!apiKey) return [];
  const url =
    `https://ieeexploreapi.ieee.org/api/v1/search/articles` +
    `?querytext=${encodeURIComponent(query)}&max_records=10&apikey=${apiKey}`;
  try {
    const response = await requestUrl({ url });
    if (response.status === 429) throw new SearchRateLimitError('IEEE');
    const data = response.json as IEEEResponse;
    if (!data.articles) return [];

    return data.articles.map(a => ({
      title: a.title ?? '',
      journal: a.publication_title ?? '',
      date: a.publication_date ?? '',
      authors:
        a.authors?.authors?.map(au => au.full_name ?? '').filter(Boolean) ?? [],
      institutions: [
        ...new Set(
          a.authors?.authors
            ?.map(au => au.affiliation ?? '')
            .filter(Boolean) ?? []
        ),
      ],
      doi: a.doi,
      abstract: a.abstract,
      source: 'ieee' as const,
    }));
  } catch (error) {
    if (isRateLimitError(error)) return [];
    return [];
  }
}
