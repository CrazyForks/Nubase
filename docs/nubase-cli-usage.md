# nubase_cli 使用文档

`nubase_cli` 是 Nubase 的本地 stdio MCP bridge。它让 Codex、Claude Code、Cursor、IDEA 等支持 MCP 的 Agent 连接到 Nubase 项目，并通过工具调用操作 Memory、Database、Auth、Storage 和 AI Gateway。

当前打包版本：

```text
nubase_cli@0.1.7
```

本地包位置：

```text
frontend/packages/mcp-bridge/nubase_cli-0.1.7.tgz
```

SHA256：

```text
cb9166e3a0b93b16032c0ed45b6ca947fcada25d90d6368fc5558cd918103e2b
```

## 1. 这个 CLI 能做什么

`nubase_cli` 暴露的是 MCP tools，不是交互式业务命令。Agent 连接后可以调用这些工具：

### 项目总览和文档

- `nubase_overview`：一次性读取当前项目概览，包括能力、数据库 schema、Storage bucket、Auth users、AI Gateway keys、权限状态和下一步建议。
- `nubase_capabilities`：查看当前 Nubase 后端支持哪些能力。
- `nubase_instructions`：返回给 Agent 的安全使用说明。
- `fetch_docs`：读取内置文档，topic 包括 `overview`、`quickstart`、`setup`、`memory`、`database`、`auth`、`storage`、`ai_gateway`、`security`、`all`。

### Memory

- `memory_context`：按任务获取相关长期记忆上下文，适合作为 Agent 开始任务时第一步。
- `memory_search`：搜索长期记忆。
- `memory_write`：写入长期记忆，可用于记录项目约定、设计决策、排障结论。

### Database

- `rest_select`：通过 `/rest/v1` 查询表数据。
- `sql_dry_run`：分析 SQL 风险和语句数量，不执行。
- `sql_execute`：执行 SQL，默认关闭，需要显式开关。
- `db_export_schema`：导出 schema/table DDL。
- `db_list_migrations`：查看通过 `sql_execute` 记录的 schema 变更审计。

### Storage

- `storage_list_buckets`：列出 bucket。
- `storage_create_bucket`：创建 bucket，默认关闭，需要 admin write 开关。
- `storage_delete_bucket`：删除 bucket，默认关闭，需要 admin write 开关。

### Auth

- `auth_list_users`：列出用户。
- `auth_create_user`：创建用户，默认关闭，需要 admin write 开关。
- `auth_delete_user`：删除用户，默认关闭，需要 admin write 开关。

### AI Gateway

- `gateway_list_keys`：列出 `nbk_` gateway keys。
- `gateway_issue_key`：签发 AI Gateway key，默认关闭，需要 admin write 开关。
- `gateway_revoke_key`：吊销 AI Gateway key，默认关闭，需要 admin write 开关。
- `gateway_usage`：查看 token、请求数、费用等使用概览。

Nubase 当前没有 serverless/edge function runtime，所以 CLI 不提供函数部署工具。

## 2. 安装和授权

### 从本地 tgz 安装

```bash
npm install -g /Users/ji/IdeaProjects/nubase_open/frontend/packages/mcp-bridge/nubase_cli-0.1.7.tgz
```

安装后可直接运行：

```bash
nubase_cli authorize \
  --agent-id codex
```

命令会打印一个授权 URL。打开 URL，登录 Studio，选择项目并批准。批准后 CLI 会写入：

```text
.nubase/config.json
```

后续 MCP server 启动时，如果没有设置 `NUBASE_PROJECT_KEY`，会自动读取这个授权配置。

### 如果发布到 npm 后使用

```bash
npx -y nubase_cli@latest authorize \
  --agent-id codex
```

### `npm install` 和 `npx` 的区别

`npm install` 是安装依赖：

```bash
npm install nubase_cli@latest
```

这会把包安装到当前项目的 `node_modules`，适合 SDK/library 场景，例如 `npm install @insforge/sdk@latest` 后在代码里 `import` 使用。

`nubase_cli` 更适合作为命令行工具/MCP server 使用，所以推荐 `npx`：

```bash
npx -y nubase_cli@latest install-skills
```

`npx` 会下载并直接执行这个包里的命令，不需要用户先全局安装。`@latest` 表示始终使用 npm 上最新发布版本；`-y` 表示跳过 npx 的确认提示。

### 安装 Agent skills

CLI 包里自带 Nubase skill，可以安装到当前项目：

```bash
npx -y nubase_cli@latest install-skills
```

默认行为：

- 写入用户级 `~/.claude/skills/nubase/**`
- 写入用户级 `~/.codex/skills/nubase/**`
- 复制本地 MCP bridge 到当前项目 `.nubase/mcp-bridge/**`
- 当 target 包含 `claude` 时，创建或合并项目 `.mcp.json`，注册 `nubase` stdio MCP server
- 启动浏览器授权，授权结果保存到当前项目 `.nubase/config.json`
- 自动把 `.nubase/` 加入当前项目 `.gitignore`

