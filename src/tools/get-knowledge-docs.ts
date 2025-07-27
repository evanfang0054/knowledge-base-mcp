/**
 * 获取知识文档工具
 */
import {
  GetKnowledgeDocsParams,
  GetKnowledgeDocsSchema,
} from '../types/mcp';
import { DifyService } from '../services/dify-service';

/**
 * 创建获取知识文档工具
 */
export function createGetKnowledgeDocsTool() {
  return {
    name: 'get-knowledge-docs',
    title: '获取知识文档',
    description: `获取库/工具/组件的知识库文档。您必须先调用 'resolve-knowledge-ids' 才能获得使用此工具所需的确切的知识库ID列表，除非用户在查询中明确提供知识库ID列表。
此工具严格依赖resolve-knowledge-ids的返回结果，确保检索的准确性和一致性。当用户未提供知识库ID列表且未先调用名称解析时，工具将拒绝执行并返回详细的错误指引。`,
    inputSchema: GetKnowledgeDocsSchema,
    handler: async (params: GetKnowledgeDocsParams) => {
      const { query, datasetIds } = params;

      if (!datasetIds || datasetIds.length === 0) {
        throw new Error('需要提供至少一个知识库ID');
      }

      // 获取DifyRepository单例
      const difyRepository = DifyService.getInstance().getRepository();

      // 使用找到的知识库ID进行文档检索
      const retrieveResults = await difyRepository.retrieveDocuments(query, {
        datasetIds,
        topK: 10,
      });

      if(!retrieveResults.records || retrieveResults.records.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "未找到相关文档或该知识库的文档尚未完成。这可能是因为您使用了无效的知识库ID。要获取有效的知识库ID，请先使用'resolve-knowledge-ids'工具结合您想要检索文档的关键词。",
              _meta: {}
            }
          ]
        };
      }

      const content = retrieveResults.records.map(record => {
        return `${record.segment.content}\n\n----------`;
      }).join('\n\n');

      return {
        content: [
          {
            type: "text" as const,
            text: content,
            _meta: {}
          }
        ]
      };
    },
  };
}
