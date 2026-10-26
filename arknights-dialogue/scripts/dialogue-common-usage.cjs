// Transparent character/substring/ngram counts. No word segmentation or POS inference.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=require('./corpus-root.cjs').resolveCorpusRoot(),refs=path.resolve(__dirname,'../references');
const categories={
认识:'知道 觉得 以为 明白 记得 忘记 想到 想起 相信 发现 听见 看见 听说 看来 看起来 说不定 恐怕 也许 大概 好像 似乎 可能 未必 果然 显然 确实',
指称范围:'这个 那个 这些 那些 这种 那种 这样的 这么说 这么做 也就是说 不管 无论 无论如何 就这样 还好 最好 更好 一切 一旦 一共 其他 有些 有点 某种 一样 不同',
意愿能力:'不要 不想 没法 没能 无法 能够 打算 决定 接受 拒绝 失去 得到 记住 忘了 剩下 活着 活下去 死去 没什么 没想到 没必要 来不及',
经验因果:'当时 之前 之后 今天 每天 过去 未来 一直以来 死亡 生命 命运 选择 责任 意义 理由 目的 机会 结果 原因 关系 情况 代价 力量 生活 世界 战争 故事 计划 安全 危险 真正 重要 简单 认真 清楚 确认 保证 实际 有用',
承接限定:'如果 要是 倘若 只要 除非 就算 即使 虽然 尽管 但是 可是 不过 然而 因为 所以 因此 既然 毕竟 反而 甚至 而且 何况 只是 只不过 至少 当然 本来 原来 其实 总之 不然 否则 直到',
时间程度:'已经 一直 仍然 仍旧 终于 突然 马上 立刻 现在 刚才 刚刚 方才 以前 后来 以后 明天 昨天 从来 总是 有时候 多少 一点 一些 一会儿 一下 稍微 实在 特别 十分 非常 这么 那么 这样 那样',
回应关系:'什么 怎么 为什么 怎么会 凭什么 难道 究竟 到底 是吗 对吧 没错 没关系 算了 等等 好吧 对不起 谢谢 抱歉 请问 不用 不必 不能 不会 没有 不是 可以 应该 必须 需要 愿意 希望 担心 害怕 可惜 可怜 自己 大家 你们 我们 他们',
常见动作对象:'说 告诉 问 回答 听 看 想 等 来 去 走 回去 回来 留下 离开 带走 拿 放 做 找 帮 忙 站 坐 门 人 名字 东西 事情 地方 办法 问题 时间 声音 工作 朋友 家 孩子 一个人 所有人 每个人',
常用单字:'的 了 是 不 没 在 有 就 也 还 都 只 才 又 再 先 却 便 而 把 让 对 给 要 能 会 得 着 过 吧 呢 啊 嗯 哦 嘛 呀 啦 呗 唉 喂'};
const terms=[...new Set(Object.values(categories).flatMap(x=>x.split(' ')))];
const clean=s=>String(s??'').replace(/<[^>]*>/g,'').replace(/\{@nickname\}/g,'博士').replace(/\\n/g,'\n').trim();
const count=s=>(s.match(/[\p{L}\p{N}]/gu)||[]).length;
const empty=()=>({frames:0,chars:0,characters:new Map(),ngrams:new Map(),terms:new Map(terms.map(t=>[t,{count:0,frames:0,files:new Set(),speakers:new Set()}]))});
const groups=Object.fromEntries(['all','mainline','canonLogos','canonClosure','southbound','workshop','broadcast'].map(k=>[k,empty()]));
function grams(s){const out=[];for(const span of s.match(/\p{Script=Han}+/gu)||[]){const cs=Array.from(span);for(const size of [2,3,4])for(let i=0;i<=cs.length-size;i++)out.push(cs.slice(i,i+size).join(''));}return out;}
function consume(b,text,file,speaker){if(!count(text))return;b.frames++;b.chars+=count(text);for(const c of text.match(/[\p{L}\p{N}]/gu)||[])b.characters.set(c,(b.characters.get(c)||0)+1);for(const t of grams(text))b.ngrams.set(t,(b.ngrams.get(t)||0)+1);for(const t of terms){const n=text.split(t).length-1;if(n){const r=b.terms.get(t);r.count+=n;r.frames++;r.files.add(file);r.speakers.add(speaker);}}}
assert(!grams('知道，自己').includes('道自'));assert(grams('不知道').includes('知道'));
const probe=empty();consume(probe,'人。人','one','甲');assert.equal(probe.terms.get('人').count,2);assert.equal(probe.terms.get('人').frames,1);assert.equal(probe.terms.get('人').files.size,1);
if(process.argv.includes('--selftest')){console.log('Boundary, overlap, frequency and dispersion tests passed.');process.exit(0);}
for(const e of JSON.parse(fs.readFileSync(path.join(root,'index.json'),'utf8'))){const buf=fs.readFileSync(path.join(root,'raw/zh_CN/gamedata/story',e.sourcePath+'.json'));assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),e.sourceSha256);for(const r of JSON.parse(buf).storyList){if(!['name','multiline'].includes(r.prop.toLowerCase()))continue;const speaker=clean(r.attributes?.name),text=clean(r.attributes?.content);if(!speaker)continue;consume(groups.all,text,e.sourcePath,speaker);if(e.category==='主线剧情')consume(groups.mainline,text,e.sourcePath,speaker);if(speaker==='Logos')consume(groups.canonLogos,text,e.sourcePath,speaker);if(speaker==='可露希尔')consume(groups.canonClosure,text,e.sourcePath,speaker);}}
for(const [key,file]of [['southbound','southbound-dialogue-sample.md'],['workshop','workshop-dialogue-sample.md'],['broadcast','last-broadcast-sample.md']])for(const l of fs.readFileSync(path.join(refs,file),'utf8').split(/\r?\n/)){const m=l.match(/^([^：]+)：“(.*)”$/);if(m)consume(groups[key],clean(m[2]),file,m[1]);}
assert.equal(groups.all.chars,6074018);assert.equal(groups.workshop.chars,1177);assert.equal(groups.southbound.chars,1542);
const rate=(n,d)=>d?+(n*10000/d).toFixed(2):0;
function finish(b){return {frames:b.frames,characters:b.chars,terms:Object.fromEntries([...b.terms].map(([t,r])=>[t,{count:r.count,per10000:rate(r.count,b.chars),frames:r.frames,files:r.files.size,exactDisplayNames:r.speakers.size}])),allCharacters:[...b.characters].sort((a,b)=>b[1]-a[1]).map(([text,n])=>({text,count:n,per10000:rate(n,b.chars)})),topNgrams:[...b.ngrams].sort((a,b)=>b[1]-a[1]).slice(0,2000).map(([text,n])=>({text,count:n,per10000:rate(n,b.chars)}))};}
const output={method:'All raw hashes verified. Dialogue-only letters/numbers denominator; raw single characters, fixed exact substrings with independent overlapping counters, and contiguous Han 2/3/4-grams. No tokenizer/POS/quality inference. Files and exact display names are dispersion counts, not independent speakers/events; aliases/branches/reprints can recur. Full reading not advanced. No aggregate merging of original samples.',categories,termCount:terms.length,groups:Object.fromEntries(Object.entries(groups).map(([k,b])=>[k,finish(b)]))};
const dir=path.join(root,'analysis');fs.writeFileSync(path.join(dir,'dialogue-common-usage.json'),JSON.stringify(output,null,2));
const names=['all','mainline','southbound','workshop','broadcast'];
const head='| 表达 | 全量 | 主线 | 南行前夜 | 工务室的锁 | 广播 | 广播次数 |\n|---|---:|---:|---:|---:|---:|---:|\n';
let md='# 常用字词与搭配扩展统计\n\n所有2040文件、6074018字；新增'+terms.length+'项固定表达。频率单位为次/万字，原文字数含字母及数字，排除姓名/标点/空白。词组独立匹配可重叠，不是完整中文分词；单字也不自动视为虚词或语气词。语义精读仍暂停327/2040。\n\n三份原创分开分析；广播'+groups.broadcast.chars+'字、'+groups.broadcast.frames+'条对白。短样本的1—2次不因归一化倍数高而自动有问题。主线及同名角色辅助排除体裁差异，不能作为同场景因果对照。\n';
for(const [cat,list]of Object.entries(categories)){md+='\n## '+cat+'\n\n'+head;for(const t of list.split(' '))md+='| '+t+' | '+names.map(k=>output.groups[k].terms[t].per10000).join(' | ')+' | '+output.groups.broadcast.terms[t].count+' |\n';}
md+='\n## 自动发现的连续汉字串\n\n二至四字串可能是词、词片段或跨词组合；不跨标点/对白记录。下面只列每篇出现至少3次的前20项，并非词典词语。地名、专业名词和同一个对象反复出现，也不能直接判为赘词。\n';
for(const k of ['southbound','workshop','broadcast'])md+='\n'+k+'：'+output.groups[k].topNgrams.filter(x=>x.count>=3).slice(0,20).map(x=>x.text+'('+x.count+')').join('、')+'。\n';
md+='\n完整频次、所有单字排序、每项覆盖文件与姓名数以及同名角色结果在 dialogue-common-usage.json。检查脚本为 scripts/dialogue-common-usage.cjs。\n';fs.writeFileSync(path.join(dir,'dialogue-common-usage-report.md'),md);
// Open-vocabulary discovery: retain every recurrent Han 2/3/4-gram (>=20 raw occurrences).
// This frequency threshold is an export bound, not a definition of valid words or good style.
const groupNames=['all','mainline','canonLogos','canonClosure','southbound','workshop','broadcast'];
const recurrent=[];for(const [text,n]of groups.all.ngrams)if(n>=20)recurrent.push({text,count:n});
recurrent.sort((a,b)=>b.count-a.count);
const columns=['text',...groupNames.flatMap(k=>[k+'_count',k+'_per10000'])];
const gramRow=t=>[t,...groupNames.flatMap(k=>{const n=groups[k].ngrams.get(t)||0;return[n,rate(n,groups[k].chars)];})].join('\t');
fs.writeFileSync(path.join(dir,'dialogue-recurrent-ngrams.tsv'),columns.join('\t')+'\n'+recurrent.map(x=>gramRow(x.text)).join('\n'));
const charRow=t=>[t,...groupNames.flatMap(k=>{const n=groups[k].characters.get(t)||0;return[n,rate(n,groups[k].chars)];})].join('\t');
fs.writeFileSync(path.join(dir,'dialogue-all-characters.tsv'),columns.join('\t')+'\n'+output.groups.all.allCharacters.map(x=>charRow(x.text)).join('\n'));
const auto=[];for(const size of [2,3,4])auto.push(...recurrent.filter(x=>Array.from(x.text).length===size).slice(0,500));
fs.writeFileSync(path.join(dir,'dialogue-discovered-candidates.json'),JSON.stringify({method:'Top500 recurrent strings separately for length2/3/4, no segmentation. Recurrent threshold20 occurrences. Counts from full maps, never from truncated sample rankings.',totalRecurrent:recurrent.length,totalCharacterTypes:groups.all.characters.size,candidates:auto.map(x=>({text:x.text,groups:Object.fromEntries(groupNames.map(k=>[k,{count:groups[k].ngrams.get(x.text)||0,per10000:rate(groups[k].ngrams.get(x.text)||0,groups[k].chars)}]))}))},null,2));
console.log(JSON.stringify({termCount:terms.length,characters:groups.all.chars,ngramTypes:groups.all.ngrams.size,recurrentNgrams:recurrent.length,discoveredCandidates:auto.length,output:path.join(dir,'dialogue-common-usage.json')}));
