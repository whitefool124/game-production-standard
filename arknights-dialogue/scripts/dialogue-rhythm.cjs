// Structural statistics only: no semantic reading or prose-quality score.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const skill=path.resolve(__dirname,'..');
const root=path.resolve(process.argv[2]||require('./corpus-root.cjs').resolveCorpusRoot());
function clean(s){return String(s??'').replace(/<[^>]*>/g,'').replace(/\{@nickname\}/g,'博士').replace(/\\n/g,'\n').trim();}
function measure(s){
  s=clean(s); const words=(s.match(/[\p{L}\p{N}]/gu)||[]).length;
  // Ellipses and dashes do not end sentences; a final spoken fragment counts once.
  const fragments=s.replace(/\.{2,}|…+|—+/g,'').split(/[。！？!?]+/).filter(t=>/[\p{L}\p{N}]/u.test(t));
  return {characters:words,visibleCharacters:Array.from(s.replace(/\s/g,'')).length,sentences:fragments.length};
}
function textUnits(s){
  const cleaned=clean(s).replace(/\.{2,}|…+|—+/g,'');
  const sentences=cleaned.split(/[。！？!?]+/).filter(t=>/[\p{L}\p{N}]/u.test(t));
  return {sentences,sentenceLengths:sentences.map(t=>(t.match(/[\p{L}\p{N}]/gu)||[]).length),pauseLengths:sentences.flatMap(t=>t.split(/[，,；;：:]+/).filter(t=>/[\p{L}\p{N}]/u.test(t)).map(t=>(t.match(/[\p{L}\p{N}]/gu)||[]).length))};
}
function structureSummary(ts){
  const sentenceLengths=[],pauseLengths=[],commas=[],prefixes=new Map();
  let joinedSentences=0,recordSentences=0,semicolonTurns=0;
  for(const t of ts){const u=textUnits(t.text);sentenceLengths.push(...u.sentenceLengths);pauseLengths.push(...u.pauseLengths);joinedSentences+=u.sentences.length;recordSentences+=t.sentences;
    commas.push((t.text.match(/[，,]/g)||[]).length);semicolonTurns+=Number(/[；;]/.test(t.text));
    const initial=(t.text.match(/[\p{L}\p{N}]/u)||[])[0];if(initial)prefixes.set(initial,(prefixes.get(initial)||0)+1);
  }
  return {recordBasedSentenceUnits:recordSentences,joinedPunctuationUnits:joinedSentences,meanJoinedUnitsPerTurn:ts.length?+(joinedSentences/ts.length).toFixed(2):0,sentenceCharacters:summarize(sentenceLengths),pauseUnitCharacters:summarize(pauseLengths),commaCountPerTurn:summarize(commas),semicolonTurnPercent:pct(semicolonTurns,ts.length),sentencesAtLeast30CharactersPercent:pct(sentenceLengths.filter(n=>n>=30).length,sentenceLengths.length),sentencesAtLeast50CharactersPercent:pct(sentenceLengths.filter(n=>n>=50).length,sentenceLengths.length),topInitialCharacters:[...prefixes].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([character,count])=>({character,count,percent:pct(count,ts.length)}))};
}
function alternating(seq){
  const out=[]; if(seq.length<4)return out;
  let start=0;
  function add(end){if(end-start+1>=4)out.push({start,end});}
  for(let i=1;i<seq.length;i++){
    if(seq[i].speaker===seq[i-1].speaker){add(i-1);start=i;}
    else if(i>=2&&seq[i].speaker!==seq[i-2].speaker){add(i-1);start=i-1;}
  }
  add(seq.length-1);return out;
}
function summarize(values){
  if(!values.length)return {count:0};const a=values.slice().sort((a,b)=>a-b),q=p=>a[Math.floor((a.length-1)*p)];
  return {count:a.length,mean:+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2),p10:q(.1),p25:q(.25),p50:q(.5),p75:q(.75),p90:q(.9),p95:q(.95),p99:q(.99),max:a.at(-1)};
}
function sum(xs,k){return xs.reduce((a,x)=>a+x[k],0);}
function stats(xs){return {frames:summarize(xs.map(x=>x.frames??1)),sentences:summarize(xs.map(x=>x.sentences)),characters:summarize(xs.map(x=>x.characters))};}
function pct(n,d){return d?+(100*n/d).toFixed(2):0;}
function parseRaw(data){
  const segments=[];let current=[];const flush=()=>{if(current.length)segments.push(current);current=[];};
  for(const r of data.storyList){
    const p=String(r.prop).toLowerCase(),a=r.attributes||{};
    if(['decision','predicate'].includes(p)){flush();continue;}
    if(['name','multiline'].includes(p)){
      const text=clean(a.content),speaker=clean(a.name);if(!text)continue;
      if(!speaker){flush();continue;}
      current.push({speaker,text,id:r.id,...measure(text)});
    }else if(['sticker','subtitle','animtext'].includes(p)&&(a.text||a.content)){flush();}
  }flush();return segments;
}
function turns(seg){
  const out=[];for(const f of seg){let t=out.at(-1);if(!t||t.speaker!==f.speaker){t={speaker:f.speaker,frames:0,sentences:0,characters:0,ids:[],text:''};out.push(t);}t.frames++;t.sentences+=f.sentences;t.characters+=f.characters;t.ids.push(f.id);t.text+=f.text;}return out;
}
function analyze(files){
  const allFrames=[],allTurns=[],blocks=[],turnBlocks=[],twoPersonTurns=[],examples=[],fileReports=[],adjacentRatios=[],majorityShares=[],dominanceWindows=[];
  let textSegments=0;
  for(const f of files){let fn=0,ft=0;for(const seg of f.segments){textSegments++;allFrames.push(...seg);fn+=seg.length;
    const ts=turns(seg);allTurns.push(...ts);ft+=ts.length;
    for(const b of alternating(seg)){const slice=seg.slice(b.start,b.end+1);blocks.push({frames:slice.length,sentences:sum(slice,'sentences'),characters:sum(slice,'characters')});}
    const twoPersonPositions=new Set();
    for(const b of alternating(ts)){const slice=ts.slice(b.start,b.end+1);turnBlocks.push({frames:sum(slice,'frames'),turns:slice.length,sentences:sum(slice,'sentences'),characters:sum(slice,'characters')});for(let i=b.start;i<=b.end;i++)twoPersonPositions.add(i);}
    for(const i of twoPersonPositions)twoPersonTurns.push(ts[i]);
    for(let i=1;i<ts.length;i++)if(twoPersonPositions.has(i-1)&&twoPersonPositions.has(i)&&ts[i-1].characters>0&&ts[i].characters>0)adjacentRatios.push(Math.max(ts[i-1].characters,ts[i].characters)/Math.min(ts[i-1].characters,ts[i].characters));
    for(let i=0;i+8<=ts.length;i++){const win=ts.slice(i,i+8);if(new Set(win.map(t=>t.speaker)).size!==2||sum(win,'characters')<120)continue;const by=new Map();for(const t of win)by.set(t.speaker,(by.get(t.speaker)||0)+t.characters);const share=100*Math.max(...by.values())/sum(win,'characters');majorityShares.push(share);if(share>=85)dominanceWindows.push({source:f.source,event:f.event,title:f.title,recordIds:win.flatMap(t=>t.ids),turns:8,characters:sum(win,'characters'),majorityShare:+share.toFixed(2)});}
    for(const t of ts)if(t.frames>=4)examples.push({source:f.source,event:f.event,title:f.title,speaker:t.speaker,recordIds:t.ids,frames:t.frames,sentences:t.sentences,characters:t.characters});
  }fileReports.push({source:f.source,frames:fn,turns:ft});}
  const multi=allTurns.filter(t=>t.frames>=2),speechTurns=allTurns.filter(t=>t.characters>0),speechFrames=allFrames.filter(t=>t.characters>0);
  const altFramePositions=new Set(); // Coverage per unique file/segment/frame, not sum of overlapping blocks.
  files.forEach((f,fi)=>f.segments.forEach((s,si)=>alternating(s).forEach(b=>{for(let i=b.start;i<=b.end;i++)altFramePositions.add(`${fi}/${si}/${i}`);})));
  return {files:files.length,segments:textSegments,namedFrames:allFrames.length,spokenFrames:speechFrames.length,turns:allTurns.length,
    spokenCharacters:sum(allFrames,'characters'),sentences:sum(allFrames,'sentences'),
    frame:stats(speechFrames),turn:stats(speechTurns),sameSpeakerMultiFrame:stats(multi),
    multiFrameTurnPercent:pct(multi.length,allTurns.length),framesInMultiFrameTurnsPercent:pct(sum(multi,'frames'),allFrames.length),
    singleFrameTurnPercent:pct(allTurns.filter(t=>t.frames===1).length,allTurns.length),
    turnsAtLeast100CharactersPercent:pct(speechTurns.filter(t=>t.characters>=100).length,speechTurns.length),
    turnsAtLeast200CharactersPercent:pct(speechTurns.filter(t=>t.characters>=200).length,speechTurns.length),
    turnCharacterBands:Object.fromEntries([[0,10],[11,30],[31,60],[61,100],[101,200],[201,Infinity]].map(([lo,hi])=>[`${lo}-${hi}`,{count:speechTurns.filter(t=>t.characters>=lo&&t.characters<=hi).length,percent:pct(speechTurns.filter(t=>t.characters>=lo&&t.characters<=hi).length,speechTurns.length)}])),
    frameAlternatingBlocks:stats(blocks),framesInStrictABABPercent:pct(altFramePositions.size,allFrames.length),
    turnAlternatingBlocks:stats(turnBlocks),turnAlternatingBlockTurns:summarize(turnBlocks.map(b=>b.turns)),
    withinTwoPersonExchanges:{turn:stats(twoPersonTurns.filter(t=>t.characters>0)),multiFrameTurnPercent:pct(twoPersonTurns.filter(t=>t.frames>=2).length,twoPersonTurns.length),framesInMultiFrameTurnsPercent:pct(sum(twoPersonTurns.filter(t=>t.frames>=2),'frames'),sum(twoPersonTurns,'frames'))},
    sentenceStructure:structureSummary(speechTurns),twoPersonSentenceStructure:structureSummary(twoPersonTurns.filter(t=>t.characters>0)),
    twoPersonAdjacentLengthRatio:{distribution:summarize(adjacentRatios),atLeast3To1Percent:pct(adjacentRatios.filter(n=>n>=3).length,adjacentRatios.length),atLeast5To1Percent:pct(adjacentRatios.filter(n=>n>=5).length,adjacentRatios.length)},
    twoPersonEightTurnWindows:{minimumCharacters:120,majorityCharacterShare:summarize(majorityShares),atLeast75Percent:pct(majorityShares.filter(n=>n>=75).length,majorityShares.length),atLeast85Percent:pct(majorityShares.filter(n=>n>=85).length,majorityShares.length),examples:dominanceWindows.slice(0,6)},
    topContinuousExamples:examples.sort((a,b)=>b.characters-a.characters).slice(0,12),fileReports};
}
function tests(){
  assert.deepStrictEqual(measure('你好。你来了？……'),{characters:5,visibleCharacters:9,sentences:2});
  assert.equal(measure('……').sentences,0);assert.equal(measure('不——我还没说完').sentences,1);
  assert.deepStrictEqual(textUnits('如果你来了，先坐。再说。').sentenceLengths,[7,2]);
  assert.equal(alternating('ABABAB'.split('').map(speaker=>({speaker})))[0].end,5);
  assert.equal(alternating('AABAB'.split('').map(speaker=>({speaker})))[0].start,1);
  assert.equal(alternating('ABCABC'.split('').map(speaker=>({speaker}))).length,0);
  assert.deepStrictEqual(alternating('ABABCBCB'.split('').map(speaker=>({speaker}))),[{start:0,end:3},{start:3,end:7}]);
  const mk=(id,prop,attributes)=>({id,prop,attributes});
  const seg=parseRaw({storyList:[mk(0,'name',{name:'甲',content:'一。'}),mk(1,'Delay',{}),mk(2,'name',{name:'甲',content:'二？三。'}),mk(3,'name',{content:'旁白。'}),mk(4,'name',{name:'甲',content:'四。'}),mk(5,'Decision',{options:'选择'}),mk(6,'name',{name:'甲',content:'五。'})]});
  assert.equal(seg.length,3);assert.deepStrictEqual(turns(seg[0]).map(t=>[t.frames,t.sentences,t.characters]),[[2,3,3]]);
  const unfinished=parseRaw({storyList:[mk(0,'name',{name:'甲',content:'如果你来了，'}),mk(1,'name',{name:'甲',content:'先坐。'})]});
  assert.equal(turns(unfinished[0])[0].sentences,2);assert.equal(textUnits(turns(unfinished[0])[0].text).sentences.length,1);
}
tests();if(process.argv.includes('--selftest')){console.log('Boundary, sentence, alternating-run tests passed.');process.exit(0);}
const index=JSON.parse(fs.readFileSync(path.join(root,'index.json'),'utf8'));
const ledger=JSON.parse(fs.readFileSync(path.join(root,'analysis/semantic-reading-ledger.json'),'utf8'));
const read=new Set(ledger.entries.map(e=>e.source));
const fingerprints=new Set(),all=[],dedup=[];
for(const e of index){
  const bytes=fs.readFileSync(path.join(root,'raw/zh_CN/gamedata/story',e.sourcePath+'.json'));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),e.sourceSha256,`Hash mismatch ${e.sourcePath}`);
  const data=JSON.parse(bytes),segments=parseRaw(data),item={source:e.sourcePath,event:e.eventName,title:e.storyName,category:e.category,segments};all.push(item);
  const fp=crypto.createHash('sha256').update(JSON.stringify(segments.map(s=>s.map(t=>[t.speaker,t.text])))).digest('hex');
  if(!fingerprints.has(fp)){fingerprints.add(fp);dedup.push(item);}
}
const samplePath=path.join(skill,'references/southbound-dialogue-sample.md');
const own=fs.readFileSync(samplePath,'utf8').split(/\r?\n/).flatMap((line,i)=>{const m=line.match(/^([^：]+)：[“](.*)[”]$/);return m?[{speaker:m[1],text:m[2],id:i+1,...measure(m[2])}]:[];});
assert(own.length>70,'Latest sample missing dialogue');
const sets={fullIndex:all,deduplicated:dedup,mainline:dedup.filter(f=>f.category==='主线剧情'),actuallyRead:dedup.filter(f=>read.has(f.source)),chapter13:dedup.filter(f=>f.source.startsWith('Obt/main/level_main_13-')),chapter14:dedup.filter(f=>f.source.startsWith('Obt/main/level_main_14-')),silverTrain:dedup.filter(f=>f.event==='银心湖列车'),ownLatest:[{source:samplePath,event:'原创',title:'南行前夜',segments:[own]}]};
const report={method:{scope:'All indexed raw files hash verified and structurally analyzed. Not semantic reading; read ledger stays unchanged.',boundaries:'File end, unnamed narration, screen text, choices, predicates break segments. Staging-only records ignored; no inferred scene cuts or player routes.',frame:'One named name/multiline record. Original sample one printed speaker paragraph.',turn:'Adjacent same exact display name, within segment. Unknown names may conflate people; composite names not separated.',characters:'Unicode letters/numbers only; punctuation/whitespace/names excluded; rich tags removed; nickname normalized to 博士. Also computed visibleCharacters internally.',sentences:'Heuristic split at 。！？!?; ellipses/dashes not sentence endings; trailing verbal fragment counts once. Not clause or syntactic complexity analysis.',strictABAB:'Maximal raw-frame runs with two exact names strictly alternating, minimum 4 frames; repeats or third speaker break. Pair transitions may overlap one boundary frame; coverage uses unique positions.',turnABAB:'Same algorithm after same-speaker frames merged; allows long speeches within a two-person exchange.',dedup:'Exact normalized named-dialogue segments only, file-level; different narration/staging may collapse identical dialogue files, passage duplicates remain.',silence:'Named punctuation-only frames retained in order but 0 lexical characters/0 sentences; speech frame/turn distributions exclude zero-character entries.',comparability:'Latest sample is a single two-person everyday/farewell scene; corpus mixes genres and cast size. Statistics cannot establish style quality or prescribe quotas.'},groups:Object.fromEntries(Object.entries(sets).map(([k,v])=>[k,analyze(v)]))};
report.method.joinedSentences='Same-speaker frame text concatenated without inserting punctuation before punctuation-unit split; record-based estimates retained separately. Neither estimates grammatical sentences without manual judgment.';
report.method.pauseUnits='Comma/semicolon/colon partitions of punctuation units; not parsed clauses. Initial-character counts are lexical signals, not sentence types.';
report.method.eightTurnWindows='Sliding windows of exactly 8 merged turns, exactly 2 names, at least 120 lexical characters; windows overlap and are not independent scenes.';
const output=path.join(root,'analysis/dialogue-rhythm-comparison.json');fs.writeFileSync(output,JSON.stringify(report,null,2));
const lean=Object.fromEntries(Object.entries(report.groups).map(([k,{fileReports,topContinuousExamples,...v}])=>[k,v]));
console.log(JSON.stringify({output,summary:Object.fromEntries(Object.entries(lean).map(([k,g])=>[k,{files:g.files,namedFrames:g.namedFrames,turns:g.turns,meanTurnCharacters:g.turn.characters.mean,multiFrameTurnPercent:g.multiFrameTurnPercent,strictABABCoverage:g.framesInStrictABABPercent}]))},null,2));
