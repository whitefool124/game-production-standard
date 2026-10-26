# 研究与工具索引

入口统一执行integrated-workflow.md。旧记录提供证据、口径变化与失败，不叠加为配额。2026-10-14核对精读账本327/2040，专项回读和扫描不增加该进度。

|问题|参考|语料analysis内数据/脚本|
|---|---|---|
|讲话、换人、句群|rhythm-and-syntax.md；length-audit-findings.md|dialogue-length-audit-report.md；dialogue-length-audit.cjs|
|十字以内每档|short-length-findings.md|dialogue-short-lengths-report.md；dialogue-short-lengths.cjs|
|常用字词|common-usage-findings.md；open-vocabulary-findings.md|dialogue-common-usage-report.md；dialogue-open-vocabulary-report.md；dialogue-common-usage.cjs|
|句首与认识推进|common-expression-contexts.json|dialogue-openings-report.md；dialogue-openings.cjs|
|局部四五字位置|photo-position-review.md|photo-position-audit.json；photo-position-audit.cjs|
|三场实写、漏词频复查|trials-2026-10-14/review.md；lexical-review.md|writing-trials-2026-10-14.md；writing-trials-lexical-2026-10-14.md|
|语义与具体改句|dialogue-editing-pass.md；writing-iteration.md；close-reading.md|已保存原稿、候选与原文出处|

报告根路径`D:/game/References/Arknights/snapshot-2026-10-13/analysis`，脚本在本skill的scripts。旧分母/双人段口径变化不能当成进步。

统一入口：`node scripts/audit-dialogue.cjs --sample 绝对路径.md --out 报告绝对路径前缀`。同一调用检查词语、句段/停顿、短句位置、局部重复和来源哈希；可附原文文件/可读版选段，参数见脚本。自动提示不等于语义判坏，仍附人工回读。旧专项脚本保留作全库历史复现。

整合后的实际执行与剩余问题见 [同稿联合复核](consolidation-review.md)，成稿见 [照片背面](photo-consolidated-final.md)。

照片后续添词稿仍被用户评价为流水账。重新梳理全段反馈并完整回读四份文本，见 [发言展开专项研究](discourse-study.md)。这修正仅靠删词/添细节的执行偏差，不撤销字词、长度和局部位置的检查，也不认定已解决文风问题。

用户要求寻找外部skill并稳定写出有人情味的中文。已读四份社区SKILL.md，实际采用/舍弃及固定测试处境见 [中文人物声音](human-voice-practice.md)。原始文件在WritingSkills研究目录，未作为四份活动skill安装，不因借鉴自动执行其脚本或代写限制。

全库2040文件6074018文字/数字字符；4510种汉字及65829种重复字串是结构扫描，不表示全量语义研读。301项表达为显式清单，不是完整中文分词。别名、分支、重复剧情与非语言标签影响计数，无模型训练或实机阅读时长验证。
