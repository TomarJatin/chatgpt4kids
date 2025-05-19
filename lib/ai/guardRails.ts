import { PersonaSettings } from '@/lib/db/schema';

// Define the filter reason types for type consistency throughout the app
export type FilterReason = 'violence' | 'politics' | 'wordFilter' | 'abusive' | 'inappropriate';

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

/** Comprehensive violence word lists by severity level */
function violenceList(level: 'low' | 'medium' | 'high'): string[] {
  // Base list - most severe terms that should be blocked at all levels
  const baseViolenceTerms = [
    'kill', 'murder', 'massacre', 'assassinate', 'slaughter', 'execute', 'torture', 'genocide', 
    'bloodshed', 'suicide', 'bombing', 'terrorist', 'shooting', 'stab', 'strangle', 'suffocate',
    'behead', 'decapitate', 'mutilate', 'dismember', 'machete', 'grenade', 'ammunition', 'assault rifle',
    'machine gun', 'explosive', 'detonate', 'hostage', 'warfare', 'fatality', 'homicide', 'massacre',
  ];

  // Medium level adds more terms
  const mediumViolenceTerms = [
    ...baseViolenceTerms,
    'fight', 'weapon', 'gun', 'knife', 'sword', 'bullet', 'bomb', 'attack', 'violent', 'wound',
    'blood', 'hurt', 'injure', 'injury', 'punch', 'kick', 'beat', 'assault', 'battle', 'combat',
    'war', 'destroy', 'threat', 'threaten', 'deadly', 'fatal', 'violent', 'brutality', 'brutalize',
    'criminal', 'vicious', 'dangerous', 'aggressive', 'missile', 'arson', 'shank',
  ];

  // High level adds even more sensitive terms
  const highViolenceTerms = [
    ...mediumViolenceTerms,
    'hit', 'struggle', 'warrior', 'soldier', 'army', 'military', 'navy', 'marine', 'air force', 
    'defense', 'offense', 'target', 'aim', 'shoot', 'fire', 'artillery', 'tank', 'missile', 
    'damage', 'wound', 'injury', 'casualty', 'victim', 'conflict', 'crusade', 'defeat', 
    'force', 'invade', 'invasion', 'strike', 'harm', 'defend', 'conquer', 'overthrow', 'protest',
    'riot', 'unrest', 'coup', 'revolution', 'revolt', 'rebel', 'resistance', 'militia',
    'gang', 'criminal', 'prison', 'prisoner', 'jail', 'arrest', 'police', 'swat', 'national guard',
    'hurt', 'painful', 'ache', 'agonize', 'suffer', 'painful', 'pistol', 'handgun', 'firearm',
  ];

  if (level === 'low') return baseViolenceTerms;
  if (level === 'medium') return mediumViolenceTerms;
  return highViolenceTerms;
}

