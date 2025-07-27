/**
 * 解析知识名称工具
 */
import {
  ResolveKnowledgeIdsParams,
  ResolveKnowledgeIdsSchema,
  KnowledgeMatch,
} from '../types/mcp';
import { ErrorHandler } from '../utils/error-handler';
import { DifyService } from '../services/dify-service';

/**
 * 创建解析知识ID工具
 */
export function createResolveKnowledgeIdsTool() {
  return {
    name: 'resolve-knowledge-ids',
    title: '获取知识库ID列表',
    description: `获取知识库ID列表。

您必须在 'get-knowledge-docs' 之前调用此函数以获取有效的知识库ID列表。

评选过程：
1. 分析查询以了解用户正在寻找的知识库
2. 根据以下条件返回最相关的匹配项：
- 名称与查询的相似性（完全匹配优先）
- 描述与查询意图的相关性
- 文档覆盖率（优先考虑代码片段数量较多的库）
- 信任评分（考虑得分为 7-10 的知识库文档更权威）

回复格式：
- 在明确标记的部分返回所选的知识库ID
- 简要说明为什么选择这个知识库
- 如果存在多个良好的匹配项，请确认这一点，但继续使用最相关的匹配项
- 如果不存在良好的匹配项，请明确说明这一点并建议查询改进

对于模棱两可的查询，请在继续进行最佳猜测匹配之前请求澄清。`,
    inputSchema: ResolveKnowledgeIdsSchema,
    handler: async (params: ResolveKnowledgeIdsParams) => {
      const { query, limit = 10 } = params;

      // 获取DifyRepository单例
      const difyRepository = DifyService.getInstance().getRepository();

      // 使用DifyRepository获取知识库名称列表
      const knowledgeIds = await difyRepository.getKnowledgeIds();

      // 转换为KnowledgeMatch数组
      const matches: KnowledgeMatch[] = knowledgeIds.map(item => {
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          documentCount: item.documentCount,
          wordCount: item.wordCount,
        };
      });

      // 限制结果数量
      const limitedMatches = matches.slice(0, limit);

      // 构建响应内容
      let content = `可用知识库（顶部匹配）:\n\n`;
      content += `每个结果包括:\n`;
      content += `- 知识库ID: 系统兼容标识符\n`;
      content += `- 名称: 知识库名称\n`;
      content += `- 描述: 简短摘要\n`;
      content += `- 文档数量: 可用文档数量\n`;
      content += `- 字数: 内容规模指标\n\n`;
      content += `为获得最佳结果，请基于名称匹配、字数、文档覆盖率和与您使用场景的相关性选择知识库。\n\n`;
      content += `----------\n\n`;

      limitedMatches.forEach((match, index) => {
        content += `- 标题: ${match.name}\n`;
        content += `- 知识库ID: ${match.id}\n`;
        content += `- 描述: ${match.description}\n`;
        content += `- 文档数量: ${match.documentCount}\n`;
        content += `- 字数: ${match.wordCount}\n`;
        if (index < limitedMatches.length - 1) {
          content += `----------\n`;
        }
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: content,
          },
        ],
      };
    },
  };
}
