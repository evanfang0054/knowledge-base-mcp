/**
 * 配置管理
 */
import dotenv from 'dotenv';
import { DifyApiConfig } from './types/dify';

// 加载.env文件
dotenv.config();

/**
 * MCP服务器配置
 */
export const mcpConfig = {
  name: 'knowledge-base-mcp',
  version: '1.0.0',
};

/**
 * Dify API配置
 */
export const difyConfig: DifyApiConfig = {
  baseUrl: process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1',
  apiKey: process.env.DIFY_API_KEY || '',
};

/**
 * 缓存配置
 */
export const cacheConfig = {
  ttl: parseInt(process.env.CACHE_TTL || '3600000', 10), // 默认1小时
  cleanup: parseInt(process.env.CACHE_CLEANUP || '300000', 10) // 默认5分钟
};

/**
 * 服务器配置
 */
export const serverConfig = {
  transport: process.env.TRANSPORT_TYPE || 'stdio',
  port: parseInt(process.env.PORT || '3000', 10),
  maxSessions: parseInt(process.env.MAX_SESSIONS || '100', 10),
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '1800000', 10), // 默认30分钟
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '*').split(',')
}; 