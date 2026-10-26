// Read-only full-corpus structure analysis; generated reports contain statistics, not dialogue copies.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(process.argv[2] || require('./corpus-root.cjs').resolveCorpusRoot());
const out = path.resolve(process.argv[3] || path.join(root, 'analysis'));
const index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'));
const clean = s => String(s ?? '').replace(/<[^>]*>/g, '').trim();
const len = s => Array.from(s).length;
const totals = {files:0, sourceRecords:0, dialogueLines:0, narrationLines:0, screenTextLines:0, decisions:0, dialogueCharacters:0};
const groups = new Map(), speakers = new Map(), fingerprints = new Map();
const fileReports = [], lengths = [], turns = [], markers = {ellipsis:0,dash:0,question:0,exclamation:0,parenthesized:0};
const patternDefs = {contrastNotBut:/不是[^。！？\n]{0,80}(?:而是|是)/,rhetoricalYouThink:/你(?:们)?以为/,onlyMe:/我只是/,namedLand:/这片大地/,address:/先生|女士|博士|小姐|殿下/};
const constructions = Object.fromEntries(Object.keys(patternDefs).map(k=>[k,0]));
const quantiles = values => {
  if (!values.length) return {count:0};
  const a=values.slice().sort((x,y)=>x-y);
  return {count:a.length,p10:a[Math.floor((a.length-1)*.1)],p50:a[Math.floor((a.length-1)*.5)],p90:a[Math.floor((a.length-1)*.9)],p99:a[Math.floor((a.length-1)*.99)],mean:Number((a.reduce((s,x)=>s+x,0)/a.length).toFixed(2))};
};
function bucket(map,key) {
  if (!map.has(key)) map.set(key,{lines:0,characters:0,questions:0,exclamations:0,ellipses:0,lengths:[]});
  return map.get(key);
}
for (const entry of index) {
  const file = path.join(root,'raw/zh_CN/gamedata/story',entry.sourcePath+'.json');
  const buffer = fs.readFileSync(file);
  if (crypto.createHash('sha256').update(buffer).digest('hex') !== entry.sourceSha256) throw Error(`Hash mismatch: ${entry.sourcePath}`);
  const data = JSON.parse(buffer.toString('utf8'));
  if (!Array.isArray(data.storyList)) throw Error(`Missing storyList: ${entry.sourcePath}`);
  const counts={dialogue:0,narration:0,screen:0,decisions:0,characters:0};
  const speakerSet=new Set(), fingerprint=[];
  let previous=null, turnLength=0;
  const flush=()=>{if(turnLength)turns.push(turnLength);previous=null;turnLength=0;};
  for (const record of data.storyList) {
    totals.sourceRecords++;
    const p=record.prop.toLowerCase(),a=record.attributes||{};
    if(p==='predicate'||p==='decision'){flush();if(p==='decision'){totals.decisions++;counts.decisions++;}continue;}
    if(p==='name'||p==='multiline') {
      const text=clean(a.content); if(!text)continue;
      const name=clean(a.name), n=len(text);
      fingerprint.push([name,text]);
      if(!name){totals.narrationLines++;counts.narration++;flush();continue;}
      totals.dialogueLines++;totals.dialogueCharacters+=n;counts.dialogue++;counts.characters+=n;
      speakerSet.add(name); lengths.push(n);
      if(previous!==name){flush();previous=name;} turnLength+=n;
      const tests={ellipsis:/(?:\.{3,}|…)/.test(text),dash:/—/.test(text),question:/[?？]/.test(text),exclamation:/[!！]/.test(text),parenthesized:/^[（(]/.test(text)};
      for(const [k,v]of Object.entries(tests))if(v)markers[k]++;
      for(const [k,r]of Object.entries(patternDefs))if(r.test(text))constructions[k]++;
      for(const b of [bucket(groups,entry.category),bucket(groups,'event:'+entry.eventName),bucket(speakers,name)]){
        b.lines++;b.characters+=n;b.questions+=Number(tests.question);b.exclamations+=Number(tests.exclamation);b.ellipses+=Number(tests.ellipsis);b.lengths.push(n);
      }
    }else if(a.text||(p==='animtext'&&a.content)){
      const text=clean(a.text||a.content);if(text){totals.screenTextLines++;counts.screen++;fingerprint.push(['screen',text]);flush();}
    }
  }
  flush();totals.files++;
  const fp=crypto.createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex');
  if(!fingerprints.has(fp))fingerprints.set(fp,[]);fingerprints.get(fp).push(entry.sourcePath);
  fileReports.push({source:entry.sourcePath,event:entry.eventName,title:entry.storyName,category:entry.category,...counts,speakers:speakerSet.size,textFingerprint:fp});
}
const summarize=b=>({lines:b.lines,characters:b.characters,length:quantiles(b.lengths),questionPercent:Number((b.questions/b.lines*100).toFixed(2)),exclamationPercent:Number((b.exclamations/b.lines*100).toFixed(2)),ellipsisPercent:Number((b.ellipses/b.lines*100).toFixed(2))});
const summary={analysisDate:'2026-10-13',scope:'All indexed files verified and structurally analyzed; this is not a semantic reading or model training claim.',totals,dialogueLineLength:quantiles(lengths),sameSpeakerTurnCharacters:quantiles(turns),markers:Object.fromEntries(Object.entries(markers).map(([k,v])=>[k,{lines:v,percent:Number((v/totals.dialogueLines*100).toFixed(2))}])),constructions,shortLinePercent:Number((lengths.filter(n=>n<=10).length/lengths.length*100).toFixed(2)),longLinePercent:Number((lengths.filter(n=>n>=60).length/lengths.length*100).toFixed(2)),longTurnPercent:Number((turns.filter(n=>n>=100).length/turns.length*100).toFixed(2)),categoryProfiles:Object.fromEntries([...groups].filter(([k])=>!k.startsWith('event:')).map(([k,b])=>[k,summarize(b)])),duplicateTextFileGroups:[...fingerprints.values()].filter(a=>a.length>1),definitions:{characters:'Unicode code points, rich-text tags removed; names and screen text excluded from dialogue lengths',turn:'Consecutive same named speaker, flushed at narration, screen text, choice or branch; staging-only records ignored. Not a verified single player route.',patterns:'Heuristic counts within one line, not rhetorical function or naturalness scores',deduplication:'File-level normalized speaker/text fingerprint; no passage-level deduplication'}};
const profiles=[...speakers].filter(([,b])=>b.lines>=100).map(([name,b])=>({name,...summarize(b)})).sort((a,b)=>b.lines-a.lines);
const eventProfiles=[...groups].filter(([k])=>k.startsWith('event:')).map(([k,b])=>({event:k.slice(6),...summarize(b)}));
fs.mkdirSync(out,{recursive:true});
for(const [name,value]of Object.entries({'full-corpus-statistics.json':summary,'file-analysis.json':fileReports,'speaker-profiles.json':profiles,'event-profiles.json':eventProfiles}))fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2),'utf8');
console.log(JSON.stringify({...summary,sampleSpeakers:profiles.slice(0,16)},null,2));
