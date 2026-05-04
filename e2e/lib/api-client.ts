import { request, APIRequestContext, APIResponse } from '@playwright/test';

export interface ApiConfig {
  baseURL: string;
  testRunId: string;
}

export class ApiClient {
  private context: APIRequestContext | null = null;

  constructor(private config: ApiConfig) {}

  private async getContext(): Promise<APIRequestContext> {
    if (!this.context) {
      this.context = await request.newContext({
        baseURL: this.config.baseURL,
        extraHTTPHeaders: {
          'X-Test-Run-Id': this.config.testRunId
        }
      });
    }
    return this.context;
  }

  private resolveApiPath(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (normalized.startsWith('/api/')) {
      return normalized;
    }

    return `/api/v1${normalized}`;
  }

  async login(username: string, password: string): Promise<{ success: boolean; message: string; data: any }> {
    const context = await this.getContext();
    const response = await context.post(this.resolveApiPath('/auth/login'), {
      data: { username, password }
    });
    
    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Login failed: ${response.status()} - ${error}`);
    }
    
    return response.json();
  }

  async post<T = any>(path: string, data?: any, headers?: Record<string, string>): Promise<T> {
    const context = await this.getContext();
    const resolvedPath = this.resolveApiPath(path);
    const response = await context.post(resolvedPath, {
      data,
      headers: headers ?? {}
    });
    
    return this.handleResponse<T>(response, 'POST', resolvedPath);
  }

  async get<T = any>(path: string, params?: Record<string, string>): Promise<T> {
    const context = await this.getContext();
    const resolvedPath = this.resolveApiPath(path);
    const url = params ? `${resolvedPath}?${new URLSearchParams(params)}` : resolvedPath;
    const response = await context.get(url, {
      headers: {}
    });
    
    return this.handleResponse<T>(response, 'GET', resolvedPath);
  }

  async put<T = any>(path: string, data?: any): Promise<T> {
    const context = await this.getContext();
    const resolvedPath = this.resolveApiPath(path);
    const response = await context.put(resolvedPath, {
      data,
      headers: {}
    });
    
    return this.handleResponse<T>(response, 'PUT', resolvedPath);
  }

  async delete<T = any>(path: string): Promise<T> {
    const context = await this.getContext();
    const resolvedPath = this.resolveApiPath(path);
    const response = await context.delete(resolvedPath, {
      headers: {}
    });
    
    return this.handleResponse<T>(response, 'DELETE', resolvedPath);
  }

  private async handleResponse<T>(response: APIResponse, method: string, path: string): Promise<T> {
    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`${method} ${path} failed: ${response.status()} - ${error}`);
    }
    
    const contentType = response.headers()['content-type'];
    if (contentType && contentType.includes('application/json')) {
      const json = await response.json();
      if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
        return json.data as T;
      }
      return json as T;
    }
    
    return response.text() as any;
  }

  async dispose(): Promise<void> {
    if (this.context) {
      await this.context.dispose();
      this.context = null;
    }
  }
}
