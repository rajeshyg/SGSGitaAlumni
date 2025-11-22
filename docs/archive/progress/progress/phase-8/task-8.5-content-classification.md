# Task 8.5: Content Classification Engine

**Status:** 🟡 Planned
**Priority:** High
**Duration:** 1 week
**Dependencies:** Task 8.3 (Rating Structure)

## Overview
Implement AI-powered content classification system for automated moderation with category-specific validation rules, confidence scoring, and human escalation workflows based on meeting requirements.

## Requirements Analysis

### Business Requirements from Meeting
- **AI Intervention:** Support decision making vs. manual approval/rejection of each post
- **Category-Based Decisions:** Job Opportunity, Accommodation, Mentorship, etc.
- **Criteria Satisfaction:** Posts must satisfy required data needs for each category
- **Moderator Support:** AI assists human moderators rather than replacing them

### Content Categories for Classification
1. **Job Opportunities:** Company verification, salary ranges, location validation
2. **Accommodation:** Safety verification, legitimate housing offers
3. **Mentorship:** Qualification verification, background checks for mentors
4. **General Support:** Community guidelines compliance
5. **Events:** Event details validation, organizer verification
6. **Educational:** Course/program information, institution verification

## Database Schema Implementation

### New AI_MODERATION_DECISIONS Table
```sql
CREATE TABLE AI_MODERATION_DECISIONS (
    uuid id PK,
    uuid posting_id FK,
    enum decision_type "auto_approve,auto_reject,human_review",
    decimal confidence_score, -- 0.0 to 1.0
    json decision_criteria, -- Detailed reasoning
    json classification_results, -- Category and subcategory classifications
    string ai_model_version,
    timestamp processed_at,
    uuid human_reviewer FK, -- If escalated to human
    boolean human_override DEFAULT FALSE,
    enum final_decision "approved,rejected,pending",
    text human_notes,
    timestamp human_decision_at
);
```

### New MODERATION_CRITERIA Table
```sql
CREATE TABLE MODERATION_CRITERIA (
    uuid id PK,
    enum content_type "job_posting,accommodation,mentorship,general,event,educational",
    json required_fields, -- Fields that must be present
    json validation_rules, -- Validation logic for each field
    json quality_indicators, -- Factors that indicate high-quality content
    json red_flags, -- Patterns that indicate problematic content
    decimal auto_approve_threshold, -- Confidence threshold for auto-approval
    decimal auto_reject_threshold, -- Confidence threshold for auto-rejection
    boolean is_active DEFAULT TRUE,
    timestamp created_at,
    timestamp updated_at
);
```

### New CONTENT_CLASSIFICATION_LOG Table
```sql
CREATE TABLE CONTENT_CLASSIFICATION_LOG (
    uuid id PK,
    uuid posting_id FK,
    enum primary_category "job_posting,accommodation,mentorship,general,event,educational",
    json secondary_categories, -- Additional applicable categories
    decimal category_confidence,
    json extracted_entities, -- Key information extracted from content
    json quality_scores, -- Various quality metrics
    json risk_indicators, -- Potential issues identified
    string model_version,
    timestamp classified_at
);
```

### New MODERATION_FEEDBACK Table
```sql
CREATE TABLE MODERATION_FEEDBACK (
    uuid id PK,
    uuid ai_decision_id FK,
    uuid moderator_id FK,
    enum feedback_type "correct,incorrect,partially_correct",
    enum error_category "false_positive,false_negative,wrong_category,confidence_error",
    text feedback_notes,
    json suggested_improvements,
    timestamp feedback_date
);
```

## Implementation Components

### 1. Content Classification Service
```typescript
interface ContentClassificationService {
  classifyContent(content: PostingContent): Promise<ClassificationResult>;
  extractEntities(content: string): Promise<ExtractedEntities>;
  calculateQualityScore(content: PostingContent, category: ContentCategory): Promise<QualityScore>;
  identifyRiskFactors(content: PostingContent): Promise<RiskAssessment>;
  validateRequiredFields(content: PostingContent, category: ContentCategory): Promise<ValidationResult>;
}

interface ClassificationResult {
  primaryCategory: ContentCategory;
  secondaryCategories: ContentCategory[];
  confidence: number;
  extractedEntities: ExtractedEntities;
  qualityScore: QualityScore;
  riskAssessment: RiskAssessment;
  validationResult: ValidationResult;
}

interface ExtractedEntities {
  jobTitle?: string;
  company?: string;
  location?: string;
  salary?: SalaryRange;
  skills?: string[];
  contactInfo?: ContactInfo;
  dates?: DateRange;
  qualifications?: string[];
}

interface QualityScore {
  overall: number;
  completeness: number;
  clarity: number;
  relevance: number;
  professionalism: number;
  factors: QualityFactor[];
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: RiskFactor[];
  spamIndicators: SpamIndicator[];
  safetyFlags: SafetyFlag[];
}
```