/** Comprehensive politics word lists by severity level */
function politicsList(level: 'low' | 'medium' | 'high'): string[] {
  // Base list - most politically charged terms that should be blocked at all levels
  const basePoliticsTerms = [
    'political party', 'partisan', 'liberal agenda', 'conservative agenda', 'left wing', 'right wing',
    'socialism', 'communism', 'fascism', 'marxism', 'dictatorship', 'authoritarian', 'totalitarian',
    'far left', 'far right', 'extremist', 'radical', 'propaganda', 'indoctrination', 'leftist', 'rightist',
    'anarchist', 'populist', 'nationalist', 'globalist', 'libertarian', 'constitution', 'amendment',
  ];

  // Medium level adds more terms
  const mediumPoliticsTerms = [
    ...basePoliticsTerms,
    'election', 'president', 'vote', 'democrat', 'republican', 'politics', 'campaign', 'candidate',
    'liberal', 'conservative', 'progressive', 'congress', 'senate', 'house', 'representatives',
    'supreme court', 'justice', 'federal', 'administration', 'capitol', 'lobby', 'lobbying',
    'legislation', 'legislator', 'policy', 'bill', 'caucus', 'parliament', 'prime minister',
    'opposition', 'monarchy', 'monarchy', 'impeach', 'impeachment', 'scandal', 'corruption',
  ];

  // High level adds even more politically sensitive terms
  const highPoliticsTerms = [
    ...mediumPoliticsTerms,
    'government', 'democracy', 'republic', 'democratic', 'republican', 'gubernatorial', 'ballot',
    'voter', 'governor', 'mayor', 'senator', 'representative', 'cabinet', 'secretary', 'minister',
    'embassy', 'ambassador', 'diplomat', 'treaty', 'summit', 'policy', 'regulation', 'law',
    'council', 'committee', 'commission', 'investigation', 'hearing', 'testimony', 'witness',
    'prosecutor', 'attorney general', 'judicial', 'executive', 'legislative', 'authority',
    'leadership', 'official', 'reform', 'platform', 'agenda', 'position', 'stance', 'viewpoint',
    'opinion', 'ideology', 'debate', 'discussion', 'discourse', 'rhetoric', 'argument',
  ];

  if (level === 'low') return basePoliticsTerms;
  if (level === 'medium') return mediumPoliticsTerms;
  return highPoliticsTerms;
}

/** Comprehensive profanity and abusive language filter */
function abusiveLanguageList(): string[] {
  return [
    // Profanity and obscenities - redacted for brevity but would include common swear words
    // 'f***', 's***', 'a**', 'b****', 'd***', 'c***', 'h***', 'w****', 
    
    // Slurs and offensive terms - redacted for brevity
    'n-word', 'r-word', 'c-word', 'f-word', 
    
    // Hate speech and discriminatory language
    'racist', 'sexist', 'homophobic', 'transphobic', 'bigot', 'bigotry', 'hatred', 'supremacist',
    'supremacy', 'nazi', 'fascist', 'discrimination', 'prejudice', 'stereotype', 
    
    // Bullying and harmful behavior
    'bully', 'bullying', 'harass', 'harassment', 'threaten', 'threat', 'intimidate', 'intimidation',
    'stalk', 'stalking', 'abuse', 'abusive', 'humiliate', 'humiliation', 'mock', 'mocking',
    'ridicule', 'tease', 'teasing', 'taunt', 'taunting', 'insult', 'insulting',
    
    // Sexual content
    'explicit', 'pornography', 'porn', 'sexual', 'sexy', 'nude', 'naked', 'inappropriate',
    'indecent', 'obscene', 'lewd', 'vulgar', 'graphic', 'disturbing', 'intimate', 'seductive',
    
    // Self-harm and eating disorders
    'suicide', 'self-harm', 'cutting', 'anorexia', 'bulimia', 'purge', 'starve', 'starving',
    'depression', 'depressed', 'anxiety', 'anxious', 'disorder', 'therapy', 'therapist',
    
    // Substance abuse
    'drug', 'drugs', 'alcohol', 'alcoholic', 'addiction', 'addicted', 'addict', 'substance',
    'abuse', 'cigarette', 'tobacco', 'smoking', 'smoke', 'vape', 'vaping', 'marijuana', 'weed',
    'cocaine', 'heroin', 'meth', 'methamphetamine', 'opioid', 'prescription', 'overdose',
    
    // Dangerous activities
    'dangerous', 'risky', 'hazardous', 'harmful', 'deadly', 'lethal', 'fatal', 'injure',
    'injury', 'accident', 'emergency', 'poison', 'toxic', 'unsafe', 'irresponsible',
  ];
  }

