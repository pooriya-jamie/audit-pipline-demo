/* ================================================================
 * app.js — DemoEngine
 * Pure vanilla JS. Drives a 6-step pipeline animation that visualises
 * an LLM-driven social-media audit loop. All data comes from data.js.
 * No real API calls are made.
 * ================================================================ */

(function () {
  "use strict";

  /* ========== DOM helpers ========== */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const el = (tag, props = {}, ...children) => {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === "class") node.className = v;
      else if (k === "dataset") Object.assign(node.dataset, v);
      else if (k === "html") node.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    });
    for (const c of children) {
      if (c == null) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  };

  /* ========== icons (inline SVG) ========== */
  const ICONS = {
    scroll: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4 L12 20 M6 14 L12 20 L18 14"/></svg>`,
    clock:  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7 L12 12 L16 14"/></svg>`,
    camera: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7 L10 4 L14 4 L15 7"/><circle cx="12" cy="14" r="3.5"/></svg>`,
    plane:  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M2 12 L22 3 L18 22 L13 14 L22 3"/></svg>`,
    brain:  `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 4 A3 3 0 0 0 6 7 A3 3 0 0 0 4 10 A3 3 0 0 0 5 13 A3 3 0 0 0 5 17 A3 3 0 0 0 9 20 L9 4 Z M15 4 A3 3 0 0 1 18 7 A3 3 0 0 1 20 10 A3 3 0 0 1 19 13 A3 3 0 0 1 19 17 A3 3 0 0 1 15 20 L15 4 Z"/></svg>`,
    split:  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3 L12 10 M12 10 L5 20 M12 10 L19 20"/></svg>`,
    heart:  `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 21 C4 14 3 9 7 6 C10 4 12 6 12 8 C12 6 14 4 17 6 C21 9 20 14 12 21 Z"/></svg>`,
    comment:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5 L19 5 L19 16 L14 16 L11 20 L11 16 L5 16 Z"/></svg>`,
    share:  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12 L19 4 L15 20 L12 13 L19 4"/></svg>`,
  };

  /* ========== state ========== */
  const state = {
    platform: "tiktok",       // "tiktok" | "youtube"
    scenarioId: null,
    persona: "interested",    // "interested" | "not_interested"
    speed: 2,                 // 1x | 2x | 4x
    running: false,
    paused: true,
    index: 0,                 // current video index
    videos: [],
    decisions: [],
    currentStepIdx: -1,
    totalWatchSec: 0,
    counts: {
      WATCH_FULL: 0,
      SKIP: 0,
      SKIP_MENTAL_HEALTH: 0,
      WATCH_FULL_NON_MENTAL_HEALTH: 0,
      YOUTUBE_FIXED: 0,
    },
    mhCount: 0,
    cancelFns: [],
  };

  /* ========== time helpers ========== */
  // Everything accepts a logical (1x) milliseconds and we divide by state.speed.
  // Polls every 50ms so pause/resume takes effect within one tick.
  const wait = (ms) =>
    new Promise((resolve) => {
      if (!state.running) { resolve(); return; }

      let remaining = ms / state.speed; // real-time ms to spend (excluding paused time)
      let lastTick = Date.now();
      let timerId = null;
      let cancelled = false;

      const cancel = () => { cancelled = true; clearTimeout(timerId); resolve(); };
      state.cancelFns.push(cancel);

      const tick = () => {
        if (cancelled || !state.running) { resolve(); return; }
        const now = Date.now();
        if (!state.paused) remaining -= (now - lastTick);
        lastTick = now;
        if (remaining <= 0) { resolve(); return; }
        // Use remaining for precision; cap at 50ms so pause detection stays responsive
        timerId = setTimeout(tick, Math.min(50, remaining));
      };

      timerId = setTimeout(tick, Math.min(50, remaining));
    });

  const clearTimers = () => {
    state.cancelFns.forEach((fn) => fn());
    state.cancelFns = [];
  };

  /* ========== logger ========== */
  const logEl = $("#log");
  function log(type, text) {
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
    const line = el("div", { class: `log-line ${type}` });
    line.innerHTML = `<span class="t">[${ts}]</span>${escapeHtml(text)}`;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
    // trim log
    while (logEl.children.length > 200) logEl.removeChild(logEl.firstChild);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  /* ========== platform / scenario init ========== */

  function cfg() { return PLATFORM_CONFIG[state.platform]; }

  function buildScenarioOptions() {
    const sel = $("#scenarioSelect");
    sel.innerHTML = "";
    cfg().scenarios.forEach((sid, i) => {
      const scen = SCENARIOS[sid];
      const opt = el("option", { value: sid }, scen.label || sid);
      sel.appendChild(opt);
      if (i === 0) opt.selected = true;
    });
    state.scenarioId = sel.value;
  }

  function buildStepper() {
    const stepper = $("#stepper");
    stepper.innerHTML = "";
    cfg().steps.forEach((step, idx) => {
      const node = el("li", { class: "step", dataset: { step: step.id, idx } },
        el("div", { class: "step-icon", html: ICONS[step.icon] || ICONS.clock }),
        el("div", { class: "step-body" },
          el("div", { class: "step-label" }, step.label),
          el("div", { class: "step-sub" }, stepSub(step.id))
        ),
        el("div", { class: "step-status" }, "idle")
      );
      stepper.appendChild(node);
    });

  }

  function stepSub(id) {
    const platform = state.platform;
    if (id === "navigate")   return platform === "tiktok" ? "scroll to next video" : "press ↓ to next short";
    if (id === "initial")    return `watch ${cfg().initialWatch}s — screenshot + LLM run in parallel`;
    if (id === "screenshot") return "capture frame → image (during initial watch)";
    if (id === "llm")        return "send to vision LLM (during initial watch)";
    if (id === "decision")   return platform === "tiktok" ? "if mental-health relevant…" : "description only";
    if (id === "execute")    return platform === "tiktok" ? "short skip | additional watch" : "fixed watch window";
    return "";
  }

  /**
   * Set current pipeline step.
   *  - Default: mark earlier steps as done, idx as running, rest idle.
   *  - { parallel: true }: just mark idx as running WITHOUT demoting other
   *    currently-active steps (used when sub-steps run during Initial Watch).
   */
  function setStep(idx, { parallel = false } = {}) {
    const stepper = $("#stepper");
    const steps = $$(".step", stepper);
    if (parallel) {
      if (idx >= 0 && idx < steps.length) {
        const node = steps[idx];
        node.classList.add("active");
        node.classList.remove("done");
        $(".step-status", node).textContent = "running";
      }
    } else {
      steps.forEach((node, i) => {
        node.classList.remove("active", "done");
        if (i < idx) {
          node.classList.add("done");
          $(".step-status", node).textContent = "done";
        } else if (i === idx) {
          node.classList.add("active");
          $(".step-status", node).textContent = "running";
        } else {
          $(".step-status", node).textContent = "idle";
        }
      });
    }
    state.currentStepIdx = idx;
    const stepObj = cfg().steps[idx];
    if (stepObj) $("#currentStepTag").textContent = stepObj.label;
  }

  function markStepDone(idx) {
    const node = $$(".step", $("#stepper"))[idx];
    if (!node) return;
    node.classList.remove("active");
    node.classList.add("done");
    $(".step-status", node).textContent = "done";
  }

  /* ========== platform theme ========== */
  function applyPlatform() {
    document.documentElement.dataset.platform = state.platform;
    const c = cfg();
    $("#tagline").textContent = c.tagline;
    $("#tabTitle").textContent = state.platform === "tiktok"
      ? "TikTok — For You"
      : "YouTube — Shorts";
    $("#addressUrl").textContent = c.url;
    $("#watchWindowVal").textContent = c.useLLMDecision
      ? `${c.initialWatch}s (LLM in parallel) → +${c.fullWatch}s or +${c.skipDuration}s`
      : `${c.initialWatch}s (LLM in parallel) → +${c.fullWatch}s fixed`;
    $("#promptFileTag").textContent = state.platform === "tiktok"
      ? "vision prompt · content analysis"
      : "vision prompt · short description";

    // hide persona when platform doesn't use LLM decisions
    $("#personaSelectWrap").style.display = c.useLLMDecision ? "" : "none";

    // update logic code shown in decision tab
    $("#logicCode").textContent = c.useLLMDecision ? TIKTOK_LOGIC_SNIPPET : YOUTUBE_LOGIC_SNIPPET;

    $$(".platform-btn").forEach((b) => {
      const on = b.dataset.platform === state.platform;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  const TIKTOK_LOGIC_SNIPPET =
`if persona == "interested":
    if mh_relevance:  WATCH_FULL   (+25s)
    else:             SKIP         (+0.5s)
else:  # not_interested
    if mh_relevance:  SKIP_MH      (+0.5s)
    else:             WATCH_NON_MH (+25s)`;

  const YOUTUBE_LOGIC_SNIPPET =
`# youtube: LLM only describes,
# no watch/skip decision is made.
watch_duration = random.uniform(8, 12)`;

  /* ========== feed rendering ========== */

  function loadScenario() {
    const scen = SCENARIOS[state.scenarioId];
    if (!scen) return;
    state.videos = scen.videos.slice();
    state.decisions = [];
    state.index = 0;
    state.totalWatchSec = 0;
    state.mhCount = 0;
    state.counts = { WATCH_FULL:0, SKIP:0, SKIP_MENTAL_HEALTH:0, WATCH_FULL_NON_MENTAL_HEALTH:0, YOUTUBE_FIXED:0 };
    renderFeed();
    updateStats();
    $("#videoCounterTag").textContent = `0 / ${state.videos.length}`;
    log("info", `Loaded scenario: ${scen.label} (${state.videos.length} videos) — seed: ${scen.seed_query || "(none — For You feed)"}`);
  }

  function renderFeed() {
    const feed = $("#feed");
    feed.innerHTML = "";
    feed.style.transform = "translateY(0)";
    state.videos.forEach((v, i) => feed.appendChild(buildCard(v, i)));
  }

  function buildCard(v, i) {
    const overlay = v.on_screen_text
      ? el("div", { class: "video-overlay-text" }, v.on_screen_text)
      : null;

    const actions = el("div", { class: "video-actions" },
      el("div", { class: "action" },
        el("span", { class: "circle", html: ICONS.heart }),
        el("span", {}, formatCount(v.likes))
      ),
      el("div", { class: "action" },
        el("span", { class: "circle", html: ICONS.comment }),
        el("span", {}, formatCount(v.comments))
      ),
      el("div", { class: "action" },
        el("span", { class: "circle", html: ICONS.share }),
        el("span", {}, formatCount(v.shares))
      )
    );

    const meta = el("div", { class: "video-meta" },
      el("div", { class: "video-user" }, v.username),
      el("div", { class: "video-display" }, v.displayName || ""),
      el("div", { class: "video-caption" }, v.caption),
      el("div", { class: "video-hashtags" },
        ...v.hashtags.map((t) => el("span", {}, `#${t}`))
      )
    );

    const card = el("div", {
      class: "video-card",
      dataset: { idx: i },
      style: `--hue:${v.thumbnailHue ?? 200};`,
    },
      el("div", { class: "thumb" }),
      overlay || document.createComment(""),
      meta,
      actions
    );
    return card;
  }

  function formatCount(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
    return String(n);
  }

  function scrollFeedTo(index) {
    const feed = $("#feed");
    feed.style.transform = `translateY(-${index * 100}%)`;
  }

  /* ========== decision resolution ========== */

  function resolveDecision(video) {
    const c = cfg();
    if (!c.useLLMDecision) {
      return {
        key: "WATCH_FULL",
        badgeClass: "watch-full",
        label: "DESCRIBE + WATCH",
        watchSec: c.fullWatch,
        action: `watch fixed ${c.fullWatch}s, no decision`,
      };
    }
    const mh = !!video.llm.possible_mental_health_relevance;
    const persona = state.persona;

    if (persona === "interested") {
      if (mh) return { key: "WATCH_FULL",  badgeClass: "watch-full", label: "WATCH_FULL",  watchSec: c.initialWatch + c.fullWatch,  action: `watch additional ${c.fullWatch}s` };
      return     { key: "SKIP",        badgeClass: "skip",       label: "SKIP",        watchSec: c.initialWatch + c.skipDuration, action: `pause ${c.skipDuration}s then scroll` };
    } else {
      if (mh) return { key: "SKIP_MENTAL_HEALTH",          badgeClass: "skip-mh",   label: "SKIP_MH",     watchSec: c.initialWatch + c.skipDuration, action: `pause ${c.skipDuration}s then scroll` };
      return     { key: "WATCH_FULL_NON_MENTAL_HEALTH",  badgeClass: "watch-nm",  label: "WATCH_NON_MH",watchSec: c.initialWatch + c.fullWatch,  action: `watch additional ${c.fullWatch}s` };
    }
  }

  /* ========== stats ========== */

  function updateStats() {
    const n = state.decisions.length;
    $("#statVideos").textContent = n;
    $("#statMH").textContent = cfg().useLLMDecision ? state.mhCount : "—";
    const avg = n > 0 ? (state.totalWatchSec / n) : 0;
    $("#statAvgWatch").textContent = avg.toFixed(1) + "s";

    const skippy = (state.counts.SKIP + state.counts.SKIP_MENTAL_HEALTH);
    const rate = n > 0 ? Math.round((skippy / n) * 100) : 0;
    $("#statSkipRate").textContent = cfg().useLLMDecision ? rate + "%" : "n/a";

    const max = Math.max(1, ...Object.values(state.counts));
    setBar("#barWatchFull", "#valWatchFull", state.counts.WATCH_FULL, max);
    setBar("#barSkip",      "#valSkip",      state.counts.SKIP,      max);
    setBar("#barSkipMH",    "#valSkipMH",    state.counts.SKIP_MENTAL_HEALTH, max);
    setBar("#barWatchNM",   "#valWatchNM",   state.counts.WATCH_FULL_NON_MENTAL_HEALTH, max);
  }

  function setBar(barSel, valSel, value, max) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    $(barSel).style.width = pct + "%";
    $(valSel).textContent = String(value);
  }

  $("#videoCounterTag");

  /* ========== LLM panel animations ========== */

  function showLLMTab(name) {
    $$(".llm-tab").forEach((t) => t.classList.toggle("active", t.dataset.llmTab === name));
    $$(".llm-tabpanel").forEach((p) => p.classList.toggle("active", p.dataset.llmPanel === name));
  }

  /**
   * typewriter: types `text` into `node` over `totalMs` (logical).
   */
  async function typewriter(node, text, totalMs) {
    node.textContent = "";
    const chars = text.split("");
    const perChar = totalMs / Math.max(1, chars.length);
    $("#typingCaret").classList.add("active");
    for (let i = 0; i < chars.length; i++) {
      node.textContent += chars[i];
      if (i % 4 === 0) await wait(perChar * 4);
    }
    $("#typingCaret").classList.remove("active");
  }

  /**
   * Reveal JSON keys one by one.
   */
  async function streamJSON(node, obj, totalMs) {
    node.innerHTML = "";
    const entries = Object.entries(obj);
    const perEntry = totalMs / Math.max(1, entries.length);

    node.insertAdjacentHTML("beforeend", `<span class="p">{</span>\n`);
    for (let i = 0; i < entries.length; i++) {
      const [k, v] = entries[i];
      node.insertAdjacentHTML(
        "beforeend",
        `  <span class="k">"${escapeHtml(k)}"</span><span class="p">:</span> ${renderJsonValue(v)}${i < entries.length - 1 ? `<span class="p">,</span>` : ""}\n`
      );
      await wait(perEntry);
    }
    node.insertAdjacentHTML("beforeend", `<span class="p">}</span>`);
  }

  function renderJsonValue(v) {
    if (v === null) return `<span class="b">null</span>`;
    if (typeof v === "boolean") return `<span class="b">${v}</span>`;
    if (typeof v === "number")  return `<span class="n">${v}</span>`;
    if (Array.isArray(v)) {
      if (v.length === 0) return `<span class="p">[]</span>`;
      const items = v.map((i) => renderJsonValue(i)).join(`<span class="p">, </span>`);
      return `<span class="p">[</span>${items}<span class="p">]</span>`;
    }
    return `<span class="s">"${escapeHtml(String(v))}"</span>`;
  }

  /* ========== animations / fx ========== */

  function cameraFlash() {
    const f = $("#flashOverlay");
    f.classList.remove("active");
    void f.offsetWidth; // restart
    f.classList.add("active");
  }

  function flyPlane() {
    const p = $("#planeTrack");
    p.classList.remove("active");
    void p.offsetWidth;
    p.classList.add("active");
  }

  function stampDecision(decision) {
    const stamp = $("#stampOverlay");
    stamp.classList.remove("visible", "skip", "skipmh", "watchnm");
    stamp.textContent = decision.label;
    if (decision.key === "SKIP") stamp.classList.add("skip");
    if (decision.key === "SKIP_MENTAL_HEALTH") stamp.classList.add("skipmh");
    if (decision.key === "WATCH_FULL_NON_MENTAL_HEALTH") stamp.classList.add("watchnm");
    void stamp.offsetWidth;
    stamp.classList.add("visible");
  }

  function hideStamp() {
    const stamp = $("#stampOverlay");
    stamp.classList.remove("visible");
  }

  /* ========== watch timer ========== */

  async function runWatchTimer(durationSec, onTickText) {
    const timer = $("#watchTimer");
    const text = $("#watchTimerText");
    timer.classList.add("visible");
    const totalLogicalMs = durationSec * 1000;
    let logicalElapsedMs = 0;

    while (state.running) {
      const remainingLogical = totalLogicalMs - logicalElapsedMs;
      const shownSec = Math.min(durationSec, logicalElapsedMs / 1000);
      text.textContent = shownSec.toFixed(1) + "s";
      if (onTickText) onTickText(shownSec);
      if (remainingLogical <= 0) break;
      const tickLogical = Math.min(200, remainingLogical);
      await wait(tickLogical); // wait() only counts down while not paused
      logicalElapsedMs += tickLogical;
    }
    text.textContent = durationSec.toFixed(1) + "s";
  }

  function hideWatchTimer() {
    $("#watchTimer").classList.remove("visible");
  }

  /* ========== main loop (state machine) ========== */

  async function runLoop() {
    state.running = true;
    state.paused = false;
    setPlayButton(true);
    $("#sessionStatusTag").textContent = "● running";
    $("#sessionStatusTag").classList.add("running");

    while (state.running && state.index < state.videos.length) {
      const v = state.videos[state.index];
      $("#videoCounterTag").textContent = `${state.index + 1} / ${state.videos.length}`;
      $("#browserHint").textContent = `processing video ${state.index + 1}/${state.videos.length}`;

      const decision = await processVideo(v);
      if (!state.running || decision == null) break;

      commitDecision(v, decision);
      state.index += 1;
      hideStamp();
      await wait(300);
    }

    setStep(-1);
    hideWatchTimer();
    state.running = false;
    state.paused = false;
    setPlayButton(false);

    const completed = state.index >= state.videos.length;
    $("#sessionStatusTag").textContent = completed ? "● complete" : "● idle";
    $("#sessionStatusTag").classList.remove("running");
    $("#browserHint").textContent = completed ? "session complete" : "waiting to start…";

    if (completed) {
      log("success", `Session complete — processed ${state.videos.length} videos`);
    }
  }

  /* ========== steps ========== */

  /**
   * Process one video end-to-end, matching the real launcher logic:
   *   1) Navigate
   *   2) Initial watch (e.g. 8s) — DURING this window, screenshot + LLM + decision run in parallel
   *   3) After the initial watch ends AND decision is ready, execute the result
   *      (additional ~25s watch, or short ~0.5s skip)
   */
  async function processVideo(v) {
    await step_navigate(v);
    if (!state.running) return null;

    const c = cfg();

    // Mark Initial Watch as running and start the timer in the background.
    setStep(1);
    log("info", c.useLLMDecision
      ? `Initial watch window opened (${c.initialWatch}s) — screenshot + LLM + decision run in parallel`
      : `Short loaded — capturing screenshot while fixed watch timer runs`);

    const initialWatchPromise = runWatchTimer(c.initialWatch, null);

    // Run screenshot → LLM → decision CONCURRENTLY with the initial watch.
    // We pass parallel:true so these don't demote the Initial Watch step.
    await step_screenshot(v, { parallel: true });
    if (!state.running) { await initialWatchPromise; return null; }
    await step_sendToLLM(v, { parallel: true });
    if (!state.running) { await initialWatchPromise; return null; }
    const decision = await step_decision(v, { parallel: true });
    if (!state.running) { await initialWatchPromise; return null; }

    // Wait for the full initial watch window to elapse (in practice, decision
    // usually finishes first, so we wait the remainder of the 8s window here).
    await initialWatchPromise;
    markStepDone(1);
    markStepDone(2);
    markStepDone(3);
    markStepDone(4);
    if (!state.running) return null;

    // Now execute: additional watch (25s) or short skip (0.5s).
    await step_execute(v, decision);
    return state.running ? decision : null;
  }

  async function step_navigate(v) {
    setStep(0);
    log("navigate", state.index === 0
      ? `Opening ${cfg().url} and waiting for feed to load…`
      : `Scrolling to next video (${state.index + 1}/${state.videos.length})`);
    scrollFeedTo(state.index);
    $("#scrollHint").classList.add("visible");
    await wait(800);
    $("#scrollHint").classList.remove("visible");
  }

  async function step_screenshot(v, { parallel = false } = {}) {
    setStep(2, { parallel });
    log("info", `Captured frame → screenshot_${Date.now()}.png`);
    cameraFlash();
    await wait(500);
  }

  async function step_sendToLLM(v, { parallel = false } = {}) {
    setStep(3, { parallel });
    $("#brainPulse").classList.add("thinking");
    $("#responseStatusChip").textContent = "posting image…";

    log("llm", `Sending screenshot to Vision LLM (gpt-4o-mini)…`);

    // Kick off plane animation
    showLLMTab("prompt");
    flyPlane();

    // Typewriter the prompt (short total because we shorten per character budget)
    const promptText = PROMPTS[state.platform];
    const promptNode = $("#promptCode");
    // Speed: 1700ms total typing (logical)
    await typewriter(promptNode, promptText, 1700);

    await wait(250);
  }

  async function step_decision(v, { parallel = false } = {}) {
    setStep(4, { parallel });
    $("#responseStatusChip").textContent = "streaming JSON…";
    showLLMTab("response");

    const llmObj = v.llm;
    await streamJSON($("#responseCode"), llmObj, 1400);

    const latency = (0.8 + Math.random() * 0.9).toFixed(2);
    $("#responseLatencyTag").textContent = `latency ${latency}s · 217 tok`;
    $("#responseStatusChip").textContent = "✓ parsed";

    $("#brainPulse").classList.remove("thinking");

    const decision = resolveDecision(v);

    // Populate decision tab
    $("#decisionText").textContent = decision.label;
    $("#decisionBadge").classList.remove("idle", "watch-full", "skip", "skip-mh", "watch-nm");
    $("#decisionBadge").classList.add(decision.badgeClass);

    $("#decMHVal").textContent = cfg().useLLMDecision
      ? (llmObj.possible_mental_health_relevance ? "true" : "false")
      : "n/a";
    $("#decConfVal").textContent = llmObj.mental_health_confidence || "—";
    $("#decPersonaVal").textContent = cfg().useLLMDecision ? state.persona : "n/a";
    $("#decActionVal").textContent = decision.action;
    $("#decReasoning").textContent = v.reasoning || "—";

    // Briefly flip to Decision tab to highlight
    await wait(300);
    showLLMTab("decision");

    if (cfg().useLLMDecision) {
      const msg = {
        WATCH_FULL: `🎯 LLM Decision: WATCH MORE — Mental health content detected (INTERESTED mode)`,
        SKIP: `⏩ LLM Decision: SKIP — Not relevant (INTERESTED mode)`,
        SKIP_MENTAL_HEALTH: `⏩ LLM Decision: SKIP — Mental health content detected (NOT_INTERESTED mode)`,
        WATCH_FULL_NON_MENTAL_HEALTH: `🎯 LLM Decision: WATCH MORE — Non-mental-health content (NOT_INTERESTED mode)`,
      }[decision.key];
      log(decision.key.startsWith("SKIP") ? "skip" : "decision", msg);
    } else {
      log("decision", `LLM description attached to video metadata (no watch/skip decision)`);
    }

    return decision;
  }

  async function step_execute(v, decision) {
    setStep(5);
    stampDecision(decision);

    const c = cfg();
    const extraSec = c.useLLMDecision
      ? (decision.key === "WATCH_FULL" || decision.key === "WATCH_FULL_NON_MENTAL_HEALTH" ? c.fullWatch : c.skipDuration)
      : Math.max(0, c.fullWatch - c.initialWatch);

    log("info", c.useLLMDecision
      ? `Executing ${decision.label}: additional ${extraSec}s before scroll`
      : `Executing fixed watch: ${c.fullWatch}s total`);

    // Run a compressed watch timer (scaled to feel like the extra watch).
    // Cap long watches at 10s so the visual difference between
    // WATCH_FULL (+25s real) and SKIP (+0.5s real) is obvious.
    const shownSec = Math.max(0.6, Math.min(extraSec, 10));
    await runWatchTimer(shownSec);
  }

  function commitDecision(v, decision) {
    const c = cfg();
    const watchSec = decision.watchSec;
    state.totalWatchSec += watchSec;
    state.decisions.push({ v, decision });
    state.counts[decision.key] = (state.counts[decision.key] || 0) + 1;

    if (c.useLLMDecision && v.llm.possible_mental_health_relevance) state.mhCount += 1;
    if (!c.useLLMDecision) state.mhCount = 0; // n/a

    updateStats();
  }

  /* ========== UI hookups ========== */

  function setPlayButton(running) {
    const lbl = $("#playLabel");
    const icon = $("#playIcon");
    if (running) {
      lbl.textContent = "Pause";
      icon.setAttribute("d", "M5 4 L9 4 L9 16 L5 16 Z M11 4 L15 4 L15 16 L11 16 Z");
    } else if (state.running && state.paused) {
      lbl.textContent = "Resume";
      icon.setAttribute("d", "M5 3 L16 10 L5 17 Z");
    } else {
      lbl.textContent = state.index >= state.videos.length ? "Restart" : "Play";
      icon.setAttribute("d", "M5 3 L16 10 L5 17 Z");
    }
  }

  function resetSession() {
    clearTimers();
    state.running = false;
    state.paused = false;
    state.index = 0;
    hideStamp();
    hideWatchTimer();
    setStep(-1);
    $("#brainPulse").classList.remove("thinking");
    $("#promptCode").textContent = "";
    $("#responseCode").textContent = "";
    $("#responseStatusChip").textContent = "awaiting response…";
    $("#responseLatencyTag").textContent = "—";
    $("#decisionText").textContent = "—";
    $("#decisionBadge").className = "decision-badge idle";
    $("#decMHVal").textContent = "—";
    $("#decConfVal").textContent = "—";
    $("#decPersonaVal").textContent = "—";
    $("#decActionVal").textContent = "—";
    $("#decReasoning").textContent = "Decision rationale will appear here after classification.";
    showLLMTab("prompt");
    loadScenario();
    setPlayButton(false);
    $("#sessionStatusTag").textContent = "● idle";
    $("#sessionStatusTag").classList.remove("running");
    $("#browserHint").textContent = "waiting to start…";
  }

  function togglePlay() {
    if (!state.running) {
      // Start (or restart after complete)
      if (state.index >= state.videos.length) resetSession();
      runLoop();
    } else if (state.paused) {
      // Resume — just flip the flag; wait() polls detect this automatically
      state.paused = false;
      setPlayButton(true);
      $("#sessionStatusTag").textContent = "● running";
      $("#sessionStatusTag").classList.add("running");
      $("#browserHint").textContent = `processing video ${state.index + 1}/${state.videos.length}`;
    } else {
      // Pause — freeze in place without stopping the async chain
      state.paused = true;
      setPlayButton(false);
      $("#sessionStatusTag").textContent = "● paused";
      $("#sessionStatusTag").classList.remove("running");
      $("#browserHint").textContent = "paused — click Resume to continue";
    }
  }

  async function stepOnce() {
    if (state.running) return; // ignore during playback
    if (state.index >= state.videos.length) resetSession();
    const v = state.videos[state.index];
    $("#videoCounterTag").textContent = `${state.index + 1} / ${state.videos.length}`;
    state.running = true;
    try {
      const decision = await processVideo(v);
      if (decision) {
        commitDecision(v, decision);
        state.index += 1;
      }
      hideStamp();
    } finally {
      state.running = false;
      setStep(-1);
      hideWatchTimer();
    }
  }

  /* ========== event wiring ========== */

  function wireUI() {
    // Platform switch
    $$(".platform-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.platform = btn.dataset.platform;
        applyPlatform();
        buildScenarioOptions();
        buildStepper();
        resetSession();
        log("info", `Switched platform → ${cfg().name}`);
      })
    );

    // Scenario select
    $("#scenarioSelect").addEventListener("change", (e) => {
      state.scenarioId = e.target.value;
      resetSession();
      log("info", `Switched scenario → ${SCENARIOS[state.scenarioId].label}`);
    });

    // Persona select
    $("#personaSelect").addEventListener("change", (e) => {
      state.persona = e.target.value;
      log("info", `Persona flipped → ${state.persona}`);
    });

    // Speed buttons
    $$(".speed-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        $$(".speed-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.speed = Number(btn.dataset.speed) || 1;
      })
    );

    // Play, Step, Reset
    $("#playBtn").addEventListener("click", togglePlay);
    $("#stepBtn").addEventListener("click", stepOnce);
    $("#resetBtn").addEventListener("click", () => {
      log("info", "Session reset");
      resetSession();
    });

    // LLM tabs
    $$(".llm-tab").forEach((t) =>
      t.addEventListener("click", () => showLLMTab(t.dataset.llmTab))
    );
  }

  /* ========== boot ========== */

  function init() {
    applyPlatform();
    buildScenarioOptions();
    buildStepper();
    loadScenario();
    setStep(-1);
    wireUI();
    log("info", "Demo initialised. Press Play to start the session.");
    log("info", "Tip: switch persona mid-demo to watch the decision flip in real time.");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
