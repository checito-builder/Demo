/* dOS — decision engine
 *
 * Pure functions that turn structured user answers into:
 *   - a lifestyle decision profile
 *   - fit-scored car recommendations (rational / balanced / emotional)
 *   - trade-off flags, hidden risks, and an opinionated final call
 *
 * No data is sent anywhere. Everything runs in the browser.
 */
(function () {
  "use strict";

  var INTEREST_ANNUAL = 0.13; // ~13% illustrative APR, common in MX
  var TERM_MONTHS = 48;

  // ---- Finance helpers ----------------------------------------------------

  function estimateMonthlyPayment(priceMXN, downPayment) {
    var principal = Math.max(priceMXN - (downPayment || 0), 0);
    var r = INTEREST_ANNUAL / 12;
    var n = TERM_MONTHS;
    if (principal === 0) return 0;
    var payment = (principal * r) / (1 - Math.pow(1 + r, -n));
    return Math.round(payment);
  }

  function estimateAnnualFuelCost(car, annualKm) {
    var km = annualKm || 15000;
    if (car.type === "Electric / Hybrid" && car.fuelKmPerL >= 50) {
      // treat as EV: ~$0.9/km energy-equivalent placeholder
      return Math.round(km * 0.9);
    }
    var pricePerLiter = 24; // MXN/L placeholder
    var liters = km / car.fuelKmPerL;
    return Math.round(liters * pricePerLiter);
  }

  function estimateMonthlyTCO(car, a) {
    var finance = estimateMonthlyPayment(car.priceMXN, a.downPayment);
    var fuel = estimateAnnualFuelCost(car, a.annualKm) / 12;
    var insurance = car.insuranceMXNYear / 12;
    var maint = car.maintenanceMXNYear / 12;
    return Math.round(finance + fuel + insurance + maint);
  }

  // ---- Profile classification --------------------------------------------

  function classifyProfile(a) {
    var p = a.priorities || [];
    var has = function (arr, v) { return arr.indexOf(v) !== -1; };

    // Scored profiles — pick the highest.
    var s = {
      "Budget-conscious commuter": 0,
      "Young family optimizer": 0,
      "Comfort-first urban driver": 0,
      "Status-conscious buyer": 0,
      "Practical long-term owner": 0,
      "Road trip family buyer": 0,
      "Tech-forward driver": 0
    };

    if (a.financial === "lowest-payment" || a.emotion === "budget-conscious") s["Budget-conscious commuter"] += 3;
    if (has(p, "fuel-efficiency")) s["Budget-conscious commuter"] += 2;
    if (has(p, "low-maintenance")) s["Budget-conscious commuter"] += 1;
    if (a.usage === "city") s["Budget-conscious commuter"] += 1;

    if (a.family === "baby" || a.family === "kids") s["Young family optimizer"] += 3;
    if (a.usage === "family") s["Young family optimizer"] += 2;
    if (has(p, "safety")) s["Young family optimizer"] += 1;
    if (a.emotion === "family-first") s["Young family optimizer"] += 2;

    if (has(p, "comfort")) s["Comfort-first urban driver"] += 2;
    if (a.usage === "city") s["Comfort-first urban driver"] += 1;
    if (a.emotion === "premium") s["Comfort-first urban driver"] += 2;
    if (a.financial === "pay-more-comfort") s["Comfort-first urban driver"] += 1;

    if (has(p, "status")) s["Status-conscious buyer"] += 3;
    if (a.emotion === "aspirational") s["Status-conscious buyer"] += 2;
    if (has(p, "design")) s["Status-conscious buyer"] += 1;
    if (a.financial === "pay-more-comfort") s["Status-conscious buyer"] += 1;

    if (has(p, "resale-value")) s["Practical long-term owner"] += 2;
    if (a.financial === "total-cost") s["Practical long-term owner"] += 2;
    if (a.emotion === "practical") s["Practical long-term owner"] += 2;
    if ((a.ownershipYears || 0) >= 6) s["Practical long-term owner"] += 1;

    if (a.usage === "roadtrips") s["Road trip family buyer"] += 4;
    if (a.family === "kids" || a.family === "passengers") s["Road trip family buyer"] += 2;
    if ((a.annualKm || 0) >= 20000) s["Road trip family buyer"] += 2;

    if (has(p, "technology")) s["Tech-forward driver"] += 3;
    if (a.emotion === "sporty") s["Tech-forward driver"] += 1;
    if (a.carType === "ev") s["Tech-forward driver"] += 2;

    var best = "Practical long-term owner";
    var bestScore = -1;
    Object.keys(s).forEach(function (k) {
      if (s[k] > bestScore) { bestScore = s[k]; best = k; }
    });
    return best;
  }

  var PROFILE_COPY = {
    "Budget-conscious commuter": "You want maximum peace of mind per peso. The smart move is keeping monthly cost and running expenses low without buying a car that'll punish you at resale time.",
    "Young family optimizer": "Your life just changed gears. Space, safety, and predictable costs matter more than badge or styling right now — and you'll keep this car through messy years.",
    "Comfort-first urban driver": "You spend real time behind the wheel and want it to feel good. A calm, well-finished cabin beats raw specs for how you actually live with a car.",
    "Status-conscious buyer": "How the car makes you feel — and how it reads to others — genuinely matters to you. That's valid; the job is getting that feeling without overpaying in hidden costs.",
    "Practical long-term owner": "You buy to keep. Total cost of ownership, reliability, and resale are your real currency, not the sticker price or the launch hype.",
    "Road trip family buyer": "You cover distance with people and luggage on board. Range, comfort over hours, safety, and trunk space are non-negotiable for you.",
    "Tech-forward driver": "You want the car to feel modern — screens, assists, efficiency, maybe electric. You're comfortable being early, but resale and infrastructure are the watch-outs."
  };

  // ---- Fit scoring --------------------------------------------------------

  function priorityWeights(a) {
    // Base weight on everything, boosted by stated priorities/emotion.
    var w = { safety: 1, fuel: 1, comfort: 1, design: 1, tech: 1, status: 1, resale: 1, maintenance: 1 };
    var map = {
      "safety": "safety", "fuel-efficiency": "fuel", "comfort": "comfort",
      "design": "design", "technology": "tech", "status": "status",
      "resale-value": "resale", "low-maintenance": "maintenance"
    };
    (a.priorities || []).forEach(function (p, i) {
      var key = map[p];
      if (key) w[key] += (3 - i * 0.5); // earlier priorities weigh more
    });
    if (a.financial === "total-cost") { w.maintenance += 1.5; w.fuel += 1; w.resale += 1.5; }
    if (a.financial === "lowest-payment") { w.maintenance += 1; w.fuel += 1; }
    if (a.financial === "pay-more-comfort") { w.comfort += 1.5; w.status += 1; }
    if (a.emotion === "sporty") { w.design += 1; w.tech += 1; }
    if (a.emotion === "premium") { w.comfort += 1.5; w.status += 1; }
    if (a.emotion === "family-first") { w.safety += 1.5; w.comfort += 1; }
    return w;
  }

  function dealBreakerPenalty(car, a) {
    var pen = 0;
    var reasons = [];
    (a.dealBreakers || []).forEach(function (db) {
      if (db === "fuel" && car.scores.fuel <= 5) { pen += 25; reasons.push("high fuel consumption"); }
      if (db === "maintenance" && car.scores.maintenance <= 5) { pen += 25; reasons.push("expensive maintenance"); }
      if (db === "resale" && car.scores.resale <= 5) { pen += 25; reasons.push("weak resale value"); }
      if (db === "trunk" && car.trunkLiters > 0 && car.trunkLiters < 400) { pen += 20; reasons.push("small trunk"); }
      if (db === "safety" && car.scores.safety <= 6) { pen += 25; reasons.push("weak safety features"); }
      if (db === "basic-interior" && car.scores.comfort <= 5) { pen += 15; reasons.push("too-basic interior"); }
    });
    return { penalty: pen, reasons: reasons };
  }

  function fitScore(car, a, weights) {
    var totalW = 0, acc = 0;
    Object.keys(weights).forEach(function (k) {
      totalW += weights[k];
      acc += weights[k] * (car.scores[k] || 0);
    });
    var base = (acc / totalW) * 10; // 0..100

    // Profile affinity bonus.
    if ((car.fits || []).indexOf(a.profile) !== -1) base += 8;

    // Type match.
    var typeMap = { suv: "SUV", sedan: "Sedan", hatchback: "Hatchback", pickup: "Pickup", ev: "Electric / Hybrid" };
    if (a.carType && typeMap[a.carType]) {
      if (car.type === typeMap[a.carType]) base += 6;
      else base -= 4;
    }

    // Family space needs.
    if ((a.family === "kids" || a.family === "passengers") && car.seats >= 7) base += 4;
    if ((a.family === "kids") && car.trunkLiters > 0 && car.trunkLiters < 400) base -= 4;

    // Budget fit — penalize if estimated payment blows the stated range.
    var pay = estimateMonthlyPayment(car.priceMXN, a.downPayment);
    if (a.budgetMax && pay > a.budgetMax * 1.15) base -= 18;
    else if (a.budgetMax && pay > a.budgetMax) base -= 8;
    else if (a.budgetMax && pay <= a.budgetMax * 0.7) base += 3; // comfortably affordable

    // Brand preferences (optional).
    var brand = car.name.split(" ")[0].toLowerCase();
    if ((a.avoidBrands || []).some(function (b) { return brand.indexOf(b.toLowerCase()) === 0 || b.toLowerCase().indexOf(brand) === 0; })) base -= 30;
    if ((a.preferredBrands || []).some(function (b) { return brand.indexOf(b.toLowerCase()) === 0 || b.toLowerCase().indexOf(brand) === 0; })) base += 6;

    var db = dealBreakerPenalty(car, a);
    base -= db.penalty;

    return { score: Math.max(0, Math.min(100, Math.round(base))), dealBreakers: db.reasons, pay: pay };
  }

  // ---- Pros / cons --------------------------------------------------------

  function prosCons(car, a) {
    var pros = [], cons = [];
    var sc = car.scores;
    if (sc.safety >= 8) pros.push("Strong safety credentials");
    if (sc.fuel >= 8) pros.push("Excellent fuel economy");
    if (sc.comfort >= 8) pros.push("Comfortable, refined cabin");
    if (sc.resale >= 8) pros.push("Holds value exceptionally well");
    if (sc.maintenance >= 8) pros.push("Cheap and easy to maintain");
    if (sc.tech >= 8) pros.push("Lots of tech for the money");
    if (sc.design >= 8) pros.push("Standout design");
    if (car.seats >= 7) pros.push("Up to 7 seats");
    if (car.trunkLiters >= 500) pros.push("Big, family-friendly trunk");

    if (sc.fuel <= 5) cons.push("Thirsty at the pump");
    if (sc.maintenance <= 5) cons.push("Pricier to service");
    if (sc.resale <= 5) cons.push("Weaker resale value");
    if (sc.comfort <= 5) cons.push("Basic interior feel");
    if (sc.safety <= 6) cons.push("Safety only average");
    if (car.trunkLiters > 0 && car.trunkLiters < 350) cons.push("Modest trunk space");
    if (estimateMonthlyPayment(car.priceMXN, a.downPayment) > (a.budgetMax || Infinity)) cons.push("Above your stated monthly budget");
    if (pros.length === 0) pros.push("Sensible all-rounder with no glaring weakness");
    if (cons.length === 0) cons.push("Nothing disqualifying — just not class-leading anywhere");
    return { pros: pros.slice(0, 4), cons: cons.slice(0, 4) };
  }

  // ---- Trade-offs / contradiction flags ----------------------------------

  function tradeOffs(a) {
    var flags = [];
    var p = a.priorities || [];
    var has = function (v) { return p.indexOf(v) !== -1; };

    if ((a.emotion === "premium" || has("status")) && (a.financial === "lowest-payment" || a.emotion === "budget-conscious")) {
      flags.push({
        title: "Premium feel vs. tight budget",
        body: "You want a car that feels upmarket but you're anchored to the lowest possible payment. Something has to give: either stretch the budget a little for genuine cabin quality, or accept a 'value' car and stop chasing the premium feel."
      });
    }
    if ((a.usage === "family" || a.family === "kids" || a.family === "baby") && (a.emotion === "sporty" || (has("design") && !has("safety")))) {
      flags.push({
        title: "Family use vs. sporty/design-first taste",
        body: "Your daily reality is family duty, but your heart is leaning sporty/design-first. Two-door looks and small trunks fight car seats and strollers. Let design break ties — don't let it pick the car."
      });
    }
    if (a.financial === "lowest-payment") {
      flags.push({
        title: "Monthly payment vs. total cost",
        body: "Optimizing only the monthly payment is the classic trap. A cheaper sticker with thirsty fuel, costly service, and weak resale often costs more over 4 years than a 'pricier' car that's cheap to run and holds value."
      });
    }
    if (has("status") && has("low-maintenance")) {
      flags.push({
        title: "Status vs. low maintenance",
        body: "Badge appeal and low upkeep rarely live in the same car. Premium brands cost more to service. If low running cost truly matters, pick a reliable mainstream brand and get your status elsewhere."
      });
    }
    if ((a.family === "kids" || a.family === "passengers") && a.carType === "hatchback") {
      flags.push({
        title: "Frequent passengers vs. a hatchback",
        body: "You carry people and gear, but you're aimed at a small hatchback. Fine occasionally — frustrating daily. Seriously weigh a compact SUV or sedan with a real trunk."
      });
    }
    return flags;
  }

  // ---- Hidden risks -------------------------------------------------------

  function hiddenRisks(rec, a) {
    var car = rec.balanced.car;
    var tco = estimateMonthlyTCO(car, a);
    var pay = estimateMonthlyPayment(car.priceMXN, a.downPayment);
    var risks = [];

    risks.push({
      label: "Payment vs. real affordability",
      level: a.budgetMax && pay > a.budgetMax ? "high" : (a.budgetMax && pay > a.budgetMax * 0.85 ? "watch" : "ok"),
      body: "Estimated finance payment ≈ " + money(pay) + "/mo on a " + TERM_MONTHS + "-month plan. Keep total car cost under ~15% of take-home income."
    });
    risks.push({
      label: "True monthly cost (TCO)",
      level: a.budgetMax && tco > a.budgetMax * 1.4 ? "high" : "watch",
      body: "Payment + fuel + insurance + maintenance ≈ " + money(tco) + "/mo. This — not the payment — is what actually leaves your account."
    });
    risks.push({
      label: "Insurance",
      level: car.insuranceMXNYear >= 19000 ? "watch" : "ok",
      body: "≈ " + money(car.insuranceMXNYear) + "/yr for this class. Get a real quote before committing — it varies a lot by age and zip code."
    });
    risks.push({
      label: "Fuel",
      level: car.scores.fuel <= 5 ? "high" : (car.scores.fuel <= 7 ? "watch" : "ok"),
      body: "≈ " + money(estimateAnnualFuelCost(car, a.annualKm)) + "/yr at your mileage. " + (car.scores.fuel <= 5 ? "This one drinks — feel it every week." : "Reasonable for the segment.")
    });
    risks.push({
      label: "Resale value",
      level: car.scores.resale <= 5 ? "high" : (car.scores.resale <= 7 ? "watch" : "ok"),
      body: "Est. " + Math.round(car.resaleRetention3y * 100) + "% value kept after 3 years. " + (car.scores.resale <= 5 ? "Depreciation will sting at trade-in." : "Solid for resale.")
    });
    risks.push({
      label: "Family practicality",
      level: (a.family === "kids" || a.family === "passengers") && car.trunkLiters > 0 && car.trunkLiters < 400 ? "watch" : "ok",
      body: car.seats + " seats, " + (car.trunkLiters ? car.trunkLiters + "L trunk" : "open bed") + ". " + ((a.family === "kids" || a.family === "passengers") ? "Check car-seat and stroller fit in person." : "Adequate for your situation.")
    });
    risks.push({
      label: "Overbuying risk",
      level: a.budgetMax && rec.emotional.pay > a.budgetMax * 1.1 ? "watch" : "ok",
      body: a.budgetMax && rec.emotional.pay > a.budgetMax * 1.1
        ? "The emotional pick stretches you beyond plan. Make sure you're buying capability you'll use, not just a feeling."
        : "Your shortlist is well-matched to your needs — low risk of paying for capability you won't use."
    });
    return risks;
  }

  // ---- Final opinionated call --------------------------------------------

  function finalCall(rec, a) {
    var r = rec.rational.car, b = rec.balanced.car;
    var lines = [];
    lines.push("If I were you, I'd start from the **" + b.name + "** as the balanced pick — it lines up best with your profile without overreaching.");

    if (a.financial === "lowest-payment" || a.emotion === "budget-conscious") {
      lines.push("Given how much the monthly cost matters to you, seriously look at the rational choice, the **" + r.name + "**. The few extra features on pricier options won't feel as good as a payment that never stresses you.");
    } else if (a.financial === "total-cost") {
      lines.push("Since you care about the full picture, the **" + r.name + "** wins on the math — lower running cost and stronger resale usually beat a nicer launch-day cabin.");
    } else if (a.financial === "pay-more-comfort" || a.emotion === "premium" || (a.priorities || []).indexOf("status") !== -1) {
      lines.push("You'll be tempted by the emotional pick, the **" + rec.emotional.car.name + "**. It's allowed — just go in clear-eyed about the higher insurance and service, and only if the payment still sits comfortably inside your budget.");
    } else {
      lines.push("The **" + r.name + "** is the safe-money call and the emotional pick is the heart call; the balanced one is where most people in your situation are happiest a year in.");
    }

    var flags = tradeOffs(a);
    if (flags.length) {
      lines.push("One honest warning: " + flags[0].body.split(". ")[0].toLowerCase() + ". Don't ignore that.");
    }
    lines.push("Whatever you pick, get a real insurance quote and a test drive with your actual family/cargo before you sign. The spec sheet is not the experience.");
    return lines;
  }

  // ---- Orchestration ------------------------------------------------------

  function generateReport(answers) {
    var a = Object.assign({}, answers);
    a.profile = classifyProfile(a);
    var weights = priorityWeights(a);

    var ranked = window.DOS_CARS.map(function (car) {
      var f = fitScore(car, a, weights);
      var pc = prosCons(car, a);
      return {
        car: car,
        score: f.score,
        pay: f.pay,
        tco: estimateMonthlyTCO(car, a),
        dealBreakers: f.dealBreakers,
        pros: pc.pros,
        cons: pc.cons,
        emotionAppeal: car.scores.design + car.scores.status + car.scores.comfort + car.scores.tech
      };
    }).sort(function (x, y) { return y.score - x.score; });

    // Rational: best fit that is within (or closest to) budget, no deal-breakers.
    var withinBudget = ranked.filter(function (r) {
      return r.dealBreakers.length === 0 && (!a.budgetMax || r.pay <= a.budgetMax);
    });
    var rational = (withinBudget[0]) || ranked.filter(function (r) { return r.dealBreakers.length === 0; })[0] || ranked[0];

    // Balanced: top overall fit (may slightly exceed budget) that isn't the rational one.
    var balanced = ranked.filter(function (r) { return r.car.id !== rational.car.id; })[0] || rational;

    // Emotional: highest emotional appeal among reasonable-fit cars, distinct from the others.
    var emotionalPool = ranked.filter(function (r) {
      return r.car.id !== rational.car.id && r.car.id !== balanced.car.id && r.score >= 45;
    }).sort(function (x, y) { return y.emotionAppeal - x.emotionAppeal; });
    var emotional = emotionalPool[0] || ranked.filter(function (r) {
      return r.car.id !== rational.car.id && r.car.id !== balanced.car.id;
    })[0] || balanced;

    var rec = { rational: rational, balanced: balanced, emotional: emotional };

    return {
      profile: a.profile,
      profileCopy: PROFILE_COPY[a.profile],
      summary: buildSummary(a),
      tradeOffs: tradeOffs(a),
      recommendations: rec,
      hiddenRisks: hiddenRisks(rec, a),
      finalCall: finalCall(rec, a),
      answers: a
    };
  }

  function buildSummary(a) {
    var typeLabel = { suv: "an SUV", sedan: "a sedan", hatchback: "a hatchback", pickup: "a pickup", ev: "an electric/hybrid", unsure: "the right body style" }[a.carType] || "a new car";
    var usageLabel = { city: "daily city driving", family: "family duty", roadtrips: "road trips", work: "work and business", mixed: "mixed use" }[a.usage] || "everyday use";
    var famLabel = { single: "as a single driver", couple: "as a couple", baby: "with a baby/toddler on board", kids: "with kids in the car", passengers: "carrying passengers often" }[a.family] || "";
    var topP = (a.priorities || []).slice(0, 3).map(prettyPriority).join(", ");
    var budget = a.budgetMax ? "around " + money(a.budgetMin) + "–" + money(a.budgetMax) + "/mo" : "an undefined monthly budget";
    return "You're shopping for " + typeLabel + " mainly for " + usageLabel + " " + famLabel + ", on " + budget +
      (a.downPayment ? " with " + money(a.downPayment) + " down" : "") +
      ". Your top priorities are " + (topP || "still being defined") + ".";
  }

  // ---- Formatting ---------------------------------------------------------

  function money(n) {
    return "$" + Math.round(n).toLocaleString("en-US") + " MXN";
  }
  function prettyPriority(p) {
    return ({
      "safety": "safety", "fuel-efficiency": "fuel efficiency", "comfort": "comfort",
      "design": "design", "technology": "technology", "status": "status/brand",
      "resale-value": "resale value", "low-maintenance": "low maintenance"
    })[p] || p;
  }

  window.DOS_ENGINE = {
    generateReport: generateReport,
    money: money,
    estimateMonthlyPayment: estimateMonthlyPayment
  };
})();
