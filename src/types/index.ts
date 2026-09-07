// ============================================
// INTELLIGENCE PLATFORM TYPE DEFINITIONS
// ============================================

export type UserRole = 'user' | 'admin' | 'analyst' | 'moderator';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Person {
  id: string;
  full_name: string;
  display_name?: string;
  occupation?: string;
  country?: string;
  city?: string;
  birth_year?: number;
  organization?: string;
  position?: string;
  bio?: string;
  photo_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SearchParams {
  personName: string;
  occupation?: string;
  country?: string;
  city?: string;
  birthYear?: number;
  organization?: string;
  position?: string;
  additionalDetails?: string;
}

export type SearchStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Search {
  id: string;
  user_id: string;
  person_id?: string;
  person_name: string;
  search_params: SearchParams;
  status: SearchStatus;
  progress: number;
  results_found: number;
  results_analyzed: number;
  duplicates_removed: number;
  sources_scanned: number;
  person_matches_verified: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  // Joined
  person?: Person;
}

export type Classification = 'positive' | 'negative' | 'neutral' | 'unknown';
export type SourceType = 'news' | 'web' | 'rss' | 'social' | 'other';

export interface SearchResult {
  id: string;
  person_id?: string;
  search_id?: string;
  title: string;
  content?: string;
  excerpt?: string;
  source_name: string;
  source_url: string;
  source_type: SourceType;
  published_at?: string;
  image_url?: string;
  author?: string;
  language: string;
  match_confidence: number;
  classification: Classification;
  classification_confidence: number;
  verification_status: string;
  ai_summary?: string;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  analysis?: ResultAnalysis;
}

export interface ResultAnalysis {
  id: string;
  result_id: string;
  person_match_score: number;
  sentiment: string;
  sentiment_confidence: number;
  content_type: string;
  claim_detected: boolean;
  allegation_detected: boolean;
  topics: string[];
  summary?: string;
  analysis_version: string;
  raw_analysis?: Record<string, unknown>;
  created_at: string;
}

export type ReviewReason =
  | 'incorrect_content'
  | 'wrong_person'
  | 'outdated_content'
  | 'privacy_concern'
  | 'misleading_classification'
  | 'other';

export type ReviewStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';

export interface ReviewRequest {
  id: string;
  request_number: string;
  user_id: string;
  person_id?: string;
  result_id?: string;
  requester_name?: string;
  requester_email?: string;
  reason: ReviewReason;
  details?: string;
  status: ReviewStatus;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  // Joined
  result?: SearchResult;
  person?: Person;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface DashboardStats {
  totalResults: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  totalSearches: number;
  pendingReviews: number;
}

export interface SearchStage {
  id: string;
  label: string;
  labelAr: string;
  status: 'pending' | 'running' | 'completed';
  progress: number;
}

// Source Connector Interface
export interface SourceConnector {
  name: string;
  type: SourceType;
  search(query: string, params?: SearchParams): Promise<RawResult[]>;
  normalize(raw: RawResult): Partial<SearchResult>;
  validate(result: Partial<SearchResult>): boolean;
}

export interface RawResult {
  title: string;
  url: string;
  snippet?: string;
  content?: string;
  source?: string;
  publishedAt?: string;
  imageUrl?: string;
  author?: string;
  language?: string;
}

// AI Analysis Interface
export interface AIAnalysisResult {
  personMatchScore: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentConfidence: number;
  contentType: string;
  claimDetected: boolean;
  allegationDetected: boolean;
  topics: string[];
  summary: string;
  classification: Classification;
  classificationConfidence: number;
}

export interface FilterState {
  classification: Classification | 'all';
  matchConfidence: 'all' | 'high' | 'medium' | 'low';
  dateRange: 'all' | 'today' | '7days' | '30days';
  language: string;
  sourceType: SourceType | 'all';
  sortBy: 'newest' | 'oldest' | 'highest_relevance' | 'highest_confidence';
}