### 2. Moderation Decision Engine
```typescript
interface ModerationDecisionEngine {
  makeDecision(classificationResult: ClassificationResult, userRating: RatingCategory): Promise<ModerationDecision>;
  calculateConfidence(factors: DecisionFactor[]): number;
  shouldEscalateToHuman(decision: ModerationDecision): boolean;
  getDecisionReasoning(decision: ModerationDecision): string[];
  updateDecisionCriteria(feedback: ModerationFeedback[]): Promise<void>;
}

interface ModerationDecision {
  decision: 'auto_approve' | 'auto_reject' | 'human_review';
  confidence: number;
  reasoning: string[];
  requiredActions?: string[];
  estimatedReviewTime?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface DecisionFactor {
  factor: string;
  weight: number;
  value: number;
  description: string;
}
```

### 3. Category-Specific Validators
```typescript
interface JobPostingValidator {
  validateJobTitle(title: string): ValidationResult;
  validateCompany(company: string): Promise<CompanyValidation>;
  validateSalaryRange(salary: string): SalaryValidation;
  validateLocation(location: string): LocationValidation;
  validateJobDescription(description: string): ContentValidation;
}

interface AccommodationValidator {
  validatePropertyType(type: string): ValidationResult;
  validateLocation(location: string): LocationValidation;
  validatePricing(pricing: string): PricingValidation;
  validateContactInfo(contact: ContactInfo): ContactValidation;
  validateSafetyFeatures(description: string): SafetyValidation;
}

interface MentorshipValidator {
  validateMentorQualifications(qualifications: string[]): QualificationValidation;
  validateExpertiseAreas(areas: string[]): ExpertiseValidation;
  validateAvailability(availability: string): AvailabilityValidation;
  validateMentorProfile(profile: MentorProfile): ProfileValidation;
}
```

## AI Model Implementation

### 1. Text Classification Model
```typescript
interface TextClassificationModel {
  predict(text: string): Promise<CategoryPrediction[]>;
  extractFeatures(text: string): TextFeatures;
  calculateConfidence(predictions: CategoryPrediction[]): number;
  updateModel(trainingData: TrainingExample[]): Promise<void>;
}

interface CategoryPrediction {
  category: ContentCategory;
  confidence: number;
  features: string[];
}

interface TextFeatures {
  wordCount: number;
  sentenceCount: number;
  readabilityScore: number;
  keywordDensity: { [keyword: string]: number };
  sentimentScore: number;
  formalityScore: number;
}
```

### 2. Entity Extraction Model
```typescript
interface EntityExtractionModel {
  extractEntities(text: string, category: ContentCategory): Promise<ExtractedEntities>;
  validateExtractedEntities(entities: ExtractedEntities): ValidationResult;
  improveExtraction(text: string, correctEntities: ExtractedEntities): Promise<void>;
}

// Named Entity Recognition for:
// - Job titles and companies
// - Locations and addresses
// - Dates and time ranges
// - Contact information
// - Skills and qualifications
// - Salary and compensation
```

### 3. Quality Assessment Model
```typescript
interface QualityAssessmentModel {
  assessContentQuality(content: string, category: ContentCategory): Promise<QualityScore>;
  identifyQualityIndicators(content: string): QualityIndicator[];
  calculateCompletenessScore(content: PostingContent, requiredFields: string[]): number;
  assessProfessionalism(content: string): number;
}

interface QualityIndicator {
  indicator: string;
  score: number;
  description: string;
  improvement: string;
}
```

## Rule-Based Classification

### 1. Category Detection Rules
```typescript
const CATEGORY_RULES = {
  job_posting: {
    keywords: ['job', 'position', 'hiring', 'career', 'employment', 'work'],
    requiredFields: ['title', 'description', 'location'],
    patterns: [
      /\b(hiring|seeking|looking for)\b/i,
      /\b(salary|compensation|pay)\b/i,
      /\b(full.?time|part.?time|contract)\b/i
    ]
  },
  accommodation: {
    keywords: ['housing', 'apartment', 'room', 'rent', 'accommodation'],
    requiredFields: ['location', 'price', 'description'],
    patterns: [
      /\b(rent|lease|housing)\b/i,
      /\$\d+/,
      /\b(bedroom|bathroom|sqft)\b/i
    ]
  },
  mentorship: {
    keywords: ['mentor', 'guidance', 'advice', 'coaching', 'teaching'],
    requiredFields: ['expertise', 'availability', 'description'],
    patterns: [
      /\b(mentor|guide|teach|coach)\b/i,
      /\b(experience|expertise|skills)\b/i,
      /\b(available|offering|providing)\b/i
    ]
  }
};
```

