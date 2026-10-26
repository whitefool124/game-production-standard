// Punctuation spans and lexical openings; these are not parsed grammatical sentences.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=require('./corpus-root.cjs').resolveCorpusRoot(),refs=path.resolve(__dirname,'../references');
const clean=s=>String(s??'').replace(/<[^>]*>/g,'').replace(/\{@nickname\}/g,'博士').replace(/\\n/g,'\n').trim();
const count=s=>(s.match(/[\p{L}\p{N}]/gu)||[]).length;
const heads=['我知道','我觉得','我以为','我只是','你知道','你别','如果','但是','不过','所以','因为','其实','当然','至少','可是','而且','然后','现在','以前','后来','这里','那里','这','那'];
const spans=s=>(s.match(/[^。！？!?]+[。！？!?]*/gu)||[]).map(x=>x.replace(/^[^\p{L}\p{N}]+/u,'')).filter(count);
const groups=Object.fromEntries(['all','Logos','可露希尔','southbound','workshop'].map(k=>[k,{turns:0,spans:0,characters:0,iYou:0,question:0,commas:0,heads:Object.fromEntries(heads.map(x=>[x,0])),twoIYou:0,eligible:0}]));
function consume(k,s){const b=groups[k],ss=spans(s);if(!ss.length)return;b.turns++;b.characters+=count(s);b.spans+=ss.length;b.commas+=(s.match(/[，,]/g)||[]).length;let hits=0;for(const x of ss){const p=Number(/^[我你]/u.test(x));b.iYou+=p;hits+=p;b.question+=Number(/[？?]/u.test(x));for(const h of heads)if(x.startsWith(h))b.heads[h]++;}if(ss.length>=2){b.eligible++;b.twoIYou+=Number(hits>=2);}}
function turns(data){const out=[];let speaker='',s='';const flush=()=>{if(speaker&&count(s))out.push({speaker,text:s});speaker='';s='';};for(const r of data.storyList){const p=r.prop.toLowerCase(),a=r.attributes||{};if(['decision','predicate'].includes(p)){flush();continue;}if(['name','multiline'].includes(p)){const text=clean(a.content),name=clean(a.name);if(!text)continue;if(!name){flush();continue;}if(name!==speaker){flush();speaker=name;}s+=text;}else if(['sticker','subtitle','animtext'].includes(p)&&(a.text||a.content))flush();}flush();return out;}
assert.deepEqual(spans('……我知道。\n你别急！'),['我知道。','你别急！']);assert.equal(spans('……').length,0);
if(process.argv.includes('--selftest')){console.log('Punctuation span tests passed.');process.exit(0);}
const examples=[];
for(const e of JSON.parse(fs.readFileSync(path.join(root,'index.json'),'utf8'))){const buf=fs.readFileSync(path.join(root,'raw/zh_CN/gamedata/story',e.sourcePath+'.json'));assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),e.sourceSha256);for(const t of turns(JSON.parse(buf))){consume('all',t.text);if(['Logos','可露希尔'].includes(t.speaker)){consume(t.speaker,t.text);if(count(t.text)>=80&&count(t.text)<=230&&examples.filter(x=>x.speaker===t.speaker).length<5)examples.push({source:e.sourcePath,...t});}}}
for(const [k,file]of [['southbound','southbound-dialogue-sample.md'],['workshop','workshop-dialogue-sample.md']]){const records=fs.readFileSync(path.join(refs,file),'utf8').split(/\r?\n/).flatMap(l=>{const m=l.match(/^([^：]+)：“(.*)”$/);return m?[{speaker:m[1],text:m[2]}]:[];});let speaker='',s='';for(const t of records){if(speaker!==t.speaker){if(s)consume(k,s);s='';speaker=t.speaker;}s+=clean(t.text);}if(s)consume(k,s);}
const pct=(n,d)=>d?+(100*n/d).toFixed(2):0;
for(const g of Object.values(groups)){g.iYouSpanPercent=pct(g.iYou,g.spans);g.questionSpanPercent=pct(g.question,g.spans);g.twoIYouOfMultiSpanPercent=pct(g.twoIYou,g.eligible);g.commasPer1000Characters=+(1000*g.commas/g.characters).toFixed(2);g.headPercent=Object.fromEntries(heads.map(h=>[h,pct(g.heads[h],g.spans)]));}
assert.equal(groups.all.characters,6074018);assert.equal(groups.workshop.characters,1177);
const report={method:'All indexed raw hashes verified. Same-name turns merge across staging but break at narration/screens/branch/file. Split joined turns by 。！？!?; final fragments count. Leading non-letter/number stripped. No grammar parsing: pronoun opening is first character, not subject; substring head categories may overlap. Ratios describe punctuation spans, not quality or independent samples. Full reading remains paused.',groups,examples};
fs.writeFileSync(path.join(root,'analysis/dialogue-openings-comparison.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({groups,examples},null,2));
