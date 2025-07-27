/**
 * Dify服务单例
 */
import { DifyRepository } from './dify-repository';
import { DifyApiConfig } from '../types/dify';

/**
 * Dify服务单例
 * 用于管理和复用DifyRepository实例
 */
export class DifyService {
  private static instance: DifyService;
  private repository: DifyRepository | null = null;
  
  private constructor() {}
  
  /**
   * 获取DifyService单例实例
   */
  public static getInstance(): DifyService {
    if (!DifyService.instance) {
      DifyService.instance = new DifyService();
    }
    return DifyService.instance;
  }
  
  /**
   * 初始化或更新DifyRepository
   * @param config DifyAPI配置
   */
  public init(config: DifyApiConfig): void {
    // 如果配置有变化或首次初始化，创建新实例
    if (!this.repository || 
        this.repository.getConfig().apiKey !== config.apiKey || 
        this.repository.getConfig().baseUrl !== config.baseUrl) {
      this.repository = new DifyRepository(config);
    }
  }
  
  /**
   * 获取DifyRepository实例
   * 如果实例不存在则抛出错误
   */
  public getRepository(): DifyRepository {
    if (!this.repository) {
      throw new Error('DifyRepository尚未初始化，请先调用init()方法');
    }
    return this.repository;
  }
} 