### 2. Quality Assessment Rules
```typescript
const QUALITY_RULES = {
  completeness: {
    minWordCount: 50,
    requiredSections: ['description', 'requirements', 'contact'],
    optionalSections: ['benefits', 'timeline', 'additional_info']
  },
  clarity: {
    maxSentenceLength: 30,
    minReadabilityScore: 60,
    avoidJargon: true,
    requireStructure: true
  },
  professionalism: {
    avoidAllCaps: true,
    requireProperGrammar: true,
    avoidExcessivePunctuation: true,
    requireContactInfo: true
  }
};
```

## User Interface Components

### 1. Content Classification Dashboard
```typescript
interface ClassificationDashboardProps {
  pendingReviews: PendingReview[];
  classificationStats: ClassificationStats;
  modelPerformance: ModelPerformance;
}

const ClassificationDashboard: React.FC<ClassificationDashboardProps> = ({
  pendingReviews,
  classificationStats,
  modelPerformance
}) => {
  return (
    <div className="classification-dashboard">
      <ModelPerformanceWidget performance={modelPerformance} />
      <ClassificationStatsWidget stats={classificationStats} />
      <PendingReviewsList reviews={pendingReviews} />
      <QuickActions />
    </div>
  );
};
```

### 2. Moderation Review Interface
```typescript
interface ModerationReviewProps {
  posting: Posting;
  classificationResult: ClassificationResult;
  aiDecision: ModerationDecision;
  onApprove: (notes?: string) => void;
  onReject: (reason: string) => void;
  onRequestChanges: (changes: string[]) => void;
}

const ModerationReviewInterface: React.FC<ModerationReviewProps> = ({
  posting,
  classificationResult,
  aiDecision,
  onApprove,
  onReject,
  onRequestChanges
}) => {
  return (
    <div className="moderation-review">
      <PostingPreview posting={posting} />
      <ClassificationResults result={classificationResult} />
      <AIRecommendation decision={aiDecision} />
      <ModerationActions 
        onApprove={onApprove}
        onReject={onReject}
        onRequestChanges={onRequestChanges}
      />
    </div>
  );
};
```

## Success Criteria

### Classification Accuracy
- [ ] **Category Classification:** 90%+ accuracy in content categorization
- [ ] **Entity Extraction:** 85%+ accuracy in key information extraction
- [ ] **Quality Assessment:** Consistent quality scoring across content types
- [ ] **Risk Detection:** 95%+ accuracy in identifying problematic content

### Automation Efficiency
- [ ] **Auto-Approval Rate:** 70%+ of high-quality content auto-approved
- [ ] **False Positive Rate:** <5% incorrect auto-rejections
- [ ] **Processing Speed:** <3 seconds for content classification
- [ ] **Human Escalation:** Appropriate escalation for edge cases

### User Experience
- [ ] **Moderator Interface:** Intuitive review and decision interface
- [ ] **Feedback Integration:** Easy feedback collection for model improvement
- [ ] **Performance Monitoring:** Real-time classification performance metrics
- [ ] **Appeal Process:** Clear process for challenging AI decisions

## Implementation Timeline

### Week 1: Core Development
- **Days 1-2:** Database schema and classification service foundation
- **Days 3-4:** Category-specific validators and rule engine
- **Days 5-6:** AI model integration and decision engine
- **Day 7:** Testing and performance optimization

## Risk Mitigation

### AI Model Risks
- **Bias Prevention:** Regular model evaluation for bias
- **False Positives:** Conservative thresholds with human oversight
- **Model Drift:** Continuous monitoring and retraining

### Content Quality Risks
- **Edge Cases:** Comprehensive testing of unusual content
- **Gaming Prevention:** Detection of attempts to manipulate classification
- **Cultural Sensitivity:** Appropriate handling of diverse content

### Technical Risks
- **Performance:** Optimize for real-time classification
- **Scalability:** Handle high volume of content submissions
- **Integration:** Seamless integration with existing moderation workflow

## Next Steps

1. **Model Selection:** Choose appropriate AI models for classification
2. **Training Data:** Collect and prepare training datasets
3. **Rule Definition:** Define category-specific validation rules
4. **Service Development:** Build core classification services
5. **Testing:** Comprehensive testing with real content samples

---

*This task establishes the intelligent content classification system that enables efficient, accurate moderation while maintaining human oversight for the Gita Connect platform.*
