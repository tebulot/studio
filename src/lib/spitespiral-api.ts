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
  sessions: z.object({
    total_sessions: z.number(),
    unique_ips: z.number(),
    total_requests: z.number(),
    avg_time_wasted: z.number(),
  }),
  patterns: z.object({
    detected: z.number(),
    high_confidence: z.number(),
    pattern_types: z.array(z.string()),
  }),
  geographic: z.array(z.object({
    country: z.string(),
    sessions: z.number(),
  })),
  top_paths: z.array(z.object({
    tarpit_id: z.string(),
    hits: z.number(),
  })),
  time_series: z.array(z.object({
    hour: z.number(),
    sessions: z.number(),
  })),
  filtered: z.boolean(),
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
    timeRange: z.optional(z.string()),
    tarpits: z.optional(z.array(z.string())),
    userId: z.optional(z.string()),
    summary: z.optional(AnalyticsSummarySchema),
    metrics: z.optional(z.object({
      sessions: z.optional(ClickHouseAnalyticsSchema.shape.sessions),
      patterns: z.optional(ClickHouseAnalyticsSchema.shape.patterns),
      geographic: z.optional(ClickHouseAnalyticsSchema.shape.geographic),
      top_paths: z.optional(ClickHouseAnalyticsSchema.shape.top_paths),
      time_series: z.optional(ClickHouseAnalyticsSchema.shape.time_series),
      filtered: z.optional(z.boolean()),
    })),
    networkwide: z.optional(z.object({
      threat_correlation: z.object({
        matches: z.number(),
        severity: z.string(),
      }),
      attribution: z.object({
        known_actors: z.number(),
        campaigns: z.number(),
      }),
      intelligence: z.object({
        iocs_matched: z.number(),
        feed_sources: z.number(),
      }),
    })),
    stix_objects: z.optional(z.array(z.object({
      type: z.string(),
      pattern: z.optional(z.string()),
      name: z.optional(z.string()),
      labels: z.optional(z.array(z.string())),
      created: z.string(),
      user_context: z.optional(z.string()),
    }))),
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