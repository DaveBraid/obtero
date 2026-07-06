import type { PaperInfo } from './types';

export type ClaudianMetadataMode = 'auto' | 'manual' | 'off';

export interface PaperMetadataBuildOptions {
  claudianMode: ClaudianMetadataMode;
}

export interface ClaudianEnrichmentResult {
  institutions: string[];
  published: string;
  publicationVenue: string;
  openSourceStatus: string;
  openSourceUrl: string;
  bibtex: string;
}

export const DEFAULT_CLAUDIAN_MODEL = 'gpt-5.5';
export const DEFAULT_CLAUDIAN_PROMPT_RELATIVE_PATH = 'plugins/obtero/skills/paper-metadata-enrichment.md';
export const BIBTEX_CALLOUT_MARKER = '[!bibtex]- BibTeX';
export const RATING_PLACEHOLDER_MARKER = '<div class="obtero-rating-placeholder"></div>';
export const DEFAULT_CLAUDIAN_PROMPT = `# Obtero 论文元数据补全

你是 Obtero 插件的论文元数据补全 skill。请根据用户提供的论文标题、作者、摘要、DOI、arXiv ID、已有期刊/会议信息，尽量查证并补全论文元数据。

## 输出要求

只输出一个 JSON 对象，不要输出解释文字，不要使用 Markdown 代码块。字段必须完整：

\`\`\`json
{
  "institutions": [],
  "published": "unknown",
  "publicationVenue": "",
  "openSourceStatus": "unknown",
  "openSourceUrl": "",
  "bibtex": ""
}
\`\`\`

## 字段说明

- institutions：研究机构或作者单位，优先使用全称（缩写），例如 Carnegie Mellon University（CMU）、UC Berkeley（UCB）、Zhejiang University（ZJU）。机构本身常用全称已经清晰时可不加缩写，例如 NVIDIA Research、KAIST。
- published：只能使用 "published"、"preprint"、"unpublished"、"unknown"。
- publicationVenue：发表期刊或会议，例如 CVPR 2026、IEEE RA-L、arXiv。
- openSourceStatus：包含开源状态、计划时间和开源程度，不能包含 URL。例如 "open · full"、"partial · weights only"、"planned · 2026 Q4"、"not_open"、"unknown"。
- openSourceUrl：开源地址，没有可靠证据则为空字符串。
- bibtex：BibTeX 条目。证据不足时可以使用 DOI/arXiv 信息生成合理 BibTeX；仍不足则为空字符串。

## 约束

- 不要编造机构、开源地址、开源计划或发表 venue。
- 如果来源互相冲突，优先官方论文页、arXiv、出版社页面、项目主页和作者 GitHub。
- 不确定时使用 unknown 或空字符串。
- 保持 JSON 可被 JSON.parse 直接解析。`;

const DEFAULT_PUBLISHED_STATUS = 'unknown';
const DEFAULT_OPEN_SOURCE_STATUS = 'unknown';

export function normalizeRating(value: unknown): number {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : 0;
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(5, Math.round(numeric)));
}

export function formatRatingStars(value: unknown): string {
  const rating = normalizeRating(value);
  return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)`;
}

export function formatCompactRatingStars(value: unknown): string {
  const rating = normalizeRating(value);
  return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`;
}

export function normalizeClaudianModel(value: string | undefined): string {
  const normalized = (value || DEFAULT_CLAUDIAN_MODEL).trim().toLowerCase();
  return normalized || DEFAULT_CLAUDIAN_MODEL;
}

export function normalizeClaudianMetadataMode(value: unknown): ClaudianMetadataMode {
  return value === 'manual' || value === 'off' ? value : 'auto';
}

export function shouldIncludeClaudianMetadata(mode: ClaudianMetadataMode): boolean {
  return mode !== 'off';
}

export function shouldAutoEnrichWithClaudian(mode: ClaudianMetadataMode): boolean {
  return mode === 'auto';
}

export function shouldIncludeAbstract(value: unknown): boolean {
  return value !== false;
}

export function shouldTranslateAbstract(includeAbstract: unknown, translateAbstract: unknown): boolean {
  return shouldIncludeAbstract(includeAbstract) && translateAbstract === true;
}

