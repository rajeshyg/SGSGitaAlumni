export interface UserResearch {
  demographics: UserDemographic[];
  accessibilityNeeds: AccessibilityNeed[];
  usagePatterns: UsagePattern[];
  feedback: UserFeedback[];
  sampleSize: number;
}

export interface UserDemographic {
  ageGroup: string;
  disabilityType?: string;
  assistiveTechnology?: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  frequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
}

export interface AccessibilityNeed {
  type: 'visual' | 'motor' | 'cognitive' | 'hearing' | 'speech';
  severity: 'mild' | 'moderate' | 'severe';
  specificRequirements: string[];
  accommodations: string[];
}

export interface UsagePattern {
  task: string;
  frequency: number;
  successRate: number;
  timeToComplete: number;
  painPoints: string[];
}

export interface UserFeedback {
  rating: number; // 1-5
  easeOfUse: number; // 1-5
  accessibility: number; // 1-5
  comments: string;
  suggestions: string[];
}

export interface Design {
  components: Component[];
  interactions: Interaction[];
  content: Content[];
  navigation: Navigation[];
  visualDesign: VisualDesign;
}

export interface Component {
  id: string;
  type: string;
  accessibilityFeatures: string[];
  complexity: number; // 1-10
  targetUsers: string[];
}

export interface Interaction {
  id: string;
  type: string;
  modes: string[]; // keyboard, mouse, touch, voice, etc.
  complexity: number;
  errorHandling: boolean;
}

export interface Content {
  type: string;
  readability: number; // Flesch score
  structure: 'simple' | 'moderate' | 'complex';
  multimedia: boolean;
  alternatives: string[];
}

export interface Navigation {
  type: string;
  complexity: number;
  landmarks: string[];
  shortcuts: string[];
}

export interface VisualDesign {
  colorContrast: number;
  fontSize: number;
  spacing: number;
  visualHierarchy: number;
}

export interface AccessibilityAudit {
  violations: WCAGViolation[];
  compliance: {
    A: number;
    AA: number;
    AAA: number;
  };
  automatedTests: number;
  manualTests: number;
  coverage: number; // percentage
}

export interface WCAGViolation {
  rule: string;
  level: 'A' | 'AA' | 'AAA';
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  count: number;
}

export interface InclusiveDesignMetrics {
  diversity: DiversityMetrics;
  usability: UsabilityMetrics;
  accessibility: AccessibilityMetrics;
  personalization: PersonalizationMetrics;
  overallInclusivity: InclusivityScore;
  gaps: InclusivityGap[];
  recommendations: InclusivityRecommendation[];
}

export interface DiversityMetrics {
  score: number; // 0-100
  representation: {
    ageGroups: number;
    disabilityTypes: number;
    experienceLevels: number;
    totalCoverage: number;
  };
  gaps: string[];
}

export interface UsabilityMetrics {
  score: number; // 0-100
  effectiveness: number;
  efficiency: number;
  satisfaction: number;
  learnability: number;
}

export interface AccessibilityMetrics {
  score: number; // 0-100
  wcagCompliance: {
    A: boolean;
    AA: boolean;
    AAA: boolean;
  };
  assistiveTechSupport: number;
  multimodalSupport: number;
}

export interface PersonalizationMetrics {
  score: number; // 0-100
  adaptability: number;
  customization: number;
  preferenceSupport: number;
}

export interface InclusivityScore {
  score: number; // 0-100
  level: InclusivityLevel;
  breakdown: {
    diversity: number;
    usability: number;
    accessibility: number;
    personalization: number;
  };
}

export type InclusivityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'very-poor';

export interface InclusivityGap {
  area: 'diversity' | 'usability' | 'accessibility' | 'personalization';
  currentScore: number;
  targetScore: number;
  gap: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export interface InclusivityRecommendation {
  area: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  implementation: string[];
  impact: number; // expected improvement
  effort: 'low' | 'medium' | 'high';
}

export interface InclusiveMetricsBreakdown {
  diversity: DiversityMetrics;
  usability: UsabilityMetrics;
  accessibility: AccessibilityMetrics;
  personalization: PersonalizationMetrics;
}

export class InclusiveDesignMetricsEngine {
  private diversityAnalyzer: DiversityAnalyzer;
  private usabilityAnalyzer: UsabilityAnalyzer;
  private accessibilityAnalyzer: AccessibilityAnalyzer;
  private personalizationAnalyzer: PersonalizationAnalyzer;

  constructor() {
    this.diversityAnalyzer = new DiversityAnalyzer();
    this.usabilityAnalyzer = new UsabilityAnalyzer();
    this.accessibilityAnalyzer = new AccessibilityAnalyzer();
    this.personalizationAnalyzer = new PersonalizationAnalyzer();
  }

