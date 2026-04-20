/* ================================================================
 * data.js - Scripted scenarios and prompts for the demo
 * All content is simulated. No API calls are made.
 * Prompts are condensed from the actual TIKTOK_ANALYSIS_PROMPT
 * in TikTok-Web/openai_vision.py.
 * ================================================================ */

const PLATFORM_CONFIG = {
  tiktok: {
    name: "TikTok-Web",
    tagline: "LLM as Decision Maker",
    url: "www.tiktok.com/foryou",
    model: "gpt-4o-mini (Vision)",
    useLLMDecision: true,
    initialWatch: 8,        // seconds of initial watch before screenshot
    fullWatch: 25,          // additional watch seconds on WATCH_FULL
    skipDuration: 0.5,      // interaction seconds on SKIP
    scenarios: ["depression_loneliness", "just_for_you", "neutral"],
    steps: [
      { id: "navigate",    label: "Navigate / Scroll",         icon: "scroll"    },
      { id: "initial",     label: "Initial Watch (8s)",        icon: "clock"     },
      { id: "screenshot",  label: "Capture Screenshot",        icon: "camera"    },
      { id: "llm",         label: "Send to GPT-4o-mini",       icon: "plane"     },
      { id: "decision",    label: "LLM Decision",              icon: "brain"     },
      { id: "execute",     label: "Watch Full or Skip",        icon: "split"     },
    ],
  },
  youtube: {
    name: "YouTube-Web",
    tagline: "LLM as Describer (not Decider)",
    url: "www.youtube.com/shorts",
    model: "gpt-4o-mini (Vision)",
    useLLMDecision: false,
    initialWatch: 2,
    fullWatch: 10,
    skipDuration: 10,       // no decision - fixed watch window
    scenarios: ["fitness_health", "comedy_entertainment"],
    steps: [
      { id: "navigate",    label: "Navigate to Shorts",        icon: "scroll"    },
      { id: "initial",     label: "Load Short",                icon: "clock"     },
      { id: "screenshot",  label: "Capture Screenshot",        icon: "camera"    },
      { id: "llm",         label: "Send to GPT-4o-mini",       icon: "plane"     },
      { id: "decision",    label: "Describe Content",          icon: "brain"     },
      { id: "execute",     label: "Watch Fixed Duration",      icon: "split"     },
    ],
  },
};

/* ---------------------------------------------------------------- */
/* Condensed prompts (real content from openai_vision.py)           */
/* ---------------------------------------------------------------- */

const PROMPTS = {
  tiktok: `You are analyzing a SINGLE screenshot of a TikTok video for
a mental health content audit study.

Extract STRUCTURED METADATA used to assess whether TikTok's
algorithm exposes vulnerable users to harmful vs supportive
mental health content.

Return ONLY a single JSON object with this schema:
{
  "creator_username": string | null,
  "caption": string | null,
  "hashtags": [string],
  "on_screen_text": string | null,
  "visual_description": string,
  "possible_mental_health_relevance": bool,
  "mental_health_keywords": [string],
  "mental_health_confidence": "high" | "medium" | "low",
  "content_categories": [string]
}

Set possible_mental_health_relevance = TRUE for:
- Depression, anxiety, PTSD, bipolar, eating disorders
- Suicidal thoughts, self-harm, crisis helplines (988)
- Therapy, counseling, psychiatric medication
- Person crying or visibly distressed
- Recovery, healing, coping strategies

Be inclusive rather than exclusive. If there's reasonable doubt,
set to TRUE and let downstream labeling decide.`,

  youtube: `Analyze this YouTube Short screenshot.

Provide a brief description including:
1. Main subject or person in the video
2. Activity being performed
3. Setting and background
4. Any visible text or captions
5. Overall mood or theme

Keep the description concise but informative (2-3 sentences).
This description will be attached to the video metadata for
later analysis. No watch/skip decision is required.`,
};

/* ---------------------------------------------------------------- */
/* Helpers to build scripted video entries.                         */
/* Each video has MH relevance baked in; the decision is computed   */
/* at runtime based on platform + persona.                          */
/* ---------------------------------------------------------------- */