export function buildPaperFrontmatterLines(
  paper: PaperInfo,
  options: PaperMetadataBuildOptions
): string[] {
  const paperFields = getPaperFields(paper);
  const lines: string[] = ['---'];

  lines.push(`title: "${escapeYaml(paper.title)}"`);
  lines.push(`journal: "${escapeYaml(paper.journal || '')}"`);
  lines.push(`date: "${paper.date || ''}"`);
  lines.push(
    `authors: [${paper.authors.map(author => `"${escapeYaml(author)}"`).join(', ')}]`
  );
  lines.push(`rating: ${normalizeRating(paper.rating)}`);
  lines.push(`pdfUrl: "${escapeYaml(paper.pdfUrl || '')}"`);

  if (shouldIncludeClaudianMetadata(options.claudianMode)) {
    lines.push(formatYamlArray('institutions', paper.institutions || []));
    lines.push(`published: "${escapeYaml(paper.published || DEFAULT_PUBLISHED_STATUS)}"`);
    lines.push(`publicationVenue: "${escapeYaml(paper.publicationVenue || paper.journal || '')}"`);
    lines.push(`openSourceStatus: "${escapeYaml(paper.openSourceStatus || DEFAULT_OPEN_SOURCE_STATUS)}"`);
    lines.push(`openSourceUrl: "${escapeYaml(paper.openSourceUrl || '')}"`);
  }

  if (paperFields.length > 0) {
    lines.push(formatYamlArray('fields', paperFields));
  }
  if (paper.arxivId) lines.push(`arxivId: "${escapeYaml(paper.arxivId)}"`);
  if (paper.doi) lines.push(`doi: "${escapeYaml(paper.doi)}"`);
  lines.push('---', '');
  return lines;
}

export function getPaperFields(paper: PaperInfo): string[] {
  return Array.from(
    new Set([...(paper.fields || []), paper.field || ''].filter(Boolean))
  );
}

export function buildBibtexCallout(bibtex: string): string {
  const lines = [
    `> ${BIBTEX_CALLOUT_MARKER}`,
    '> ```bibtex',
  ];
  const body = bibtex.trim();
  if (body) {
    body.split(/\r?\n/).forEach(line => lines.push(`> ${line}`));
  } else {
    lines.push('> ');
  }
  lines.push('> ```');
  return lines.join('\n');
}

export function upsertBibtexCallout(content: string, bibtex: string): string {
  const nextCallout = buildBibtexCallout(bibtex);
  const contentWithoutCallout = removeBibtexCallout(content);
  return insertBlockBeforeHeadings(contentWithoutCallout, nextCallout, ['## 摘要', '## 笔记']);
}

export function upsertRatingPlaceholder(content: string): string {
  const contentWithoutPlaceholder = content
    .replace(new RegExp(`\\n*${escapeRegExp(RATING_PLACEHOLDER_MARKER)}\\n*`, 'g'), '\n')
    .trimEnd();
  return insertBlockBeforeHeadings(contentWithoutPlaceholder, RATING_PLACEHOLDER_MARKER, [
    `> ${BIBTEX_CALLOUT_MARKER}`,
    '## 摘要',
    '## 笔记',
  ]);
}

function removeBibtexCallout(content: string): string {
  const existingStart = content.indexOf(`> ${BIBTEX_CALLOUT_MARKER}`);
  if (existingStart < 0) {
    return content;
  }

  const before = content.slice(0, existingStart).trimEnd();
  const rest = content.slice(existingStart);
  const restLines = rest.split('\n');
  let calloutLineCount = 0;
  while (calloutLineCount < restLines.length && restLines[calloutLineCount]?.startsWith('>')) {
    calloutLineCount += 1;
  }
  const remainder = restLines.slice(calloutLineCount).join('\n').trimStart();
  return `${before}${remainder ? `\n\n${remainder}` : ''}`;
}

function insertBlockBeforeHeadings(content: string, block: string, headings: string[]): string {
  const targetIndex = headings
    .map(heading => findHeadingIndex(content, heading))
    .filter(index => index >= 0)
    .sort((a, b) => a - b)[0];

  if (targetIndex !== undefined) {
    return `${content.slice(0, targetIndex).trimEnd()}\n\n${block}${content.slice(targetIndex)}`;
  }

  return `${content.trimEnd()}\n\n${block}\n`;
}

function findHeadingIndex(content: string, heading: string): number {
  if (content.startsWith(heading)) {
    return 0;
  }
  return content.indexOf(`\n${heading}`);
}

export function updatePaperBodyMetadata(content: string, paper: PaperInfo): string {
  let next = content;
  const institutions = paper.institutions || [];
  if (institutions.length > 0) {
    next = upsertBodyMetadataLine(next, '作者单位', institutions.join('; '), '作者');
  }
  next = upsertBodyMetadataLine(next, '发表状态', paper.published || DEFAULT_PUBLISHED_STATUS, '作者单位');
  if (paper.publicationVenue || paper.journal) {
    next = upsertBodyMetadataLine(next, '发表期刊/会议', paper.publicationVenue || paper.journal || '', '发表状态');
  }
  next = upsertBodyMetadataLine(next, '开源状态', formatOpenSourceSummary(paper), '发表期刊/会议');
  if (paper.openSourceUrl) {
    next = upsertBodyMetadataLine(next, '开源地址', paper.openSourceUrl, '开源状态');
  } else {
    next = removeBodyMetadataLine(next, '开源地址');
  }
  return next;
}

