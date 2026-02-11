# VC Investment Committee Analyzer

Analyzes startup pitch decks through the lens of 20 renowned VCs and tech thinkers via a simulated 4-stage Investment Committee process.

## Attribution

Created by **Ian Park**. Original prompt: [https://ianparkvc.github.io/aivc/prompt.html](https://ianparkvc.github.io/aivc/prompt.html)

## What it does

When given a pitch deck or startup description, this skill runs a 4-stage analysis pipeline:

1. **Deal Memo Extraction** - Structures the pitch into a standardized VC deal memo format and selects a 3-person debate panel
2. **10-Person VC Evaluation** - 10 distinct VC personas independently evaluate the opportunity
3. **Investment Committee Debate** - 3 selected VCs (Bull / Bear / Wild Card) engage in a 5-round structured debate
4. **Final Report** - Key insights, founder questions, action plans, and executive summary

## The 20 VC Personas

15 VC Gurus (evaluation + debate eligible) and 5 Bright Minds (evaluation only):

Peter Thiel, Marc Andreessen, Bill Gurley, Elad Gil, Fred Wilson, Arjun Sethi, Reid Hoffman, Sam Altman, Garry Tan, Vinod Khosla, Michael Moritz, Kirsten Green, Steve Jurvetson, Arthur Rock, Don Valentine, Paul Graham, Clayton Christensen, Elon Musk, Thales Teixeira, Naval Ravikant

## Installation

```bash
cp -r skills/vc-investment-committee ~/.claude/skills/
node build.mjs vc-investment-committee
```

## When this skill works best

- Pitch deck is reasonably complete with market, traction, team, and business model info
- Startup is in tech/software domain where these VCs have expertise
- User wants comprehensive analysis over quick feedback
- Decision involves significant capital allocation or strategic direction

## When to supplement with other approaches

- Non-tech industries (consumer goods, retail, services) - add domain experts
- Very early stage (pre-product) - focus on founder assessment and market validation
- Post-Series B growth stage - add growth equity and operational expertise
- Hardware/deep tech - emphasize technical feasibility and capital intensity analysis