function v(opts) {
  return Object.assign(
    {
      likes: Math.floor(500 + Math.random() * 250_000),
      comments: Math.floor(20 + Math.random() * 5000),
      shares: Math.floor(5 + Math.random() * 2000),
    },
    opts
  );
}

/* ---------------------------------------------------------------- */
/* SCENARIOS                                                        */
/* ---------------------------------------------------------------- */

const SCENARIOS = {
  /* ============================================================ */
  /* TIKTOK SCENARIOS                                              */
  /* ============================================================ */

  depression_loneliness: {
    id: "depression_loneliness",
    platform: "tiktok",
    label: "Depression & Loneliness",
    description: "User who feels depressed and lonely",
    seed_query: "I feel depressed and lonely",
    videos: [
      v({
        username: "@emma_heals",
        displayName: "Emma · Mental Health",
        caption: "Day 47 of recovery from depression 💔",
        hashtags: ["depression", "mentalhealth", "recovery", "healing"],
        on_screen_text: "You are not alone",
        thumbnailHue: 290,
        stance: "supportive",
        llm: {
          creator_username: "@emma_heals",
          caption: "Day 47 of recovery from depression",
          hashtags: ["depression", "mentalhealth", "recovery", "healing"],
          on_screen_text: "You are not alone",
          language: "en",
          visual_description:
            "Young adult female in warmly lit bedroom speaking directly to camera with a calm but emotional expression. Close-up selfie angle, intimate tone.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["depression", "recovery", "healing"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Explicit mental-health recovery content — high confidence.",
      }),
      v({
        username: "@lost_in_silence",
        displayName: "anonymous",
        caption: "nobody would even notice if i disappeared...",
        hashtags: ["sad", "alone", "depressed", "empty"],
        on_screen_text: "i'm so tired",
        thumbnailHue: 230,
        stance: "harmful",
        llm: {
          creator_username: "@lost_in_silence",
          caption: "nobody would even notice if i disappeared",
          hashtags: ["sad", "alone", "depressed", "empty"],
          on_screen_text: "i'm so tired",
          language: "en",
          visual_description:
            "Teenager in dimly lit bedroom, tears visible, speaking softly. Dark atmosphere, close-up shot emphasising distress.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["depression", "suicidal ideation", "hopeless"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Distressing ideation — flagged by LLM as mental-health relevant.",
      }),
      v({
        username: "@dr.mira",
        displayName: "Dr. Mira · Therapist",
        caption: "3 grounding exercises for when anxiety takes over",
        hashtags: ["therapy", "anxiety", "mentalhealth", "coping"],
        on_screen_text: "5-4-3-2-1 grounding technique",
        thumbnailHue: 160,
        stance: "supportive",
        llm: {
          creator_username: "@dr.mira",
          caption: "3 grounding exercises for when anxiety takes over",
          hashtags: ["therapy", "anxiety", "mentalhealth", "coping"],
          on_screen_text: "5-4-3-2-1 grounding technique",
          language: "en",
          visual_description:
            "Professional-looking therapist in a bright office with bookshelf background, demonstrating a breathing exercise.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["anxiety", "therapy", "coping"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Professional mental-health advice — supportive content.",
      }),
      v({
        username: "@latte.life",
        displayName: "Latte Life ☕",
        caption: "morning coffee routine in my tiny apartment",
        hashtags: ["coffee", "morning", "aesthetic", "lifestyle"],
        on_screen_text: null,
        thumbnailHue: 30,
        stance: "neutral",
        llm: {
          creator_username: "@latte.life",
          caption: "morning coffee routine in my tiny apartment",
          hashtags: ["coffee", "morning", "aesthetic", "lifestyle"],
          on_screen_text: null,
          language: "en",
          visual_description:
            "Warm morning kitchen scene, hands pouring espresso into a ceramic cup. Soft natural light, cozy lifestyle vibe.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Lifestyle content — no mental-health relevance.",
      }),
      v({
        username: "@crisis.help",
        displayName: "Crisis Support",
        caption: "If you're struggling, please call 988. You matter.",
        hashtags: ["988", "suicideprevention", "help", "youmatter"],
        on_screen_text: "988 Suicide & Crisis Lifeline",
        thumbnailHue: 200,
        stance: "supportive",
        llm: {
          creator_username: "@crisis.help",
          caption: "If you're struggling, please call 988. You matter.",
          hashtags: ["988", "suicideprevention", "help", "youmatter"],
          on_screen_text: "988 Suicide & Crisis Lifeline",
          language: "en",
          visual_description:
            "Text-forward PSA style video with the 988 hotline number prominently displayed over a calming gradient background.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["suicide prevention", "crisis", "988"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Crisis hotline PSA — mental-health relevant and supportive.",
      }),
      v({
        username: "@justVibes22",
        displayName: "justVibes",
        caption: "POV: your dog sees you after 5 minutes 🐶",
        hashtags: ["dogs", "pets", "cute", "fyp"],
        on_screen_text: null,
        thumbnailHue: 90,
        stance: "neutral",
        llm: {
          creator_username: "@justVibes22",
          caption: "POV: your dog sees you after 5 minutes",
          hashtags: ["dogs", "pets", "cute", "fyp"],
          on_screen_text: null,
          language: "en",
          visual_description:
            "Enthusiastic golden retriever jumping up to greet its owner in a sunny living room. Upbeat, lighthearted tone.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Wholesome pet content — no mental-health relevance.",
      }),
      v({
        username: "@ptsd.warrior",
        displayName: "PTSD Warrior",
        caption: "why therapy changed my life",
        hashtags: ["ptsd", "trauma", "therapy", "healing"],
        on_screen_text: "seeking help isn't weakness",
        thumbnailHue: 260,
        stance: "supportive",
        llm: {
          creator_username: "@ptsd.warrior",
          caption: "why therapy changed my life",
          hashtags: ["ptsd", "trauma", "therapy", "healing"],
          on_screen_text: "seeking help isn't weakness",
          language: "en",
          visual_description:
            "Adult speaker in casual home setting sharing personal trauma recovery journey. Earnest, vulnerable tone.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["PTSD", "trauma", "therapy", "healing"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Personal mental-health journey — supportive.",
      }),
      v({
        username: "@foodie.fred",
        displayName: "Foodie Fred",
        caption: "15-min pasta that will change your weeknight",
        hashtags: ["pasta", "recipe", "quickmeals"],
        on_screen_text: "15 minutes start to finish",
        thumbnailHue: 10,
        stance: "neutral",
        llm: {
          creator_username: "@foodie.fred",
          caption: "15-min pasta that will change your weeknight",
          hashtags: ["pasta", "recipe", "quickmeals"],
          on_screen_text: "15 minutes start to finish",
          language: "en",
          visual_description:
            "Overhead kitchen shot of hands cooking pasta in a stainless steel pan, warm golden lighting.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Cooking content — no mental-health relevance.",
      }),
    ],
  },

  just_for_you: {
    id: "just_for_you",
    platform: "tiktok",
    label: "For You Feed (mixed)",
    description: "Scrolling For You feed without specific search",
    seed_query: null,
    videos: [
      v({
        username: "@nate.the.great",
        displayName: "Nate",
        caption: "bro just got a haircut and feels like a new man",
        hashtags: ["funny", "fyp", "haircut"],
        on_screen_text: null,
        thumbnailHue: 190,
        stance: "neutral",
        llm: {
          creator_username: "@nate.the.great",
          caption: "bro just got a haircut and feels like a new man",
          hashtags: ["funny", "fyp", "haircut"],
          on_screen_text: null,
          language: "en",
          visual_description:
            "Young man showing off a fresh haircut with exaggerated confidence, comedic tone.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Comedy content — no mental-health relevance.",
      }),
      v({
        username: "@therapy.notes",
        displayName: "Therapy Notes",
        caption: "signs you might be masking depression",
        hashtags: ["depression", "mentalhealth", "therapy"],
        on_screen_text: "high-functioning depression",
        thumbnailHue: 280,
        stance: "supportive",
        llm: {
          creator_username: "@therapy.notes",
          caption: "signs you might be masking depression",
          hashtags: ["depression", "mentalhealth", "therapy"],
          on_screen_text: "high-functioning depression",
          language: "en",
          visual_description:
            "Therapist in office setting listing symptoms on a clean infographic overlay.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["depression", "masking", "mental health"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Mental-health education — supportive.",
      }),
      v({
        username: "@gymratz",
        displayName: "GymRatz",
        caption: "this is your sign to start lifting",
        hashtags: ["gym", "fitness", "motivation"],
        on_screen_text: "day 1 energy",
        thumbnailHue: 0,
        stance: "neutral",
        llm: {
          creator_username: "@gymratz",
          caption: "this is your sign to start lifting",
          hashtags: ["gym", "fitness", "motivation"],
          on_screen_text: "day 1 energy",
          language: "en",
          visual_description:
            "Energetic gym scene, person setting up a barbell, vibrant lighting and pumping music vibe.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Fitness motivation — no mental-health relevance.",
      }),
      v({
        username: "@quiet.quitter",
        displayName: "quiet quitter",
        caption: "i think i'm burnt out and nobody cares",
        hashtags: ["burnout", "anxiety", "tired", "mentalhealth"],
        on_screen_text: "running on empty",
        thumbnailHue: 240,
        stance: "harmful",
        llm: {
          creator_username: "@quiet.quitter",
          caption: "i think i'm burnt out and nobody cares",
          hashtags: ["burnout", "anxiety", "tired", "mentalhealth"],
          on_screen_text: "running on empty",
          language: "en",
          visual_description:
            "Young adult sitting at a cluttered desk under fluorescent light, tired expression, somber tone.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["burnout", "anxiety", "emotional exhaustion"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Emotional distress content — mental-health relevant.",
      }),
      v({
        username: "@traveldiaries",
        displayName: "Travel Diaries",
        caption: "hidden island in the Philippines you need to see",
        hashtags: ["travel", "philippines", "beach"],
        on_screen_text: "Siargao, 2026",
        thumbnailHue: 180,
        stance: "neutral",
        llm: {
          creator_username: "@traveldiaries",
          caption: "hidden island in the Philippines you need to see",
          hashtags: ["travel", "philippines", "beach"],
          on_screen_text: "Siargao, 2026",
          language: "en",
          visual_description:
            "Aerial drone footage of a tropical beach with turquoise water and swaying palm trees.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Travel content — no mental-health relevance.",
      }),
      v({
        username: "@ed.recovery",
        displayName: "ED Recovery Together",
        caption: "3 things my dietitian taught me about food freedom",
        hashtags: ["edrecovery", "mentalhealth", "foodfreedom"],
        on_screen_text: "eating is self-care",
        thumbnailHue: 310,
        stance: "supportive",
        llm: {
          creator_username: "@ed.recovery",
          caption: "3 things my dietitian taught me about food freedom",
          hashtags: ["edrecovery", "mentalhealth", "foodfreedom"],
          on_screen_text: "eating is self-care",
          language: "en",
          visual_description:
            "Speaker in soft-lit kitchen plating food, warm and reassuring tone.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["eating disorder", "recovery", "mental health"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Eating disorder recovery — supportive mental-health content.",
      }),
      v({
        username: "@tech.takes",
        displayName: "Tech Takes",
        caption: "the new iPhone camera is insane",
        hashtags: ["tech", "iphone", "review"],
        on_screen_text: "48 megapixel",
        thumbnailHue: 210,
        stance: "neutral",
        llm: {
          creator_username: "@tech.takes",
          caption: "the new iPhone camera is insane",
          hashtags: ["tech", "iphone", "review"],
          on_screen_text: "48 megapixel",
          language: "en",
          visual_description:
            "Studio shot of a smartphone being rotated on a turntable, crisp product photography aesthetic.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Tech review — no mental-health relevance.",
      }),
      v({
        username: "@mind.matters",
        displayName: "Mind Matters",
        caption: "your anxiety isn't your fault — here's the science",
        hashtags: ["anxiety", "brain", "mentalhealth"],
        on_screen_text: "amygdala hijack",
        thumbnailHue: 270,
        stance: "supportive",
        llm: {
          creator_username: "@mind.matters",
          caption: "your anxiety isn't your fault — here's the science",
          hashtags: ["anxiety", "brain", "mentalhealth"],
          on_screen_text: "amygdala hijack",
          language: "en",
          visual_description:
            "Educator explaining with animated brain diagrams overlaid, clean educational style.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["anxiety", "brain", "mental health"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Educational mental-health content — supportive.",
      }),
    ],
  },

  neutral: {
    id: "neutral",
    platform: "tiktok",
    label: "Neutral topics",
    description: "Searching for neutral, non-mental-health topics",
    seed_query: "cute animals",
    videos: [
      v({
        username: "@purrfect.life",
        displayName: "Purrfect Life",
        caption: "kitten's first bath — she's not impressed 🐾",
        hashtags: ["cats", "kittens", "cute", "fyp"],
        on_screen_text: null,
        thumbnailHue: 50,
        stance: "neutral",
        llm: {
          creator_username: "@purrfect.life",
          caption: "kitten's first bath — she's not impressed",
          hashtags: ["cats", "kittens", "cute", "fyp"],
          on_screen_text: null,
          language: "en",
          visual_description:
            "Small grey kitten being gently washed in a bathroom sink, wide-eyed and slightly annoyed.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Pet content — no mental-health relevance.",
      }),
      v({
        username: "@chef.sana",
        displayName: "Chef Sana",
        caption: "30-second garlic butter shrimp",
        hashtags: ["cooking", "recipe", "quickmeals"],
        on_screen_text: "30 seconds",
        thumbnailHue: 20,
        stance: "neutral",
        llm: {
          creator_username: "@chef.sana",
          caption: "30-second garlic butter shrimp",
          hashtags: ["cooking", "recipe", "quickmeals"],
          on_screen_text: "30 seconds",
          language: "en",
          visual_description:
            "Close-up of shrimp sizzling in butter and garlic, steam rising, warm kitchen lighting.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Cooking content — no mental-health relevance.",
      }),
      v({
        username: "@hoop.dreams",
        displayName: "Hoop Dreams",
        caption: "top 10 crossovers of the season 🏀",
        hashtags: ["basketball", "sports", "highlights"],
        on_screen_text: "Top 10",
        thumbnailHue: 20,
        stance: "neutral",
        llm: {
          creator_username: "@hoop.dreams",
          caption: "top 10 crossovers of the season",
          hashtags: ["basketball", "sports", "highlights"],
          on_screen_text: "Top 10",
          language: "en",
          visual_description:
            "High-energy basketball highlight reel with commentary overlay and slow-motion crossovers.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Sports highlights — no mental-health relevance.",
      }),
      v({
        username: "@zen.breath",
        displayName: "Zen Breath",
        caption: "1-minute breathing reset that actually works",
        hashtags: ["breathing", "calm", "anxiety"],
        on_screen_text: "box breathing",
        thumbnailHue: 150,
        stance: "supportive",
        llm: {
          creator_username: "@zen.breath",
          caption: "1-minute breathing reset that actually works",
          hashtags: ["breathing", "calm", "anxiety"],
          on_screen_text: "box breathing",
          language: "en",
          visual_description:
            "Calm ocean background, soft voice guiding a 4-4-4-4 breathing pattern with on-screen timer.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["anxiety", "calm", "breathing"],
          mental_health_confidence: "medium",
          content_categories: [],
        },
        reasoning: "Even in a neutral feed the LLM flags anxiety-related content.",
      }),
      v({
        username: "@gadget.guru",
        displayName: "Gadget Guru",
        caption: "this $20 gadget replaced my $500 one",
        hashtags: ["tech", "gadget", "hack"],
        on_screen_text: "$20 vs $500",
        thumbnailHue: 220,
        stance: "neutral",
        llm: {
          creator_username: "@gadget.guru",
          caption: "this $20 gadget replaced my $500 one",
          hashtags: ["tech", "gadget", "hack"],
          on_screen_text: "$20 vs $500",
          language: "en",
          visual_description:
            "Side-by-side comparison shot of two gadgets on a clean white desk.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Tech content — no mental-health relevance.",
      }),
      v({
        username: "@earthlife",
        displayName: "Earth Life",
        caption: "elephant herd crossing a river at sunset",
        hashtags: ["nature", "wildlife", "elephants"],
        on_screen_text: null,
        thumbnailHue: 35,
        stance: "neutral",
        llm: {
          creator_username: "@earthlife",
          caption: "elephant herd crossing a river at sunset",
          hashtags: ["nature", "wildlife", "elephants"],
          on_screen_text: null,
          language: "en",
          visual_description:
            "Golden-hour wildlife footage of elephants wading across shallow water, majestic wide shot.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Nature content — no mental-health relevance.",
      }),
    ],
  },

  /* ============================================================ */
  /* YOUTUBE SCENARIOS                                             */
  /* ============================================================ */

  fitness_health: {
    id: "fitness_health",
    platform: "youtube",
    label: "Fitness & Health",
    description: "Fitness and health content (no decision-making)",
    seed_query: "home workout",
    videos: [
      v({
        username: "FitWithRay",
        displayName: "Fit With Ray",
        caption: "5-min full-body morning stretch",
        hashtags: ["fitness", "stretch", "morning"],
        on_screen_text: "5 minutes · no equipment",
        thumbnailHue: 340,
        stance: "neutral",
        llm: {
          description:
            "A fitness instructor demonstrates a 5-minute full-body stretching routine on a yoga mat in a well-lit living room. Bright, energetic tone suitable for a morning wake-up workout.",
        },
        reasoning: "Description-only (YouTube-Web). No watch/skip decision.",
      }),
      v({
        username: "HealthyByDanii",
        displayName: "Healthy by Danii",
        caption: "high-protein meal prep for the week",
        hashtags: ["mealprep", "protein", "healthy"],
        on_screen_text: "150g protein/day",
        thumbnailHue: 350,
        stance: "neutral",
        llm: {
          description:
            "Creator prepares multiple portioned meals in glass containers on a kitchen counter. Clean cooking aesthetic with rapid jump cuts and on-screen macro counts.",
        },
        reasoning: "Description-only (YouTube-Web). No watch/skip decision.",
      }),
      v({
        username: "TrainWithMax",
        displayName: "Train With Max",
        caption: "why I stopped doing long cardio",
        hashtags: ["fitness", "cardio", "hiit"],
        on_screen_text: "HIIT > LISS?",
        thumbnailHue: 355,
        stance: "neutral",
        llm: {
          description:
            "Personal trainer speaks to camera in a home gym, whiteboard with training theory visible in the background. Conversational, educational tone.",
        },
        reasoning: "Description-only (YouTube-Web). No watch/skip decision.",
      }),
      v({
        username: "YogaJourneyJen",
        displayName: "Yoga Journey Jen",
        caption: "10-min yoga for tight hips",
        hashtags: ["yoga", "hips", "flexibility"],
        on_screen_text: "follow along",
        thumbnailHue: 345,
        stance: "neutral",
        llm: {
          description:
            "Yoga instructor flows through hip-opening poses on a sunlit hardwood floor. Calm instrumental music, follow-along format, soothing tone.",
        },
        reasoning: "Description-only (YouTube-Web). No watch/skip decision.",
      }),
      v({
        username: "RunItRita",
        displayName: "Run It Rita",
        caption: "marathon training week 6 vlog",
        hashtags: ["running", "marathon", "training"],
        on_screen_text: "18 miles",
        thumbnailHue: 20,
        stance: "neutral",
        llm: {
          description:
            "Runner logs an 18-mile long run through city streets, GoPro footage intercut with post-run recovery in kitchen. High-energy, documentary-style vlog.",
        },
        reasoning: "Description-only (YouTube-Web). No watch/skip decision.",
      }),
      v({
        username: "StrongerMei",
        displayName: "Stronger with Mei",
        caption: "deadlift PR at 185 lbs!",
        hashtags: ["strength", "deadlift", "pr"],
        on_screen_text: "185 lbs · bodyweight 130",
        thumbnailHue: 15,
        stance: "neutral",
        llm: {
          description:
            "Athlete successfully lifts a heavy deadlift in a commercial gym, celebration from training partners in the background. Triumphant mood.",
        },
        reasoning: "Description-only (YouTube-Web). No watch/skip decision.",
      }),
    ],
  },

  comedy_entertainment: {
    id: "comedy_entertainment",
    platform: "youtube",
    label: "Comedy & Entertainment",
    description: "Comedy and entertainment content",
    seed_query: "funny videos",
    videos: [
      v({
        username: "BitsByBrady",
        displayName: "Bits by Brady",
        caption: "when your wifi cuts out mid-meeting",
        hashtags: ["comedy", "skit", "wfh"],
        on_screen_text: "can you hear me?",
        thumbnailHue: 280,
        stance: "neutral",
        llm: {
          description:
            "Comedic skit of a remote worker dramatically reacting to a wifi outage during a video call. Exaggerated expressions and quick cuts.",
        },
        reasoning: "Description-only (YouTube-Web). No watch/skip decision.",
      }),
      v({
        username: "PranksByPablo",
        displayName: "Pranks by Pablo",
        caption: "tipping waiters with $100",
        hashtags: ["prank", "tipping", "kind"],
        on_screen_text: "watch their reaction",
        thumbnailHue: 100,
        stance: "neutral",
        llm: {
          description:
            "A creator hands a waiter a large tip and films their surprised, emotional reaction in a diner. Heartwarming, uplifting tone.",
        },
        reasoning: "Description-only (YouTube-Web). No watch/skip decision.",
      }),
      v({
        username: "Mimicry.Moe",
        displayName: "Mimicry Moe",
        caption: "impressions of every teacher you've had",
        hashtags: ["impressions", "comedy", "school"],
        on_screen_text: "part 3",
        thumbnailHue: 210,
        stance: "neutral",
        llm: {
          description:
            "Solo performer rapid-fires through ten teacher impressions against a plain wall. Quick costume swaps and dynamic editing.",
        },
        reasoning: "Description-only (YouTube-Web). No watch/skip decision.",
      }),
      v({
        username: "FailArmy",
        displayName: "Fail Army",
        caption: "epic skateboard fails compilation",
        hashtags: ["fails", "skate", "compilation"],
        on_screen_text: "try not to cringe",
        thumbnailHue: 5,
        stance: "neutral",
        llm: {
          description:
            "Fast-cut compilation of amateur skateboarders wiping out in parks and streets. Loud upbeat music, lighthearted framing.",
        },
        reasoning: "Description-only (YouTube-Web). No watch/skip decision.",
      }),
      v({
        username: "StoryTimeSteph",
        displayName: "Story Time Steph",
        caption: "storytime: my uber driver had a pet goat",
        hashtags: ["storytime", "funny", "uber"],
        on_screen_text: null,
        thumbnailHue: 320,
        stance: "neutral",
        llm: {
          description:
            "Creator speaks directly to camera in car selfie angle telling an animated story, engaging and conversational delivery.",
        },
        reasoning: "Description-only (YouTube-Web). No watch/skip decision.",
      }),
      v({
        username: "KidSaysWhat",
        displayName: "Kids Say What",
        caption: "asking 5 year olds deep questions",
        hashtags: ["kids", "funny", "cute"],
        on_screen_text: "what is love?",
        thumbnailHue: 60,
        stance: "neutral",
        llm: {
          description:
            "Interviewer asks young children thoughtful questions at a playground, cutting to their earnest and hilarious answers.",
        },
        reasoning: "Description-only (YouTube-Web). No watch/skip decision.",
      }),
    ],
  },
};

/* ---------------------------------------------------------------- */
/* Expose to window for non-module usage                            */
/* ---------------------------------------------------------------- */
window.PLATFORM_CONFIG = PLATFORM_CONFIG;
window.PROMPTS = PROMPTS;
window.SCENARIOS = SCENARIOS;
