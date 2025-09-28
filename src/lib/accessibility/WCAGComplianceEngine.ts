export interface WCAGViolation {
  ruleId: string;
  guideline: string;
  level: 'A' | 'AA' | 'AAA';
  principle: 'Perceivable' | 'Operable' | 'Understandable' | 'Robust';
  description: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  element?: string;
  code?: string;
  help?: string;
  helpUrl?: string;
}

export interface WCAGComplianceReport {
  summary: {
    totalViolations: number;
    violationsByLevel: Record<string, number>;
    violationsByPrinciple: Record<string, number>;
    complianceScore: number;
    overallLevel: 'A' | 'AA' | 'AAA' | 'Non-compliant';
  };
  violations: WCAGViolation[];
  passedChecks: string[];
  recommendations: string[];
  timestamp: Date;
}

export interface AccessibilityElement {
  tagName: string;
  attributes: Record<string, string>;
  textContent?: string;
  children?: AccessibilityElement[];
  computedStyle?: Record<string, string>;
  ariaAttributes?: Record<string, string>;
  role?: string;
}

export class WCAGComplianceEngine {
  private wcagRules: Map<string, WCAGRule> = new Map();

  constructor() {
    this.initializeWCAGRules();
  }

  public async auditCompliance(
    elements: AccessibilityElement[],
    options: AuditOptions = {}
  ): Promise<WCAGComplianceReport> {
    const violations: WCAGViolation[] = [];
    const passedChecks: string[] = [];

    // Run all WCAG rules against elements
    for (const [ruleId, rule] of this.wcagRules) {
      try {
        const ruleViolations = await rule.check(elements, options);
        if (ruleViolations.length > 0) {
          violations.push(...ruleViolations);
        } else {
          passedChecks.push(ruleId);
        }
      } catch (error) {
        console.error(`Error checking rule ${ruleId}:`, error);
      }
    }

    // Generate compliance report
    const report = this.generateComplianceReport(violations, passedChecks);

    return report;
  }

  public async checkSingleRule(
    ruleId: string,
    elements: AccessibilityElement[],
    options: AuditOptions = {}
  ): Promise<WCAGViolation[]> {
    const rule = this.wcagRules.get(ruleId);
    if (!rule) {
      throw new Error(`WCAG rule ${ruleId} not found`);
    }

    return await rule.check(elements, options);
  }

  public getSupportedRules(): string[] {
    return Array.from(this.wcagRules.keys());
  }

  public getRuleInfo(ruleId: string): WCAGRuleInfo | null {
    const rule = this.wcagRules.get(ruleId);
    return rule ? rule.getInfo() : null;
  }

  private initializeWCAGRules(): void {
    // 1.1.1 Non-text Content
    this.wcagRules.set('1.1.1', new NonTextContentRule());

    // 1.3.1 Info and Relationships
    this.wcagRules.set('1.3.1', new InfoAndRelationshipsRule());

    // 1.3.3 Sensory Characteristics
    this.wcagRules.set('1.3.3', new SensoryCharacteristicsRule());

    // 1.4.3 Contrast (Minimum)
    this.wcagRules.set('1.4.3', new ContrastMinimumRule());

    // 1.4.6 Contrast (Enhanced)
    this.wcagRules.set('1.4.6', new ContrastEnhancedRule());

    // 2.1.1 Keyboard
    this.wcagRules.set('2.1.1', new KeyboardRule());

    // 2.1.2 No Keyboard Trap
    this.wcagRules.set('2.1.2', new NoKeyboardTrapRule());

    // 2.4.2 Page Titled
    this.wcagRules.set('2.4.2', new PageTitledRule());

    // 2.4.6 Headings and Labels
    this.wcagRules.set('2.4.6', new HeadingsAndLabelsRule());

    // 3.1.1 Language of Page
    this.wcagRules.set('3.1.1', new LanguageOfPageRule());

    // 3.3.1 Error Identification
    this.wcagRules.set('3.3.1', new ErrorIdentificationRule());

    // 4.1.1 Parsing
    this.wcagRules.set('4.1.1', new ParsingRule());

    // 4.1.2 Name, Role, Value
    this.wcagRules.set('4.1.2', new NameRoleValueRule());
  }

