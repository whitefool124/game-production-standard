// Records an explicit batch of texts actually read by the assistant.
// This script verifies evidence and synchronizes metadata; it does not perform semantic reading.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
function fail(message) { throw new Error(message); }
const args = process.argv.slice(2);
if (args.length < 1 || args.length > 2) fail('Usage: record-reading.cjs NOTES_JSON [CORPUS_ROOT]');
const root = path.resolve(args[1] || require('./corpus-root.cjs').resolveCorpusRoot());
const skill = path.resolve(__dirname, '..');
const notes = JSON.parse(fs.readFileSync(args[0], 'utf8'));
const index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'));
const ledgerPath = path.join(root, 'analysis/semantic-reading-ledger.json');
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const coveragePath = path.join(root, 'analysis/study-coverage.json');
const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
if (!notes.date || !notes.batchId || !Array.isArray(notes.entries) || !notes.entries.length) fail('Notes require date, batchId and nonempty entries');
const done = new Set(ledger.entries.map(e => e.source));
if (done.size !== ledger.entries.length) fail('Duplicate ledger entries');
const previousSession = (ledger.fullReadingSessions || []).find(s => s.batchId === notes.batchId);
if (previousSession) {
  if (JSON.stringify(previousSession.sources) !== JSON.stringify(notes.entries.map(e => e.source)) || notes.entries.some(n => !ledger.entries.some(e => e.source === n.source && e.note === n.note))) fail('Batch ID reused with different notes');
  if (coverage.filter(e => e.semanticRead === 'complete-readable-file').length !== done.size) fail('Coverage inconsistent; inspect before retry');
  console.log(JSON.stringify({alreadyRecorded: true, complete: done.size, pending: index.length - done.size}));
  process.exit(0);
}
const pending = index.filter(e => !done.has(e.sourcePath));
if (notes.entries.some((e, i) => e.source !== pending[i]?.sourcePath)) fail('Batch is not the next contiguous unread prefix of index.json');
const records = notes.entries.map(n => {
  if (typeof n.note !== 'string' || !n.note.trim()) fail(`Missing observation: ${n.source}`);
  const e = index.find(e => e.sourcePath === n.source);
  const raw = path.resolve(root, 'raw/zh_CN/gamedata/story', e.sourcePath + '.json');
  const readable = path.resolve(root, e.readablePath);
  if (![raw, readable].every(p => p.startsWith(root + path.sep))) fail('Indexed path escapes corpus');
  if (crypto.createHash('sha256').update(fs.readFileSync(raw)).digest('hex') !== e.sourceSha256) fail(`Source hash changed: ${e.sourcePath}`);
  return {source: n.source, event: e.eventName, title: e.storyName, status: 'complete_readable_file_read_in_this_conversation', physicalLines: fs.readFileSync(readable, 'utf8').split(/\r?\n/).length, retainedLines: e.lineCount, sourceSha256: e.sourceSha256, note: n.note};
});
const oldCount = done.size;
ledger.entries.push(...records);
ledger.completeReadableFiles = ledger.entries.length;
ledger.unreadAsCompleteFiles = index.length - ledger.entries.length;
ledger.fullReadingSessions = ledger.fullReadingSessions || [];
ledger.fullReadingSessions.push({date: notes.date, batchId: notes.batchId, order: 'index.json; next contiguous unread prefix, no topic selection', sources: records.map(e => e.source), retainedLines: records.reduce((n, e) => n + e.retainedLines, 0), noteFile: path.resolve(args[0]), scope: 'Assistant supplied observations after actual complete text reading; recorder only validates metadata'});
for (const record of records) {
  const row = coverage.find(e => e.source === record.source);
  if (!row) fail(`Missing coverage row: ${record.source}`);
  row.semanticRead = 'complete-readable-file';
}
const statusPath = path.join(skill, 'references/study-status.md');
let status = fs.readFileSync(statusPath, 'utf8');
status = status.replace(/累计从头到尾阅读 \d+ 个/, `累计从头到尾阅读 ${ledger.entries.length} 个`)
  .replace(/不是 \d+ 个完整活动/, `不是 ${ledger.entries.length} 个完整活动`)
  .replace(/其余 [\d,]+ 个文件/, `其余 ${ledger.unreadAsCompleteFiles.toLocaleString('en-US')} 个文件`)
  .replace(/\d+ 文件实际完整阅读记录/, `${ledger.entries.length} 文件实际完整阅读记录`);
const rows = records.map(r => {
  const e = index.find(e => e.sourcePath === r.source);
  return `| ${e.eventName || 'RO1'} · ${e.code || ''} ${e.storyName} ${e.tag || ''} | \`${r.source}\` | ${r.note.replace(/\|/g, '／').replace(/\r?\n/g, ' ')} |`;
}).join('\n');
if (!status.includes('## 可重现资料')) fail('Study status insertion point missing');
status = status.replace('## 可重现资料', `${rows}\n\n目录连续阅读批次 ${notes.batchId}：${records.length} 文件，${records.reduce((n,e) => n+e.retainedLines,0)} 条保留文本。尚未全读完。\n\n## 可重现资料`);
const craftPath = path.join(skill, 'references/dialogue-craft.md');
const craft = fs.readFileSync(craftPath, 'utf8').replace(/累计完整阅读 \d+ 文件/, `累计完整阅读 ${ledger.entries.length} 文件`);
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
fs.writeFileSync(coveragePath, JSON.stringify(coverage, null, 2) + '\n');
fs.writeFileSync(statusPath, status);
fs.writeFileSync(craftPath, craft);
console.log(JSON.stringify({previous: oldCount, complete: ledger.entries.length, pending: ledger.unreadAsCompleteFiles, batchFiles: records.length, batchLines: records.reduce((n,e) => n+e.retainedLines,0)}));
