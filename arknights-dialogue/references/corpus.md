# 本地语料与检索

快照：`D:/game/References/Arknights/snapshot-2026-10-13`。来源仓库为 https://github.com/3aKHP/arknights-data-pipeline ，ASTR 上游为 https://github.com/050644zf/ArknightsStoryJson 。游戏原文版权属于鹰角及相关权利人。

## 已有内容与边界

源版本 `26-10-08-04-51-28-56071834`；2,040 个剧情文件，包括 427 个主线、1,212 个活动、394 个密录、5 个集成战略独立脚本及 2 个其他脚本。剧情回顾索引的 2,032 条不同路径在此快照内无缺失；此项只说明索引覆盖，不证明游戏所有文本完整。

`index.json` 给出 `eventName`、`storyName`、`category`、`sourcePath`、`readablePath` 和源文件哈希。`readable/` 保留说话人、旁白、字幕、选项与分支，移除了演出控制和富文本。`raw/zh_CN/gamedata/story/` 保存原始 JSON。故事的音乐、立绘、镜头时间及实际路线须查原 JSON 或游戏证据，可读版不能证明演出效果。

`raw/zh_CN/gamedata/excel/` 另有干员档案、语音和集成战略事件等数据表，尚未转换入剧情合集。LLM 生成的 `summaries.json` 与 `event_summaries.json` 不用作原作风格证据。2026-10-08 之后的更新及游戏外文本未确认覆盖。

## 只读工具

全量结构统计、已读文件及尚未完整阅读的范围见 [study-status.md](study-status.md)。分析脚本遍历原 JSON，检索工具只用于定位和读取，不会自动理解篇章。

`scripts/corpus.cjs` 无第三方依赖。通常先列出合适的篇章，再取一个有限的上下文窗口。它不会执行语料内容，也不会改写快照。

```powershell
node "C:/Users/pc/.codex/skills/arknights-dialogue/scripts/corpus.cjs" list --event "孤星" --limit 24
node "C:/Users/pc/.codex/skills/arknights-dialogue/scripts/corpus.cjs" list --event "尘影余音" --speaker "黑键" --limit 24
node "C:/Users/pc/.codex/skills/arknights-dialogue/scripts/corpus.cjs" list --category "干员密录" --title "关键词"
node "C:/Users/pc/.codex/skills/arknights-dialogue/scripts/corpus.cjs" read --source "activities/act25side/level_act25side_07_beg" --start 65 --lines 55
```

`list` 的篇章、标题和类别作包含匹配，多个条件需同时满足；`--speaker` 则按原 JSON 的姓名标签精确匹配，返回该姓名对白记录数，不合并别名、伪装名或匿名标签。它适合找到同一人物的多个文件，再完整阅读并比较关系、情绪、时间段；检索结果不等于人物分析。省略过滤条件可浏览目录。`read` 的 `--source` 必须是目录中的精确 sourcePath。`--start` 从 1 起，默认读取 60 行，最多 200 行。库搬迁时两个命令都可传 `--root "新的快照目录"`。

可用 `rg -n -F` 在指定篇章目录搜索角色名或短语，再扩展上下文。不要为普通写作任务一次加载千万字符合集，也不把分支连排中相邻的句子假定为相同路线。

本机若 `node` 不在 PATH，使用 `C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`；PowerShell 的带引号可执行程序路径需用 `&` 调用。无需启动引擎、安装工程依赖或改动全局配置。
