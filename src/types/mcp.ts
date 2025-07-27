/**
 * MCP工具相关类型定义
 */
import { z } from "zod";

/**
 * 解析知识名称工具类型
 */
export const ResolveKnowledgeIdsSchema = z.object({
  query: z.string().optional().describe("用户查询的自然语言描述"),
  limit: z.number().optional().default(10).describe("返回结果数量限制，默认10"),
});

export type ResolveKnowledgeIdsParams = z.infer<typeof ResolveKnowledgeIdsSchema>;

export interface KnowledgeMatch {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  wordCount: number;
}

export interface ResolveKnowledgeIdsResult {
  matches: KnowledgeMatch[];
  hasMore: boolean;
  queryAnalysis: string;
  totalCount: number;
}

/**
 * 获取知识文档工具类型
 */
export const GetKnowledgeDocsSchema = z.object({
  query: z.string().describe("用户查询的自然语言描述"),
  datasetIds: z.array(z.string()).optional().describe("结合用户的描述，仅提供相关的知识库ID列表")
});

export type GetKnowledgeDocsParams = z.infer<typeof GetKnowledgeDocsSchema>;

export interface DocumentSection {
  title: string;
  content: string;
  examples?: string[];
}

export interface KnowledgeDocument {
  docName: string;
  content: string;
  metadata: {
    name: string;
    version?: string;
    lastUpdated: string;
    author?: string;
    formattedName: string;
  };
  sections: DocumentSection[];
  relatedDocs: string[];
  status: 'success' | 'not_found' | 'error';
}

export interface GetKnowledgeDocsResult {
  documents: KnowledgeDocument[];
  summary: {
    totalRequested: number;
    totalFound: number;
    totalNotFound: number;
    errors: string[];
  };
  validation: {
    wasResolved: boolean;
    resolutionSource?: string;
  };
}

/**
 * 缓存相关类型
 */
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * 错误类型
 */
export interface McpError {
  code: string;
  message: string;
  details?: any;
} 