/** Comprehensive inappropriate topics list */
function inappropriateTopicsList(): string[] {
  return [
    // Controversial or adult topics
    'dating', 'relationship', 'breakup', 'divorce', 'marriage', 'affair', 'cheat', 'cheating',
    'romance', 'romantic', 'girlfriend', 'boyfriend', 'crush', 'love', 'kiss', 'kissing',
    'hook up', 'hookup', 'flirt', 'flirting', 'attraction', 'attractive', 'pregnancy', 
    'pregnant', 'abortion', 'contraception', 'birth control', 'std', 'sexually transmitted',
    
    // Financial and gambling
    'gambling', 'bet', 'betting', 'lottery', 'casino', 'slot', 'poker', 'blackjack',
    'roulette', 'stock market', 'investment', 'investing', 'cryptocurrency', 'bitcoin',
    'ethereum', 'dogecoin', 'nft', 'trading', 'forex', 'day trading', 'money making',
    
    // Hacking and cybercrime
    'hack', 'hacking', 'hacker', 'cyberattack', 'cybercrime', 'malware', 'virus', 'trojan',
    'phishing', 'scam', 'scammer', 'fraud', 'identity theft', 'password', 'credentials',
    'account', 'security', 'breach', 'unauthorized', 'illegal', 'cheat code', 'pirate',
    'piracy', 'torrent', 'download', 'steal', 'theft',
  ];
}

/**
 * Pre-process a child's message. 
 * Returns allowed=false + reason if we should block it.
 */
export function preProcessUserMessage(
  text: string,
  settings: PersonaSettings,
  customBlacklist: string[],
): { allowed: boolean; reason?: FilterReason; matched?: string } {
  // 1) Abusive language check (always enabled)
  const abusive = findMatch(text, abusiveLanguageList());
  if (abusive) return { allowed: false, reason: 'abusive', matched: abusive };
  
  // 2) Custom words (if enabled)
  if (settings.wordFilteringEnabled) {
    const m = findMatch(text, customBlacklist);
    if (m) return { allowed: false, reason: 'wordFilter', matched: m };
  }
  
  // 3) Violence check (based on level)
  const vm = findMatch(text, violenceList(settings.violenceFilterLevel));
  if (vm) return { allowed: false, reason: 'violence', matched: vm };
  
  // 4) Politics check (based on level)
  const pm = findMatch(text, politicsList(settings.politicsFilterLevel));
  if (pm) return { allowed: false, reason: 'politics', matched: pm };
  
  // 5) Inappropriate topics check (always enabled)
  const inappropriate = findMatch(text, inappropriateTopicsList());
  if (inappropriate) return { allowed: false, reason: 'inappropriate', matched: inappropriate };

  return { allowed: true };
}

/**
 * Post-process the LLM's response. 
 * If it contains anything disallowed, replace entire response with a safe fallback.
 */
export function postProcessLLMResponse(
  text: string,
  settings: PersonaSettings,
  customBlacklist: string[],
): { message: string; wasFiltered: boolean; filterReason?: FilterReason } {
  // Abusive language first (always enabled)
  if (findMatch(text, abusiveLanguageList())) {
    return { message: "Let's talk about something else!", wasFiltered: true, filterReason: 'abusive' };
  }
  
  // Violence check
  if (findMatch(text, violenceList(settings.violenceFilterLevel))) {
    return { message: "Let's talk about something else!", wasFiltered: true, filterReason: 'violence' };
  }
  
  // Politics check
  if (findMatch(text, politicsList(settings.politicsFilterLevel))) {
    return { message: "Let's talk about something else!", wasFiltered: true, filterReason: 'politics' };
  }
  
  // Custom words check (if enabled)
  if (settings.wordFilteringEnabled && findMatch(text, customBlacklist)) {
    return { message: "Let's talk about something else!", wasFiltered: true, filterReason: 'wordFilter' };
  }
  
  // Inappropriate topics check (always enabled)
  if (findMatch(text, inappropriateTopicsList())) {
    return { message: "Let's talk about something else!", wasFiltered: true, filterReason: 'inappropriate' };
  }
  
  // otherwise clean
  return { message: text, wasFiltered: false };
}
