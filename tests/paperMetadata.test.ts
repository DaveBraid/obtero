import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BIBTEX_CALLOUT_MARKER,
  buildBibtexCallout,
  buildPaperFrontmatterLines,
  formatRatingStars,
  upsertBibtexCallout,
  normalizeClaudianModel,
  normalizeRating,
  parseClaudianEnrichmentResponse,
  updatePaperBodyMetadata,
} from '../src/paperMetadata.ts';
import type { PaperInfo } from '../src/types.ts';

const basePaper: PaperInfo = {
  title: 'A Useful Robot Paper',
  journal: 'arXiv',
  date: '2026-07-01',
  authors: ['Ada Lovelace', 'Grace Hopper'],
  source: 'arxiv',
  field: 'Robotics',
  arxivId: '2607.00001',
};

test('rating is stored as an integer from 0 to 5', () => {
  assert.equal(normalizeRating(undefined), 0);
  assert.equal(normalizeRating(-1), 0);
  assert.equal(normalizeRating(2.6), 3);
  assert.equal(normalizeRating('4'), 4);
  assert.equal(normalizeRating(9), 5);
  assert.equal(formatRatingStars(3), '★★★☆☆ (3/5)');
  assert.equal(formatRatingStars(0), '☆☆☆☆☆ (0/5)');
});

test('auto mode writes local fields and compact Claudian metadata defaults', () => {
  const lines = buildPaperFrontmatterLines(basePaper, { claudianMode: 'auto' });

  assert.ok(lines.includes('rating: 0'));
  assert.ok(lines.includes('pdfUrl: ""'));
  assert.ok(lines.includes('institutions: []'));
  assert.ok(lines.includes('published: "unknown"'));
  assert.ok(lines.includes('openSourceStatus: "unknown"'));
  assert.ok(lines.includes('openSourceUrl: ""'));
  assert.ok(lines.includes('fields: ["Robotics"]'));
  assert.equal(lines.some(line => line.startsWith('openSourcePlan:')), false);
  assert.equal(lines.some(line => line.startsWith('openSourceLevel:')), false);
  assert.equal(lines.some(line => line.startsWith('metadataEnrichedAt:')), false);
  assert.equal(lines.some(line => line.startsWith('field:')), false);
});

test('manual mode keeps Claudian fields without requiring an automatic call', () => {
  const lines = buildPaperFrontmatterLines(basePaper, { claudianMode: 'manual' });

  assert.ok(lines.includes('institutions: []'));
  assert.ok(lines.includes('publicationVenue: "arXiv"'));
  assert.ok(lines.includes('openSourceUrl: ""'));
});

test('off mode omits Claudian-managed metadata but keeps local fields', () => {
  const lines = buildPaperFrontmatterLines(basePaper, { claudianMode: 'off' });

  assert.ok(lines.includes('rating: 0'));
  assert.ok(lines.includes('pdfUrl: ""'));
  assert.equal(lines.some(line => line.startsWith('institutions:')), false);
  assert.equal(lines.some(line => line.startsWith('published:')), false);
  assert.equal(lines.some(line => line.startsWith('openSourceStatus:')), false);
});

test('bibtex callout is folded and copyable by a stable marker', () => {
  const callout = buildBibtexCallout('@article{demo, title={Demo}}');

  assert.ok(callout.includes(BIBTEX_CALLOUT_MARKER));
  assert.ok(callout.includes('```bibtex'));
  assert.ok(callout.includes('@article{demo, title={Demo}}'));
});

test('bibtex callout is inserted before notes and replaced in place', () => {
  const withoutCallout = '# Demo\n\n## 摘要\nText\n\n## 笔记\n';
  const inserted = upsertBibtexCallout(withoutCallout, '@article{a}');

  assert.match(inserted, /@article\{a\}[\s\S]*## 笔记/);

  const replaced = upsertBibtexCallout(inserted, '@article{b}');
  assert.equal(replaced.includes('@article{a}'), false);
  assert.match(replaced, /@article\{b\}[\s\S]*## 笔记/);
});

test('Claudian response parser accepts fenced JSON and normalizes missing evidence', () => {
  const parsed = parseClaudianEnrichmentResponse(`
    Here is the result:
    \`\`\`json
    {
      "institutions": ["Carnegie Mellon University（CMU）", "NVIDIA Research"],
      "published": "published",
      "publicationVenue": "CVPR 2026",
      "openSourceStatus": "partial",
      "openSourceUrl": "https://github.com/example/repo",
      "openSourceLevel": "weights",
      "openSourcePlan": "after camera-ready",
      "bibtex": "@inproceedings{demo2026,title={Demo}}"
    }
    \`\`\`
  `);

  assert.deepEqual(parsed.institutions, ['Carnegie Mellon University（CMU）', 'NVIDIA Research']);
  assert.equal(parsed.published, 'published');
  assert.equal(parsed.publicationVenue, 'CVPR 2026');
  assert.equal(parsed.openSourceStatus, 'partial · weights · 计划：after camera-ready');
  assert.equal(parsed.openSourceUrl, 'https://github.com/example/repo');
  assert.match(parsed.bibtex, /@inproceedings/);
});

test('paper body metadata is updated after Claudian enrichment', () => {
  const content = [
    '# Demo',
    '',
    '**期刊/会议**：arXiv  ',
    '**发表时间**：2026-07-01  ',
    '**作者**：Ada  ',
    '**发表状态**：unknown  ',
    '**发表期刊/会议**：arXiv  ',
    '**开源状态**：unknown  ',
    '',
    '## 笔记',
    '',
  ].join('\n');
  const updated = updatePaperBodyMetadata(content, {
    ...basePaper,
    institutions: ['CMU', 'NVIDIA Lab'],
    published: 'published',
    publicationVenue: 'CVPR 2026',
    openSourceStatus: 'partial · weights',
    openSourceUrl: 'https://github.com/example/repo',
  });

  assert.match(updated, /\*\*作者单位\*\*：CMU; NVIDIA Lab/);
  assert.match(updated, /\*\*发表状态\*\*：published/);
  assert.match(updated, /\*\*发表期刊\/会议\*\*：CVPR 2026/);
  assert.match(updated, /\*\*开源状态\*\*：partial · weights/);
  assert.match(updated, /\*\*开源地址\*\*：https:\/\/github.com\/example\/repo/);
});

test('Claudian model setting is normalized for runtime use', () => {
  assert.equal(normalizeClaudianModel(' GPT-5.5 '), 'gpt-5.5');
  assert.equal(normalizeClaudianModel(''), 'gpt-5.5');
});
