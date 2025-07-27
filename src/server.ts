/**
 * MCP服务器实现
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  ResolveKnowledgeIdsSchema,
  GetKnowledgeDocsSchema,
} from './types/mcp';
import { createResolveKnowledgeIdsTool } from './tools/resolve-knowledge-ids';
import { createGetKnowledgeDocsTool } from './tools/get-knowledge-docs';
import { mcpConfig, difyConfig } from './config';
import { DifyService } from './services/dify-service';

/**
 * 创建MCP服务器实例
 * @param clientIp 客户端IP（可选）
 * @param difyApiKey 可选的Dify API密钥，覆盖环境变量设置
 */
export function createServerInstance(clientIp?: string, difyApiKey?: string): McpServer {
  console.log(`[${new Date().toISOString()}] 创建MCP服务器实例${clientIp ? ' (客户端IP: ' + clientIp + ')' : ''}`);
  
  // 初始化Dify服务
  const difyService = DifyService.getInstance();
  
  // 使用配置来初始化，如果提供了API密钥则覆盖环境变量设置
  const apiConfig = {
    ...difyConfig,
    apiKey: difyApiKey || difyConfig.apiKey
  };
  difyService.init(apiConfig);
  
  // 创建MCP服务器实例
  const server = new McpServer({
    name: mcpConfig.name,
    version: mcpConfig.version,
  });
  
  // 注册工具
  registerTools(server);
  
  return server;
}

/**
 * 注册MCP工具
 */
function registerTools(server: McpServer): void {
  // 注册解析知识名称工具
  const resolveKnowledgeIdsTool = createResolveKnowledgeIdsTool();
  server.registerTool(resolveKnowledgeIdsTool.name, {
    title: resolveKnowledgeIdsTool.title,
    description: resolveKnowledgeIdsTool.description,
    inputSchema: {
      ...ResolveKnowledgeIdsSchema.shape,
    }
  }, resolveKnowledgeIdsTool.handler);
  
  // 注册获取知识文档工具
  const getKnowledgeDocsTool = createGetKnowledgeDocsTool();
  server.registerTool(getKnowledgeDocsTool.name, {
    title: getKnowledgeDocsTool.title,
    description: getKnowledgeDocsTool.description,
    inputSchema: {
      ...GetKnowledgeDocsSchema.shape,
    }
  }, getKnowledgeDocsTool.handler);
  
  console.log(`[${new Date().toISOString()}] MCP工具注册完成`);
} 