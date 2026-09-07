import { supabase } from './supabase';
import { SearchParams, Search, SearchResult, Classification } from '@/types';

// ============================================
// SEARCH QUERY BUILDER
// ============================================
export function buildSearchQueries(params: SearchParams): string[] {
  const queries: string[] = [];
  const name = params.personName.trim();

  // Primary query: exact name
  queries.push(`"${name}"`);

  // Name + occupation
  if (params.occupation) {
    queries.push(`"${name}" ${params.occupation}`);
  }

  // Name + organization
  if (params.organization) {
    queries.push(`"${name}" ${params.organization}`);
  }

  // Name + country
  if (params.country) {
    queries.push(`"${name}" ${params.country}`);
  }

  // Name + position
  if (params.position) {
    queries.push(`"${name}" ${params.position}`);
  }

  // Combined context
  if (params.occupation && params.country) {
    queries.push(`"${name}" ${params.occupation} ${params.country}`);
  }

  return queries;
}

// ============================================
// PERSON MATCH CONFIDENCE CALCULATOR
// ============================================
export function calculatePersonMatchConfidence(
  resultText: string,
  params: SearchParams
): number {
  const text = (resultText || '').toLowerCase();
  const name = params.personName.toLowerCase();
  let score = 0;

  // Name presence (base score)
  if (text.includes(name)) score += 40;

  // Partial name match
  const nameParts = name.split(' ');
  const matchedParts = nameParts.filter(part => part.length > 2 && text.includes(part));
  score += (matchedParts.length / nameParts.length) * 20;

  // Additional context boosts
  if (params.occupation && text.includes(params.occupation.toLowerCase())) score += 10;
  if (params.organization && text.includes(params.organization.toLowerCase())) score += 10;
  if (params.country && text.includes(params.country.toLowerCase())) score += 8;
  if (params.city && text.includes(params.city.toLowerCase())) score += 7;
  if (params.position && text.includes(params.position.toLowerCase())) score += 5;

  return Math.min(100, Math.round(score));
}

// ============================================
// CLASSIFICATION HELPER
// ============================================
export function classifyContentBasic(text: string): {
  classification: Classification;
  claimDetected: boolean;
  allegationDetected: boolean;
} {
  const t = text.toLowerCase();

  const negativeKeywords = ['اتهام', 'ادعاء', 'فساد', 'قضية', 'تهمة', 'مزعوم', 'فضيحة',
    'corruption', 'fraud', 'scandal', 'accused', 'alleged', 'arrested', 'charged',
    'lawsuit', 'controversy', 'criminal', 'illegal', 'violation'];

  const positiveKeywords = ['جائزة', 'إنجاز', 'نجاح', 'تكريم', 'مدح', 'مبادرة',
    'award', 'success', 'achievement', 'honored', 'praised', 'launched', 'partnership',
    'investment', 'growth', 'elected', 'appointed', 'recognized'];

  const claimKeywords = ['يدعي', 'زعم', 'وفق ما أفادت', 'مصادر', 'يُتهم',
    'claims', 'allegedly', 'reportedly', 'sources say', 'alleged', 'unconfirmed', 'rumor'];

  const allegationKeywords = ['اتهم', 'متهم', 'موجهة إليه', 'تحقيق', 'ادعى',
    'accused of', 'charged with', 'under investigation', 'allegation', 'indicted'];

  const negScore = negativeKeywords.filter(k => t.includes(k)).length;
  const posScore = positiveKeywords.filter(k => t.includes(k)).length;
  const claimDetected = claimKeywords.some(k => t.includes(k));
  const allegationDetected = allegationKeywords.some(k => t.includes(k));

  let classification: Classification = 'neutral';
  if (posScore > negScore) classification = 'positive';
  else if (negScore > posScore || allegationDetected) classification = 'negative';

  return { classification, claimDetected, allegationDetected };
}

