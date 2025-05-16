import { PersonaSettings } from '@/lib/db/schema';

/** Normalize for keyword matching */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Escape user‐supplied words into a safe regex */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Return the first keyword that matches, or null */
function findMatch(message: string, keywords: string[]): string | null {
  const norm = normalizeText(message);
  for (const kw of keywords) {
    const pattern = `\\b${escapeRegExp(normalizeText(kw))}\\b`;
    if (new RegExp(pattern, 'i').test(norm)) {
      return kw;
    }
  }
  return null;
}

/** Word-lists by severity 0=LOW,1=MEDIUM,2=HIGH */
function violenceList(level: 'low' | 'medium' | 'high'): string[]{
    if (level === 'high') {
    return ['hit','fight','hurt','battle','war','weapon','gun','bomb','attack','kill','blood'];
  }
  if (level === 'medium') {
    return ['fight','weapon','gun','kill','attack','bomb','blood','murder','shoot','stab','violent'];
  }
  return ['kill','murder','gun','bomb','bloodshed','shooting','torture'];
}

function politicsList(level: 'low' | 'medium' | 'high'): string[] {
  if (level === 'high') {
    return ['government','election','president','vote','politics','party','democrat','republican','congress','policy','senate','candidate'];
  }
  if (level === 'medium') {
    return ['election','president','vote','democrat','republican','politics','campaign','candidate'];
  }
  return ['political party','partisan','liberal agenda','conservative agenda','left wing','right wing'];
}

/**
 * Pre-process a child’s message. 
 * Returns allowed=false + reason if we should block it.
 */
export function preProcessUserMessage(
  text: string,
  settings: PersonaSettings,
  customBlacklist: string[],
): { allowed: boolean; reason?: 'violence'|'politics'|'wordFilter'; matched?: string } {
  // 1) custom words
  if (settings.wordFilteringEnabled) {
    const m = findMatch(text, customBlacklist);
    if (m) return { allowed: false, reason: 'wordFilter', matched: m };
  }
  // 2) violence
  const vm = findMatch(text, violenceList(settings.violenceFilterLevel));
  if (vm) return { allowed: false, reason: 'violence', matched: vm };
  // 3) politics
  const pm = findMatch(text, politicsList(settings.politicsFilterLevel));
  if (pm) return { allowed: false, reason: 'politics', matched: pm };

  return { allowed: true };
}

/**
 * Post-process the LLM’s response. 
 * If it contains anything disallowed, replace entire response with a safe fallback.
 */
export function postProcessLLMResponse(
  text: string,
  settings: PersonaSettings,
  customBlacklist: string[],
): { message: string; wasFiltered: boolean; filterReason?: 'violence'|'politics'|'wordFilter' } {
  // violence first
  if (findMatch(text, violenceList(settings.violenceFilterLevel))) {
    return { message: "Let’s talk about something else!", wasFiltered: true, filterReason: 'violence' };
  }
  // politics
  if (findMatch(text, politicsList(settings.politicsFilterLevel))) {
    return { message: "Let’s talk about something else!", wasFiltered: true, filterReason: 'politics' };
  }
  // custom words
  if (settings.wordFilteringEnabled && findMatch(text, customBlacklist)) {
    return { message: "Let’s talk about something else!", wasFiltered: true, filterReason: 'wordFilter' };
  }
  // otherwise clean
  return { message: text, wasFiltered: false };
}