export function formatOpenSourceSummary(paper: PaperInfo): string {
  return paper.openSourceStatus || DEFAULT_OPEN_SOURCE_STATUS;
}

export function parseClaudianEnrichmentResponse(content: string): ClaudianEnrichmentResult {
  const candidate = extractJsonCandidate(content);
  const parsed = JSON.parse(candidate) as unknown;
  return normalizeClaudianEnrichmentResult(parsed);
}

export function normalizeClaudianEnrichmentResult(value: unknown): ClaudianEnrichmentResult {
  const record = isRecord(value) ? value : {};
  return {
    institutions: normalizeStringArray(record.institutions),
    published: normalizeString(record.published) || DEFAULT_PUBLISHED_STATUS,
    publicationVenue: normalizeString(record.publicationVenue),
    openSourceStatus: combineOpenSourceStatus(
      normalizeString(record.openSourceStatus) || DEFAULT_OPEN_SOURCE_STATUS,
      normalizeString(record.openSourceLevel),
      normalizeString(record.openSourcePlan)
    ),
    openSourceUrl: normalizeString(record.openSourceUrl),
    bibtex: normalizeString(record.bibtex),
  };
}

export function applyClaudianEnrichmentToPaper(
  paper: PaperInfo,
  enrichment: ClaudianEnrichmentResult
): PaperInfo {
  return {
    ...paper,
    institutions: enrichment.institutions.length > 0 ? enrichment.institutions : paper.institutions,
    published: enrichment.published,
    publicationVenue: enrichment.publicationVenue,
    openSourceStatus: enrichment.openSourceStatus,
    openSourceUrl: enrichment.openSourceUrl,
    bibtex: enrichment.bibtex,
  };
}

export function buildClaudianMetadataPrompt(skillPrompt: string, paper: PaperInfo): string {
  const payload = {
    title: paper.title,
    authors: paper.authors,
    journal: paper.journal || '',
    date: paper.date || '',
    institutions: paper.institutions || [],
    arxivId: paper.arxivId || '',
    doi: paper.doi || '',
    abstract: paper.abstract || '',
    source: paper.source || '',
  };

  return [
    skillPrompt.trim(),
    '',
    '## 论文输入',
    '',
    '请根据以下论文信息补全 Obtero 元数据，只返回符合提示词 schema 的 JSON 对象。',
    '',
    '```json',
    JSON.stringify(payload, null, 2),
    '```',
  ].join('\n');
}

function extractJsonCandidate(content: string): string {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return content.slice(start, end + 1);
  }
  return content.trim();
}

function upsertBodyMetadataLine(
  content: string,
  label: string,
  value: string,
  insertAfterLabel: string
): string {
  const line = `**${label}**：${value}  `;
  const existing = new RegExp(`^\\*\\*${escapeRegExp(label)}\\*\\*：.*$`, 'm');
  if (existing.test(content)) {
    return content.replace(existing, line);
  }

  const insertAfter = new RegExp(`^(\\*\\*${escapeRegExp(insertAfterLabel)}\\*\\*：.*)$`, 'm');
  if (insertAfter.test(content)) {
    return content.replace(insertAfter, `$1\n${line}`);
  }

  const notesHeading = '\n## 笔记';
  const notesIndex = content.indexOf(notesHeading);
  if (notesIndex >= 0) {
    return `${content.slice(0, notesIndex).trimEnd()}\n${line}${content.slice(notesIndex)}`;
  }
  return `${content.trimEnd()}\n${line}\n`;
}

function removeBodyMetadataLine(content: string, label: string): string {
  const existing = new RegExp(`^\\*\\*${escapeRegExp(label)}\\*\\*：.*(?:\\n|$)`, 'm');
  return content.replace(existing, '');
}

function combineOpenSourceStatus(status: string, level: string, plan: string): string {
  const parts = [status || DEFAULT_OPEN_SOURCE_STATUS];
  if (level) {
    parts.push(level);
  }
  if (plan) {
    parts.push(`计划：${plan}`);
  }

  return parts.reduce<string[]>((result, part) => {
    if (!result.includes(part)) {
      result.push(part);
    }
    return result;
  }, []).join(' · ');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatYamlArray(key: string, values: string[]): string {
  return `${key}: [${values.map(value => `"${escapeYaml(value)}"`).join(', ')}]`;
}

function escapeYaml(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map(item => normalizeString(item))
    .filter(item => item.length > 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
