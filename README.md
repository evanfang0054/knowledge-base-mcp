# 知识库MCP服务

基于MCP（Model Context Protocol）协议的知识库检索系统，提供与Dify知识库集成的能力。

## 项目介绍

知识库MCP服务是一个轻量级服务，可以通过MCP协议将您的Dify知识库连接到支持MCP的AI助手（如Claude AI）。该服务支持多种传输方式，包括STDIO、HTTP和SSE，适用于不同的应用场景。

### 主要特点

- 支持MCP协议，与Claude等AI助手无缝集成
- 支持解析知识库ID和获取知识库文档的工具
- 支持多种传输方式：STDIO、HTTP和SSE
- 缓存机制提高查询效率
- 支持多知识库同时查询
- 简单易用的API接口

## 技术架构

![Architecture Diagram](./architectureDiagram.dio)

系统由以下主要组件构成：

1. MCP服务器：处理与AI助手的通信
2. Dify服务：与Dify API交互，检索知识库内容
3. 工具服务：提供MCP工具实现，包括解析知识库ID和获取知识库文档

## 安装与设置

### 环境要求

- Node.js 18+
- TypeScript
- 有效的Dify API密钥

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/yourusername/knowledge-base-mcp.git
cd knowledge-base-mcp
```

2. 安装依赖

```bash
npm install
# 或者使用pnpm
pnpm install
```

3. 配置环境变量

将`.env.example`复制为`.env`，并填写必要的配置信息：

```bash
cp .env.example .env
```

编辑`.env`文件，设置Dify API密钥和其他配置。

### 配置说明

在`.env`文件中可以配置以下参数：

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| DIFY_BASE_URL | Dify API基础URL | https://api.dify.ai/v1 |
| DIFY_API_KEY | Dify API密钥 | - |
| TRANSPORT_TYPE | 传输类型（stdio/http/sse） | stdio |
| PORT | HTTP/SSE服务端口 | 3000 |
| CACHE_TTL | 缓存生存时间（毫秒） | 3600000（1小时） |
| CACHE_CLEANUP | 缓存清理间隔（毫秒） | 300000（5分钟） |
| ALLOWED_ORIGINS | 允许的CORS来源（逗号分隔） | * |

## 构建与运行

### 构建项目

```bash
npm run build
```

### 运行服务

可以通过以下方式运行服务：

#### STDIO模式（默认）

```bash
npm start
# 或
npm run dev
```

#### HTTP模式

```bash
npm run dev:http
# 或
node dist/index.js --transport http --port 8008
```

#### SSE模式

```bash
npm run dev:sse
# 或
node dist/index.js --transport sse --port 8006
```

### 命令行参数

服务支持以下命令行参数：

- `--transport <stdio|http|sse>`: 指定传输类型
- `--port <number>`: 指定HTTP/SSE服务端口
- `--dify-api-key <string>`: 指定Dify API密钥（覆盖环境变量设置）

## 使用方法

### 与Claude AI集成

1. 启动知识库MCP服务
2. 配置Claude API使用MCP连接到该服务
3. 在Claude中使用以下工具：

#### 解析知识库ID工具

用于查找知识库ID和名称。

```json
{
  "libraryName": "知识库名称关键词"
}
```

#### 获取知识库文档工具

用于从知识库中检索文档内容。

```json
{
  "context7CompatibleLibraryID": "/knowledge-base-id",
  "topic": "搜索关键词",
  "tokens": 10000
}
```

## 开发指南

### 项目结构

```
src/
├── tools/           # MCP工具实现
├── types/           # TypeScript类型定义
├── services/        # 服务实现
├── utils/           # 工具函数
├── config.ts        # 配置管理
├── index.ts         # 入口文件
└── server.ts        # MCP服务器实现
```

### 添加新工具

1. 在`src/types/mcp.ts`中定义新工具的输入模式
2. 在`src/tools/`中创建新工具实现
3. 在`src/server.ts`中注册新工具

## 许可证

MIT License
