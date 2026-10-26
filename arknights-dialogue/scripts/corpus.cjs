const fs = require('fs');
const path = require('path');

function fail(message) { console.error(message); process.exit(1); }
const args = process.argv.slice(2);
const command = args.shift();
const options = {};
const allowed = new Set(['root', 'event', 'title', 'category', 'speaker', 'limit', 'source', 'start', 'lines']);
while (args.length) {
  const key = args.shift();
  if (!key.startsWith('--') || !allowed.has(key.slice(2))) fail(`Unknown option: ${key}`);
  const value = args.shift();
  if (value === undefined || value.startsWith('--')) fail(`Missing value: ${key}`);
  options[key.slice(2)] = value;
}
function integer(key, defaultValue, max) {
  if (options[key] === undefined) return defaultValue;
  if (!/^\d+$/.test(options[key])) fail(`${key} must be a positive integer`);
  const n = Number(options[key]);
  if (!Number.isSafeInteger(n) || n < 1 || n > max) fail(`${key} must be between 1 and ${max}`);
  return n;
}
if (!['list', 'read'].includes(command)) fail('Usage: corpus.cjs list [--event NAME] [--title NAME] [--category NAME] [--speaker EXACT_LABEL] [--limit N] | read --source PATH [--start N] [--lines N]; optional --root DIR');
const root = path.resolve(options.root || require('./corpus-root.cjs').resolveCorpusRoot());
let index;
try { index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8')); }
catch (error) { fail(`Cannot read corpus index at ${root}: ${error.message}`); }
if (command === 'list') {
  let matches = index.filter(x => ['event', 'title', 'category'].every(k => {
    const field = {event:'eventName', title:'storyName', category:'category'}[k];
    return !options[k] || String(x[field] || '').includes(options[k]);
  }));
  if (options.speaker) {
    matches = matches.map(x => {
      const file = path.resolve(root, 'raw/zh_CN/gamedata/story', x.sourcePath + '.json');
      if (!file.startsWith(root + path.sep)) fail('Indexed path escapes corpus root');
      let story;
      try { story = JSON.parse(fs.readFileSync(file, 'utf8')); }
      catch (error) { fail(`Cannot inspect indexed story ${x.sourcePath}: ${error.message}`); }
      const speakerLines = (story.storyList || []).filter(r => ['name', 'multiline'].includes(String(r.prop).toLowerCase()) && r.attributes?.name === options.speaker).length;
      return {...x, speakerLines};
    }).filter(x => x.speakerLines > 0);
  }
  const result = matches.slice(0, integer('limit', 12, 200)).map(x => ({event:x.eventName, title:x.storyName, code:x.code, tag:x.tag, category:x.category, source:x.sourcePath, lines:x.lineCount, ...(options.speaker ? {speaker:options.speaker, matchedDialogueRecords:x.speakerLines} : {})}));
  console.log(JSON.stringify({total:matches.length, shown:result.length, entries:result}, null, 2));
} else {
  if (!options.source) fail('read requires --source from a listed entry');
  const entry = index.find(x => x.sourcePath.toLowerCase() === options.source.toLowerCase());
  if (!entry) fail(`Source is not indexed: ${options.source}`);
  const file = path.resolve(root, entry.readablePath);
  if (!file.startsWith(root + path.sep)) fail('Indexed path escapes corpus root');
  const start = integer('start', 1, 1000000);
  const count = integer('lines', 60, 200);
  let lines;
  try { lines = fs.readFileSync(file, 'utf8').split(/\r?\n/); }
  catch (error) { fail(`Cannot read indexed story: ${error.message}`); }
  if (start > lines.length) fail(`start exceeds file length (${lines.length} lines)`);
  console.log(JSON.stringify({event:entry.eventName, title:entry.storyName, source:entry.sourcePath, file, totalLines:lines.length, start, end:Math.min(start + count - 1, lines.length)}));
  console.log(lines.slice(start - 1, start - 1 + count).map((line, i) => `${start + i}: ${line}`).join('\n'));
}
