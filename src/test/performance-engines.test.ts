// src/test/performance-engines.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { PredictivePerformanceEngine } from '../lib/performance/PredictivePerformanceEngine';
import { AnomalyDetectionEngine } from '../lib/performance/AnomalyDetectionEngine';
import { ResourceForecastingEngine } from '../lib/performance/ResourceForecastingEngine';
import { UserExperienceCorrelationEngine } from '../lib/performance/UserExperienceCorrelationEngine';

describe('Performance Engineering Components', () => {
  let mockSystem: any;
  let mockMetrics: any[];

  beforeEach(() => {
    mockSystem = {
      components: ['api', 'database', 'frontend'],
      architecture: 'microservices'
    };

    mockMetrics = [
      {
        timestamp: new Date(),
        responseTime: 450,
        throughput: 85,
        errorRate: 0.01,
        resourceUsage: { cpu: 65, memory: 70 },
        concurrentUsers: 120
      },
      {
        timestamp: new Date(Date.now() - 60000),
        responseTime: 480,
        throughput: 82,
        errorRate: 0.015,
        resourceUsage: { cpu: 68, memory: 72 },
        concurrentUsers: 115
      }
    ];
  });

  describe('PredictivePerformanceEngine', () => {
    it('should generate performance predictions', async () => {
      const engine = new PredictivePerformanceEngine();
      const predictions = await engine.predictPerformanceTrends(mockMetrics, mockSystem);

      expect(predictions).toBeDefined();
      expect(predictions.confidence).toBeGreaterThan(0);
      expect(predictions.forecasts).toBeDefined();
      expect(predictions.bottlenecks).toBeDefined();
      expect(predictions.recommendations).toBeDefined();
    });

    it('should identify performance bottlenecks', async () => {
      const engine = new PredictivePerformanceEngine();
      const predictions = await engine.predictPerformanceTrends(mockMetrics, mockSystem);

      expect(Array.isArray(predictions.bottlenecks)).toBe(true);
      expect(Array.isArray(predictions.recommendations)).toBe(true);
    });
  });

  describe('AnomalyDetectionEngine', () => {
    it('should detect performance anomalies', async () => {
      const engine = new AnomalyDetectionEngine();
      const baseline = {
        responseTime: { mean: 500, stdDev: 100 },
        throughput: { mean: 100, stdDev: 20 },
        resourceUsage: { mean: 75, stdDev: 10 },
        errorRate: { mean: 0.01, stdDev: 0.005 }
      };

      const result = await engine.detectPerformanceAnomalies(mockMetrics, baseline);

      expect(result).toBeDefined();
      expect(result.anomalies).toBeDefined();
      expect(result.falsePositiveRate).toBeGreaterThanOrEqual(0);
      expect(result.detectionAccuracy).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ResourceForecastingEngine', () => {
    it('should forecast resource requirements', async () => {
      const engine = new ResourceForecastingEngine();
      const mockPredictions = {
        forecasts: {
          responseTime: { current: 450, predicted: [460, 470, 480], confidence: [0.8, 0.75, 0.7], upperBound: [470, 485, 500], lowerBound: [430, 455, 460] },
          throughput: { current: 85, predicted: [87, 89, 91], confidence: [0.8, 0.75, 0.7], upperBound: [90, 95, 100], lowerBound: [80, 83, 82] },
          resourceUsage: { current: 0.7, predicted: [0.72, 0.74, 0.76], confidence: [0.8, 0.75, 0.7], upperBound: [0.75, 0.78, 0.80], lowerBound: [0.68, 0.70, 0.72] }
        },
        trendAnalysis: {
          responseTime: { data: [], slope: 0.1, seasonality: 0.2, volatility: 0.1, forecast: [460, 470, 480] },
          throughput: { data: [], slope: 0.05, seasonality: 0.1, volatility: 0.05, forecast: [87, 89, 91] },
          resourceUsage: { data: [], slope: 0.02, seasonality: 0.05, volatility: 0.02, forecast: [0.72, 0.74, 0.76] },
          correlations: [],
          anomalies: []
        },
        bottlenecks: [],
        recommendations: [],
        confidence: 0.85,
        timeHorizon: 90
      };

      const currentResources = { cpu: 0.6, memory: 0.7, storage: 0.5, network: 0.7 };
      const businessRequirements = { availability: 0.99, performance: 0.8, cost: 0.6 };

      const forecast = await engine.forecastResourceRequirements(
        mockPredictions,
        currentResources,
        businessRequirements
      );

      expect(forecast).toBeDefined();
      expect(forecast.requirements).toBeDefined();
      expect(forecast.scalingRecommendations).toBeDefined();
      expect(forecast.riskAssessment).toBeDefined();
    });
  });

  describe('UserExperienceCorrelationEngine', () => {
    it('should correlate performance with user experience', async () => {
      const engine = new UserExperienceCorrelationEngine();
      const mockUserData = [
        {
          userId: 'user1',
          sessionId: 'session1',
          timestamp: new Date(),
          pageViews: 5,
          timeOnPage: 180,
          bounceRate: 0.2,
          conversionRate: 0.05,
          userActions: [{ action: 'click', timestamp: new Date(), duration: 2.5, success: true }],
          deviceType: 'desktop',
          browser: 'chrome',
          location: 'US'
        }
      ];

      const mockBusinessMetrics = [
        {
          timestamp: new Date(),
          revenue: 10000,
          conversionRate: 0.03,
          customerSatisfaction: 0.85,
          retentionRate: 0.9,
          churnRate: 0.05
        }
      ];

      const correlation = await engine.correlatePerformanceWithUserExperience(
        mockMetrics,
        mockUserData,
        mockBusinessMetrics
      );

      expect(correlation).toBeDefined();
      expect(correlation.behaviorPatterns).toBeDefined();
      expect(correlation.performanceCorrelations).toBeDefined();
      expect(correlation.experienceImpact).toBeDefined();
    });
  });

  describe('Integration Test', () => {
    it('should work together as a complete system', async () => {
      // Test the complete performance engineering pipeline
      const predictiveEngine = new PredictivePerformanceEngine();
      const anomalyEngine = new AnomalyDetectionEngine();
      const resourceEngine = new ResourceForecastingEngine();
      const uxEngine = new UserExperienceCorrelationEngine();

      // 1. Generate predictions
      const predictions = await predictiveEngine.predictPerformanceTrends(mockMetrics, mockSystem);
      expect(predictions).toBeDefined();

      // 2. Detect anomalies
      const baseline = {
        responseTime: { mean: 500, stdDev: 100 },
        throughput: { mean: 100, stdDev: 20 },
        resourceUsage: { mean: 75, stdDev: 10 },
        errorRate: { mean: 0.01, stdDev: 0.005 }
      };
      const anomalies = await anomalyEngine.detectPerformanceAnomalies(mockMetrics, baseline);
      expect(anomalies).toBeDefined();

      // 3. Forecast resources
      const currentResources = { cpu: 0.6, memory: 0.7, storage: 0.5, network: 0.7 };
      const businessRequirements = { availability: 0.99, performance: 0.8, cost: 0.6 };
      const resourceForecast = await resourceEngine.forecastResourceRequirements(
        predictions,
        currentResources,
        businessRequirements
      );
      expect(resourceForecast).toBeDefined();

      // 4. Correlate with UX
      const mockUserData = [{ userId: 'test', sessionId: 'test', timestamp: new Date(), pageViews: 1, timeOnPage: 60, bounceRate: 0, conversionRate: 0, userActions: [], deviceType: 'desktop', browser: 'chrome', location: 'US' }];
      const mockBusinessMetrics = [{ timestamp: new Date(), revenue: 1000, conversionRate: 0.05, customerSatisfaction: 0.8, retentionRate: 0.85, churnRate: 0.1 }];
      const uxCorrelation = await uxEngine.correlatePerformanceWithUserExperience(
        mockMetrics,
        mockUserData,
        mockBusinessMetrics
      );
      expect(uxCorrelation).toBeDefined();

      // All components working together
      expect(predictions.confidence).toBeGreaterThan(0);
      expect(anomalies.anomalies).toBeDefined();
      expect(resourceForecast.requirements).toBeDefined();
      expect(uxCorrelation.experienceImpact).toBeDefined();
    });
  });
});