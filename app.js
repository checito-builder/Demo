/* dOS — app shell, guided flow, and report rendering */
(function () {
  "use strict";

  var app = document.getElementById("app");
  var money = window.DOS_ENGINE.money;

  // ---- Questionnaire definition ------------------------------------------
  // type: "budget" | "single" | "multi" | "optional"
  var QUESTIONS = [
    {
      id: "budget", key: "budget", type: "budget",
      title: "What monthly payment feels right?",
      hint: "Slide to your comfortable range. This is the payment, not the car price."
    },
    {
      id: "down", key: "downPayment", type: "down",
      title: "How much can you put down?",
      hint: "A bigger down payment lowers your monthly cost — but don't drain your safety net."
    },
    {
      id: "carType", key: "carType", type: "single",
      title: "What kind of car are you leaning toward?",
      hint: "Not sure is a perfectly good answer — we'll help you decide.",
      options: [
        { v: "suv", l: "SUV", e: "🚙" }, { v: "sedan", l: "Sedan", e: "🚗" },
        { v: "hatchback", l: "Hatchback", e: "🚐" }, { v: "pickup", l: "Pickup", e: "🛻" },
        { v: "ev", l: "Electric / Hybrid", e: "⚡" }, { v: "unsure", l: "Not sure yet", e: "🤔" }
      ]
    },
    {
      id: "usage", key: "usage", type: "single",
      title: "How will you mostly use it?",
      options: [
        { v: "city", l: "Daily city commute", e: "🏙️" }, { v: "family", l: "Family use", e: "👨‍👩‍👧" },
        { v: "roadtrips", l: "Road trips", e: "🛣️" }, { v: "work", l: "Work / business", e: "💼" },
        { v: "mixed", l: "Mixed use", e: "🔀" }
      ]
    },
    {
      id: "family", key: "family", type: "single",
      title: "What's your family situation?",
      options: [
        { v: "single", l: "Single", e: "🧍" }, { v: "couple", l: "Couple", e: "👫" },
        { v: "baby", l: "Couple with baby/toddler", e: "🍼" }, { v: "kids", l: "Family with kids", e: "👨‍👩‍👧‍👦" },
        { v: "passengers", l: "Frequent passengers", e: "🧑‍🤝‍🧑" }
      ]
    },
    {
      id: "priorities", key: "priorities", type: "multi", max: 3,
      title: "What matters most to you?",
      hint: "Pick up to 3, in order of importance.",
      options: [
        { v: "safety", l: "Safety", e: "🛡️" }, { v: "fuel-efficiency", l: "Fuel efficiency", e: "⛽" },
        { v: "comfort", l: "Comfort", e: "🛋️" }, { v: "design", l: "Design", e: "🎨" },
        { v: "technology", l: "Technology", e: "📱" }, { v: "status", l: "Status / brand", e: "✨" },
        { v: "resale-value", l: "Resale value", e: "📈" }, { v: "low-maintenance", l: "Low maintenance", e: "🔧" }
      ]
    },
    {
      id: "emotion", key: "emotion", type: "single",
      title: "Which best describes the feeling you want?",
      options: [
        { v: "practical", l: "Practical", e: "✅" }, { v: "aspirational", l: "Aspirational", e: "🌟" },
        { v: "sporty", l: "Sporty", e: "🏁" }, { v: "premium", l: "Premium-feeling", e: "💎" },
        { v: "family-first", l: "Family-first", e: "❤️" }, { v: "budget-conscious", l: "Budget-conscious", e: "🪙" }
      ]
    },
    {
      id: "financial", key: "financial", type: "single",
      title: "How do you think about money here?",
      options: [
        { v: "lowest-payment", l: "I want the lowest monthly payment", e: "📉" },
        { v: "total-cost", l: "I care about total cost of ownership", e: "🧮" },
        { v: "pay-more-comfort", l: "I'll pay more for comfort/status", e: "💸" },
        { v: "avoid-stress", l: "I want to avoid financial stress", e: "😌" }
      ]
    },
    {
      id: "dealBreakers", key: "dealBreakers", type: "multi", max: 4,
      title: "Any absolute deal-breakers?",
      hint: "Optional — pick anything you simply won't accept.",
      options: [
        { v: "fuel", l: "High fuel consumption", e: "⛽" }, { v: "maintenance", l: "Expensive maintenance", e: "🔧" },
        { v: "resale", l: "Poor resale value", e: "📉" }, { v: "trunk", l: "Small trunk", e: "🧳" },
        { v: "safety", l: "Weak safety features", e: "🛡️" }, { v: "basic-interior", l: "Too basic interior", e: "🪑" },
        { v: "waiting", l: "Long waiting times", e: "⏳" }
      ]
    },
    {
      id: "optional", key: "optional", type: "optional",
      title: "Anything else? (optional)",
      hint: "These sharpen the recommendation but you can skip them all."
    }
  ];

  // ---- State --------------------------------------------------------------
  var state = {
    step: 0, // index into QUESTIONS during flow
    answers: {
      budgetMin: 6000, budgetMax: 12000,
      downPayment: 60000,
      carType: null, usage: null, family: null,
      priorities: [], emotion: null, financial: null, dealBreakers: [],
      preferredBrands: [], avoidBrands: [], ownershipYears: null, annualKm: null,
      currentCar: "", considering: ""
    }
  };

  var route = "landing"; // landing | flow | profile | report

  // ---- Render dispatch ----------------------------------------------------
  function render() {
    if (route === "landing") renderLanding();
    else if (route === "flow") renderFlow();
    else if (route === "profile") renderProfile();
    else if (route === "report") renderReport();
    window.scrollTo(0, 0);
  }

  // ---- Landing ------------------------------------------------------------
  function renderLanding() {
    app.innerHTML =
      '<div class="landing">' +
        '<div class="bg-orbs"><span></span><span></span></div>' +
        '<header class="topbar"><div class="logo">d<span>OS</span></div>' +
          '<div class="logo-sub">decision OS</div></header>' +
        '<main class="hero">' +
          '<div class="pill">🇲🇽 Smart car decisions for Mexico</div>' +
          '<h1>Find the car that <span class="grad">actually fits your life</span>.</h1>' +
          '<p class="sub">A smarter way to choose a new car based on your lifestyle, budget, family needs, and real-world trade-offs.</p>' +
          '<button class="btn btn-primary btn-lg" id="start">Start decision flow →</button>' +
          '<div class="trust">No login · Takes 2 minutes · Independent &amp; not salesy</div>' +
          '<div class="value-row">' +
            valueCard("🎯", "Fit over hype", "We score the match between a car and <em>you</em> — not generic rankings.") +
            valueCard("🧮", "Real costs", "Payment, fuel, insurance, maintenance and resale — the full picture.") +
            valueCard("🗣️", "Honest take", "A rational friend who challenges your blind spots, not a brochure.") +
          '</div>' +
        '</main>' +
        '<footer class="foot">Prototype · Illustrative data · dOS decision intelligence</footer>' +
      '</div>';
    document.getElementById("start").onclick = function () { route = "flow"; state.step = 0; render(); };
  }
  function valueCard(icon, title, body) {
    return '<div class="vcard"><div class="vicon">' + icon + '</div><h3>' + title + '</h3><p>' + body + '</p></div>';
  }

  // ---- Flow ---------------------------------------------------------------
  function renderFlow() {
    var q = QUESTIONS[state.step];
    var pct = Math.round((state.step) / QUESTIONS.length * 100);
    var body = "";

    if (q.type === "budget") body = renderBudget();
    else if (q.type === "down") body = renderDown();
    else if (q.type === "single") body = renderChoices(q, false);
    else if (q.type === "multi") body = renderChoices(q, true);
    else if (q.type === "optional") body = renderOptional();

    app.innerHTML =
      '<div class="flow">' +
        '<div class="flow-head">' +
          '<button class="ghost" id="back">' + (state.step === 0 ? "✕ Exit" : "← Back") + '</button>' +
          '<div class="progress"><div class="bar" style="width:' + pct + '%"></div></div>' +
          '<div class="step-count">' + (state.step + 1) + '/' + QUESTIONS.length + '</div>' +
        '</div>' +
        '<div class="flow-body">' +
          '<div class="q-card">' +
            '<h2 class="q-title">' + q.title + '</h2>' +
            (q.hint ? '<p class="q-hint">' + q.hint + '</p>' : '') +
            body +
          '</div>' +
        '</div>' +
        '<div class="flow-foot">' +
          '<button class="btn btn-primary btn-lg" id="next">' +
            (state.step === QUESTIONS.length - 1 ? "See my decision profile →" : "Continue →") +
          '</button>' +
        '</div>' +
      '</div>';

    document.getElementById("back").onclick = function () {
      if (state.step === 0) { route = "landing"; render(); }
      else { state.step--; render(); }
    };
    document.getElementById("next").onclick = function () {
      if (!validateStep(q)) return;
      if (state.step === QUESTIONS.length - 1) { route = "profile"; render(); }
      else { state.step++; render(); }
    };
    wireFlow(q);
  }

  function validateStep(q) {
    var a = state.answers;
    var nextBtn = document.getElementById("next");
    var warn = function (msg) {
      var ex = document.querySelector(".q-warn");
      if (ex) ex.remove();
      var d = document.createElement("div");
      d.className = "q-warn";
      d.textContent = msg;
      document.querySelector(".q-card").appendChild(d);
    };
    if (q.type === "single" && !a[q.key]) { warn("Pick one to continue."); return false; }
    if (q.id === "priorities" && a.priorities.length === 0) { warn("Pick at least one priority."); return false; }
    return true;
  }

  function renderBudget() {
    var a = state.answers;
    return '<div class="slider-block">' +
      '<div class="slider-value"><span class="big">' + money(a.budgetMin) + '</span> – <span class="big">' + money(a.budgetMax) + '</span><span class="permo">/mo</span></div>' +
      '<label class="sl-label">Minimum</label>' +
      '<input type="range" id="bmin" min="2000" max="30000" step="500" value="' + a.budgetMin + '">' +
      '<label class="sl-label">Maximum</label>' +
      '<input type="range" id="bmax" min="2000" max="30000" step="500" value="' + a.budgetMax + '">' +
      '</div>';
  }
  function renderDown() {
    var a = state.answers;
    return '<div class="slider-block">' +
      '<div class="slider-value"><span class="big">' + money(a.downPayment) + '</span></div>' +
      '<input type="range" id="down" min="0" max="300000" step="5000" value="' + a.downPayment + '">' +
      '<div class="sl-scale"><span>$0</span><span>$300,000</span></div>' +
      '</div>';
  }
  function renderChoices(q, multi) {
    var a = state.answers;
    var sel = multi ? a[q.key] : [a[q.key]];
    var cells = q.options.map(function (o) {
      var on = sel.indexOf(o.v) !== -1;
      var rank = multi && on ? (a[q.key].indexOf(o.v) + 1) : null;
      return '<button class="choice' + (on ? ' on' : '') + '" data-v="' + o.v + '">' +
        '<span class="ch-emoji">' + o.e + '</span>' +
        '<span class="ch-label">' + o.l + '</span>' +
        (rank ? '<span class="ch-rank">' + rank + '</span>' : (on ? '<span class="ch-check">✓</span>' : '')) +
        '</button>';
    }).join("");
    return '<div class="choice-grid' + (multi ? ' multi' : '') + '">' + cells + '</div>';
  }
  function renderOptional() {
    var a = state.answers;
    return '<div class="opt-grid">' +
      optText("currentCar", "Current car", a.currentCar, "e.g. 2018 Nissan March") +
      optText("considering", "Cars you're considering", a.considering, "e.g. Creta, Seltos") +
      optText("preferredBrands", "Preferred brands", (a.preferredBrands || []).join(", "), "e.g. Toyota, Mazda") +
      optText("avoidBrands", "Brands to avoid", (a.avoidBrands || []).join(", "), "e.g. MG") +
      optNum("ownershipYears", "Expected ownership (years)", a.ownershipYears, "e.g. 5") +
      optNum("annualKm", "Annual mileage (km)", a.annualKm, "e.g. 15000") +
      '</div>';
  }
  function optText(id, label, val, ph) {
    return '<div class="opt-field"><label>' + label + '</label><input type="text" data-opt="' + id + '" value="' + escapeAttr(val || "") + '" placeholder="' + ph + '"></div>';
  }
  function optNum(id, label, val, ph) {
    return '<div class="opt-field"><label>' + label + '</label><input type="number" data-opt="' + id + '" value="' + (val || "") + '" placeholder="' + ph + '"></div>';
  }

  function wireFlow(q) {
    var a = state.answers;
    if (q.type === "budget") {
      var bmin = document.getElementById("bmin"), bmax = document.getElementById("bmax");
      var sync = function () {
        a.budgetMin = Math.min(+bmin.value, +bmax.value);
        a.budgetMax = Math.max(+bmin.value, +bmax.value);
        var v = document.querySelector(".slider-value");
        v.innerHTML = '<span class="big">' + money(a.budgetMin) + '</span> – <span class="big">' + money(a.budgetMax) + '</span><span class="permo">/mo</span>';
      };
      bmin.oninput = sync; bmax.oninput = sync;
    }
    if (q.type === "down") {
      var d = document.getElementById("down");
      d.oninput = function () {
        a.downPayment = +d.value;
        document.querySelector(".slider-value").innerHTML = '<span class="big">' + money(a.downPayment) + '</span>';
      };
    }
    if (q.type === "single" || q.type === "multi") {
      Array.prototype.forEach.call(document.querySelectorAll(".choice"), function (btn) {
        btn.onclick = function () {
          var v = btn.getAttribute("data-v");
          if (q.type === "single") {
            a[q.key] = v;
          } else {
            var arr = a[q.key];
            var i = arr.indexOf(v);
            if (i !== -1) arr.splice(i, 1);
            else if (arr.length < (q.max || 99)) arr.push(v);
          }
          renderFlow(); // re-render to reflect selection/ranks
        };
      });
    }
    if (q.type === "optional") {
      Array.prototype.forEach.call(document.querySelectorAll("[data-opt]"), function (inp) {
        inp.onchange = function () {
          var id = inp.getAttribute("data-opt");
          if (id === "preferredBrands" || id === "avoidBrands") {
            a[id] = inp.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
          } else if (id === "ownershipYears" || id === "annualKm") {
            a[id] = inp.value ? +inp.value : null;
          } else {
            a[id] = inp.value;
          }
        };
      });
    }
  }

  // ---- Profile screen -----------------------------------------------------
  function renderProfile() {
    var report = window.DOS_ENGINE.generateReport(state.answers);
    state.report = report;
    var a = state.answers;

    var chips = []
      .concat(a.priorities.map(function (p) { return prettyChip(p); }))
      .concat(a.dealBreakers.map(function (d) { return '⛔ ' + prettyDeal(d); }));

    app.innerHTML =
      '<div class="screen">' +
        miniHeader("Your decision profile") +
        '<div class="profile-hero">' +
          '<div class="profile-emoji">' + profileEmoji(report.profile) + '</div>' +
          '<div class="profile-tag">DETECTED PROFILE</div>' +
          '<h1 class="profile-name">' + report.profile + '</h1>' +
          '<p class="profile-copy">' + report.profileCopy + '</p>' +
        '</div>' +
        '<div class="card">' +
          '<h3 class="card-h">📋 Your situation, in a sentence</h3>' +
          '<p class="lead">' + report.summary + '</p>' +
          '<div class="chip-row">' + chips.map(function (c) { return '<span class="chip">' + c + '</span>'; }).join("") + '</div>' +
        '</div>' +
        (report.tradeOffs.length ?
          '<div class="card warn-card">' +
            '<h3 class="card-h">⚠️ Trade-offs worth facing now</h3>' +
            report.tradeOffs.map(function (t) {
              return '<div class="tradeoff"><div class="to-title">' + t.title + '</div><div class="to-body">' + t.body + '</div></div>';
            }).join("") +
          '</div>' : '') +
        '<div class="flow-foot static">' +
          '<button class="btn btn-primary btn-lg" id="toReport">See my recommendations →</button>' +
          '<button class="ghost center" id="editAns">← Adjust my answers</button>' +
        '</div>' +
      '</div>';

    document.getElementById("toReport").onclick = function () { route = "report"; render(); };
    document.getElementById("editAns").onclick = function () { route = "flow"; state.step = 0; render(); };
  }

  // ---- Report screen ------------------------------------------------------
  function renderReport() {
    var report = state.report || window.DOS_ENGINE.generateReport(state.answers);
    var rec = report.recommendations;

    app.innerHTML =
      '<div class="screen">' +
        miniHeader("Your recommendation report") +
        '<div class="report-intro">' +
          '<div class="profile-tag">FOR A ' + report.profile.toUpperCase() + '</div>' +
          '<h1 class="report-h1">Three ways to go</h1>' +
          '<p class="lead">Same person, three honest strategies. Fit scores show how well each matches <em>your</em> answers — not a generic ranking.</p>' +
        '</div>' +
        '<div class="rec-grid">' +
          recCard("Rational choice", "The smart-money pick", "rational", rec.rational, report.answers) +
          recCard("Balanced choice", "Best all-round fit", "balanced", rec.balanced, report.answers) +
          recCard("Emotional but acceptable", "The heart pick that still makes sense", "emotional", rec.emotional, report.answers) +
        '</div>' +
        '<div class="card">' +
          '<h3 class="card-h">🕵️ Hidden risks to check before you sign</h3>' +
          '<div class="risk-list">' +
            report.hiddenRisks.map(function (r) {
              return '<div class="risk">' +
                '<div class="risk-top"><span class="risk-label">' + r.label + '</span>' + riskBadge(r.level) + '</div>' +
                '<div class="risk-body">' + r.body + '</div></div>';
            }).join("") +
          '</div>' +
        '</div>' +
        '<div class="card final-card">' +
          '<h3 class="card-h">🗣️ If I were you…</h3>' +
          report.finalCall.map(function (l) { return '<p class="final-line">' + mdBold(l) + '</p>'; }).join("") +
        '</div>' +
        '<div class="flow-foot static">' +
          '<button class="btn btn-primary btn-lg" id="restart">Start over</button>' +
          '<button class="ghost center" id="editAns2">← Adjust my answers</button>' +
          '<div class="disclaimer">Prototype · Figures are illustrative estimates, not quotes. Always verify price, financing and insurance with the dealer.</div>' +
        '</div>' +
      '</div>';

    document.getElementById("restart").onclick = function () {
      route = "landing"; state.step = 0; render();
    };
    document.getElementById("editAns2").onclick = function () { route = "flow"; state.step = 0; render(); };
  }

  function recCard(kind, tagline, cls, r, a) {
    var c = r.car;
    var overBudget = a.budgetMax && r.pay > a.budgetMax;
    return '<div class="rec rec-' + cls + '">' +
      '<div class="rec-ribbon">' + kind + '</div>' +
      '<div class="rec-head">' +
        '<div><div class="rec-tagline">' + tagline + '</div>' +
          '<div class="rec-name">' + c.name + '</div>' +
          '<div class="rec-type">' + c.type + ' · ' + (c.trunkLiters ? c.trunkLiters + 'L · ' : '') + c.seats + ' seats</div>' +
        '</div>' +
        fitRing(r.score) +
      '</div>' +
      '<p class="rec-blurb">' + c.blurb + '</p>' +
      '<div class="rec-badges">' + c.badges.map(function (b) { return '<span class="badge">' + b + '</span>'; }).join("") + '</div>' +
      '<div class="rec-cost">' +
        costItem("Est. payment", money(r.pay) + "/mo", overBudget ? "over" : "ok") +
        costItem("True cost (TCO)", money(r.tco) + "/mo", "") +
        costItem("Price", money(c.priceMXN), "") +
      '</div>' +
      '<div class="pc">' +
        '<div class="pc-col"><div class="pc-h up">Pros</div><ul>' + r.pros.map(li).join("") + '</ul></div>' +
        '<div class="pc-col"><div class="pc-h down">Cons</div><ul>' + r.cons.map(li).join("") + '</ul></div>' +
      '</div>' +
      (r.dealBreakers.length ? '<div class="db-flag">⛔ Hits a deal-breaker: ' + r.dealBreakers.join(", ") + '</div>' : '') +
    '</div>';
  }

  // ---- Small UI helpers ---------------------------------------------------
  function miniHeader(label) {
    return '<header class="mini-head"><div class="logo small">d<span>OS</span></div><div class="mini-label">' + label + '</div></header>';
  }
  function fitRing(score) {
    var tone = score >= 75 ? "great" : score >= 55 ? "good" : "meh";
    var deg = Math.round(score * 3.6);
    return '<div class="fit-ring ' + tone + '" style="--deg:' + deg + 'deg">' +
      '<div class="fit-inner"><span class="fit-num">' + score + '</span><span class="fit-lbl">FIT</span></div></div>';
  }
  function costItem(label, val, tone) {
    return '<div class="cost-item ' + tone + '"><div class="cost-label">' + label + '</div><div class="cost-val">' + val + '</div></div>';
  }
  function li(t) { return '<li>' + t + '</li>'; }
  function riskBadge(level) {
    var map = { ok: ["ok", "Low"], watch: ["watch", "Watch"], high: ["high", "High"] };
    var m = map[level] || map.ok;
    return '<span class="rbadge ' + m[0] + '">' + m[1] + '</span>';
  }
  function profileEmoji(p) {
    return ({
      "Budget-conscious commuter": "🪙", "Young family optimizer": "👨‍👩‍👧",
      "Comfort-first urban driver": "🛋️", "Status-conscious buyer": "✨",
      "Practical long-term owner": "🧱", "Road trip family buyer": "🛣️",
      "Tech-forward driver": "⚡"
    })[p] || "🚗";
  }
  function prettyChip(p) {
    return "⭐ " + ({
      "safety": "Safety", "fuel-efficiency": "Fuel efficiency", "comfort": "Comfort",
      "design": "Design", "technology": "Technology", "status": "Status/brand",
      "resale-value": "Resale value", "low-maintenance": "Low maintenance"
    })[p];
  }
  function prettyDeal(d) {
    return ({
      "fuel": "High fuel use", "maintenance": "Costly upkeep", "resale": "Poor resale",
      "trunk": "Small trunk", "safety": "Weak safety", "basic-interior": "Basic interior", "waiting": "Long waits"
    })[d] || d;
  }
  function mdBold(s) { return s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); }
  function escapeAttr(s) { return String(s).replace(/"/g, "&quot;"); }

  render();
})();
