import { requestUrl } from 'obsidian';
import type { PaperInfo } from './types';

/**
 * 搜索 arXiv 论文
 */
export async function searchArxiv(query: string): Promise<PaperInfo[]> {
	const encodedQuery = encodeURIComponent(query);
	const url = `https://export.arxiv.org/api/query?search_query=all:${encodedQuery}&max_results=10&sortBy=relevance`;

	const response = await requestUrl({ url, method: 'GET' });
	const parser = new DOMParser();
	const xmlDoc = parser.parseFromString(response.text, 'text/xml');
	const entries = Array.from(xmlDoc.querySelectorAll('entry'));
	const arxivNs = 'http://arxiv.org/schemas/atom';

	return entries.map((entry) => {
		const title =
			entry.querySelector('title')?.textContent?.trim().replace(/\s+/g, ' ') ?? '';
		const published = entry.querySelector('published')?.textContent?.trim() ?? '';
		const year = published.split('-')[0] ?? '';

		const authors = Array.from(entry.querySelectorAll('author > name')).map(
			(n) => n.textContent?.trim() ?? '',
		);

		const affiliations = Array.from(
			entry.getElementsByTagNameNS(arxivNs, 'affiliation'),
		)
			.map((n) => n.textContent?.trim() ?? '')
			.filter((a, i, arr) => a && arr.indexOf(a) === i); // 去重

		const journalRef =
			entry.getElementsByTagNameNS(arxivNs, 'journal_ref')[0]?.textContent?.trim() ?? '';
		const comment =
			entry.getElementsByTagNameNS(arxivNs, 'comment')[0]?.textContent?.trim() ?? '';
		// 优先使用期刊引用，其次短评论（可能包含会议信息），最后默认为 arXiv
		const venue = journalRef || (comment.length < 120 ? comment : '') || 'arXiv Preprint';

		const abstract =
			entry.querySelector('summary')?.textContent?.trim().replace(/\s+/g, ' ') ?? '';

		const idUrl = entry.querySelector('id')?.textContent?.trim() ?? '';
		const arxivId = idUrl.split('/abs/').pop() ?? '';

		return {
			title,
			authors,
			affiliations,
			venue,
			year,
			publishDate: published.split('T')[0] ?? year,
			abstract,
			arxivId,
			url: idUrl,
			source: 'arxiv' as const,
		};
	});
}

/**
 * 搜索 Semantic Scholar 论文
 */
export async function searchSemanticScholar(query: string): Promise<PaperInfo[]> {
	const encodedQuery = encodeURIComponent(query);
	const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodedQuery}&limit=10&fields=title,authors,year,venue,publicationDate,externalIds,abstract`;

	try {
		const response = await requestUrl({
			url,
			method: 'GET',
			headers: { 'User-Agent': 'obsidian-mypaper-plugin/1.0' },
		});

		const data = response.json as {
			data?: Array<{
				paperId: string;
				title: string;
				authors: Array<{ authorId: string; name: string }>;
				year: number;
				venue: string;
				publicationDate: string;
				externalIds: { DOI?: string; ArXiv?: string };
				abstract: string;
			}>;
		};

		if (!data?.data) return [];

		return data.data.map((paper) => ({
			title: paper.title ?? '',
			authors: (paper.authors ?? []).map((a) => a.name),
			affiliations: [], // Semantic Scholar 基础 API 不返回单位信息
			venue: paper.venue ?? '',
			year: String(paper.year ?? ''),
			publishDate: paper.publicationDate ?? String(paper.year ?? ''),
			abstract: paper.abstract ?? '',
			doi: paper.externalIds?.DOI,
			arxivId: paper.externalIds?.ArXiv,
			url: `https://www.semanticscholar.org/paper/${paper.paperId}`,
			source: 'semantic_scholar' as const,
		}));
	} catch {
		return [];
	}
}

/**
 * 同时搜索 arXiv 和 Semantic Scholar，合并并去重结果
 */
export async function searchPapers(query: string): Promise<PaperInfo[]> {
	const [arxivResult, ssResult] = await Promise.allSettled([
		searchArxiv(query),
		searchSemanticScholar(query),
	]);

	const results: PaperInfo[] = [];

	if (arxivResult.status === 'fulfilled') {
		results.push(...arxivResult.value);
	}

	if (ssResult.status === 'fulfilled') {
		const existingTitles = new Set(results.map((r) => r.title.toLowerCase()));
		for (const paper of ssResult.value) {
			if (!existingTitles.has(paper.title.toLowerCase())) {
				results.push(paper);
				existingTitles.add(paper.title.toLowerCase());
			}
		}
	}

	return results;
}
