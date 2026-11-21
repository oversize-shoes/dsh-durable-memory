# DSH Durable Memory

[English](README.md) · [下载插件](https://github.com/oversize-shoes/dsh-durable-memory/releases) · [反馈问题](https://github.com/oversize-shoes/dsh-durable-memory/issues)

给 DeepSeek Harness 增加跨会话的本地长期记忆，让它记住项目约定、稳定偏好和排障经验，在新会话中按需召回。

独立社区插件，MIT 开源。当前为 **0.1.1 预览版**，欢迎试用和反馈。

## 功能

- 通过 DSH 原生存储持久化，关闭会话或重启后仍可读取。
- 全局和工作目录范围隔离，项目记忆不会自动串到其他目录。
- 中文词片段和英文关键词检索，相关记忆在预算内自动注入。
- 模型工具增删改查，支持固定条目、过期时间、去重、来源操作记录和版本冲突保护。

保存由模型调用 `durable_memory` 工具完成，没有后台自动提炼服务；模型未调用工具，就不会新增记忆。无需向量服务或额外 API Key，但召回文本会发送给当前模型供应商并消耗上下文 Token。

## 安装要求

| 项目 | 要求 |
|---|---|
| DSH | **0.2.1-rc.2 或 0.2.2-rc.5**，目前仅声明支持这两个版本 |
| Node.js | **24.9.0+** |
| 包管理器 | DSH 安装插件需要可用的 pnpm |
| 运行方式 | Web 或提供 agents、tools、systemPrompt、storageDomain 的自定义 profile |

先运行 `node --version`、`dsh --version`、`pnpm --version` 检查环境。其他 rc 尚未验证，不建议绕过版本检查。完整 Desktop 安装测试仍待补充。

## 方法一：界面安装

1. 打开 [v0.1.1 发布页](https://github.com/oversize-shoes/dsh-durable-memory/releases/tag/v0.1.1)。
2. 下载 **dsh-durable-memory-0.1.1.tgz**，不要选 GitHub 自动生成的 Source code 压缩包。
3. 在 DSH「插件 → 添加插件」选择文件，或粘贴安装包的本地完整路径。
4. 按提示启用或重启。新会话中应能看到 **durable_memory** 工具。

若工具没出现，先重启整个 DSH 后端，再刷新网页。仅刷新网页不一定加载新插件。

## 方法二：命令安装

Web 版：

```sh
dsh plugin --profile web add "https://github.com/oversize-shoes/dsh-durable-memory/releases/download/v0.1.1/dsh-durable-memory-0.1.1.tgz"
```

网络受限时，从发布页手动下载后安装：

```powershell
dsh plugin --profile web add "C:/Downloads/dsh-durable-memory-0.1.1.tgz"
```

把 `web` 换成你正在运行的实际 profile。Desktop 不一定使用 `desktop` 名称，请看启动配置。安装后用原先的方式重启，例如 `dsh web`。

安装包已包含可执行 JS，不需要编译、没有安装脚本。npm 包名尚未发布，**不要运行 `npm install dsh-durable-memory` 安装插件**。

## 三分钟自测

在有工作目录的会话 A 中发送：

> 请调用 durable_memory 保存为项目记忆：这个项目的测试口令是“蓝鲸松果-731”。告诉我保存结果和 ID。

保持相同工作目录，创建新会话 B：

> 请调用 durable_memory 查询这个项目的测试口令。

预期查到“蓝鲸松果-731”。再尝试：

| 发送内容 | 预期 |
|---|---|
| 把测试口令改为“蓝鲸松果-732” | 先读取 ID/revision，再更新 |
| 列出这个项目的记忆 | 显示条目和版本 |
| 删除刚才的测试口令记忆 | 删除成功，之后不再召回 |
| 保存为全局记忆：我喜欢先看结论，再看解释 | 其他工作目录也可召回 |

测试隔离时要换实际工作目录，改会话标题没有作用。测试完可删除测试条目。

## 范围、数据与隐私

默认文件：`$DSH_HOME/storages/durable_memory.json`。未设置 DSH_HOME 时，Windows 通常为 `%USERPROFILE%/.dsh/storages/durable_memory.json`。自定义存储路由可能改变位置。

项目范围是会话工作目录的真实路径。**同一 Git 仓库的子目录、不同 worktree 默认拥有不同记忆范围**；移动目录也会改变范围。全局记忆在同一 DSH 存储中共享，不是跨设备同步。没有工作目录的会话只能自动召回全局记忆。

插件不增加遥测、云同步或独立模型调用，但召回内容仍会发送给你配置的模型。常见凭据检测不能识别全部秘密，不要保存密码、密钥或敏感业务信息。记忆可能过时，应以当前事实和用户请求为准。

删除、更新或过期只影响后续召回，**不会抹去已有对话日志和备份中的副本**。来源字段仅记录保存操作的会话和序列位置，不是独立核验的事实证据。

## 配置

在插件 loader 行设置，下次重载/重启后生效：

| 字段 | 默认 | 作用 |
|---|---:|---|
| enabled | true | 启用插件 |
| maxEntries | 2000 | 所有范围的总容量，含过期条目 |
| maxContentChars | 2000 | 每条内容 JS 字符长度上限 |
| recallChars | 6000 | 自动召回字符预算，含标题 |
| recallLimit | 8 | 每次搜索/召回最多条数 |

保存工具支持 `tags`、`pinned`、`ttlDays`（0 表示永不过期）。更新/删除需要最新 `id` 和 `revision`，修改全局条目须明确 `scope=global`。容量满时拒绝新增，可用 `list` 查看并删除过期条目。

首次尚无查询时提供预算内的最近/固定记忆，之后按收到的新消息检索。固定条目仍受预算限制。检索基于词面匹配，同义词可能不命中。

## 更新和卸载

更新时重新运行新版本发布页的安装命令，再按提示重启。建议先停止 DSH 并备份记忆文件，无需删除原数据。

```sh
dsh plugin --profile web remove dsh-durable-memory
```

停用/卸载会移除工具与后续注入，文件保留。如要彻底删除内容，还需自行处理已有会话和备份。

## 常见问题

**没有工具？** 检查安装和运行 profile 是否一致，重启后端，并看插件是否加载成功。“已安装”不等于“已加载”。

**新会话没记住？** 确认旧会话实际调用了保存工具、工作目录一致；先明确要求调用搜索，排除模型未主动召回的问题。

**版本不兼容？** 提交准确 `dsh --version`，不要改兼容范围强装。

**找不到 dsh 命令？** 使用安装 DSH 时的启动脚本或 Node CLI 路径，本插件不负责全局安装 DSH。

## 验证与贡献

已针对两个声明版本运行真实 DSH 服务测试，覆盖存储重开、范围隔离、过期、去重、并发修改、损坏数据、工具调度、停用及重新加载。Windows 上还通过官方 CLI 在独立环境安装 tgz，启动完整 DSH 0.2.1-rc.2 Web profile，并由探针确认工具及存储已加载。代理单元测试使用精简替身，完整真实模型和 Desktop 端到端验证仍待补充。提供了 [Windows/Linux CI 配置示例](docs/ci-example.yml)，由于发布工作流需要额外 GitHub 授权，目前尚未启用；本地 Windows 通过不表示 Linux 已通过。

当前不提供后台提炼、语义向量检索、管理面板、修订历史、云同步或多进程共同写入支持。

参见 [贡献指南](CONTRIBUTING.md)、[更新记录](CHANGELOG.md)、[源码机制分析](docs/architecture-analysis.txt) 和 [MIT 许可证](LICENSE)。欢迎提交问题和 PR，日志分享前请移除凭据和私人路径。
