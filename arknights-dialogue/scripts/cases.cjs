const fs=require('fs'),path=require('path');
const args=process.argv.slice(2);
if(args.length && (args.length!==2||args[0]!=='--task'||!args[1]))throw Error('Usage: cases.cjs [--task KEYWORD]');
const all=JSON.parse(fs.readFileSync(path.join(__dirname,'../references/v2-cases.json'),'utf8')).cases;
const matches=args.length?all.filter(x=>x.tasks.some(t=>t.includes(args[1]))):all;
console.log(JSON.stringify({method:'literal task keyword filtering, not semantic ranking',matches:matches.map(x=>({...x,readCommand:`node scripts/corpus.cjs read --source ${x.source} --start ${x.start} --lines ${x.end-x.start+1}`}))},null,2));