安装后需要重启 Claude Code，进入项目后运行 `/mcp` 确认 `nubase` connected。

target 可选：

- `codex`：写入 `~/.codex/skills/nubase/**`
- `claude`：写入 `~/.claude/skills/nubase/**`
- `both`：两个都写入

如果希望写入当前项目 skill 目录：

```bash
npx -y nubase_cli@latest install-skills --skills-scope project
```

如果只想安装 skill，不做浏览器授权：

```bash
npx -y nubase_cli@latest install-skills --no-authorize
```

如果只想安装 skill，不写 MCP 配置：

```bash
npx -y nubase_cli@latest install-skills --no-mcp
```

如果还想同时为 Codex 写项目级 `.codex/config.toml`：

```bash
npx -y nubase_cli@latest install-skills --mcp both
```

## 3. 环境变量

最常用：

```bash
NUBASE_URL=https://nubase.ai
NUBASE_CONFIG=.nubase/config.json
NUBASE_PROJECT_KEY=YOUR_PROJECT_SERVICE_ROLE_OR_PROJECT_KEY
NUBASE_AGENT_ID=codex
```

可选上下文：

```bash
NUBASE_USER_JWT=USER_ACCESS_TOKEN
NUBASE_USER_ID=USER_UUID
NUBASE_RUN_ID=feature-123
```

安全开关：

```bash
# 默认 false。开启后 sql_execute 才能执行 SQL。
NUBASE_ALLOW_SQL_EXECUTE=true

# 默认 false。drop/truncate 等危险 SQL 仍会被拦截。
NUBASE_ALLOW_DANGEROUS_SQL=false

# 默认 false。开启后才允许创建/删除 bucket、创建/删除用户、签发/吊销 gateway key。
NUBASE_ALLOW_ADMIN_WRITE=true

# 默认 true。schema-changing sql_execute 会写入 nubase.migrations 审计表。
NUBASE_RECORD_MIGRATIONS=true
```

建议：日常给 Agent 使用时只开只读能力；需要改 schema 时先让 Agent 调 `sql_dry_run`，确认后再临时开启 `NUBASE_ALLOW_SQL_EXECUTE=true`。

## 4. 在 Codex 中使用

Codex 使用 `~/.codex/config.toml` 配置 MCP server。添加：

```toml
[mcp_servers.nubase]
command = "node"
args = ["/absolute/project/path/.nubase/mcp-bridge/dist/src/index.js"]
startup_timeout_sec = 30

[mcp_servers.nubase.env]
NUBASE_AGENT_ID = "codex"
NUBASE_CONFIG = ".nubase/config.json"
```

如果已经执行过 `nubase_cli authorize` 或 `install-skills` 授权，可以不写 `NUBASE_PROJECT_KEY`，CLI 会读取项目 `.nubase/config.json`。旧版 `~/.nubase/config.json` 仍作为兼容 fallback。

如果要手动配置 key：

```toml
[mcp_servers.nubase.env]
NUBASE_AGENT_ID = "codex"
NUBASE_URL = "https://nubase.ai"
NUBASE_PROJECT_KEY = "YOUR_PROJECT_KEY"
```

需要允许 SQL 或 admin 写操作时再加：

```toml
NUBASE_ALLOW_SQL_EXECUTE = "true"
NUBASE_ALLOW_ADMIN_WRITE = "true"
```

启动 Codex 后，用 `/mcp` 检查 `nubase` 是否连接成功。

推荐给 Codex 的第一句话：

```text
使用 nubase MCP。先调用 nubase_overview 查看项目状态；需要上下文时调用 memory_context；改数据库前先 sql_dry_run，不要直接执行危险 SQL。
```

## 5. 在 Claude Code 中使用

Claude Code 可以用命令添加 stdio MCP server：

```bash
claude mcp add nubase --transport stdio --scope project \
  -e NUBASE_AGENT_ID=claude-code \
  -e NUBASE_CONFIG="$PWD/.nubase/config.json" \
  -- npx -y nubase_cli@latest
```

如果没有提前 `authorize`，也可以直接传 key：

```bash
claude mcp add nubase --transport stdio --scope project \
  -e NUBASE_AGENT_ID=claude-code \
  -e NUBASE_PROJECT_KEY=YOUR_PROJECT_KEY \
  -- npx -y nubase_cli@latest
```

也可以在项目根目录写 `.mcp.json`。更推荐用 `install-skills` 自动生成，因为它会先复制 `.nubase/mcp-bridge`：

