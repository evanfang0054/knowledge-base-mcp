/**
 * Dify API仓库
 */
import axios, { AxiosInstance } from 'axios';
import { 
  DifyApiConfig, 
  DifyRetrieveRequest, 
  DifyRetrieveResponse,
  DifyKnowledgeName,
  DifyError
} from '../types/dify';
import { CacheManager } from '../utils/cache-manager';
import { ErrorHandler } from '../utils/error-handler';

export class DifyRepository {
  private client: AxiosInstance;
  private config: DifyApiConfig;
  private cache: CacheManager<DifyRetrieveResponse>;
  
  constructor(config: DifyApiConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      }
    });
    
    // 创建缓存实例
    this.cache = new CacheManager<DifyRetrieveResponse>();
    
    // 添加响应拦截器处理错误
    this.client.interceptors.response.use(
      response => response,
      error => {
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || error.message;
        const details = error.response?.data || error.toString();
        
        throw {
          status: statusCode,
          message,
          details
        } as DifyError;
      }
    );
  }
  
  /**
   * 获取当前API配置
   */
  getConfig(): DifyApiConfig {
    return { ...this.config };
  }
  
  /**
   * 知识库检索
   */
  async retrieveDocuments(query: string, options: { 
    topK?: number; 
    threshold?: number; 
    useCache?: boolean;
    datasetIds: string[];
  } = {
    datasetIds: []
  }): Promise<DifyRetrieveResponse> {
    const { topK = 10, threshold = 0.7, useCache = true, datasetIds } = options;
    
    // 检查是否提供了知识库ID
    if (!datasetIds.length) {
      throw new Error('至少需要提供一个知识库ID');
    }
    
    // 生成缓存键，包含所有知识库ID信息
    const datasetsKey = datasetIds.sort().join(',');
    const cacheKey = `retrieve:${query}:${topK}:${threshold}:${datasetsKey}`;
    
    // 如果启用缓存，尝试获取缓存数据
    if (useCache) {
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }
    
    try {
      // 构建请求参数
      const requestData: DifyRetrieveRequest = {
        query,
        top_k: topK,
        score_threshold: threshold
      };
      
      // 并发请求多个知识库
      const retrievePromises = datasetIds.map(datasetId => 
        this.client.post<DifyRetrieveResponse>(
          `/datasets/${datasetId}/retrieve`,
          requestData
        ).then(response => response.data)
      );
      
      // 等待所有请求完成
      const results = await Promise.all(retrievePromises);
      
      // 合并所有知识库的结果
      const mergedResult: DifyRetrieveResponse = {
        query,
        records: [],
      };
      
      // 处理API响应结果
      results.forEach(result => {
        // 检查是否有records字段（新API格式）
        if (result.records && Array.isArray(result.records)) {
          // 将新API格式转换为标准格式
          const documents = result.records.map(record => {
            return {
              segment: record.segment,
              score: record.score,
              tsne_position: record.tsne_position || null
            };
          });
          mergedResult.records = [
            ...mergedResult.records,
            ...documents
          ];
        }
      });
      
      // 按相关性得分排序
      mergedResult.records.sort((a, b) => b.score - a.score);
      
      // 限制返回的结果数量
      if (mergedResult.records.length > topK) {
        mergedResult.records = mergedResult.records.slice(0, topK);
      }
      
      // 缓存结果
      if (useCache) {
        this.cache.set(cacheKey, mergedResult);
      }
      
      return mergedResult;
    } catch (error) {
      // 处理错误
      if ((error as DifyError).status) {
        throw error;
      } else {
        throw ErrorHandler.handleApiError(error);
      }
    }
  }
  
  /**
   * 获取知识库ID列表
   */
  async getKnowledgeIds(keyword?: string): Promise<DifyKnowledgeName[]> {
    
    try {
      const queryParams = new URLSearchParams();
      
      // 添加查询参数
      if (keyword) queryParams.append('keyword', keyword);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      const response = await this.client.get(
        `/datasets${queryString}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // 转换API响应为所需格式
      const results = response?.data?.data?.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || `${item.name}的详细说明`,
        documentCount: item.document_count || 0,
        wordCount: item.word_count || 0
      }));
      
      return results;
    } catch (error) {
      throw error;
    }
  }
}