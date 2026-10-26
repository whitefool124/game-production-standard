# 工具、原文与历史

配置文件为skill根目录corpus.config.json，root可为绝对路径或相对skill目录路径。环境变量ARKNIGHTS_CORPUS_ROOT可覆盖；部分命令原有显式root参数继续有效。Node.js 18+，无需npm依赖。

在skill目录运行：
```powershell
node scripts/cases.cjs --task 思辨
node scripts/corpus.cjs list --event 怀黍离 --limit 3
node scripts/corpus.cjs read --source Obt/main/level_main_13-04_beg --start 55 --lines 34
node scripts/lexicon.cjs --term 凋敝
node scripts/audit-dialogue.cjs --sample 绝对路径.md --out 报告前缀
node scripts/audit-dialogue.cjs --selftest
node scripts/validate-v2.cjs
```

cases只作关键词筛选，不自动判断最佳原文。audit统计署名对白，不测第三人称质量；篇幅很短、体裁不同、字串未分词及分支重复会影响对照。不用正则结果认证人格、潜台词、哲理或好读。

## 研究时才读取

- 人物与世界：character-and-world.md；逐句：sentence-craft.md；叙述：third-person-craft.md；长论辩：extended-argument.md。
- 语料范围/来源：corpus.md与语料README.md；账本：study-status.md、full-reading.md。旧数字有过口径修订，查报告方法再比较。
- 统计明细：research-index.md所列报告和旧脚本。保留原始口径，不合并不兼容分母。
- 失败史、草稿及有限认可稿：v2-history-index.json。旧参考未删除或移动，以保持脚本和历史链接可复现；不在默认写作路径中将它们全部读入。

已分享2026-10-19包保持不变。V2统一从源目录发布，分享时只将配置root设成包内相对路径，不另改脚本。安装副本后修改这一处配置即可。历史报告里的原作者路径是证据，不是运行依赖。

语料来源版本2026-10-08；扫描不等于精读，历史327/2040记录不代表接收者已读。V2不会自动续读或更改账本。来源包中的LLM摘要不作为原文风格样本。
