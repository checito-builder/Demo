# dOS — decision OS for smart car buying 🇲🇽

> **Find the car that actually fits your life.**

dOS is a **decision intelligence** prototype that helps people in Mexico choose
the best *new car for their real life* — not the best car on paper.

The core philosophy:

> The unit of analysis is not the vehicle. **The unit of analysis is the user.**

Instead of ranking cars by specs, dOS evaluates the **fit between a car and a
person** — lifestyle, family, real budget, daily usage, emotional priorities,
and trade-offs.

## What it does

Built around the **VIBE** framework:

- **Vision** — answer *"What is the best car for *me*?"*, not *"What is the best car overall?"*
- **Input** — a guided, one-question-per-screen flow (no open chatbot).
- **Behaviors** — classifies the user into a *lifestyle decision profile*, then
  generates a structured report with trade-offs, three recommendation
  categories (rational / balanced / emotional), hidden risks, and an
  opinionated *"If I were you…"* final call.
- **Experience** — a clean, mobile-friendly decision dashboard.

### The flow

1. **Landing** — concept + CTA.
2. **Guided questionnaire** — budget, down payment, car type, usage, family
   situation, priorities (ranked), emotional preference, financial sensitivity,
   deal-breakers, and optional details (current car, brands, mileage, etc.).
3. **Decision profile** — detected lifestyle profile + a one-sentence summary +
   honest **trade-off flags** when your answers contradict each other (e.g.
   *premium feel vs. tight budget*, *family use vs. sporty taste*).
4. **Recommendation report** — three cards (Rational / Balanced / Emotional),
   each with a **fit score**, pros/cons, estimated payment, true cost of
   ownership (TCO), and price; a **hidden-risks** section; and a final
   opinionated recommendation.

## Decision logic (mock)

- A weighted, profile-aware scoring engine matches each car in the mock catalog
  against the user's answers (priorities weighted by rank, emotional/financial
  signals, type match, family space, budget fit, brand preferences, and
  deal-breaker penalties).
- Costs (payment, fuel, insurance, maintenance, resale) are estimated at runtime
  for the user's down payment and mileage.
- **Recommendations are deliberately distinct:** *Rational* = best fit within
  budget with no deal-breakers; *Balanced* = best overall fit; *Emotional* =
  highest design/status/comfort appeal among reasonable fits.

> ⚠️ **Prototype.** The car catalog and all figures (prices, costs, resale,
> APR) are **illustrative placeholders** for the Mexico market — not quotes.

## Run it

No build step, no dependencies. Just open the file:

```bash
# from this directory
open index.html        # macOS
xdg-open index.html    # Linux
# or serve it
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | App shell |
| `styles.css` | Visual system (dark decision-dashboard theme) |
| `data.js` | Mock car catalog (Mexico market) |
| `engine.js` | Decision engine — profiling, scoring, costs, risks, final call |
| `app.js` | App shell, guided flow, and report rendering |

---

*Built as a first version of a scalable, independent, and replicable decision
intelligence product for smart car buying in Mexico.*
