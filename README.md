# 游戏制作规范 Skill

面向游戏界面、功能文案、程序实现和检查验收的制作规范。核心是图形实用主义、克制文字、真实布局，以及可核实的交付质量。

[技能入口](game-production-standard/SKILL.md)

[完整规范与 22 条检查要求](game-production-standard/references/game-production-standard.md)

[明日方舟对白技能 2.1.0](arknights-dialogue/SKILL.md)（本地源版本日期：2026-10-23）

## 安装

克隆本仓库，将其中的 `game-production-standard` 和 `arknights-dialogue` 文件夹复制到你的 Codex 技能目录，例如用户目录下的 `.codex/skills/`。也可将这两个文件夹安装到所用工具支持的项目技能目录。技能入口使用相对引用。

安装后使用 `$game-production-standard` 调用；保持默认自动发现。是否需要刷新技能列表以当前宿主行为为准。

对白技能也可通过 `$arknights-dialogue` 独立调用，包含写作流程、上下文案例索引、研究记录与无第三方 npm 依赖的检索/校验脚本（Node.js 18+）。历史样稿与阅读账本按原样保留，不代表安装者已读或全部样稿获认可。

### 对白语料配置

本仓库不包含明日方舟原文语料。请自行准备对应快照（语料源版本为 2026-10-08，索引包含 2,040 份剧情），将其放在技能目录相邻的 `corpus/snapshot-2026-10-13/`，或修改 `arknights-dialogue/corpus.config.json` 的 `root`；也可通过 `ARKNIGHTS_CORPUS_ROOT` 环境变量指定。相对路径以 skill 目录为基准。语料结构与来源见 [语料说明](arknights-dialogue/references/corpus.md)。历史研究中的作者电脑路径仅为记录，运行配置不依赖该路径。

准备好语料后，在 `arknights-dialogue` 目录运行 `node scripts/validate-v2.cjs`，检查脚本语法、入口引用、案例原文哈希、检索和配置行为；脚本通过不等于文学质量验收。没有语料时不能声称完成原文检索或案例哈希验证。

## 主要约束

1. 独立控件承担真实布局，禁止空格、空行和人工断行伪排版。
2. 游戏界面禁用圆点与竖线作分隔符。
3. 优先图形、空间与反馈，说明文字按需呈现。
4. 正式布局必须有经过实际审阅的生图参考，或经过实际应用与审阅的适用设计技能。
5. 两条设计路径都未完成，只能交付明确标识的临时原型。正式制作任务不得自行降级后结束。
6. 状态与反馈来自真实数据，检查证据对应实际版本和环境。
7. 所有游戏对白必须采用独立的 `arknights-dialogue` 技能。

## 依赖与范围

本仓库发布制作规范及独立的 `arknights-dialogue` 技能，不捆绑明日方舟原文语料或其他第三方技能。对白任务需安装本仓库提供的 `arknights-dialogue` 并配置所需语料；设计技能路径需提供所选的适用技能，例如 `impeccable`、`ui-design-crafter` 或 `ui-ux-pro-max`。所需依赖缺失时应如实说明，不伪称完成。

规范适用于不同引擎，但字体、分辨率、像素网格、输入方式和性能预算由项目确定。普通按钮、系统提示与日常聊天不套角色对白文风。本规范不等同于平台认证要求。