```json
{
  "mcpServers": {
    "nubase": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/absolute/project/path/.nubase/mcp-bridge/dist/src/index.js"
      ],
      "env": {
        "NUBASE_AGENT_ID": "claude-code",
        "NUBASE_CONFIG": "/absolute/project/path/.nubase/config.json"
      }
    }
  }
}
```

进入 Claude Code 后用：

```text
/mcp
```

确认 `nubase` 已连接。

推荐给 Claude Code 的第一句话：

```text
Use the nubase MCP server. First call nubase_overview. Use memory_context for relevant project memory. Before schema changes, run sql_dry_run and explain the risk.
```

## 6. 常见工作流

### 开始一个项目任务

1. Agent 调 `nubase_overview`
2. Agent 调 `memory_context` 获取历史上下文
3. 如果涉及数据库，调 `db_export_schema`
4. 如果要改 schema，先 `sql_dry_run`
5. 确认后再 `sql_execute`
6. 完成后用 `memory_write` 记录关键决策

### 只读排查

允许默认配置即可，不开启写开关。Agent 可以：

- 查 schema
- 查 bucket
- 查 auth users
- 查 gateway keys 和 usage
- 搜索 memory

### 允许 Agent 做管理操作

需要显式添加：

```bash
NUBASE_ALLOW_ADMIN_WRITE=true
```

然后 Agent 才能调用：

- `storage_create_bucket`
- `storage_delete_bucket`
- `auth_create_user`
- `auth_delete_user`
- `gateway_issue_key`
- `gateway_revoke_key`

## 7. 打包和验证命令

```bash
cd /Users/ji/IdeaProjects/nubase_open/frontend
pnpm --filter nubase_cli typecheck
pnpm --filter nubase_cli build
pnpm --filter nubase_cli test
pnpm --filter nubase_cli pack:check

cd packages/mcp-bridge
npm_config_cache=../../.npm-cache npm pack
```

当前验证结果：

- typecheck 通过
- build 通过
- test 通过：32 条测试全部通过，包含浏览器授权 callback 的 CORS 预检、POST、项目级授权配置、用户级 skill、`.mcp.json` 和 `.codex/config.toml` 注册/合并
- pack:check 通过
- 最终产物：`frontend/packages/mcp-bridge/nubase_cli-0.1.7.tgz`

## 8. 常见问题

### `http://127.0.0.1:<port>/callback` 报跨域

这是 Studio 页面从 `https://nubase.ai/studio` 向 CLI 临时 localhost callback 发起授权回写时触发的浏览器 CORS 预检。`nubase_cli@0.1.4` 及以上已支持 `OPTIONS /callback`，并返回 `Access-Control-Allow-Origin: *` 和 `Access-Control-Allow-Private-Network: true`。

处理方式：

```bash
npx -y nubase_cli@latest install-skills
```

如果 npm 还没有发布新版，先用本地包测试：

```bash
npm install -g /Users/ji/IdeaProjects/nubase_open/frontend/packages/mcp-bridge/nubase_cli-0.1.7.tgz
nubase_cli install-skills
```

### Claude 提示 MCP tools 没连接

这说明只安装/授权了 CLI，但当前 Claude Code 会话没有加载 MCP server。`nubase_cli@0.1.7` 起，`install-skills` 会默认写项目 `.mcp.json`，并使用本地 `.nubase/mcp-bridge` 启动，避免每次 Claude 重连都执行 `npx @latest`：

```json
{
  "mcpServers": {
    "nubase": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/project/path/.nubase/mcp-bridge/dist/src/index.js"],
      "env": {
        "NUBASE_AGENT_ID": "claude-code",
        "NUBASE_CONFIG": "/absolute/project/path/.nubase/config.json"
      }
    }
  }
}
```

处理方式：

```bash
npx -y nubase_cli@latest install-skills
```

然后重启 Claude Code，进入项目后运行：

```text
/mcp
```

确认 `nubase` 显示 connected。

### Claude 重连提示 30000ms timeout

如果 `.mcp.json` 里还是：

```json
{
  "command": "npx",
  "args": ["-y", "nubase_cli@latest"]
}
```

Claude 每次连接都可能等待 npm registry，超过 30 秒就会 timeout。重新执行：

```bash
npx -y nubase_cli@latest install-skills --no-authorize
```

新的 `.mcp.json` 会改成本地启动：

```json
{
  "command": "node",
  "args": ["/absolute/project/path/.nubase/mcp-bridge/dist/src/index.js"]
}
```

## 9. 发布到 npm

确认 package 后执行：

```bash
cd /Users/ji/IdeaProjects/nubase_open/frontend/packages/mcp-bridge
npm publish --access public
```

发布后用户可以用：

```bash
npx -y nubase_cli@latest
```

MCP 配置中的 args 也可以改成：

```json
["-y", "nubase_cli@latest"]
```
