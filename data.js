/* ================================================================
 * data.js - Scripted scenarios and prompts for the demo
 * All content is simulated. No API calls are made.
 * ================================================================ */

const PLATFORM_CONFIG = {
  tiktok: {
    name: "tiktok",
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
    name: "youtube",
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
/* Condensed prompts shown in the LLM panel                         */
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
/* Helpers                                                          */
/* ---------------------------------------------------------------- */

// Deterministic engagement numbers keyed by username so every run looks the
// same and numbers feel platform-realistic (TikTok feeds skew to viral outliers).
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}
function engagementFor(username, bias = 1) {
  const h = hashStr(username);
  // NOTE: use UNSIGNED right shift (>>>) everywhere so results stay positive
  // on 32-bit values with the high bit set.
  const base = 800 + (h % 320000);
  const viral = ((h >>> 7) % 100) < 8 ? (900000 + ((h >>> 13) % 4_100_000)) : 0;
  const likes = Math.max(0, Math.floor((base + viral) * bias));
  const comments = Math.floor(likes * (0.005 + ((h >>> 3) % 100) / 2500));
  const shares = Math.floor(likes * (0.002 + ((h >>> 11) % 100) / 4500));
  const bookmarks = Math.floor(likes * (0.004 + ((h >>> 17) % 100) / 3200));
  return { likes, comments, shares, bookmarks };
}

function v(opts) {
  const eng = engagementFor(opts.username || "anon", opts.engagementBias || 1);
  return Object.assign({}, eng, opts);
}

/* ---------------------------------------------------------------- */
/* SCENARIOS                                                        */
/* ---------------------------------------------------------------- */

const SCENARIOS = {
  /* ============================================================ */
  /* TIKTOK · depression_loneliness                                */
  /* ============================================================ */

  depression_loneliness: {
    id: "depression_loneliness",
    platform: "tiktok",
    label: "Depression & Loneliness",
    description: "Vulnerable user searching for emotional support",
    seed_query: "I feel depressed and lonely",
    videos: [
      v({
        username: "@emma.heals",
        displayName: "Emma · recovery diaries",
        caption: "day 47 of getting out of bed. it still hurts but it hurts less 🤍 small wins are still wins",
        hashtags: ["depression","mentalhealth","recovery","healing","smallwins","mentalhealthjourney","youmatter"],
        on_screen_text: "day 47 / you are not alone",
        thumbnailHue: 290,
        stance: "supportive",
        engagementBias: 2.4,
        llm: {
          creator_username: "@emma.heals",
          caption: "day 47 of getting out of bed. it still hurts but it hurts less",
          hashtags: ["depression","mentalhealth","recovery","healing","smallwins","mentalhealthjourney"],
          on_screen_text: "day 47 / you are not alone",
          language: "en",
          visual_description:
            "Young adult woman in warmly lit bedroom speaking softly to camera. Makeup-free, hair tied up, wearing an oversized hoodie. Calm-but-emotional expression, close-up selfie angle, intimate tone. A journal and half-finished coffee are visible on the nightstand.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["depression","recovery","healing","mental health"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Explicit depression-recovery vlog — high confidence. Supportive framing.",
      }),
      v({
        username: "@lost.in.silence_",
        displayName: "anon.",
        caption: "would anyone even notice if i just stopped showing up.... this isn't a cry for help it's just a thought",
        hashtags: ["sad","alone","depressed","empty","tired","novisibility","invisible","4u"],
        on_screen_text: "i'm so tired",
        thumbnailHue: 230,
        stance: "harmful",
        engagementBias: 0.8,
        llm: {
          creator_username: "@lost.in.silence_",
          caption: "would anyone even notice if i just stopped showing up",
          hashtags: ["sad","alone","depressed","empty","tired","invisible"],
          on_screen_text: "i'm so tired",
          language: "en",
          visual_description:
            "Teenager sitting on the floor of a dimly lit bedroom, knees pulled to chest, faint tears visible on cheeks. Only a phone flashlight illuminating the face. Somber, distressed tone; slow zoom-in framing.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["depression","passive suicidal ideation","isolation","hopeless"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Contains passive suicidal ideation cues — flagged with high confidence.",
      }),
      v({
        username: "@dr.mira.therapy",
        displayName: "Dr. Mira · LMFT",
        caption: "if your anxiety spikes at 3am try this 5-4-3-2-1 grounding exercise — saved me countless nights during residency ✨",
        hashtags: ["therapy","anxiety","mentalhealth","coping","grounding","therapistsoftiktok","anxietyrelief","cbt"],
        on_screen_text: "5-4-3-2-1 · ground yourself",
        thumbnailHue: 160,
        stance: "supportive",
        engagementBias: 3.1,
        llm: {
          creator_username: "@dr.mira.therapy",
          caption: "if your anxiety spikes at 3am try this 5-4-3-2-1 grounding exercise",
          hashtags: ["therapy","anxiety","mentalhealth","coping","grounding","cbt"],
          on_screen_text: "5-4-3-2-1 · ground yourself",
          language: "en",
          visual_description:
            "Licensed therapist in a warmly lit home office with a bookshelf background, demonstrating a grounding exercise on-camera. Animated text overlays count down from 5 senses to 1. Professional but approachable tone.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["anxiety","therapy","grounding","coping skills"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Licensed-therapist educational content — supportive, high confidence.",
      }),
      v({
        username: "@latte.life",
        displayName: "Latte Life ☕",
        caption: "my 6am routine in a 350 sq ft apartment · espresso, one chapter, sunrise",
        hashtags: ["coffee","morningroutine","aesthetic","slowliving","apartmenttherapy","latte","cozy"],
        on_screen_text: null,
        thumbnailHue: 30,
        stance: "neutral",
        engagementBias: 1.6,
        llm: {
          creator_username: "@latte.life",
          caption: "my 6am routine in a 350 sq ft apartment — espresso, one chapter, sunrise",
          hashtags: ["coffee","morningroutine","aesthetic","slowliving","apartmenttherapy","latte","cozy"],
          on_screen_text: null,
          language: "en",
          visual_description:
            "Warm morning kitchen scene. Hands pouring espresso into a small ceramic cup, steam visible, golden hour lighting through a window. A vinyl record spins in the background. Cozy, slow-living lifestyle aesthetic.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Lifestyle / aesthetic content — no mental-health relevance.",
      }),
      v({
        username: "@crisis.support.us",
        displayName: "Crisis Support USA",
        caption: "reminder: you can call or text 988 anytime, free and confidential. please save this. 🤍",
        hashtags: ["988","suicideprevention","help","youmatter","mentalhealth","crisisline","pleasestay","callforhelp"],
        on_screen_text: "988  ·  Suicide & Crisis Lifeline\n(call or text, 24/7)",
        thumbnailHue: 200,
        stance: "supportive",
        engagementBias: 1.9,
        llm: {
          creator_username: "@crisis.support.us",
          caption: "you can call or text 988 anytime, free and confidential. please save this.",
          hashtags: ["988","suicideprevention","help","youmatter","mentalhealth","crisisline"],
          on_screen_text: "988 · Suicide & Crisis Lifeline (call or text, 24/7)",
          language: "en",
          visual_description:
            "PSA-style video with the 988 hotline number in large typography over a soft gradient background. Gentle piano music implied by waveform at the top. Calm, reassuring voiceover.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["suicide prevention","crisis","988","helpline"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Crisis hotline PSA — mental-health relevant and clearly supportive.",
      }),
      v({
        username: "@justvibes22",
        displayName: "justVibes",
        caption: "POV: your golden sees you after 5 minutes. this cured my monday 🐶",
        hashtags: ["dogs","goldenretriever","pov","dogsoftiktok","fyp","wholesome","puppylove"],
        on_screen_text: "he genuinely missed me",
        thumbnailHue: 90,
        stance: "neutral",
        engagementBias: 2.0,
        llm: {
          creator_username: "@justvibes22",
          caption: "POV: your golden sees you after 5 minutes",
          hashtags: ["dogs","goldenretriever","pov","dogsoftiktok","fyp","wholesome"],
          on_screen_text: "he genuinely missed me",
          language: "en",
          visual_description:
            "Enthusiastic golden retriever leaps up to greet its owner in a sunny living room. Handheld phone footage, quick cuts, upbeat vibe with visible tail-wag motion blur.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Wholesome pet content — no mental-health relevance.",
      }),
      v({
        username: "@ptsd.warrior",
        displayName: "Jade · PTSD Warrior",
        caption: "why i cried the first 3 sessions of therapy and why that was a good thing",
        hashtags: ["ptsd","trauma","therapy","emdr","healing","traumarecovery","mentalhealthawareness","veteran"],
        on_screen_text: "seeking help isn't weakness. it's the bravest thing i've done.",
        thumbnailHue: 260,
        stance: "supportive",
        engagementBias: 2.2,
        llm: {
          creator_username: "@ptsd.warrior",
          caption: "why i cried the first 3 sessions of therapy and why that was a good thing",
          hashtags: ["ptsd","trauma","therapy","emdr","healing","traumarecovery","mentalhealthawareness"],
          on_screen_text: "seeking help isn't weakness",
          language: "en",
          visual_description:
            "Adult speaker in casual home setting, soft overhead lighting, tears visible but composed. Shares personal trauma recovery journey with earnest, vulnerable delivery. Low-key non-monetized aesthetic.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["PTSD","trauma","therapy","healing","EMDR"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Personal trauma-recovery content — supportive, high confidence.",
      }),
      v({
        username: "@foodie.fred",
        displayName: "Foodie Fred 🍝",
        caption: "15-minute garlic-parm pasta that will ruin restaurant pasta for you forever",
        hashtags: ["pasta","recipe","quickmeals","weeknightdinner","foodtok","garlic","pastalover"],
        on_screen_text: "15 min · 6 ingredients",
        thumbnailHue: 10,
        stance: "neutral",
        engagementBias: 1.3,
        llm: {
          creator_username: "@foodie.fred",
          caption: "15-minute garlic-parm pasta that will ruin restaurant pasta for you forever",
          hashtags: ["pasta","recipe","quickmeals","weeknightdinner","foodtok"],
          on_screen_text: "15 min · 6 ingredients",
          language: "en",
          visual_description:
            "Overhead kitchen shot, hands toss pasta with bubbling garlic-butter in a stainless steel pan. Warm golden lighting, crisp ASMR-style audio of oil sizzling.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Cooking content — no mental-health relevance.",
      }),
      v({
        username: "@selfhelp.sasha",
        displayName: "Sasha · self-help but make it real",
        caption: "just \"choose happiness\" is the worst advice i've ever received. here's what actually helped.",
        hashtags: ["mentalhealth","selfhelp","toxicpositivity","realhelp","therapy","anxiety","depression"],
        on_screen_text: "toxic positivity is still toxic",
        thumbnailHue: 320,
        stance: "supportive",
        engagementBias: 1.7,
        llm: {
          creator_username: "@selfhelp.sasha",
          caption: "\"just choose happiness\" is the worst advice i've ever received. here's what actually helped.",
          hashtags: ["mentalhealth","selfhelp","toxicpositivity","realhelp","therapy","anxiety"],
          on_screen_text: "toxic positivity is still toxic",
          language: "en",
          visual_description:
            "Creator speaks directly to camera in neutral home setting with indoor plants. Calm, matter-of-fact delivery, occasional text overlays with tips. Mid-shot angle.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["toxic positivity","mental health","self-help"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Critique of toxic positivity — mental-health relevant, supportive.",
      }),
      v({
        username: "@night.thoughts_.04",
        displayName: "can't sleep again",
        caption: "3am and my brain is doing that thing again. anyone else here too 🥲",
        hashtags: ["insomnia","anxiety","3am","cantsleep","overthinking","mentalhealth","anxious"],
        on_screen_text: "spiraling at 3:47am",
        thumbnailHue: 250,
        stance: "harmful",
        engagementBias: 1.1,
        llm: {
          creator_username: "@night.thoughts_.04",
          caption: "3am and my brain is doing that thing again. anyone else here too",
          hashtags: ["insomnia","anxiety","3am","cantsleep","overthinking","mentalhealth"],
          on_screen_text: "spiraling at 3:47am",
          language: "en",
          visual_description:
            "Phone flashlight selfie in a dark bedroom, person whispering toward camera, visibly exhausted, eyes puffy. Blanket over shoulders. Intimate and somewhat distressed tone.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["insomnia","anxiety","overthinking","rumination"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Nighttime anxiety/insomnia content — mental-health relevant.",
      }),
      v({
        username: "@psychprof.kim",
        displayName: "Dr. Kim · clinical psych",
        caption: "4 signs your \"being fine\" is actually high-functioning depression · saving this made me finally book a therapist",
        hashtags: ["depression","highfunctioning","mentalhealth","therapy","psychologist","cbt","awareness"],
        on_screen_text: "high-functioning ≠ happy",
        thumbnailHue: 280,
        stance: "supportive",
        engagementBias: 2.8,
        llm: {
          creator_username: "@psychprof.kim",
          caption: "4 signs your \"being fine\" is actually high-functioning depression",
          hashtags: ["depression","highfunctioning","mentalhealth","therapy","psychologist"],
          on_screen_text: "high-functioning ≠ happy",
          language: "en",
          visual_description:
            "Professor-style speaker in front of a whiteboard with a bulleted list. Clean cut production, educational tone, on-screen animations emphasising each point.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["depression","high-functioning","mental health","therapy"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Mental-health psychoeducation — supportive, high confidence.",
      }),
      v({
        username: "@camping.casey",
        displayName: "Casey · van life",
        caption: "woke up to this view in moab · #7 on my solo trip ⛺️",
        hashtags: ["vanlife","camping","moab","soloadventure","travel","outdoors","sunrise","utah"],
        on_screen_text: null,
        thumbnailHue: 20,
        stance: "neutral",
        engagementBias: 1.8,
        llm: {
          creator_username: "@camping.casey",
          caption: "woke up to this view in moab — #7 on my solo trip",
          hashtags: ["vanlife","camping","moab","soloadventure","travel","outdoors"],
          on_screen_text: null,
          language: "en",
          visual_description:
            "Van sliding door opens onto red-rock desert canyon at sunrise. Hand-held first-person view, coffee steaming in the foreground, warm color palette.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Travel / outdoors content — no mental-health relevance.",
      }),
      v({
        username: "@recovery.together",
        displayName: "recovery together · ED support",
        caption: "my dietitian said one sentence and it changed how i eat forever 🤍 swipe if you need to hear this",
        hashtags: ["edrecovery","eatingdisorderrecovery","mentalhealth","foodfreedom","healing","selflove","dietitian"],
        on_screen_text: "eating is self-care, not a failure",
        thumbnailHue: 310,
        stance: "supportive",
        engagementBias: 1.5,
        llm: {
          creator_username: "@recovery.together",
          caption: "my dietitian said one sentence and it changed how i eat forever",
          hashtags: ["edrecovery","mentalhealth","foodfreedom","healing","selflove"],
          on_screen_text: "eating is self-care, not a failure",
          language: "en",
          visual_description:
            "Soft-lit kitchen, creator plates breakfast while speaking to camera. Warm, reassuring tone with steady voice. Calm music overlay.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["eating disorder","recovery","mental health","self-care"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Eating-disorder recovery content — mental-health relevant, supportive.",
      }),
      v({
        username: "@nails.by.ren",
        displayName: "Ren · nail artist",
        caption: "chrome ombré set for a bride 💅 took 3h 40 and i would die for her",
        hashtags: ["naildesign","chromenails","bridalnails","nailart","nailsoftiktok","nailinspo","beauty"],
        on_screen_text: "bride's request: subtle 💅",
        thumbnailHue: 330,
        stance: "neutral",
        engagementBias: 1.2,
        llm: {
          creator_username: "@nails.by.ren",
          caption: "chrome ombré set for a bride — took 3h 40",
          hashtags: ["naildesign","chromenails","bridalnails","nailart","nailsoftiktok"],
          on_screen_text: "bride's request: subtle",
          language: "en",
          visual_description:
            "Macro close-up of nail-art process, hands applying chrome powder with a tiny brush. Bright ring-light studio setup, satisfying tactile footage.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Beauty / nails content — no mental-health relevance.",
      }),
    ],
  },

  /* ============================================================ */
  /* TIKTOK · just_for_you                                         */
  /* ============================================================ */

  just_for_you: {
    id: "just_for_you",
    platform: "tiktok",
    label: "For You Feed (mixed)",
    description: "Algorithmic feed with no specific seed query",
    seed_query: null,
    videos: [
      v({
        username: "@nate.the.great",
        displayName: "Nate · actor studio kid",
        caption: "bro got a fresh fade and suddenly he speaks 4 languages and owns property",
        hashtags: ["funny","fyp","freshcut","comedy","skit","haircut","viral"],
        on_screen_text: null,
        thumbnailHue: 190,
        stance: "neutral",
        engagementBias: 2.6,
        llm: {
          creator_username: "@nate.the.great",
          caption: "bro got a fresh fade and suddenly he speaks 4 languages and owns property",
          hashtags: ["funny","fyp","freshcut","comedy","skit"],
          on_screen_text: null,
          language: "en",
          visual_description:
            "Young man showing off a fresh haircut in a bathroom mirror with exaggerated swagger. Quick zoom edits and punchy comedic timing.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Comedy skit — no mental-health relevance.",
      }),
      v({
        username: "@therapy.notes.daily",
        displayName: "therapy notes · anon",
        caption: "8 signs you might be masking depression from yourself · #3 hit me hard",
        hashtags: ["depression","mentalhealth","therapy","masking","highfunctioning","awareness","selfawareness","anxiety"],
        on_screen_text: "the \"i'm fine\" mask",
        thumbnailHue: 280,
        stance: "supportive",
        engagementBias: 2.1,
        llm: {
          creator_username: "@therapy.notes.daily",
          caption: "8 signs you might be masking depression from yourself",
          hashtags: ["depression","mentalhealth","therapy","masking","highfunctioning","awareness"],
          on_screen_text: "the \"i'm fine\" mask",
          language: "en",
          visual_description:
            "Creator speaks calmly in soft-lit home office, animated infographic overlays listing 8 signs one by one. Warm neutral color grade, educational tone.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["depression","masking","mental health"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Mental-health education — supportive.",
      }),
      v({
        username: "@gymratz.daily",
        displayName: "gym ratz",
        caption: "this is your sign to walk into the gym for the first time. nobody's watching you i promise",
        hashtags: ["gym","fitness","motivation","beginner","gymtok","firstday","lifting"],
        on_screen_text: "day 1 · you got this",
        thumbnailHue: 0,
        stance: "neutral",
        engagementBias: 1.4,
        llm: {
          creator_username: "@gymratz.daily",
          caption: "this is your sign to walk into the gym for the first time",
          hashtags: ["gym","fitness","motivation","beginner","gymtok"],
          on_screen_text: "day 1 · you got this",
          language: "en",
          visual_description:
            "Energetic gym scene, wide-angle shot of a person setting up a barbell under neon lighting. Fast-paced hip-hop audio, bold text overlays.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Fitness motivation — no mental-health relevance.",
      }),
      v({
        username: "@quiet.quitter.lol",
        displayName: "kay · burnout diaries",
        caption: "i think i'm burnt out and nobody in my life cares because i keep performing well at work 🙃",
        hashtags: ["burnout","anxiety","corporatelife","mentalhealth","tired","workstress","9to5","performance"],
        on_screen_text: "running on empty",
        thumbnailHue: 240,
        stance: "harmful",
        engagementBias: 1.9,
        llm: {
          creator_username: "@quiet.quitter.lol",
          caption: "i think i'm burnt out and nobody in my life cares",
          hashtags: ["burnout","anxiety","corporatelife","mentalhealth","tired","workstress"],
          on_screen_text: "running on empty",
          language: "en",
          visual_description:
            "Young adult sitting at a cluttered desk under harsh fluorescent light, tired expression, empty energy drink cans in view. Somber handheld framing.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["burnout","anxiety","emotional exhaustion"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Burnout / emotional exhaustion content — mental-health relevant.",
      }),
      v({
        username: "@traveldiaries.jen",
        displayName: "jen · 49 countries",
        caption: "i flew 16 hours to see this hidden island and it broke me (in a good way) 🇵🇭",
        hashtags: ["travel","philippines","siargao","solotravel","bucketlist","beach","hiddengem","wanderlust"],
        on_screen_text: "Siargao · March 2026",
        thumbnailHue: 180,
        stance: "neutral",
        engagementBias: 2.0,
        llm: {
          creator_username: "@traveldiaries.jen",
          caption: "flew 16 hours to see this hidden island",
          hashtags: ["travel","philippines","siargao","solotravel","bucketlist","beach"],
          on_screen_text: "Siargao · March 2026",
          language: "en",
          visual_description:
            "Aerial drone footage of a tropical beach with turquoise water and swaying palm trees. Cinematic color grade, ambient music implied.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Travel content — no mental-health relevance.",
      }),
      v({
        username: "@ed.recovery.together",
        displayName: "ED recovery together",
        caption: "3 things my dietitian taught me about food freedom that therapy couldn't 🤍",
        hashtags: ["edrecovery","mentalhealth","foodfreedom","healing","dietitian","selflove","recovery","intuitiveeating"],
        on_screen_text: "eating is self-care",
        thumbnailHue: 310,
        stance: "supportive",
        engagementBias: 1.4,
        llm: {
          creator_username: "@ed.recovery.together",
          caption: "3 things my dietitian taught me about food freedom",
          hashtags: ["edrecovery","mentalhealth","foodfreedom","healing","dietitian","selflove"],
          on_screen_text: "eating is self-care",
          language: "en",
          visual_description:
            "Creator plating a colorful plate of food in soft-lit kitchen. Speaks to camera between bites with warm, reassuring tone.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["eating disorder","recovery","mental health"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Eating-disorder recovery — mental-health relevant, supportive.",
      }),
      v({
        username: "@tech.takes.with.raj",
        displayName: "Raj · tech takes",
        caption: "i tested the new iphone camera against a $3k mirrorless · the results shocked me",
        hashtags: ["tech","iphone","review","photography","mirrorless","apple","techtok","camera"],
        on_screen_text: "48 MP · side by side",
        thumbnailHue: 210,
        stance: "neutral",
        engagementBias: 1.7,
        llm: {
          creator_username: "@tech.takes.with.raj",
          caption: "tested the new iphone camera against a $3k mirrorless",
          hashtags: ["tech","iphone","review","photography","apple","camera"],
          on_screen_text: "48 MP · side by side",
          language: "en",
          visual_description:
            "Studio shot of a smartphone on a turntable next to a DSLR. Crisp product photography, clean minimalist background.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Tech review — no mental-health relevance.",
      }),
      v({
        username: "@mind.matters.io",
        displayName: "mind matters · neuroscience",
        caption: "your anxiety isn't your fault — here's what the amygdala is actually doing (and how to calm it)",
        hashtags: ["anxiety","brain","neuroscience","mentalhealth","amygdala","stress","regulation","nervoussystem"],
        on_screen_text: "amygdala hijack explained",
        thumbnailHue: 270,
        stance: "supportive",
        engagementBias: 2.3,
        llm: {
          creator_username: "@mind.matters.io",
          caption: "your anxiety isn't your fault — here's what the amygdala is actually doing",
          hashtags: ["anxiety","brain","neuroscience","mentalhealth","amygdala","stress"],
          on_screen_text: "amygdala hijack explained",
          language: "en",
          visual_description:
            "Educator in front of animated brain diagrams, clean educational style, 3D amygdala rendered with highlights during explanation.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["anxiety","brain","amygdala","mental health"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Neuroscience-based anxiety education — supportive.",
      }),
      v({
        username: "@trendy.toni",
        displayName: "Toni · #ootd",
        caption: "outfit inspo for when you want to look expensive on a $40 budget 💸",
        hashtags: ["ootd","fashion","thrift","budgetstyle","trending","styleinspo","fashiontok"],
        on_screen_text: "thrift haul · $40",
        thumbnailHue: 340,
        stance: "neutral",
        engagementBias: 1.3,
        llm: {
          creator_username: "@trendy.toni",
          caption: "outfit inspo for when you want to look expensive on a $40 budget",
          hashtags: ["ootd","fashion","thrift","budgetstyle","styleinspo","fashiontok"],
          on_screen_text: "thrift haul · $40",
          language: "en",
          visual_description:
            "Full-length mirror, creator rotates through 3 outfits with jump-cut transitions. Ring-light lit bedroom, bright clean palette.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Fashion / thrift content — no mental-health relevance.",
      }),
      v({
        username: "@lovebomb_stories",
        displayName: "storytime with kass",
        caption: "storytime: i realized my relationship was emotionally abusive and here's how i left 🚩",
        hashtags: ["storytime","toxicrelationship","mentalhealth","trauma","emotionalabuse","healing","leaving","therapy"],
        on_screen_text: "part 1/4",
        thumbnailHue: 0,
        stance: "harmful",
        engagementBias: 2.0,
        llm: {
          creator_username: "@lovebomb_stories",
          caption: "storytime: i realized my relationship was emotionally abusive and here's how i left",
          hashtags: ["storytime","toxicrelationship","mentalhealth","trauma","emotionalabuse","healing"],
          on_screen_text: "part 1/4",
          language: "en",
          visual_description:
            "Creator speaks directly to front camera in a car (parked), visibly emotional. Black and white text overlays highlight key moments.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["trauma","emotional abuse","mental health","healing"],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Trauma storytime — mental-health relevant.",
      }),
      v({
        username: "@puppy_of_the_day",
        displayName: "puppies, daily",
        caption: "the way he sighs when mom finally sits down 🥹",
        hashtags: ["puppy","cute","dogsoftiktok","wholesome","fyp","pets","aww"],
        on_screen_text: null,
        thumbnailHue: 45,
        stance: "neutral",
        engagementBias: 3.2,
        llm: {
          creator_username: "@puppy_of_the_day",
          caption: "the way he sighs when mom finally sits down",
          hashtags: ["puppy","cute","dogsoftiktok","wholesome","fyp","pets"],
          on_screen_text: null,
          language: "en",
          visual_description:
            "Small beagle puppy nestles into blanket on a couch, lets out a visible sigh. Warm living-room lighting, cozy atmosphere.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Pet content — no mental-health relevance.",
      }),
      v({
        username: "@mindful.mateo",
        displayName: "Mateo · meditations",
        caption: "a 60-second breathing exercise for when your chest feels tight 🤍",
        hashtags: ["anxiety","breathing","boxbreathing","meditation","mentalhealth","calm","panicattack"],
        on_screen_text: "box breathing · 4-4-4-4",
        thumbnailHue: 150,
        stance: "supportive",
        engagementBias: 1.6,
        llm: {
          creator_username: "@mindful.mateo",
          caption: "a 60-second breathing exercise for when your chest feels tight",
          hashtags: ["anxiety","breathing","boxbreathing","meditation","mentalhealth","calm"],
          on_screen_text: "box breathing · 4-4-4-4",
          language: "en",
          visual_description:
            "Calm ocean background, animated box guides the user through 4-4-4-4 breathing. Soft voiceover and ambient waves audio.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["anxiety","breathing","panic attack","calm"],
          mental_health_confidence: "medium",
          content_categories: [],
        },
        reasoning: "Even in a mixed feed the LLM flags anxiety-regulation content.",
      }),
      v({
        username: "@crunchy.credit.score",
        displayName: "personal finance with mo",
        caption: "the 3 credit-card moves that boosted my score 120 points in 7 months · saving this for my future self",
        hashtags: ["creditscore","personalfinance","moneytok","budgeting","debtfree","financialliteracy","adulting"],
        on_screen_text: "+120 in 7 months",
        thumbnailHue: 120,
        stance: "neutral",
        engagementBias: 1.8,
        llm: {
          creator_username: "@crunchy.credit.score",
          caption: "the 3 credit-card moves that boosted my score 120 points",
          hashtags: ["creditscore","personalfinance","moneytok","budgeting","debtfree"],
          on_screen_text: "+120 in 7 months",
          language: "en",
          visual_description:
            "Animated spreadsheet / score-tracking graph with hand-drawn arrows. Voiceover from the creator, clean green-accent color scheme.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Personal finance content — no mental-health relevance.",
      }),
    ],
  },

  /* ============================================================ */
  /* TIKTOK · neutral                                              */
  /* ============================================================ */

  neutral: {
    id: "neutral",
    platform: "tiktok",
    label: "Neutral topics",
    description: "Searching for neutral, non-mental-health topics",
    seed_query: "cute animals",
    videos: [
      v({
        username: "@purrfect.life",
        displayName: "Purrfect Life 🐾",
        caption: "kitten's first bath experience. unclear who is more traumatized honestly",
        hashtags: ["cats","kittens","cute","fyp","firstbath","catsoftiktok","petsoftiktok"],
        on_screen_text: "she is plotting revenge",
        thumbnailHue: 50,
        stance: "neutral",
        engagementBias: 2.8,
        llm: {
          creator_username: "@purrfect.life",
          caption: "kitten's first bath experience",
          hashtags: ["cats","kittens","cute","fyp","catsoftiktok"],
          on_screen_text: "she is plotting revenge",
          language: "en",
          visual_description:
            "Small grey kitten being gently washed in a bathroom sink, wide-eyed, dripping wet. Warm bathroom lighting, soft-focus on background towels.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Pet content — no mental-health relevance.",
      }),
      v({
        username: "@chef.sana",
        displayName: "Chef Sana · 30-sec recipes",
        caption: "30-second garlic butter shrimp that will make you feel rich · restaurant dupe",
        hashtags: ["cooking","recipe","quickmeals","shrimp","restaurantdupe","foodtok","30secondmeal"],
        on_screen_text: "30 seconds · $6 per plate",
        thumbnailHue: 20,
        stance: "neutral",
        engagementBias: 1.6,
        llm: {
          creator_username: "@chef.sana",
          caption: "30-second garlic butter shrimp",
          hashtags: ["cooking","recipe","quickmeals","shrimp","foodtok"],
          on_screen_text: "30 seconds · $6 per plate",
          language: "en",
          visual_description:
            "Close-up of shrimp sizzling in butter and garlic, steam rising, hand tossing the pan. Warm kitchen lighting, crisp ASMR-style audio.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Cooking content — no mental-health relevance.",
      }),
      v({
        username: "@hoop.dreams",
        displayName: "Hoop Dreams · NBA",
        caption: "top 10 crossovers of the season that broke ankles and my spirit 🏀",
        hashtags: ["basketball","nba","sports","highlights","crossover","sportstok","top10"],
        on_screen_text: "Top 10 · 2025-26",
        thumbnailHue: 20,
        stance: "neutral",
        engagementBias: 2.4,
        llm: {
          creator_username: "@hoop.dreams",
          caption: "top 10 crossovers of the season that broke ankles",
          hashtags: ["basketball","nba","sports","highlights","crossover"],
          on_screen_text: "Top 10 · 2025-26",
          language: "en",
          visual_description:
            "High-energy basketball highlight reel, announcer commentary overlay, slow-motion replays on crossovers. Dynamic editing with score counters.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Sports highlights — no mental-health relevance.",
      }),
      v({
        username: "@zen.breath.daily",
        displayName: "Zen Breath",
        caption: "1-minute breathing reset for when your nervous system won't chill 🌿",
        hashtags: ["breathing","calm","anxiety","nervoussystem","breathwork","mindfulness","meditation"],
        on_screen_text: "box breathing · follow along",
        thumbnailHue: 150,
        stance: "supportive",
        engagementBias: 1.2,
        llm: {
          creator_username: "@zen.breath.daily",
          caption: "1-minute breathing reset for when your nervous system won't chill",
          hashtags: ["breathing","calm","anxiety","nervoussystem","breathwork","mindfulness"],
          on_screen_text: "box breathing · follow along",
          language: "en",
          visual_description:
            "Calm ocean background, soft voice guiding a 4-4-4-4 breathing pattern with an on-screen animated square expanding and contracting.",
          possible_mental_health_relevance: true,
          mental_health_keywords: ["anxiety","calm","breathing","nervous system"],
          mental_health_confidence: "medium",
          content_categories: [],
        },
        reasoning: "Even in a neutral feed, the LLM flags anxiety-related content (medium confidence).",
      }),
      v({
        username: "@gadget.guru",
        displayName: "Gadget Guru · $20 vs $500",
        caption: "this $20 gadget replaced my $500 one and i'm kind of upset about it",
        hashtags: ["tech","gadget","hack","amazonfinds","tiktokmademebuyit","tech","budgetgear"],
        on_screen_text: "$20 vs $500",
        thumbnailHue: 220,
        stance: "neutral",
        engagementBias: 1.9,
        llm: {
          creator_username: "@gadget.guru",
          caption: "this $20 gadget replaced my $500 one",
          hashtags: ["tech","gadget","hack","amazonfinds","tiktokmademebuyit"],
          on_screen_text: "$20 vs $500",
          language: "en",
          visual_description:
            "Side-by-side comparison of two gadgets on a clean white desk with price tags. Quick cuts, hand demonstration of each.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Tech / gadget content — no mental-health relevance.",
      }),
      v({
        username: "@earthlife.daily",
        displayName: "Earth Life · nature",
        caption: "an elephant herd crossing a river at golden hour · 4k drone footage 🐘",
        hashtags: ["nature","wildlife","elephants","dronefootage","4k","safari","earth","natgeo"],
        on_screen_text: null,
        thumbnailHue: 35,
        stance: "neutral",
        engagementBias: 2.1,
        llm: {
          creator_username: "@earthlife.daily",
          caption: "an elephant herd crossing a river at golden hour",
          hashtags: ["nature","wildlife","elephants","dronefootage","safari"],
          on_screen_text: null,
          language: "en",
          visual_description:
            "Cinematic drone shot of elephants wading across a shallow river at sunset, reflections in the water. Ambient natural sound.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Nature content — no mental-health relevance.",
      }),
      v({
        username: "@car.detail.kyle",
        displayName: "Kyle · detailing",
        caption: "before/after on a 2007 civic that hadn't been cleaned in 14 years · the smell, the regret, the foam 🧼",
        hashtags: ["detailing","cardetailing","cleantok","satisfying","beforeandafter","asmr","autotok"],
        on_screen_text: "14 years of neglect",
        thumbnailHue: 205,
        stance: "neutral",
        engagementBias: 2.6,
        llm: {
          creator_username: "@car.detail.kyle",
          caption: "before/after on a 2007 civic that hadn't been cleaned in 14 years",
          hashtags: ["detailing","cardetailing","cleantok","satisfying","beforeandafter","asmr"],
          on_screen_text: "14 years of neglect",
          language: "en",
          visual_description:
            "Time-lapse car interior cleaning footage, dramatic dirt-to-clean reveals, satisfying foam and steam visuals.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Satisfying / detailing content — no mental-health relevance.",
      }),
      v({
        username: "@dad.joke.dan",
        displayName: "dad joke dan",
        caption: "my dad has been waiting 34 years to use this joke · you're welcome",
        hashtags: ["dadjokes","funny","family","comedy","wholesome","fyp"],
        on_screen_text: "it was a dad joke all along",
        thumbnailHue: 40,
        stance: "neutral",
        engagementBias: 1.7,
        llm: {
          creator_username: "@dad.joke.dan",
          caption: "my dad has been waiting 34 years to use this joke",
          hashtags: ["dadjokes","funny","family","comedy","wholesome"],
          on_screen_text: "it was a dad joke all along",
          language: "en",
          visual_description:
            "Middle-aged father and adult child in suburban kitchen, dad delivers punchline deadpan, son groans theatrically. Warm home lighting.",
          possible_mental_health_relevance: false,
          mental_health_keywords: [],
          mental_health_confidence: "high",
          content_categories: [],
        },
        reasoning: "Comedy / family content — no mental-health relevance.",
      }),
    ],
  },

  /* ============================================================ */
  /* YOUTUBE · fitness_health                                      */
  /* ============================================================ */

  fitness_health: {
    id: "fitness_health",
    platform: "youtube",
    label: "Fitness & Health",
    description: "Fitness/health Shorts · description-only (no decision)",
    seed_query: "home workout",
    videos: [
      v({
        username: "FitWithRay",
        displayName: "Fit With Ray · 2.1M subs",
        caption: "5-min full-body morning stretch · no equipment needed, do this before coffee",
        hashtags: ["fitness","stretch","morningroutine","mobility","shorts","homeworkout","noequipment"],
        on_screen_text: "5 minutes · no equipment",
        thumbnailHue: 340,
        stance: "neutral",
        engagementBias: 2.4,
        llm: {
          description:
            "A fitness instructor demonstrates a 5-minute full-body stretching routine on a yoga mat in a well-lit living room. Bright, energetic tone suitable for a morning wake-up workout. On-screen timer and rep counter guide the viewer through each move.",
        },
        reasoning: "Description-only (youtube). No watch/skip decision is made.",
      }),
      v({
        username: "HealthyByDanii",
        displayName: "Healthy by Danii · dietitian",
        caption: "high-protein meal prep for the week · 150g protein per day on $60 of groceries",
        hashtags: ["mealprep","protein","healthy","nutrition","shorts","dietitian","budgetfood"],
        on_screen_text: "150g protein/day · $60/week",
        thumbnailHue: 350,
        stance: "neutral",
        engagementBias: 1.9,
        llm: {
          description:
            "Creator prepares multiple portioned meals in glass containers on a kitchen counter. Rapid jump cuts between cooking stages, clean cooking aesthetic with on-screen macro counts and price tags. Upbeat background music.",
        },
        reasoning: "Description-only (youtube). No watch/skip decision is made.",
      }),
      v({
        username: "TrainWithMax",
        displayName: "Train With Max · strength coach",
        caption: "why i stopped doing 45-minute cardio sessions and what i do instead",
        hashtags: ["fitness","cardio","hiit","strength","shorts","coach","liss"],
        on_screen_text: "HIIT > LISS?",
        thumbnailHue: 355,
        stance: "neutral",
        engagementBias: 2.0,
        llm: {
          description:
            "Personal trainer in a home gym speaks to camera while a whiteboard behind him shows contrasting HR-zone graphs. Conversational, educational tone with quick cut-ins of example workouts.",
        },
        reasoning: "Description-only (youtube). No watch/skip decision is made.",
      }),
      v({
        username: "YogaJourneyJen",
        displayName: "Yoga Journey Jen",
        caption: "10-min yoga for tight hips · follow along, no experience needed 🧘‍♀️",
        hashtags: ["yoga","hipmobility","flexibility","followalong","shorts","beginneryoga"],
        on_screen_text: "follow along · 10 min",
        thumbnailHue: 345,
        stance: "neutral",
        engagementBias: 1.6,
        llm: {
          description:
            "Yoga instructor flows through hip-opening poses on a sunlit hardwood floor with tall windows in the background. Calm instrumental music, follow-along format, soothing voiceover cuing each pose transition.",
        },
        reasoning: "Description-only (youtube). No watch/skip decision is made.",
      }),
      v({
        username: "RunItRita",
        displayName: "Run It Rita · marathon vlogger",
        caption: "marathon training week 6 · an 18-miler and i almost bonked at mile 14 (lessons learned)",
        hashtags: ["running","marathon","training","runnersofinstagram","shorts","longrun","vlog"],
        on_screen_text: "week 6 · 18 miles",
        thumbnailHue: 20,
        stance: "neutral",
        engagementBias: 1.7,
        llm: {
          description:
            "Runner logs an 18-mile long run through city streets, GoPro footage intercut with post-run recovery scenes in a home kitchen. High-energy documentary-style editing with running-pace data overlays.",
        },
        reasoning: "Description-only (youtube). No watch/skip decision is made.",
      }),
      v({
        username: "StrongerMei",
        displayName: "Stronger with Mei",
        caption: "deadlift PR at 185 lbs 🎉 bodyweight is 130 lbs · form breakdown in caption",
        hashtags: ["strength","deadlift","pr","powerlifting","shorts","womenwholift","homegym"],
        on_screen_text: "185 lbs · bw 130",
        thumbnailHue: 15,
        stance: "neutral",
        engagementBias: 2.2,
        llm: {
          description:
            "Athlete successfully lifts a heavy deadlift in a commercial gym, visible strain and triumph, training partners cheer in the background. Triumphant mood, chalked hands and thick-belt setup.",
        },
        reasoning: "Description-only (youtube). No watch/skip decision is made.",
      }),
      v({
        username: "SleepScience",
        displayName: "Sleep Science · research-backed",
        caption: "3 things to stop doing 90 minutes before bed if you want to actually feel rested 😴",
        hashtags: ["sleep","sleephealth","health","shorts","circadian","wellness","sleephygiene"],
        on_screen_text: "90-minute rule",
        thumbnailHue: 220,
        stance: "neutral",
        engagementBias: 2.5,
        llm: {
          description:
            "Narrator-led explainer Short with animated infographics of a 90-minute pre-sleep window. Cool blue-toned color palette, minimalist text cards emphasising each behavior to avoid.",
        },
        reasoning: "Description-only (youtube). No watch/skip decision is made.",
      }),
      v({
        username: "PilatesWithAvi",
        displayName: "Pilates with Avi",
        caption: "3 mat-pilates moves that fixed my posture after 9 years at a desk",
        hashtags: ["pilates","posture","deskjob","mobility","shorts","corestrength","wfhlife"],
        on_screen_text: "9 years at a desk · fixed",
        thumbnailHue: 335,
        stance: "neutral",
        engagementBias: 1.5,
        llm: {
          description:
            "Instructor demonstrates three pilates moves on a mat in a bright studio. Mirror behind shows full form from multiple angles. Calm piano music and subtle breath-cue voiceover.",
        },
        reasoning: "Description-only (youtube). No watch/skip decision is made.",
      }),
    ],
  },

  /* ============================================================ */
  /* YOUTUBE · comedy_entertainment                                */
  /* ============================================================ */

  comedy_entertainment: {
    id: "comedy_entertainment",
    platform: "youtube",
    label: "Comedy & Entertainment",
    description: "Comedy Shorts · description-only (no decision)",
    seed_query: "funny videos",
    videos: [
      v({
        username: "BitsByBrady",
        displayName: "Bits by Brady · comedy",
        caption: "when your wifi cuts out mid-meeting and your whole career flashes before your eyes",
        hashtags: ["comedy","skit","wfh","shorts","remotework","funny","zoom"],
        on_screen_text: "can you hear me? hello?",
        thumbnailHue: 280,
        stance: "neutral",
        engagementBias: 2.1,
        llm: {
          description:
            "Comedic skit of a remote worker dramatically reacting to a wifi outage during a video call. Exaggerated expressions, quick cuts between his laptop screen and his increasingly panicked face. Set in a tidy home office.",
        },
        reasoning: "Description-only (youtube). No watch/skip decision is made.",
      }),
      v({
        username: "PranksByPablo",
        displayName: "Pranks by Pablo · wholesome",
        caption: "tipping waiters $100 on their worst shift · their reactions will ruin you (in a good way) 🤍",
        hashtags: ["prank","tipping","kindness","shorts","wholesome","socialexperiment","generosity"],
        on_screen_text: "hidden camera · real reactions",
        thumbnailHue: 100,
        stance: "neutral",
        engagementBias: 3.0,
        llm: {
          description:
            "Creator hands a waiter a large tip in a small-town diner and films their surprised, emotional reaction. Hidden-camera framing with soft piano music overlay. Heartwarming, uplifting tone.",
        },
        reasoning: "Description-only (youtube). No watch/skip decision is made.",
      }),
      v({
        username: "MimicryMoe",
        displayName: "Mimicry Moe",
        caption: "every teacher you've ever had · part 3 · #5 is every gym teacher ever",
        hashtags: ["impressions","comedy","school","shorts","teachers","funnyshorts","characterwork"],
        on_screen_text: "part 3 · 10 teachers",
        thumbnailHue: 210,
        stance: "neutral",
        engagementBias: 2.5,
        llm: {
          description:
            "Solo performer rapid-fires through ten teacher impressions against a plain wall. Quick wardrobe swaps (glasses, ties, clipboards) and sharp jump-cut editing. Clear character voices and body language.",
        },
        reasoning: "Description-only (youtube). No watch/skip decision is made.",
      }),
      v({
        username: "FailArmyClips",
        displayName: "FailArmy · official clips",
        caption: "epic skateboard fails compilation · try not to cringe (impossible mode) 🛹",
        hashtags: ["fails","skate","compilation","shorts","funnyfails","failarmy","viral"],
        on_screen_text: "try not to cringe",
        thumbnailHue: 5,
        stance: "neutral",
        engagementBias: 2.8,
        llm: {
          description:
            "Fast-cut compilation of amateur skateboarders wiping out in parks and streets. Loud upbeat punk-rock music overlay, comedic sound effects, lighthearted framing that doesn't show any serious injuries.",
        },
        reasoning: "Description-only (youtube). No watch/skip decision is made.",
      }),
      v({
        username: "StoryTimeSteph",
        displayName: "Story Time Steph",
        caption: "my uber driver had a pet goat in the front seat and refused to explain further · true story",
        hashtags: ["storytime","funny","uber","shorts","truestory","chaotic","weirdencounters"],
        on_screen_text: null,
        thumbnailHue: 320,
        stance: "neutral",
        engagementBias: 1.8,
        llm: {
          description:
            "Creator speaks directly to camera in car selfie angle while driving (parked) telling an animated story. Engaging conversational delivery with big reactions at punchlines.",
        },
        reasoning: "Description-only (youtube). No watch/skip decision is made.",
      }),
      v({
        username: "KidSaysWhat",
        displayName: "Kids Say What",
        caption: "asking 5 year olds deep questions · \"what is love?\" had me on the floor",
        hashtags: ["kids","funny","cute","shorts","interview","wholesome","kidsaysthedarnedthings"],
        on_screen_text: "what is love, really?",
        thumbnailHue: 60,
        stance: "neutral",
        engagementBias: 3.3,
        llm: {
          description:
            "Interviewer asks young children thoughtful questions at a playground. Cut to their earnest, hilarious answers delivered with total seriousness. Warm natural lighting and cheerful background ambient sound.",
        },
        reasoning: "Description-only (youtube). No watch/skip decision is made.",
      }),
      v({
        username: "TheRoastMaster",
        displayName: "The Roast Master",
        caption: "i let strangers roast my instagram · the 72-year-old grandma was BRUTAL",
        hashtags: ["roast","funny","streetinterview","shorts","socialexperiment","granny","savage"],
        on_screen_text: "grandma went in",
        thumbnailHue: 280,
        stance: "neutral",
        engagementBias: 2.3,
        llm: {
          description:
            "Street interview format, creator hands phone to strangers who react to his instagram. A 72-year-old grandma delivers deadpan commentary. Bright city street setting, handheld handheld camera.",
        },
        reasoning: "Description-only (youtube). No watch/skip decision is made.",
      }),
      v({
        username: "MagicMattMagic",
        displayName: "Magic Matt",
        caption: "performing this card trick for a stranger and watching his reaction twice 🃏 part 8",
        hashtags: ["magic","cardtrick","streetmagic","shorts","magicians","realreactions","streetperformer"],
        on_screen_text: "he said \"no way\" 6 times",
        thumbnailHue: 260,
        stance: "neutral",
        engagementBias: 2.0,
        llm: {
          description:
            "Close-up card-trick performance on a busy street. Creator shows the reveal twice, spectator's jaw-drop reaction slowed down for emphasis. Clean upbeat music and ambient city background noise.",
        },
        reasoning: "Description-only (youtube). No watch/skip decision is made.",
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
