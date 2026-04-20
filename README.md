# Social Media Audit Pipeline — Demo Dashboard

A self-contained, single-page visualization of how an LLM-driven social-media audit pipeline works, with a spotlight on the **LLM-as-decision-maker** loop. Built with vanilla HTML, CSS, and JavaScript — no build step, no dependencies beyond Google Fonts.

## Run locally

Just open `demo/index.html` in a modern browser, or serve the folder with any static server:

```bash
# Python
python -m http.server 8000 -d demo

# Node
npx serve demo
```

Then visit `http://localhost:8000`.

## What you see

**Top bar** — platform toggle (`tiktok` ↔ `youtube`), scenario dropdown, persona (`interested` / `not_interested`), playback speed (0.5× / 1× / 2× / 4×), and transport controls (Play / Step / Reset).

**Browser panel (left)** — a stylised browser mockup showing the current feed. Videos scroll into view; during the initial watch window a camera flash fires, a paper plane carries a screenshot toward the LLM, and a decision stamp lands on the active video.

**Pipeline stepper (middle)** — the six stages of processing one video:

1. **Navigate / Scroll** — move to the next video.
2. **Initial Watch** — e.g. 8 seconds. **Screenshot, LLM call, and decision all happen in parallel during this window.**
3. **Capture Screenshot** (parallel with step 2).
4. **Send to Vision LLM** (parallel with step 2).
5. **Decision** — for tiktok, classify mental-health relevance; for youtube, just describe.
6. **Execute** — additional watch (+25s) or a short skip (~0.5s) for tiktok; fixed watch window for youtube.

**LLM panel (right)** — three tabs:

- **Prompt** — a condensed version of the real vision-analysis prompt, typed out character-by-character.
- **Response** — a streamed JSON object populated key by key, simulating an LLM completion.
- **Decision** — the resolved outcome with a colored badge, classification metadata, and the decision rule as pseudocode.

**Bottom dock** — live stats, a decision-breakdown bar chart, and a timestamped activity log.

## Suggested presentation flow

### 1. Start on **tiktok** / depression_loneliness / persona = **interested**

Press **Play** and let the first few videos run. Call out:

- The LLM receives the screenshot **while** the initial watch timer is still ticking — it's concurrent, not sequential.
- After the 8-second window, if the LLM flagged mental-health content and the persona is "interested", the bot invests an **additional +25s** of watch time. If not, it skips in ~0.5s.

### 2. Mid-run, flip persona to **not_interested**

Watch the decision labels invert. Mental-health content now gets `SKIP_MH` while non-mental-health content gets `WATCH_NON_MH`. Same prompt, same screenshots — the LLM output is interpreted differently based on persona.

### 3. Switch scenario to **neutral**

Point out that mental-health relevance drops and skip-rate climbs — confirming the classifier discriminates correctly.

### 4. Switch top toggle to **youtube**

Key contrast:

- The pipeline still runs, but the decision step is **description-only**.
- Watch duration is a fixed window (no +25s / −0.5s branching).
- **This is the core comparison:** tiktok uses the LLM as a decision maker, youtube uses it purely as a metadata describer.

### 5. Hit Reset, bump speed to 4× (or 0.5×)

Run a full scenario through and finish on the cumulative stats: total videos, mental-health hits, average watch, skip rate, and the decision-breakdown bars.

## Controls cheat sheet

| Control          | Effect                                              |
| ---------------- | --------------------------------------------------- |
| Platform switch  | tiktok ↔ youtube                                    |
| Scenario select  | different feed lists                                |
| Persona select   | interested ↔ not_interested (tiktok only)           |
| Speed buttons    | 0.5× / 1× / 2× / 4× (scales all timers)             |
| Play / Pause     | run the main loop                                   |
| Step             | process exactly one video                           |
| Reset            | clear counts, rewind to the first video             |

## Accessibility & performance

- All animations use CSS transforms and opacity — no heavy JS rendering.
- Color-coded decision badges also show text labels for screen readers.
- Focus states are preserved on all interactive elements.
- No network calls — safe to run offline.

## Tech

- Vanilla JavaScript state machine (`DemoEngine` in `app.js`).
- Scripted scenarios + condensed prompts (`data.js`).
- CSS variables for theming; no preprocessor.
- Google Fonts (Inter, JetBrains Mono) loaded once.

## Files

```
demo/
├── index.html   # layout and static chrome
├── styles.css   # theme, animations, layout
├── app.js       # state machine + UI logic
├── data.js      # scenarios, videos, prompts
└── README.md    # this file
```
