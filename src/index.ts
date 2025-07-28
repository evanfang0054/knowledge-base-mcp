#!/usr/bin/env node

/**
 * 知识库MCP服务入口
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Command } from 'commander';
import express from 'express';
import cors from 'cors';
import { createServer, IncomingMessage } from 'http';
import { createServerInstance } from './server';
import { serverConfig } from './config';

// 存储SSE传输实例
const sseTransports: Record<string, SSEServerTransport> = {};

/**
 * 获取客户端IP
 */
function getClientIp(req: IncomingMessage): string | undefined {
  // 检查X-Forwarded-For头（由负载均衡器设置）
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For可能包含多个IP，取第一个
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }
  
  // 回退到socket远程地址
  return req.socket?.remoteAddress;
}

/**
 * 主函数
 */
async function main() {
  // 解析命令行参数
  const program = new Command()
    .option('--transport <stdio|http|sse>', 'transport type', 'stdio')
    .option('--port <number>', 'port for HTTP/SSE transport', '3000')
    .option('--dify-api-key <string>', 'dify api key')
    .allowUnknownOption() // 允许MCP Inspector等包装器传递额外标志
    .parse(process.argv);
  
  const cliOptions = program.opts<{
    transport: string;
    port: string;
    difyApiKey: string;
  }>();
  
  // 验证transport选项
  const allowedTransports = ['stdio', 'http', 'sse'];
  if (!allowedTransports.includes(cliOptions.transport)) {
    console.error(`无效的--transport值: '${cliOptions.transport}'，必须是以下之一: stdio, http, sse`);
    process.exit(1);
  }
  
  // 传输配置
  const transportType = (cliOptions.transport || serverConfig.transport) as 'stdio' | 'http' | 'sse';
  
  // HTTP/SSE端口配置
  const port = (() => {
    const parsedCliPort = parseInt(cliOptions.port, 10);
    const cliPort = isNaN(parsedCliPort) ? undefined : parsedCliPort;
    return cliPort || serverConfig.port;
  })();
  
  // 根据传输类型启动服务器
  if (transportType === 'http' || transportType === 'sse') {
    // 获取初始端口
    const initialPort = port;
    // 跟踪最终使用的端口
    let actualPort = initialPort;
    
    // 创建HTTP服务器
    const app = express();
    app.use(express.json());
    app.use(cors({
      origin: serverConfig.allowedOrigins,
      methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
      allowedHeaders: ['Content-Type', 'MCP-Session-Id', 'mcp-session-id', 'MCP-Protocol-Version'],
      exposedHeaders: ['MCP-Session-Id']
    }));
    
    const httpServer = createServer(async (req, res) => {
      try {
        const pathname = new URL(req.url || '', `http://${req.headers.host}`).pathname;
        console.log(`[${new Date().toISOString()}] 收到请求: ${req.url || '', `http://${req.headers.host}`}`);
        console.log(`[${new Date().toISOString()}] 收到请求pathname: ${pathname || ''}`);
        
        // 处理预检OPTIONS请求
        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }
        
        // 提取客户端IP地址
        const clientIp = getClientIp(req);
        
        // 为每个请求创建新的服务器实例
        const requestServer = createServerInstance(clientIp, cliOptions.difyApiKey);
        
        if (pathname === '/mcp') {
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
          });
          await requestServer.connect(transport);
          await transport.handleRequest(req, res);
        } else if (pathname === '/sse' && req.method === 'GET') {
          // 为GET请求创建新的SSE传输
          const sseTransport = new SSEServerTransport('/messages', res);
          // 按会话ID存储传输
          sseTransports[sseTransport.sessionId] = sseTransport;
          // 连接关闭时清理传输
          res.on('close', () => {
            delete sseTransports[sseTransport.sessionId];
          });
          await requestServer.connect(sseTransport);
        } else if (pathname === '/messages' && req.method === 'POST') {
          // 从查询参数获取会话ID
          const sessionId =
            new URL(req.url || '', `http://${req.headers.host}`).searchParams.get('sessionId') ?? '';
          
          if (!sessionId) {
            res.writeHead(400);
            res.end('缺少sessionId参数');
            return;
          }
          
          // 获取此会话的现有传输
          const sseTransport = sseTransports[sessionId];
          if (!sseTransport) {
            res.writeHead(400);
            res.end(`未找到sessionId的传输: ${sessionId}`);
            return;
          }
          
          // 使用现有传输处理POST消息
          await sseTransport.handlePostMessage(req, res);
        } else if (pathname === '/ping') {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('pong');
        } else {
          res.writeHead(404);
          res.end('未找到');
        }
      } catch (error) {
        console.error('处理请求时出错:', error);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end('内部服务器错误');
        }
      }
    });
    
    // 尝试监听端口，失败时回退到其他端口的函数
    const startServer = (port: number, maxAttempts = 10) => {
      httpServer.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && port < initialPort + maxAttempts) {
          console.warn(`端口 ${port} 已被占用，尝试端口 ${port + 1}...`);
          startServer(port + 1, maxAttempts);
        } else {
          console.error(`启动服务器失败: ${err.message}`);
          process.exit(1);
        }
      });
      
      httpServer.listen(port, () => {
        actualPort = port;
        console.log(`[${new Date().toISOString()}] MCP ${transportType.toUpperCase()} 服务器已启动，监听端口 ${actualPort}`);
      });
    };
    
    // 使用初始端口启动服务器
    startServer(initialPort);
  } else {
    // STDIO传输 - 这本身就是无状态的
    console.log(`[${new Date().toISOString()}] MCP STDIO 服务器已启动`);
    const server = createServerInstance(undefined, cliOptions.difyApiKey);
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

// 启动服务器
main().catch((error) => {
  console.error('main()中的致命错误:', error);
  process.exit(1);
}); 