  public async calculateInclusiveDesignMetrics(
    design: Design,
    userResearch: UserResearch,
    accessibilityAudit: AccessibilityAudit
  ): Promise<InclusiveDesignMetrics> {
    // Analyze user diversity representation
    const diversityMetrics = await this.diversityAnalyzer.analyzeDiversity(userResearch);

    // Analyze usability across user groups
    const usabilityMetrics = await this.usabilityAnalyzer.analyzeUsability(design, userResearch);

    // Analyze accessibility coverage
    const accessibilityMetrics = await this.accessibilityAnalyzer.analyzeAccessibility(accessibilityAudit);

    // Analyze personalization capabilities
    const personalizationMetrics = await this.personalizationAnalyzer.analyzePersonalization(design);

    // Calculate overall inclusivity score
    const overallInclusivity = this.calculateOverallInclusivity({
      diversity: diversityMetrics,
      usability: usabilityMetrics,
      accessibility: accessibilityMetrics,
      personalization: personalizationMetrics
    });

    return {
      diversity: diversityMetrics,
      usability: usabilityMetrics,
      accessibility: accessibilityMetrics,
      personalization: personalizationMetrics,
      overallInclusivity,
      gaps: this.identifyInclusivityGaps({
        diversity: diversityMetrics,
        usability: usabilityMetrics,
        accessibility: accessibilityMetrics,
        personalization: personalizationMetrics
      }),
      recommendations: await this.generateInclusivityRecommendations({
        diversity: diversityMetrics,
        usability: usabilityMetrics,
        accessibility: accessibilityMetrics,
        personalization: personalizationMetrics
      })
    };
  }

  private calculateOverallInclusivity(metrics: InclusiveMetricsBreakdown): InclusivityScore {
    // Weighted calculation based on inclusive design principles
    const weights = {
      diversity: 0.25,
      usability: 0.30,
      accessibility: 0.30,
      personalization: 0.15
    };

    const overallScore = (
      metrics.diversity.score * weights.diversity +
      metrics.usability.score * weights.usability +
      metrics.accessibility.score * weights.accessibility +
      metrics.personalization.score * weights.personalization
    );

    return {
      score: Math.round(overallScore),
      level: this.classifyInclusivityLevel(overallScore),
      breakdown: {
        diversity: metrics.diversity.score,
        usability: metrics.usability.score,
        accessibility: metrics.accessibility.score,
        personalization: metrics.personalization.score
      }
    };
  }

  private classifyInclusivityLevel(score: number): InclusivityLevel {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'very-poor';
  }

