const fs = require('fs');
const path = require('path');
function resolveCorpusRoot() {
  const skill = path.resolve(__dirname, '..');
  let configured = '../corpus/snapshot-2026-10-13';
  const config = path.join(skill, 'corpus.config.json');
  if (fs.existsSync(config)) {
    const configText = fs.readFileSync(config, 'utf8');
    const data = JSON.parse(configText.charCodeAt(0) === 65279 ? configText.slice(1) : configText);
    if (typeof data.root !== 'string' || !data.root.trim()) throw Error('corpus.config.json requires a nonempty root');
    configured = data.root;
  }
  const root = process.env.ARKNIGHTS_CORPUS_ROOT
    ? path.resolve(process.env.ARKNIGHTS_CORPUS_ROOT)
    : path.resolve(skill, configured);
  if (!fs.existsSync(path.join(root, 'index.json'))) throw Error('Cannot find corpus index: ' + root + '. Set corpus.config.json root or ARKNIGHTS_CORPUS_ROOT.');
  return root;
}
module.exports = {resolveCorpusRoot};
