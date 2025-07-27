/**
 * 错误处理工具
 */
import { McpError } from "../types/mcp";

export class ErrorHandler {
  /**
   * 创建MCP工具错误
   */
  static createToolError(code: string, message: string, details?: any): McpError {
    return {
      code,
      message,
      details
    };
  }

  /**
   * 处理名称解析错误
   */
  static handleResolveError(error: unknown): McpError {
    if (error instanceof Error) {
      return {
        code: "RESOLUTION_FAILED",
        message: `名称解析失败: ${error.message}`,
        details: { stack: error.stack }
      };
    }
    
    return {
      code: "RESOLUTION_FAILED",
      message: "未知的名称解析错误",
      details: { error }
    };
  }

  /**
   * 处理文档获取错误
   */
  static handleDocumentError(error: unknown, docName?: string): McpError {
    if (error instanceof Error) {
      return {
        code: "DOCUMENT_RETRIEVAL_FAILED",
        message: `文档获取失败${docName ? ` (${docName})` : ''}: ${error.message}`,
        details: { stack: error.stack, docName }
      };
    }
    
    return {
      code: "DOCUMENT_RETRIEVAL_FAILED",
      message: `未知的文档获取错误${docName ? ` (${docName})` : ''}`,
      details: { error, docName }
    };
  }

  /**
   * 处理API请求错误
   */
  static handleApiError(error: unknown): McpError {
    if (error instanceof Error) {
      return {
        code: "API_ERROR",
        message: `API请求失败: ${error.message}`,
        details: { stack: error.stack }
      };
    }
    
    return {
      code: "API_ERROR",
      message: "未知的API请求错误",
      details: { error }
    };
  }

  /**
   * 处理参数验证错误
   */
  static handleValidationError(error: unknown): McpError {
    if (error instanceof Error) {
      return {
        code: "VALIDATION_ERROR",
        message: `参数验证失败: ${error.message}`,
        details: { stack: error.stack }
      };
    }
    
    return {
      code: "VALIDATION_ERROR",
      message: "未知的参数验证错误",
      details: { error }
    };
  }
} 