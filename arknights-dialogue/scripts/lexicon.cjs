const fs = require('fs');
const path = require('path');
function fail(message) { console.error(message); process.exit(1); }
const args = process.argv.slice(2);
const options = {};
while (args.length) {
  const key = args.shift();
  if (!['--term', '--domain', '--limit'].includes(key)) fail('Usage: lexicon.cjs [--term WORD] [--domain DOMAIN] [--limit 1..100]');
  const value = args.shift();
  if (!value || value.startsWith('--')) fail(`Missing value for ${key}`);
  options[key.slice(2)] = value;
}
const limit = options.limit === undefined ? 8 : Number(options.limit);
if (!Number.isInteger(limit) || limit < 1 || limit > 100) fail('limit must be an integer between 1 and 100');
let data;
try { data = JSON.parse(fs.readFileSync(path.join(__dirname, '../references/lexicon.json'), 'utf8')); }
catch (error) { fail(`Cannot read skill lexicon: ${error.message}`); }
const matches = data.entries.filter(e => (!options.term || e.term.includes(options.term)) && (!options.domain || e.domain.includes(options.domain)));
console.log(JSON.stringify({total: matches.length, shown: Math.min(matches.length, limit), domains: [...new Set(data.entries.map(e => e.domain))], entries: matches.slice(0, limit)}, null, 2));
