
import { CoreAnalyticsService } from './coreAnalytics';
import { StrategyFilteringService } from './strategyFiltering';
import { RecommendationsService } from './recommendationsService';

// Re-export all types for easy importing
export * from './types';

// Main service that combines all analytics functionality
export class StrategyAnalyticsService {
  // Core analytics methods
  static getAnalytics = CoreAnalyticsService.getAnalytics;
  static getPerformanceAnalysis = CoreAnalyticsService.getPerformanceAnalysis;

  // Strategy filtering methods
  static getHighReturnStrategies = StrategyFilteringService.getHighReturnStrategies;
  static getStrategyByPerformance = StrategyFilteringService.getStrategyByPerformance;

  // Recommendations methods
  static getPersonalizedRecommendations = RecommendationsService.getPersonalizedRecommendations;
}
