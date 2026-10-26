const fs=require('fs'),path=require('path');
const dir=path.join(require('./corpus-root.cjs').resolveCorpusRoot(), 'analysis'),r=JSON.parse(fs.readFileSync(path.join(dir,'dialogue-short-lengths.json'),'utf8'));
const labels={all:'全量',mainline:'主线',activities:'活动',operatorRecords:'干员密录',chapter13:'第13章',chapter14:'第14章',twoSpeakerSegments:'双人段',canonLogos:'原文Logos',canonClosure:'原文可露希尔',southbound:'南行',workshop:'工务室',broadcast:'广播',theatre:'剧院'};
const focus=['all','mainline','twoSpeakerSegments','southbound','workshop','broadcast','theatre'];
let md='# 1—10字逐字数统计与复核\n\n沿用整轮拼合后的标点句段：按。！？!?切分，省略号/破折号不单独结束，尾部文字仍计一段。字数为Unicode文字/数字，去姓名、标点、空白、富文本；不等于语法句数。原文401410句段，其中1—10字175656段，44句段的剧院对照来自80句段。0字沉默不进入1字，另在长度总报告记录。\n\n2040原文件哈希验证，13组逐字数比较。普通表达归一化去标点后排序，所以同字不同语气可能合并。字数本身不决定表达任务；问号/叹号/省略号比例可以重叠。无自动语义分类。原文混合题材，四篇样本很短，1次在剧院就是1.25个百分点；不设置配额或宣称统计显著性。\n\n## 每一种字数：句段次数\n\n|字数|'+focus.map(k=>labels[k]).join('|')+'|\n|---|'+focus.map(()=> '---:').join('|')+'|\n';
for(let n=1;n<=10;n++)md+='|'+n+'|'+focus.map(k=>r.groups[k].exactLengths[n].count).join('|')+'|\n';
md+='\n## 占各组全部句段的比例\n\n|字数|'+focus.map(k=>labels[k]).join('|')+'|\n|---|'+focus.map(()=> '---:').join('|')+'|\n';
for(let n=1;n<=10;n++)md+='|'+n+'|'+focus.map(k=>r.groups[k].exactLengths[n].percentOfAllSentences+'%').join('|')+'|\n';
md+='\n## 全量：位置、标点与后续\n\n独立一轮、轮首、轮中、轮尾是互斥四类。一轮只有一个句段归独立一轮，不再次归首/尾。后续长句只比较同一轮确有后一句的位置。\n\n|字数|独立一轮%|轮首%|轮中%|轮尾%|含问号%|含叹号%|含省略号%|后续句段平均字数|后续句段>10字%|轮结束后下轮平均字数|\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n';
for(let n=1;n<=10;n++){const b=r.groups.all.exactLengths[n];md+='|'+[n,...Object.values(b.positionPercent),b.questionPercent,b.exclamationPercent,b.ellipsisPercent,b.nextSentence.mean,b.nextSentence.over10Percent,b.nextTurnAfterEnd.mean].join('|')+'|\n';}
md+='\n## 中文口径复核\n\n保留只含汉字的句段作为敏感性检查，排除含字母或数字的整句段，不把它们删字重算。专名仍可能存在；纯汉字不等于自然语言句法已清洗。\n\n|字数|原口径次数|纯汉字次数|占所有纯汉字句段%|\n|---|---:|---:|---:|\n';
for(let n=1;n<=10;n++){const b=r.groups.all.exactLengths[n];md+='|'+[n,b.count,b.pureHanCount,b.pureHanPercentOfAllPureHanSentences].join('|')+'|\n';}
const analysis={
1:'原文常见归一化表达有嗯、啊、好，既可以独立回应，也可以给后续发言开头。剧院两处嗯都在轮首，随后还有内容，数量并不高。保留口气的差别，不把一字句当成一句废话，也不强制补语气词。',
2:'原文是的、没错、谢谢、是吗等表明回应任务多样。剧院5处包括不用、喊名、洗过、算了、给我，分别承担拒绝、施压、辩解、转移及请求；不能统一延长。只需检查洗过及给我是否又构成过于准确的笑点兑现。',
3:'原文为什么、怎么了、我知道、对不起等常见，但同字数任务不同。剧院4处全部是轮首：听见了、脚麻了、还没完、等一下。都能引出后话，不是4次独立短回复；反复先用一短段报态度/状态再说明，才是应回读的路径。',
4:'原文20532段，常见完整短问及认识回应，但最常见的单个归一化表达也不到本档1%，不是只有固定模板。剧院7段、8.75%，有身体限制、认可名词、提醒别人情绪、未归还物件，也有她没揍你—我跑得快等笑点链。高占比定位需要回读的片段，不意味着7段全错。',
5:'剧院4段、5%，与全量4.31%差别不足一条样本。票是我挑的直接承担窘迫；那首我听过位于轮中、进入回忆；先不说公主改换话题；你怎么回答是递问。最后一种要查是否故事本可自行展开，不把另外三种一同合并。',
6:'剧院7段、8.75%，高于全量4.55%。便宜的那一档、可你刚才笑了、喜欢他的披风先给一句判断再展开，重复结构可能比同为6字更关键；又记回票上了属于回扣；公主唱的时候以破折号结束，是被截断的话，不是假称完整语法句。',
7:'剧院5段，包含轮尾补充和轮首安排。王子倒下的时候是前一句的时间限定，单独说可加重责问，但不能每次都拆主干与限定；他走出来你走了有对照，也会使对白过于机敏。按语境决定保留停顿或重新连接。',
8:'剧院5段，纠正披风、换座位提议、询问偏好及打断等都有具体任务。不是布是他的披风虽短，信息是完整的；不因低于10字便扩写解释。注意整个交流是否长期靠纠正与安排维持，不能只看这一句。',
9:'剧院仅1段，旁边接的那个唱得好，明显低于全量4.10%。它承担故事中的评价并兑现笑点，但缺9字句不是应补齐的空档。原文9字档最常见归一化表达仅0.07%，组合多样，不能规定9字应承载某一种情绪。',
10:'剧院4段、5%，接近全量3.99%。既有轮首判断、轮尾补充，也有回忆内部时间推进。后来答应她下回认真听本可与后面可灯一亮形成连续让步；这类句间关系比凑到更长重要。原文10字句段约47.59%在轮中/轮尾，不全是独立短回答。'
};
for(let n=1;n<=10;n++){const a=r.groups.all.exactLengths[n],t=r.groups.theatre.exactLengths[n];md+='\n## '+n+'字：单独分析\n\n原文'+a.count+'段，占全部句段'+a.percentOfAllSentences+'%，占十字以内句段'+a.percentOfShortSentences+'%；剧院'+t.count+'段，占全部句段'+t.percentOfAllSentences+'%。\n\n'+analysis[n]+'\n\n原文归一化高频表达前五：'+a.topNormalizedTexts.slice(0,5).map(x=>x.text+'（'+x.count+'次，占本档'+x.percentOfThisLength+'%）').join('、')+'。专名、笑声、粗口标签及非汉字表达不当成通用句法范例。\n\n剧院全部本档句段：\n\n|文本|位置|同轮前句|同轮后句|\n|---|---|---|---|\n';for(const ex of t.examples)md+='|'+[ex.text,ex.position,ex.previous||'—',ex.next||'—'].map(x=>x.replace(/\|/g,'／').replace(/\n/g,' ')).join('|')+'|\n';}
md+='\n## 单条与完整发言的精确1—10字对照\n\n不能把一个长发言中的3字开场当成一个3字轮次。\n\n|字数|原文单条次数|原文整轮次数|剧院单条次数|剧院整轮次数|\n|---|---:|---:|---:|---:|\n';for(let n=1;n<=10;n++){const a=r.groups.all.exactLengths[n],t=r.groups.theatre.exactLengths[n];md+='|'+[n,a.frameCount,a.turnCount,t.frameCount,t.turnCount].join('|')+'|\n';}
md+='\n## 本轮修改方向\n\n剧院44个短段不是一种问题：1字开场保留；4/6字偏高优先回读；5/8/10字任务不同；9字少不补配额。原文一字常有固定回应，字数增加后完整表达的集中度迅速降低，不能为每个字数编一套公式。对同轮先短判断后解释，检查主干与限定是否该连续；对跨人短应答链，检查递问和笑点是否过密。所有修改仍回到人物当下意图、注意和句中情绪，不按数字删字。\n\n机器结果dialogue-short-lengths.json包含13组全部精确计数、分母、位置、标点、相邻长度、归一化频次和参考上下文。原始计数与上一轮分桶精确核对，不从四舍五入的百分比反推次数。复现脚本dialogue-short-lengths.cjs、dialogue-short-report.cjs。精读账本不变。\n';
fs.writeFileSync(path.join(dir,'dialogue-short-lengths-report.md'),md);console.log(JSON.stringify({output:path.join(dir,'dialogue-short-lengths-report.md'),lengths:10,groups:13}));
