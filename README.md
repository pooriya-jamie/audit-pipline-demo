# Comparison Project — Web Demo Dashboard

A self-contained, single-page visualization of how the **TikTok-Web** and **YouTube-Web** bots work, with a spotlight on the **LLM-as-decision-maker** loop. Built with vanilla HTML, CSS, and JavaScript — no build step, no dependencies beyond Google Fonts.

Everything is **fully simulated**: no real browser automation runs, no cookies are used, no API calls are made. The goal is a reliable, presentable walkthrough that always plays perfectly in front of an audience.

---

## Run it

Either option works. Pick the one you prefer.

### Option 1 — Double-click

Open `demo/index.html` in Chrome, Edge, or Firefox.

### Option 2 — Local static server (recommended for best font loading)

```powershell
cd demo
python -m http.server 8000
```

Then open <http://localhost:8000>.

---

## What you're looking at

```
+---------------------------------------------------------------+
| Top bar  : platform switch · scenario · persona · speed · play|
+---------------------------------------------------------------+
| Browser  |  Pipeline      |  LLM Brain Panel                  |
| Mockup   |  Stepper       |  Prompt / Response / Decision     |
| (feed)   |  (6 steps)     |                                   |
+---------------------------------------------------------------+
| Stats tiles | Decision bars | Controller log (terminal-style) |
+---------------------------------------------------------------+
```

**Browser mockup (left)** — a fake Chrome window showing a stylized TikTok For You feed or YouTube Shorts feed. It scrolls to the next video, flashes a "screenshot", sends a paper-plane animation towards the LLM panel, and stamps the final decision on top of the current video.

**Pipeline stepper (middle)** — the six stages that mirror [`TikTok-Web/simple_launcher.py`](../TikTok-Web/simple_launcher.py):

1. Navigate / Scroll
2. Initial Watch (8 s window)
3. Capture Screenshot
4. Send to GPT-4o-mini
5. LLM Decision
6. Watch Full (+25 s) or Skip (0.5 s)

Each step lights up in sequence with a neon outline as the current video progresses.

**LLM brain panel (right)** — three tabs:

- **Prompt** — a condensed version of the real `TIKTOK_ANALYSIS_PROMPT` from [`TikTok-Web/openai_vision.py`](../TikTok-Web/openai_vision.py), typed out character-by-character.
- **Response** — the JSON returned by the model, streamed key-by-key (creator_username → caption → hashtags → possible_mental_health_relevance → …).
- **Decision** — a big coloured badge: **WATCH_FULL**, **SKIP**, **SKIP_MH**, or **WATCH_NON_MH**, plus the rationale and the actual decision rule quoted from the source.

**Bottom dock** — session stats (videos processed, MH-relevant count, avg watch time, skip rate), a live bar chart of decisions, and a scrolling controller log that mirrors the real `print()` lines emitted by the launchers.

---

## Suggested presentation flow

This tells the project's headline story in about 3 minutes.

### 1. Start on **TikTok-Web** / **depression_loneliness** / persona = **interested**

Press **Play** at **2×**. Point out:

- The bot scrolls to each video (left panel).
- After the 8-second initial watch, a screenshot is captured and the paper plane flies towards the LLM panel.
- The LLM streams back structured JSON with a **`possible_mental_health_relevance`** field.
- Because the persona is `interested`, mental-health videos get `WATCH_FULL (+25s)`. Non-MH videos get `SKIP`.
- Stats climb on the bottom dock.

### 2. Flip the persona to **not_interested**

While playing. The exact same videos now get `SKIP_MH` or `WATCH_NON_MH`. This is the key insight: **the LLM's job is to tell the bot how to act like the scripted persona, not to judge the content.**

### 3. Switch scenario to **just_for_you** (mixed feed)

Show the algorithm reacting to a realistic mix. Watch decision counts diverge on the bar chart.

### 4. Switch top toggle to **YouTube-Web**

- Theme shifts from cyan/pink to YouTube red.
- Persona selector disappears.
- LLM panel now shows a description-only prompt and response.
- Decision step becomes "Describe Content" — there is no watch/skip branching.
- This is the core comparison: **TikTok-Web uses the LLM as a decision maker, YouTube-Web uses it purely as a metadata describer.**

---

## Keyboard / control reference

| Control | Effect |
|---|---|
| Play / Pause | Start or stop the scripted session |
| Step | Advance exactly one video (useful for freezing a frame during Q&A) |
| Reset | Start the current scenario over, clear stats |
| 1× / 2× / 4× | Playback speed |
| Platform switch | TikTok-Web ↔ YouTube-Web |
| Scenario dropdown | Load a different scripted feed |
| Persona dropdown | Flip the decision polarity (TikTok only) |

---

## File structure

```
demo/
├── index.html     single-page UI
├── styles.css     dark theme + animations
├── app.js         DemoEngine state machine
├── data.js        scripted scenarios + real prompts
└── README.md      this file
```

## Notes on accuracy

The scripted videos, LLM JSON responses, and decision logic faithfully mirror the real pipelines. Specific cross-references:

- The six-step pipeline and the `INTERESTED` / `NOT_INTERESTED` branches reflect [`TikTok-Web/simple_launcher.py`](../TikTok-Web/simple_launcher.py) (see lines 1069–1158).
- The prompt shown in the left tab is a condensed `TIKTOK_ANALYSIS_PROMPT` from [`TikTok-Web/openai_vision.py`](../TikTok-Web/openai_vision.py).
- The JSON schema matches `validate_metadata_structure()` in the same file.
- Scenarios (`depression_loneliness`, `just_for_you`, `neutral`) come from [`TikTok-Web/experiment_config.py`](../TikTok-Web/experiment_config.py).
- YouTube scenarios (`fitness_health`, `comedy_entertainment`) come from [`YouTube-Web/scenarios_config.py`](../YouTube-Web/scenarios_config.py).
- YouTube-Web watch-duration behaviour mirrors `resolve_watch_duration()` in [`YouTube-Web/simple_watch_YT.py`](../YouTube-Web/simple_watch_YT.py).

## Possible follow-ups

- Replay real past-run data from `experiment_results/logs/` instead of scripted content.
- Add the Mobile (Appium) pipelines as a third and fourth platform.
- Connect a live OpenAI key so the Response tab streams actual model output.
