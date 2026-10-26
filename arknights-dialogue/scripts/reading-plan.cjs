const fs = require('fs');
const path = require('path');
function fail(message) { console.error(message); process.exit(1); }
const args = process.argv.slice(2);
const options = {};
while (args.length) {
  const key = args.shift();
  if (!['--root', '--files', '--line-budget'].includes(key)) fail('Usage: reading-plan.cjs [--root DIR] [--files N] [--line-budget N]');
  const value = args.shift();
  if (!value || value.startsWith('--')) fail(`Missing value: ${key}`);
  options[key.slice(2)] = value;
}
function integer(key, fallback, max) {
  if (options[key] === undefined) return fallback;
  if (!/^\d+$/.test(options[key])) fail(`${key} must be a positive integer`);
  const value = Number(options[key]);
  if (!Number.isSafeInteger(value) || value < 1 || value > max) fail(`${key} must be between 1 and ${max}`);
  return value;
}
const root = path.resolve(options.root || require('./corpus-root.cjs').resolveCorpusRoot());
let index, ledger;
try {
  index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'));
  ledger = JSON.parse(fs.readFileSync(path.join(root, 'analysis/semantic-reading-ledger.json'), 'utf8'));
} catch (error) { fail(error.message); }
const done = new Set(ledger.entries.map(e => e.source));
if (done.size !== ledger.entries.length || ledger.entries.some(e => !index.some(x => x.sourcePath === e.source && x.sourceSha256 === e.sourceSha256))) fail('Reading ledger is duplicated or inconsistent with the indexed snapshot');
const pending = index.filter(e => !done.has(e.sourcePath));
const maxFiles = integer('files', 4, 200);
const budget = integer('line-budget', 800, 100000);
const entries = [];
let lines = 0;
for (const entry of pending) {
  if (entries.length >= maxFiles || (entries.length > 0 && lines + entry.lineCount > budget)) break;
  const file = path.resolve(root, entry.readablePath);
  if (!file.startsWith(root + path.sep)) fail('Indexed path escapes root');
  entries.push({source: entry.sourcePath, event: entry.eventName, title: entry.storyName, lines: entry.lineCount, file, sourceSha256: entry.sourceSha256});
  lines += entry.lineCount;
}
console.log(JSON.stringify({total: index.length, completeReadableFiles: done.size, pendingFiles: pending.length, order: 'index.json order; already completed files omitted; no semantic reading performed by this tool', selectedLines: lines, entries}, null, 2));
