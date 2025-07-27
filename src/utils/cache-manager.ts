/**
 * 缓存管理工具
 */
import { CacheItem } from "../types/mcp";

export class CacheManager<T> {
  private cache: Map<string, CacheItem<T>> = new Map();
  private readonly defaultTTL: number;
  
  constructor(defaultTTL = 3600000) { // 默认缓存1小时
    this.defaultTTL = defaultTTL;
    // 启动定期清理任务
    setInterval(() => this.cleanup(), 300000); // 每5分钟清理一次
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 缓存有效期（毫秒）
   */
  set(key: string, data: T, ttl = this.defaultTTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存数据，如不存在或已过期返回null
   */
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    const now = Date.now();
    if (now > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
} 