import { AIAnalysisResult, Classification, RawResult, SearchParams } from '@/types';
import { calculatePersonMatchConfidence, classifyContentBasic } from './searchPipeline';

// ============================================
// AI PROVIDER LAYER
// Abstracted to allow easy provider switching
// ============================================

export interface AIProvider {
  analyzeContent(content: string, context?: Record<string, string>): Promise<AIAnalysisResult>;
  classifyContent(content: string): Promise<{ classification: Classification; confidence: number }>;
  matchPerson(content: string, personParams: SearchParams): Promise<{ score: number; reasoning: string }>;
  generateSummary(content: string, maxLength?: number): Promise<string>;
  extractTopics(content: string): Promise<string[]>;
}

// ============================================
// LOCAL ANALYSIS ENGINE (V1 - No external API needed)
// ============================================
class LocalAnalysisEngine implements AIProvider {
  async analyzeContent(content: string, context?: Record<string, string>): Promise<AIAnalysisResult> {
    const text = (content || '').toLowerCase();
    const { classification, claimDetected, allegationDetected } = classifyContentBasic(text);

    const topics = await this.extractTopics(content);
    const summary = await this.generateSummary(content);
    const matchScore = context?.personName
      ? calculatePersonMatchConfidence(content, { personName: context.personName })
      : 50;

    const sentimentMap: Record<Classification, string> = {
      positive: 'positive',
      negative: 'negative',
      neutral: 'neutral',
      unknown: 'neutral',
    };

    return {
      personMatchScore: matchScore,
      sentiment: sentimentMap[classification],
      sentimentConfidence: classification === 'neutral' ? 60 : 75,
      contentType: this.detectContentType(content),
      claimDetected,
      allegationDetected,
      topics,
      summary,
      classification,
      classificationConfidence: 70,
    };
  }

  async classifyContent(content: string): Promise<{ classification: Classification; confidence: number }> {
    const { classification } = classifyContentBasic(content);
    return { classification, confidence: 70 };
  }

  async matchPerson(content: string, personParams: SearchParams): Promise<{ score: number; reasoning: string }> {
    const score = calculatePersonMatchConfidence(content, personParams);
    const reasoning = score > 70
      ? 'High name and context match'
      : score > 40
      ? 'Partial match detected'
      : 'Low confidence match';
    return { score, reasoning };
  }

  async generateSummary(content: string, maxLength = 200): Promise<string> {
    if (!content || content.length < 50) return content || '';
    // Extract first meaningful sentence(s)
    const sentences = content
      .replace(/\n+/g, ' ')
      .split(/[.!?؟،\n]/)
      .filter(s => s.trim().length > 20)
      .slice(0, 2);
    const summary = sentences.join('. ').trim();
    return summary.length > maxLength
      ? summary.substring(0, maxLength) + '...'
      : summary;
  }

  async extractTopics(content: string): Promise<string[]> {
    const topicKeywords: Record<string, string[]> = {
      Business: ['company', 'business', 'investment', 'market', 'economy', 'financial', 'شركة', 'أعمال', 'استثمار'],
      Politics: ['politics', 'government', 'minister', 'election', 'parliament', 'سياسة', 'حكومة', 'وزير', 'انتخابات'],
      Technology: ['technology', 'tech', 'software', 'digital', 'AI', 'تقنية', 'برمجيات', 'رقمي'],
      Sports: ['sports', 'football', 'player', 'match', 'team', 'رياضة', 'كرة', 'لاعب', 'مباراة'],
      Culture: ['art', 'culture', 'media', 'film', 'music', 'ثقافة', 'فن', 'سينما', 'موسيقى'],
      Legal: ['court', 'legal', 'law', 'lawsuit', 'judge', 'قضاء', 'قانون', 'محكمة', 'قاضي'],
      Science: ['research', 'science', 'study', 'academic', 'university', 'بحث', 'علم', 'جامعة'],
      Social: ['social', 'community', 'humanitarian', 'charity', 'اجتماعي', 'مجتمع', 'إنساني'],
    };

    const text = content.toLowerCase();
    const detected: string[] = [];

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
        detected.push(topic);
      }
    }

    return detected.slice(0, 4);
  }

  private detectContentType(content: string): string {
    const text = content.toLowerCase();
    if (text.includes('interview') || text.includes('said') || text.includes('قال') || text.includes('مقابلة')) return 'interview';
    if (text.includes('report') || text.includes('تقرير')) return 'report';
    if (text.includes('opinion') || text.includes('رأي') || text.includes('editorial')) return 'opinion';
    if (text.includes('press release') || text.includes('بيان')) return 'press_release';
    return 'article';
  }
}

// Export singleton
export const aiEngine: AIProvider = new LocalAnalysisEngine();

// Convenience functions
export const analyzeContent = (content: string, context?: Record<string, string>) =>
  aiEngine.analyzeContent(content, context);

export const generateSummary = (content: string, maxLength?: number) =>
  aiEngine.generateSummary(content, maxLength);

export const extractTopics = (content: string) =>
  aiEngine.extractTopics(content);

export const matchPerson = (content: string, params: SearchParams) =>
  aiEngine.matchPerson(content, params);