// ============================================
// SEARCH ORCHESTRATOR
// ============================================
export async function createSearchSession(
  userId: string,
  params: SearchParams,
  personId?: string
): Promise<string> {
  const { data, error } = await supabase
    .from('searches')
    .insert({
      user_id: userId,
      person_id: personId,
      person_name: params.personName,
      search_params: params,
      status: 'pending',
      progress: 0,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateSearchProgress(
  searchId: string,
  updates: Partial<{
    status: string;
    progress: number;
    results_found: number;
    results_analyzed: number;
    duplicates_removed: number;
    sources_scanned: number;
    person_matches_verified: number;
    completed_at: string;
    error_message: string;
  }>
) {
  const { error } = await supabase
    .from('searches')
    .update(updates)
    .eq('id', searchId);

  if (error) console.error('Error updating search progress:', error);
}

export async function findOrCreatePerson(
  params: SearchParams,
  userId: string
): Promise<string> {
  // Search for existing person
  const { data: existing } = await supabase
    .from('persons')
    .select('id')
    .ilike('full_name', params.personName)
    .limit(1)
    .single();

  if (existing) return existing.id;

  // Create new person
  const { data: newPerson, error } = await supabase
    .from('persons')
    .insert({
      full_name: params.personName,
      display_name: params.personName,
      occupation: params.occupation,
      country: params.country,
      city: params.city,
      birth_year: params.birthYear,
      organization: params.organization,
      position: params.position,
      bio: params.additionalDetails,
      created_by: userId,
    })
    .select('id')
    .single();

  if (error) throw error;
  return newPerson.id;
}

export async function saveResult(result: Partial<SearchResult>) {
  const { data, error } = await supabase
    .from('results')
    .insert(result)
    .select('id')
    .single();

  if (error) {
    console.error('Error saving result:', error);
    return null;
  }
  return data.id;
}

export async function saveResultAnalysis(analysis: {
  result_id: string;
  person_match_score: number;
  sentiment: string;
  sentiment_confidence: number;
  content_type: string;
  claim_detected: boolean;
  allegation_detected: boolean;
  topics: string[];
  summary: string;
}) {
  const { error } = await supabase.from('result_analysis').insert(analysis);
  if (error) console.error('Error saving analysis:', error);
}

// Simulate fetching from public news API (stub for V1 - architecture ready for real sources)
export async function simulatePublicSearch(
  searchId: string,
  personId: string,
  params: SearchParams,
  onProgress: (stage: string, progress: number) => void
): Promise<void> {
  const queries = buildSearchQueries(params);
  console.log('[SearchPipeline] Starting search with queries:', queries);

  // Stage 1: Initializing
  onProgress('INITIALIZING', 5);
  await updateSearchProgress(searchId, { status: 'running', progress: 5 });
  await delay(800);

  // Stage 2: Scanning sources
  onProgress('SCANNING_SOURCES', 20);
  await updateSearchProgress(searchId, { progress: 20, sources_scanned: 3 });
  await delay(1000);

  // Stage 3: Collecting results
  onProgress('COLLECTING_RESULTS', 40);
  await updateSearchProgress(searchId, { progress: 40, results_found: 0, sources_scanned: 8 });
  await delay(1000);

  // Stage 4: Normalizing
  onProgress('NORMALIZING', 55);
  await updateSearchProgress(searchId, { progress: 55 });
  await delay(700);

  // Stage 5: Deduplication
  onProgress('DEDUPLICATION', 70);
  await updateSearchProgress(searchId, { progress: 70, duplicates_removed: 0 });
  await delay(700);

  // Stage 6: Person matching
  onProgress('PERSON_MATCHING', 80);
  await updateSearchProgress(searchId, { progress: 80, person_matches_verified: 0 });
  await delay(800);

  // Stage 7: AI Analysis
  onProgress('AI_ANALYSIS', 90);
  await updateSearchProgress(searchId, { progress: 90 });
  await delay(1000);

  // Stage 8: Finalizing
  onProgress('FINALIZING', 100);
  await updateSearchProgress(searchId, {
    status: 'completed',
    progress: 100,
    completed_at: new Date().toISOString(),
  });
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