  private identifyInclusivityGaps(metrics: InclusiveMetricsBreakdown): InclusivityGap[] {
    const gaps: InclusivityGap[] = [];

    // Check diversity gaps
    if (metrics.diversity.score < 70) {
      gaps.push({
        area: 'diversity',
        currentScore: metrics.diversity.score,
        targetScore: 70,
        gap: 70 - metrics.diversity.score,
        priority: 'high',
        description: 'User diversity representation needs improvement'
      });
    }

    // Check usability gaps
    if (metrics.usability.score < 75) {
      gaps.push({
        area: 'usability',
        currentScore: metrics.usability.score,
        targetScore: 75,
        gap: 75 - metrics.usability.score,
        priority: 'high',
        description: 'Usability across user groups needs improvement'
      });
    }

    // Check accessibility gaps
    if (metrics.accessibility.score < 80) {
      gaps.push({
        area: 'accessibility',
        currentScore: metrics.accessibility.score,
        targetScore: 80,
        gap: 80 - metrics.accessibility.score,
        priority: 'critical',
        description: 'Accessibility compliance needs improvement'
      });
    }

    // Check personalization gaps
    if (metrics.personalization.score < 60) {
      gaps.push({
        area: 'personalization',
        currentScore: metrics.personalization.score,
        targetScore: 60,
        gap: 60 - metrics.personalization.score,
        priority: 'medium',
        description: 'Personalization capabilities need enhancement'
      });
    }

    return gaps.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private async generateInclusivityRecommendations(
    metrics: InclusiveMetricsBreakdown
  ): Promise<InclusivityRecommendation[]> {
    const recommendations: InclusivityRecommendation[] = [];

    // Diversity recommendations
    if (metrics.diversity.score < 70) {
      recommendations.push({
        area: 'diversity',
        priority: 'high',
        description: 'Expand user research to include more diverse user groups',
        implementation: [
          'Conduct user research with additional disability types',
          'Include users with different experience levels',
          'Test with various assistive technologies'
        ],
        impact: 15,
        effort: 'medium'
      });
    }

    // Usability recommendations
    if (metrics.usability.score < 75) {
      recommendations.push({
        area: 'usability',
        priority: 'high',
        description: 'Improve usability for users with different abilities',
        implementation: [
          'Simplify complex interactions',
          'Add progressive disclosure for advanced features',
          'Implement better error handling and recovery'
        ],
        impact: 20,
        effort: 'medium'
      });
    }

    // Accessibility recommendations
    if (metrics.accessibility.score < 80) {
      recommendations.push({
        area: 'accessibility',
        priority: 'critical',
        description: 'Address critical accessibility violations',
        implementation: [
          'Fix WCAG AA compliance issues',
          'Improve assistive technology compatibility',
          'Add proper semantic markup and ARIA labels'
        ],
        impact: 25,
        effort: 'high'
      });
    }

    // Personalization recommendations
    if (metrics.personalization.score < 60) {
      recommendations.push({
        area: 'personalization',
        priority: 'medium',
        description: 'Enhance personalization and adaptability features',
        implementation: [
          'Add user preference settings',
          'Implement adaptive interfaces',
          'Support different interaction modes'
        ],
        impact: 10,
        effort: 'low'
      });
    }

    return recommendations;
  }
}

// Specialized analyzers
class DiversityAnalyzer {
  async analyzeDiversity(userResearch: UserResearch): Promise<DiversityMetrics> {
    const demographics = userResearch.demographics;

    // Calculate representation scores
    const ageGroups = new Set(demographics.map(d => d.ageGroup)).size;
    const disabilityTypes = new Set(demographics.filter(d => d.disabilityType).map(d => d.disabilityType)).size;
    const experienceLevels = new Set(demographics.map(d => d.experienceLevel)).size;

    const totalCoverage = (ageGroups + disabilityTypes + experienceLevels) / 12 * 100; // Normalize to 0-100

    // Identify gaps
    const gaps: string[] = [];
    if (ageGroups < 3) gaps.push('Limited age group representation');
    if (disabilityTypes < 2) gaps.push('Limited disability type coverage');
    if (experienceLevels < 2) gaps.push('Limited experience level diversity');

    const score = Math.min(100, totalCoverage + (demographics.length / userResearch.sampleSize) * 20);

    return {
      score: Math.round(score),
      representation: {
        ageGroups,
        disabilityTypes,
        experienceLevels,
        totalCoverage: Math.round(totalCoverage)
      },
      gaps
    };
  }
}

class UsabilityAnalyzer {
  async analyzeUsability(design: Design, userResearch: UserResearch): Promise<UsabilityMetrics> {
    // Analyze effectiveness (task completion)
    const effectiveness = userResearch.usagePatterns.reduce((sum, pattern) =>
      sum + pattern.successRate, 0) / userResearch.usagePatterns.length * 100;

    // Analyze efficiency (time to complete)
    const avgTime = userResearch.usagePatterns.reduce((sum, pattern) =>
      sum + pattern.timeToComplete, 0) / userResearch.usagePatterns.length;
    const efficiency = Math.max(0, 100 - (avgTime / 300) * 100); // Assume 5min is baseline

    // Analyze satisfaction
    const satisfaction = userResearch.feedback.reduce((sum, f) =>
      sum + f.accessibility, 0) / userResearch.feedback.length * 20; // Convert 1-5 to 0-100

    // Analyze learnability (based on experience level distribution)
    const beginnerUsers = userResearch.demographics.filter(d => d.experienceLevel === 'beginner').length;
    const learnability = (beginnerUsers / userResearch.demographics.length) * 100;

    const score = Math.round((effectiveness + efficiency + satisfaction + learnability) / 4);

    return {
      score,
      effectiveness: Math.round(effectiveness),
      efficiency: Math.round(efficiency),
      satisfaction: Math.round(satisfaction),
      learnability: Math.round(learnability)
    };
  }
}

class AccessibilityAnalyzer {
  async analyzeAccessibility(accessibilityAudit: AccessibilityAudit): Promise<AccessibilityMetrics> {
    // Calculate WCAG compliance
    const wcagCompliance = {
      A: accessibilityAudit.compliance.A >= 95,
      AA: accessibilityAudit.compliance.AA >= 95,
      AAA: accessibilityAudit.compliance.AAA >= 80
    };

    // Calculate assistive technology support (mock implementation)
    const assistiveTechSupport = 85; // Based on audit coverage

    // Calculate multimodal support (mock implementation)
    const multimodalSupport = 78; // Based on interaction analysis

    // Calculate overall score
    const complianceScore = (wcagCompliance.A ? 40 : 0) +
                           (wcagCompliance.AA ? 35 : 0) +
                           (wcagCompliance.AAA ? 25 : 0);

    const score = Math.round((complianceScore + assistiveTechSupport + multimodalSupport) / 3);

    return {
      score,
      wcagCompliance,
      assistiveTechSupport,
      multimodalSupport
    };
  }
}

class PersonalizationAnalyzer {
  async analyzePersonalization(design: Design): Promise<PersonalizationMetrics> {
    // Analyze adaptability (how well design adapts to different needs)
    const adaptability = design.interactions.filter(i => i.modes.length > 1).length /
                        design.interactions.length * 100;

    // Analyze customization (user preference options)
    const customization = 65; // Mock - would analyze actual customization features

    // Analyze preference support (how well preferences are honored)
    const preferenceSupport = 70; // Mock - would analyze preference implementation

    const score = Math.round((adaptability + customization + preferenceSupport) / 3);

    return {
      score,
      adaptability: Math.round(adaptability),
      customization,
      preferenceSupport
    };
  }
}