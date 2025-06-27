import { z } from 'zod';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_SPITESPIRAL_API_URL || 'http://localhost:3002';

// Zod schemas for type safety
const AnalyticsSummarySchema = z.object({
  totalRequests: z.number(),
  uniqueIPs: z.number(),
  topCountries: z.array(z.unknown()),
  threatLevel: z.string(),
  lastUpdated: z.string().nullable(),
});

const ClickHouseAnalyticsSchema = z.object({
  requests: z.object({
    total: z.number(),
    unique_ips: z.number(),
  }),
  patterns: z.object({
    detected: z.number(),
    high_confidence: z.number(),
  }),
  geographic: z.array(z.object({
    country: z.string(),
    requests: z.number(),
  })),
  behavioral: z.array(z.object({
    pattern: z.string(),
    occurrences: z.number(),
    avg_confidence: z.number(),
  })),
  timeSeriesData: z.array(z.object({
    time: z.string(),
    requests: z.number(),
  })),
});

const EnterpriseAnalyticsSchema = ClickHouseAnalyticsSchema.extend({
  stixIndicators: z.array(z.object({
    id: z.string(),
    type: z.string(),
    pattern: z.string(),
    confidence: z.number(),
    created: z.string(),
  })),
});

const AnalyticsResponseSchema = z.object({
  success: z.boolean(),
  tier: z.string(),
  dataAccess: z.string(),
  tarpitCount: z.number(),
  data: z.object({
    source: z.string(),
    summary: z.optional(AnalyticsSummarySchema),
    requests: z.optional(ClickHouseAnalyticsSchema.shape.requests),
    patterns: z.optional(ClickHouseAnalyticsSchema.shape.patterns),
    geographic: z.optional(ClickHouseAnalyticsSchema.shape.geographic),
    behavioral: z.optional(ClickHouseAnalyticsSchema.shape.behavioral),
    timeSeriesData: z.optional(ClickHouseAnalyticsSchema.shape.timeSeriesData),
    stixIndicators: z.optional(EnterpriseAnalyticsSchema.shape.stixIndicators),
    message: z.optional(z.string()),
    error: z.optional(z.string()),
  }),
});

const HealthResponseSchema = z.object({
  status: z.string(),
  version: z.string(),
  timestamp: z.string(),
  services: z.object({
    firebase: z.boolean(),
    docker: z.boolean(),
  }),
});

export type AnalyticsResponse = z.infer<typeof AnalyticsResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

class SpiteSpiralAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'SpiteSpiralAPIError';
  }
}

export class SpiteSpiralAPI {
  private baseURL: string;
  private getAuthToken: () => Promise<string | null>;

  constructor(getAuthToken: () => Promise<string | null>) {
    this.baseURL = API_BASE_URL;
    this.getAuthToken = getAuthToken;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }
      
      throw new SpiteSpiralAPIError(errorMessage, response.status);
    }

    return response;
  }

  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      const data = await response.json();
      return HealthResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new SpiteSpiralAPIError('Invalid health response format');
      }
      throw error;
    }
  }

  async getAnalytics(): Promise<AnalyticsResponse> {
    try {
      const response = await this.fetchWithAuth('/v1/analytics/data');
      const data = await response.json();
      return AnalyticsResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Analytics response validation error:', error.errors);
        throw new SpiteSpiralAPIError('Invalid analytics response format');
      }
      throw error;
    }
  }

  async getDemoAnalytics(): Promise<AnalyticsResponse> {
    try {
      const response = await fetch(`${this.baseURL}/v1/demo/analytics`);
      const data = await response.json();
      return AnalyticsResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Demo analytics response validation error:', error.errors);
        throw new SpiteSpiralAPIError('Invalid demo analytics response format');
      }
      throw error;
    }
  }
}

// Singleton instance factory
let apiInstance: SpiteSpiralAPI | null = null;

export function getSpiteSpiralAPI(getAuthToken: () => Promise<string | null>): SpiteSpiralAPI {
  if (!apiInstance) {
    apiInstance = new SpiteSpiralAPI(getAuthToken);
  }
  return apiInstance;
}