/* BF3122 Applied Concept Quiz — vanilla JS, no dependencies. */
(function () {
  "use strict";

  var STORE = "bf3122.quiz.v1";
  var LETTERS = ["A", "B", "C", "D"];
  var app = document.getElementById("app");
  var DATA = null;
  var S = null; // live session

  /* ---------- storage (always optional) ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE) || "{}") || {}; }
    catch (e) { return {}; }
  }
  function save(patch) {
    try {
      var cur = load();
      for (var k in patch) cur[k] = patch[k];
      localStorage.setItem(STORE, JSON.stringify(cur));
    } catch (e) { /* private mode, blocked storage — ignore */ }
  }

  /* ---------- theme ---------- */
  var themeBtn = document.getElementById("themeBtn");
  var saved = load();
  if (saved.theme) document.documentElement.setAttribute("data-theme", saved.theme);
  themeBtn.addEventListener("click", function () {
    var el = document.documentElement;
    var now = el.getAttribute("data-theme");
    var dark = now ? now === "dark"
      : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var next = dark ? "light" : "dark";
    el.setAttribute("data-theme", next);
    save({ theme: next });
  });

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function el(html) {
    var d = document.createElement("div");
    d.innerHTML = html.trim();
    return d.firstElementChild;
  }
  function shuffled(arr) {
    var a = arr.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function topicName(id) {
    for (var i = 0; i < DATA.topics.length; i++) if (DATA.topics[i].id === id) return DATA.topics[i].name;
    return id;
  }
  function byId(id) {
    for (var i = 0; i < DATA.questions.length; i++) if (DATA.questions[i].id === id) return DATA.questions[i];
    return null;
  }

  /* ---------- config (start screen state) ---------- */
  var cfg = {
    topics: {},        // id -> bool
    hardOnly: false,
    shuffleQ: true,
    shuffleOpts: true,
    mode: "instant"    // instant | exam
  };

  function selectedQuestions() {
    var picked = DATA.questions.filter(function (q) {
      if (!cfg.topics[q.topic]) return false;
      if (cfg.hardOnly && q.difficulty < 3) return false;
      return true;
    });
    return cfg.shuffleQ ? shuffled(picked) : picked;
  }

  /* ---------- session ---------- */
  function startSession(list) {
    S = {
      items: list.map(function (q) {
        var order = cfg.shuffleOpts ? shuffled([0, 1, 2, 3]) : [0, 1, 2, 3];
        return { id: q.id, order: order, pick: null, seen: false };
      }),
      i: 0,
      mode: cfg.mode,
      done: false
    };
    persist();
    render();
  }
  function persist() {
    save({ session: S });
  }
  function cur() { return S.items[S.i]; }
  function curQ() { return byId(cur().id); }
  function answeredCount() {
    return S.items.filter(function (it) { return it.pick !== null; }).length;
  }
  function isRight(it) {
    var q = byId(it.id);
    return it.pick !== null && it.order[it.pick] === q.answer;
  }
  function scoreNow() {
    return S.items.filter(isRight).length;
  }

  /* ---------- render: start ---------- */
  function renderStart() {
    var counts = {};
    DATA.questions.forEach(function (q) { counts[q.topic] = (counts[q.topic] || 0) + 1; });
    var hardCounts = {};
    DATA.questions.forEach(function (q) { if (q.difficulty === 3) hardCounts[q.topic] = (hardCounts[q.topic] || 0) + 1; });

    var prev = load().session;
    var resumeHtml = "";
    if (prev && !prev.done && prev.items && prev.items.length) {
      var n = prev.items.filter(function (it) { return it.pick !== null; }).length;
      resumeHtml =
        '<div class="card"><h2>Unfinished attempt</h2>' +
        '<p class="hint">' + n + " of " + prev.items.length + ' answered.</p>' +
        '<div class="actions"><button class="primary" id="resumeBtn" type="button">Resume</button>' +
        '<button class="sec" id="discardBtn" type="button">Discard</button></div></div>';
    }

    var topicRows = DATA.topics.map(function (t) {
      return '<label class="check"><input type="checkbox" data-topic="' + t.id + '"' +
        (cfg.topics[t.id] ? " checked" : "") + '>' +
        '<span><span class="t">' + esc(t.name) + "</span><br>" +
        '<span class="c">Week ' + t.week + " · " + counts[t.id] + " questions · " +
        (hardCounts[t.id] || 0) + " hard</span></span></label>";
    }).join("");

    app.innerHTML =
      resumeHtml +
      '<div class="card">' +
        "<h2>Choose your topics</h2>" +
        '<p class="hint">Topics follow the eight headings in the revision guide.</p>' +
        '<div class="grid two" id="topicGrid">' + topicRows + "</div>" +
        '<div class="row" style="margin-top:12px">' +
          '<div class="seg">' +
            '<button type="button" data-sel="all">All</button>' +
            '<button type="button" data-sel="none">None</button>' +
            '<button type="button" data-sel="w1">Week 1</button>' +
            '<button type="button" data-sel="w2">Week 2</button>' +
            '<button type="button" data-sel="w3">Week 3</button>' +
            '<button type="button" data-sel="w4">Week 4</button>' +
          "</div>" +
        "</div>" +
      "</div>" +

      '<div class="card">' +
        "<h2>Settings</h2>" +
        '<p class="hint">Instant feedback is for learning; exam mode holds everything back until the end.</p>' +
        '<div class="grid">' +
          '<div class="row"><span class="note">Feedback</span><div class="seg" id="modeSeg">' +
            '<button type="button" data-mode="instant" aria-pressed="' + (cfg.mode === "instant") + '">Instant</button>' +
            '<button type="button" data-mode="exam" aria-pressed="' + (cfg.mode === "exam") + '">Exam</button>' +
          "</div></div>" +
          '<label class="check"><input type="checkbox" id="hardOnly"' + (cfg.hardOnly ? " checked" : "") + '>' +
            '<span class="t">Hard questions only<br><span class="c">Multi-step reasoning and traps</span></span></label>' +
          '<label class="check"><input type="checkbox" id="shuffleQ"' + (cfg.shuffleQ ? " checked" : "") + '>' +
            '<span class="t">Shuffle question order</span></label>' +
          '<label class="check"><input type="checkbox" id="shuffleOpts"' + (cfg.shuffleOpts ? " checked" : "") + '>' +
            '<span class="t">Shuffle answer options<br><span class="c">Stops you memorising positions on a re-run</span></span></label>' +
        "</div>" +
        '<div class="actions">' +
          '<button class="primary" id="startBtn" type="button">Start quiz</button>' +
          '<span class="note" id="countNote"></span>' +
        "</div>" +
      "</div>" +
      bestHtml();

    function refreshCount() {
      var n = DATA.questions.filter(function (q) {
        return cfg.topics[q.topic] && (!cfg.hardOnly || q.difficulty === 3);
      }).length;
      document.getElementById("countNote").textContent = n + (n === 1 ? " question" : " questions") + " selected";
      document.getElementById("startBtn").disabled = n === 0;
    }
    refreshCount();

    app.querySelectorAll("[data-topic]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        cfg.topics[cb.getAttribute("data-topic")] = cb.checked;
        refreshCount();
      });
    });
    app.querySelectorAll("[data-sel]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-sel");
        DATA.topics.forEach(function (t) {
          if (k === "all") cfg.topics[t.id] = true;
          else if (k === "none") cfg.topics[t.id] = false;
          else cfg.topics[t.id] = ("w" + t.week) === k;
        });
        renderStart();
      });
    });
    document.getElementById("hardOnly").addEventListener("change", function (e) {
      cfg.hardOnly = e.target.checked; refreshCount();
    });
    document.getElementById("shuffleQ").addEventListener("change", function (e) { cfg.shuffleQ = e.target.checked; });
    document.getElementById("shuffleOpts").addEventListener("change", function (e) { cfg.shuffleOpts = e.target.checked; });
    app.querySelectorAll("#modeSeg button").forEach(function (b) {
      b.addEventListener("click", function () {
        cfg.mode = b.getAttribute("data-mode");
        app.querySelectorAll("#modeSeg button").forEach(function (x) {
          x.setAttribute("aria-pressed", String(x === b));
        });
      });
    });
    document.getElementById("startBtn").addEventListener("click", function () {
      startSession(selectedQuestions());
    });
    if (document.getElementById("resumeBtn")) {
      document.getElementById("resumeBtn").addEventListener("click", function () {
        S = load().session; render();
      });
      document.getElementById("discardBtn").addEventListener("click", function () {
        save({ session: null }); renderStart();
      });
    }
  }

  function bestHtml() {
    var best = load().best;
    if (!best) return "";
    var rows = DATA.topics.filter(function (t) { return best[t.id]; }).map(function (t) {
      var b = best[t.id];
      var pct = Math.round((b.right / b.total) * 100);
      var col = pct >= 75 ? "var(--good)" : pct >= 50 ? "var(--warn)" : "var(--bad)";
      return '<div class="tb"><span class="n">' + esc(t.name) + "</span>" +
        '<span class="v">' + b.right + "/" + b.total + " · " + pct + "%</span>" +
        '<span class="track"><i style="width:' + pct + "%;background:" + col + '"></i></span></div>';
    }).join("");
    if (!rows) return "";
    return '<div class="card"><h2>Your last result per topic</h2>' +
      '<p class="hint">From the most recent attempt that covered each topic.</p>' +
      '<div class="tbreak">' + rows + "</div></div>";
  }

  /* ---------- render: quiz ---------- */
  function renderQuiz() {
    var it = cur(), q = curQ();
    var revealed = S.mode === "instant" && it.pick !== null;
    var pct = Math.round(((S.i + 1) / S.items.length) * 100);

    var opts = it.order.map(function (origIdx, pos) {
      var cls = "opt";
      if (revealed) {
        if (origIdx === q.answer) cls += " correct";
        else if (pos === it.pick) cls += " wrong";
      }
      return '<button class="' + cls + '" type="button" data-pos="' + pos + '"' +
        (revealed ? " disabled" : "") +
        ' aria-pressed="' + (it.pick === pos) + '">' +
        '<span class="k">' + LETTERS[pos] + "</span><span>" + esc(q.options[origIdx]) + "</span></button>";
    }).join("");

    var why = "";
    if (revealed) {
      var rs = it.order.map(function (origIdx, pos) {
        var hit = origIdx === q.answer || pos === it.pick;
        return '<div class="r' + (hit ? " hit" : "") + '"><b>' + LETTERS[pos] + "</b><span>" +
          esc(q.rationales[origIdx]) + "</span></div>";
      }).join("");
      why = '<div class="why">' + rs +
        '<div class="take">' + esc(q.takeaway) + "</div>" +
        '<div class="src">' + esc(q.source) + "</div></div>";
    }

    app.innerHTML =
      '<div class="card">' +
        '<div class="qmeta">' +
          "<span>Question " + (S.i + 1) + " of " + S.items.length + "</span>" +
          '<span class="tag">' + esc(topicName(q.topic)) + "</span>" +
          '<span class="tag">Week ' + q.week + "</span>" +
          '<span class="tag' + (q.difficulty === 3 ? " d3" : "") + '">' +
            (q.difficulty === 3 ? "Hard" : q.difficulty === 2 ? "Standard" : "Core") + "</span>" +
          (S.mode === "exam" ? '<span class="tag">Exam mode</span>' : "") +
        "</div>" +
        '<p class="stem">' + esc(q.stem) + "</p>" +
        '<div class="opts">' + opts + "</div>" +
        why +
        '<div class="actions">' +
          '<button class="sec" id="prevBtn" type="button"' + (S.i === 0 ? " disabled" : "") + ">Back</button>" +
          '<button class="primary" id="nextBtn" type="button">' +
            (S.i === S.items.length - 1 ? "Finish" : "Next") + "</button>" +
          '<button class="sec" id="quitBtn" type="button">End &amp; score</button>' +
        "</div>" +
        '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
        '<p class="note" style="margin-top:10px">' +
          '<span class="kbd">1</span>–<span class="kbd">4</span> to answer · ' +
          '<span class="kbd">←</span> <span class="kbd">→</span> to move · ' +
          answeredCount() + " of " + S.items.length + " answered</p>" +
      "</div>";

    app.querySelectorAll(".opt").forEach(function (b) {
      b.addEventListener("click", function () { pick(parseInt(b.getAttribute("data-pos"), 10)); });
    });
    document.getElementById("prevBtn").addEventListener("click", go(-1));
    document.getElementById("nextBtn").addEventListener("click", go(1));
    document.getElementById("quitBtn").addEventListener("click", finish);
  }

  function pick(pos) {
    var it = cur();
    if (S.mode === "instant" && it.pick !== null) return; // locked once revealed
    it.pick = pos;
    it.seen = true;
    persist();
    renderQuiz();
  }
  function go(d) {
    return function () {
      var n = S.i + d;
      if (n < 0) return;
      if (n >= S.items.length) return finish();
      S.i = n;
      persist();
      renderQuiz();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }

  /* ---------- render: results ---------- */
  function finish() {
    S.done = true;
    persist();
    recordBest();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function recordBest() {
    var best = load().best || {};
    var agg = {};
    S.items.forEach(function (it) {
      var q = byId(it.id);
      agg[q.topic] = agg[q.topic] || { right: 0, total: 0 };
      agg[q.topic].total++;
      if (isRight(it)) agg[q.topic].right++;
    });
    for (var t in agg) best[t] = agg[t];
    save({ best: best });
  }

  function renderResults() {
    var right = scoreNow(), total = S.items.length;
    var pct = Math.round((right / total) * 100);

    var agg = {};
    S.items.forEach(function (it) {
      var q = byId(it.id);
      agg[q.topic] = agg[q.topic] || { right: 0, total: 0 };
      agg[q.topic].total++;
      if (isRight(it)) agg[q.topic].right++;
    });
    var breakdown = DATA.topics.filter(function (t) { return agg[t.id]; }).map(function (t) {
      var a = agg[t.id], p = Math.round((a.right / a.total) * 100);
      var col = p >= 75 ? "var(--good)" : p >= 50 ? "var(--warn)" : "var(--bad)";
      return '<div class="tb"><span class="n">' + esc(t.name) + "</span>" +
        '<span class="v">' + a.right + "/" + a.total + " · " + p + "%</span>" +
        '<span class="track"><i style="width:' + p + "%;background:" + col + '"></i></span></div>';
    }).join("");

    var reviews = S.items.map(function (it, idx) {
      var q = byId(it.id);
      var ok = isRight(it);
      var rs = it.order.map(function (origIdx, pos) {
        var hit = origIdx === q.answer || pos === it.pick;
        return '<div class="r' + (hit ? " hit" : "") + '"><b>' + LETTERS[pos] + "</b><span>" +
          "<em>" + esc(q.options[origIdx]) + "</em><br>" + esc(q.rationales[origIdx]) + "</span></div>";
      }).join("");
      return '<details class="rev"><summary>' +
        '<span class="mark ' + (ok ? "ok" : "no") + '">' + (ok ? "✓" : "✗") + "</span>" +
        "<span>" + (idx + 1) + ". " + esc(q.stem) + "</span></summary>" +
        '<div class="body"><div class="why">' + rs +
        '<div class="take">' + esc(q.takeaway) + "</div>" +
        '<div class="src">' + esc(q.source) + "</div></div></div></details>";
    }).join("");

    var wrongCount = S.items.filter(function (it) { return !isRight(it); }).length;

    app.innerHTML =
      '<div class="card">' +
        "<h2>Result</h2>" +
        '<div class="score" style="margin-top:10px">' +
          '<span class="big">' + right + "/" + total + "</span>" +
          '<span class="pct">' + pct + "% · " + answeredCount() + " answered</span>" +
        "</div>" +
        '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="actions">' +
          (wrongCount ? '<button class="primary" id="retryBtn" type="button">Retry ' + wrongCount + " missed</button>" : "") +
          '<button class="sec" id="againBtn" type="button">New quiz</button>' +
        "</div>" +
      "</div>" +
      '<div class="card"><h2>By topic</h2>' +
        '<p class="hint">Anything under 75% is where the marginal revision hour pays.</p>' +
        '<div class="tbreak">' + breakdown + "</div></div>" +
      '<div class="card"><h2>Review</h2>' +
        '<p class="hint">Open a question to see why each option was written the way it was.</p>' +
        reviews +
      "</div>";

    if (document.getElementById("retryBtn")) {
      document.getElementById("retryBtn").addEventListener("click", function () {
        var missed = S.items.filter(function (it) { return !isRight(it); })
          .map(function (it) { return byId(it.id); });
        startSession(cfg.shuffleQ ? shuffled(missed) : missed);
      });
    }
    document.getElementById("againBtn").addEventListener("click", function () {
      S = null; save({ session: null }); render();
    });
  }

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", function (e) {
    if (!S || S.done) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key >= "1" && e.key <= "4") { e.preventDefault(); pick(parseInt(e.key, 10) - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); go(1)(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1)(); }
  });

  /* ---------- router ---------- */
  function render() {
    if (!S) return renderStart();
    if (S.done) return renderResults();
    return renderQuiz();
  }

  /* ---------- boot ---------- */
  fetch("questions.json", { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (d) {
      DATA = d;
      DATA.topics.forEach(function (t) { cfg.topics[t.id] = true; });
      var st = document.getElementById("subtitle");
      if (d.meta) st.textContent = d.meta.title + " · " + d.meta.scope + " · " + d.questions.length + " questions";
      render();
    })
    .catch(function (err) {
      app.innerHTML = '<div class="card"><div class="err"><strong>Could not load questions.json.</strong><br>' +
        esc(err.message) +
        "<br><br>If you opened this file directly from disk, browsers block the fetch. " +
        "Run a local server (<code>python -m http.server</code>) or use the deployed link.</div></div>";
    });
})();