  private generateComplianceReport(
    violations: WCAGViolation[],
    passedChecks: string[]
  ): WCAGComplianceReport {
    const violationsByLevel = violations.reduce((acc, v) => {
      acc[v.level] = (acc[v.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const violationsByPrinciple = violations.reduce((acc, v) => {
      acc[v.principle] = (acc[v.principle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalRules = this.wcagRules.size;
    const complianceScore = Math.round((passedChecks.length / totalRules) * 100);

    let overallLevel: 'A' | 'AA' | 'AAA' | 'Non-compliant' = 'Non-compliant';

    if (violationsByLevel['AAA'] === 0 && violationsByLevel['AA'] === 0 && violationsByLevel['A'] === 0) {
      overallLevel = 'AAA';
    } else if (violationsByLevel['AAA'] === 0 && violationsByLevel['AA'] === 0) {
      overallLevel = 'AA';
    } else if (violationsByLevel['AAA'] === 0) {
      overallLevel = 'A';
    }

    const recommendations = this.generateRecommendations(violations);

    return {
      summary: {
        totalViolations: violations.length,
        violationsByLevel,
        violationsByPrinciple,
        complianceScore,
        overallLevel
      },
      violations,
      passedChecks,
      recommendations,
      timestamp: new Date()
    };
  }

  private generateRecommendations(violations: WCAGViolation[]): string[] {
    const recommendations: string[] = [];
    const uniqueRecommendations = new Set<string>();

    for (const violation of violations) {
      if (violation.help) {
        uniqueRecommendations.add(violation.help);
      }
    }

    // Add general recommendations based on violation patterns
    if (violations.some(v => v.ruleId.startsWith('1.1.'))) {
      recommendations.push('Add appropriate alt text to all images and non-text content');
    }

    if (violations.some(v => v.ruleId.startsWith('1.4.'))) {
      recommendations.push('Ensure sufficient color contrast ratios for all text');
    }

    if (violations.some(v => v.ruleId.startsWith('2.1.'))) {
      recommendations.push('Ensure all interactive elements are keyboard accessible');
    }

    if (violations.some(v => v.ruleId.startsWith('2.4.'))) {
      recommendations.push('Improve navigation structure with proper headings and labels');
    }

    return Array.from(uniqueRecommendations).concat(recommendations);
  }
}

// Base interface for WCAG rules
export interface WCAGRule {
  check(elements: AccessibilityElement[], options: AuditOptions): Promise<WCAGViolation[]>;
  getInfo(): WCAGRuleInfo;
}

export interface WCAGRuleInfo {
  id: string;
  name: string;
  description: string;
  level: 'A' | 'AA' | 'AAA';
  principle: 'Perceivable' | 'Operable' | 'Understandable' | 'Robust';
  guideline: string;
}

export interface AuditOptions {
  includeWarnings?: boolean;
  skipElements?: string[];
  customRules?: WCAGRule[];
  viewport?: { width: number; height: number };
}

// Implementation of specific WCAG rules
class NonTextContentRule implements WCAGRule {
  async check(elements: AccessibilityElement[]): Promise<WCAGViolation[]> {
    const violations: WCAGViolation[] = [];

    for (const element of elements) {
      if (this.isNonTextContent(element) && !this.hasAltText(element)) {
        violations.push({
          ruleId: '1.1.1',
          guideline: '1.1.1 Non-text Content',
          level: 'A',
          principle: 'Perceivable',
          description: 'Non-text content does not have a text alternative',
          impact: 'serious',
          element: element.tagName,
          help: 'Add alt text to images, or use aria-label for other non-text content'
        });
      }
    }

    return violations;
  }

  getInfo(): WCAGRuleInfo {
    return {
      id: '1.1.1',
      name: 'Non-text Content',
      description: 'All non-text content has a text alternative',
      level: 'A',
      principle: 'Perceivable',
      guideline: '1.1.1'
    };
  }

  private isNonTextContent(element: AccessibilityElement): boolean {
    const nonTextTags = ['img', 'input', 'area', 'canvas', 'svg', 'video', 'audio'];
    return nonTextTags.includes(element.tagName.toLowerCase());
  }

  private hasAltText(element: AccessibilityElement): boolean {
    return !!(element.attributes.alt || element.attributes['aria-label'] || element.attributes['aria-labelledby']);
  }
}

class InfoAndRelationshipsRule implements WCAGRule {
  async check(elements: AccessibilityElement[]): Promise<WCAGViolation[]> {
    const violations: WCAGViolation[] = [];

    for (const element of elements) {
      if (this.hasSemanticMeaning(element) && !this.hasProperSemantics(element)) {
        violations.push({
          ruleId: '1.3.1',
          guideline: '1.3.1 Info and Relationships',
          level: 'A',
          principle: 'Perceivable',
          description: 'Information is not properly structured or associated',
          impact: 'serious',
          element: element.tagName,
          help: 'Use proper semantic HTML elements and ARIA attributes'
        });
      }
    }

    return violations;
  }

  getInfo(): WCAGRuleInfo {
    return {
      id: '1.3.1',
      name: 'Info and Relationships',
      description: 'Information, structure, and relationships conveyed through presentation',
      level: 'A',
      principle: 'Perceivable',
      guideline: '1.3.1'
    };
  }

  private hasSemanticMeaning(element: AccessibilityElement): boolean {
    // Check if element contains important structural information
    return !!(element.children && element.children.length > 0);
  }

  private hasProperSemantics(element: AccessibilityElement): boolean {
    // Check for proper semantic markup
    const semanticTags = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];
    return semanticTags.includes(element.tagName.toLowerCase()) ||
           !!(element.attributes.role && element.attributes.role !== 'presentation');
  }
}

class ContrastMinimumRule implements WCAGRule {
  async check(elements: AccessibilityElement[]): Promise<WCAGViolation[]> {
    const violations: WCAGViolation[] = [];

    for (const element of elements) {
      if (this.hasTextContent(element)) {
        const contrast = this.calculateContrast(element);
        if (contrast < 4.5) { // WCAG AA requires 4.5:1 for normal text
          violations.push({
            ruleId: '1.4.3',
            guideline: '1.4.3 Contrast (Minimum)',
            level: 'AA',
            principle: 'Perceivable',
            description: `Insufficient color contrast ratio: ${contrast.toFixed(2)}:1`,
            impact: 'serious',
            element: element.tagName,
            help: 'Increase contrast between text and background colors to at least 4.5:1'
          });
        }
      }
    }

    return violations;
  }

  getInfo(): WCAGRuleInfo {
    return {
      id: '1.4.3',
      name: 'Contrast (Minimum)',
      description: 'Minimum contrast ratio of 4.5:1 for normal text',
      level: 'AA',
      principle: 'Perceivable',
      guideline: '1.4.3'
    };
  }

  private hasTextContent(element: AccessibilityElement): boolean {
    return !!(element.textContent && element.textContent.trim().length > 0);
  }

  private calculateContrast(element: AccessibilityElement): number {
    // Mock contrast calculation - in real implementation would analyze actual colors
    // This would require color parsing from computedStyle
    return 5.2; // Mock value - assume good contrast for now
  }
}

class KeyboardRule implements WCAGRule {
  async check(elements: AccessibilityElement[]): Promise<WCAGViolation[]> {
    const violations: WCAGViolation[] = [];

    for (const element of elements) {
      if (this.isInteractive(element) && !this.isKeyboardAccessible(element)) {
        violations.push({
          ruleId: '2.1.1',
          guideline: '2.1.1 Keyboard',
          level: 'A',
          principle: 'Operable',
          description: 'Interactive element is not keyboard accessible',
          impact: 'serious',
          element: element.tagName,
          help: 'Ensure all interactive elements can be accessed and operated using only the keyboard'
        });
      }
    }

    return violations;
  }

  getInfo(): WCAGRuleInfo {
    return {
      id: '2.1.1',
      name: 'Keyboard',
      description: 'All functionality available via keyboard',
      level: 'A',
      principle: 'Operable',
      guideline: '2.1.1'
    };
  }

  private isInteractive(element: AccessibilityElement): boolean {
    const interactiveTags = ['button', 'input', 'select', 'textarea', 'a'];
    const interactiveRoles = ['button', 'link', 'checkbox', 'radio', 'textbox'];

    return interactiveTags.includes(element.tagName.toLowerCase()) ||
           !!(element.attributes.role && interactiveRoles.includes(element.attributes.role));
  }

  private isKeyboardAccessible(element: AccessibilityElement): boolean {
    // Check for tabindex, keyboard event handlers, etc.
    return element.attributes.tabindex !== '-1' &&
           !element.attributes['aria-hidden'];
  }
}

// Placeholder implementations for other rules
class SensoryCharacteristicsRule implements WCAGRule {
  async check(elements: AccessibilityElement[]): Promise<WCAGViolation[]> {
    // Implementation for 1.3.3 Sensory Characteristics
    return [];
  }
  getInfo(): WCAGRuleInfo {
    return {
      id: '1.3.3',
      name: 'Sensory Characteristics',
      description: 'Instructions not solely based on sensory characteristics',
      level: 'A',
      principle: 'Perceivable',
      guideline: '1.3.3'
    };
  }
}

class ContrastEnhancedRule implements WCAGRule {
  async check(elements: AccessibilityElement[]): Promise<WCAGViolation[]> {
    // Implementation for 1.4.6 Contrast (Enhanced)
    return [];
  }
  getInfo(): WCAGRuleInfo {
    return {
      id: '1.4.6',
      name: 'Contrast (Enhanced)',
      description: 'Enhanced contrast ratio of 7:1 for normal text',
      level: 'AAA',
      principle: 'Perceivable',
      guideline: '1.4.6'
    };
  }
}

class NoKeyboardTrapRule implements WCAGRule {
  async check(elements: AccessibilityElement[]): Promise<WCAGViolation[]> {
    // Implementation for 2.1.2 No Keyboard Trap
    return [];
  }
  getInfo(): WCAGRuleInfo {
    return {
      id: '2.1.2',
      name: 'No Keyboard Trap',
      description: 'Keyboard focus not trapped in any part of content',
      level: 'A',
      principle: 'Operable',
      guideline: '2.1.2'
    };
  }
}

class PageTitledRule implements WCAGRule {
  async check(elements: AccessibilityElement[]): Promise<WCAGViolation[]> {
    // Implementation for 2.4.2 Page Titled
    return [];
  }
  getInfo(): WCAGRuleInfo {
    return {
      id: '2.4.2',
      name: 'Page Titled',
      description: 'Web pages have titles that describe topic or purpose',
      level: 'A',
      principle: 'Operable',
      guideline: '2.4.2'
    };
  }
}

class HeadingsAndLabelsRule implements WCAGRule {
  async check(elements: AccessibilityElement[]): Promise<WCAGViolation[]> {
    // Implementation for 2.4.6 Headings and Labels
    return [];
  }
  getInfo(): WCAGRuleInfo {
    return {
      id: '2.4.6',
      name: 'Headings and Labels',
      description: 'Headings and labels describe topic or purpose',
      level: 'AA',
      principle: 'Operable',
      guideline: '2.4.6'
    };
  }
}

class LanguageOfPageRule implements WCAGRule {
  async check(elements: AccessibilityElement[]): Promise<WCAGViolation[]> {
    // Implementation for 3.1.1 Language of Page
    return [];
  }
  getInfo(): WCAGRuleInfo {
    return {
      id: '3.1.1',
      name: 'Language of Page',
      description: 'Primary language of each Web page can be programmatically determined',
      level: 'A',
      principle: 'Understandable',
      guideline: '3.1.1'
    };
  }
}

class ErrorIdentificationRule implements WCAGRule {
  async check(elements: AccessibilityElement[]): Promise<WCAGViolation[]> {
    // Implementation for 3.3.1 Error Identification
    return [];
  }
  getInfo(): WCAGRuleInfo {
    return {
      id: '3.3.1',
      name: 'Error Identification',
      description: 'Errors are described to the user in text',
      level: 'A',
      principle: 'Understandable',
      guideline: '3.3.1'
    };
  }
}

class ParsingRule implements WCAGRule {
  async check(elements: AccessibilityElement[]): Promise<WCAGViolation[]> {
    // Implementation for 4.1.1 Parsing
    return [];
  }
  getInfo(): WCAGRuleInfo {
    return {
      id: '4.1.1',
      name: 'Parsing',
      description: 'Markup is used properly',
      level: 'A',
      principle: 'Robust',
      guideline: '4.1.1'
    };
  }
}

class NameRoleValueRule implements WCAGRule {
  async check(elements: AccessibilityElement[]): Promise<WCAGViolation[]> {
    // Implementation for 4.1.2 Name, Role, Value
    return [];
  }
  getInfo(): WCAGRuleInfo {
    return {
      id: '4.1.2',
      name: 'Name, Role, Value',
      description: 'Name and role can be programmatically determined',
      level: 'A',
      principle: 'Robust',
      guideline: '4.1.2'
    };
  }
}