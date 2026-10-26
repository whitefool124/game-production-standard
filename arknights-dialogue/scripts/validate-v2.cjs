const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert'),crypto=require('crypto'),cp=require('child_process');
const skill=path.resolve(__dirname,'..'),resolver=require('./corpus-root.cjs'),root=resolver.resolveCorpusRoot();
const run=(a)=>{const r=cp.spawnSync(process.execPath,a,{encoding:'utf8',cwd:os.tmpdir()});assert.equal(r.status,0,r.stderr||r.stdout);return r.stdout;};
for(const name of fs.readdirSync(__dirname).filter(n=>n.endsWith('.cjs')))run(['--check',path.join(__dirname,name)]);
for(const f of ['SKILL.md','references/v2-workflow.md','references/v2-tools.md'])for(const m of fs.readFileSync(path.join(skill,f),'utf8').matchAll(/\]\(([^)]+)\)/g))if(!/^(https?:|#)/.test(m[1]))assert(fs.existsSync(path.resolve(skill,path.dirname(f),m[1])),m[1]);
const index=JSON.parse(fs.readFileSync(path.join(root,'index.json'),'utf8'));
const cases=JSON.parse(fs.readFileSync(path.join(skill,'references/v2-cases.json'),'utf8')).cases;
for(const c of cases){const e=index.find(e=>e.sourcePath===c.source);assert(e,c.source);const b=fs.readFileSync(path.join(root,'raw/zh_CN/gamedata/story',c.source+'.json'));assert.equal(crypto.createHash('sha256').update(b).digest('hex'),c.sourceSha256);const lines=fs.readFileSync(path.join(root,e.readablePath),'utf8').split(/\r?\n/);assert(c.start>=1&&c.end<=lines.length&&c.start<=c.end);}
assert.equal(JSON.parse(run([path.join(__dirname,'cases.cjs'),'--task','思辨'])).matches.length,1);
run([path.join(__dirname,'corpus.cjs'),'list','--limit','1']);run([path.join(__dirname,'lexicon.cjs'),'--term','凋敝']);run([path.join(__dirname,'audit-dialogue.cjs'),'--selftest']);
// Test a copied resolver/config, not the installed user's configuration.
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'arknights-v2-config-')),scripts=path.join(tmp,'scripts');fs.mkdirSync(scripts);
try{fs.copyFileSync(path.join(__dirname,'corpus-root.cjs'),path.join(scripts,'corpus-root.cjs'));fs.writeFileSync(path.join(tmp,'corpus.config.json'),'\uFEFF'+JSON.stringify({root}));const code=`console.log(require(${JSON.stringify(path.join(scripts,'corpus-root.cjs'))}).resolveCorpusRoot())`;assert.equal(run(['-e',code]).trim(),root);
const previous=process.env.ARKNIGHTS_CORPUS_ROOT;try{process.env.ARKNIGHTS_CORPUS_ROOT=root;assert.equal(resolver.resolveCorpusRoot(),root);process.env.ARKNIGHTS_CORPUS_ROOT=path.join(tmp,'missing');assert.throws(()=>resolver.resolveCorpusRoot(),/Cannot find corpus index/);}finally{if(previous===undefined)delete process.env.ARKNIGHTS_CORPUS_ROOT;else process.env.ARKNIGHTS_CORPUS_ROOT=previous;}
}finally{fs.unlinkSync(path.join(scripts,'corpus-root.cjs'));fs.unlinkSync(path.join(tmp,'corpus.config.json'));fs.rmdirSync(scripts);fs.rmdirSync(tmp);}
console.log(JSON.stringify({status:'OK',contextCases:cases.length,indexedStories:index.length,checks:['syntax','active-links','case-source-hashes','ranges','retrieval','lexicon','audit-selftests','relocated-BOM-config','environment-precedence'],literaryQuality:'not assessed by script'}));
