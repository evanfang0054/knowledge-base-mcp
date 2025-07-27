/**
 * Dify API 类型定义
 */

export interface DifyRetrieveRequest {
  query: string;
  top_k?: number;
  score_threshold?: number;
  reranking?: boolean;
  file_ids?: string[];
  collection_ids?: string[];
}

export interface DifyKnowledgeName {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  wordCount: number;
}

export interface DifyRetrieveResponse {
  query: string;
  records: DifyRetrievedRecord[];
}

export interface DifyRetrievedRecord {
  segment: {
    id: string;
    position: number;
    document_id: string;
    content: string;
    answer: string | null;
    word_count: number;
    tokens: number;
    keywords: string[];
    index_node_id: string;
    index_node_hash: string;
    hit_count: number;
    enabled: boolean;
    disabled_at: string | null;
    disabled_by: string | null;
    status: string;
    created_by: string;
    created_at: number;
    indexing_at: number;
    completed_at: number;
    error: string | null;
    stopped_at: string | null;
    document: {
      id: string;
      data_source_type: string;
      name: string;
    };
  };
  score: number;
  tsne_position: any | null;
}

export interface DifyApiConfig {
  baseUrl: string;
  apiKey: string;
}

export interface DifyError {
  status: number;
  message: string;
  details?: any;
}