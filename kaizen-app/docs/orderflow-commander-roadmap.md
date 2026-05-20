# OrderFlow Commander Roadmap

This roadmap turns the current `OrderFlow Commander` MVP into a real product plan. It is split into phases so we can move from a strong manual assistant to a durable, data-backed trading workspace without jumping too early into broker execution complexity.

## Product Goal

Build a professional futures execution assistant for `MNQ`, `MES`, and `GC` that helps the trader:

- structure context
- evaluate setup quality
- size risk consistently
- document execution
- review outcomes and mistakes

The product must remain educational and workflow-focused. It should not present itself as a signal service, a profit-guarantee engine, or a live auto-trading system.

## Current State

The repo currently includes:

- a dedicated `OrderFlow Commander` area inside the Kaizen app
- manual level management
- manual and CSV order-flow input
- setup scoring and trade-plan generation
- a basic risk engine
- a lightweight journal workflow
- starter Supabase schema and sample CSV assets

This is a good `manual MVP`, but it is still local-state driven and single-page in structure.

## Progress Snapshot

Recent progress against the backlog:

- `P0` is largely in place: local versioned persistence, extracted domain helpers, tested risk/setup logic, stronger CSV parsing, and reset/clear actions are already live.
- `P1` is mostly delivered: inline level editing, session presets, score breakdowns, nearest support and resistance mapping, order-flow sorting and filtering, plan copy, and journal detail review are in the app.
- `P2` is now underway in-product: journal-driven analytics cover setup performance, session performance, long vs short mix, mistake frequency, instrument heatmap, and rolling 10/30 trade summaries.
- `P3` has started but is not complete: Commander still lives inside the current CRA app, but analytics now uses a dedicated feature component plus a pure analytics domain module with tests.

## Roadmap Phases

### Phase 1: Stabilize The Manual MVP

Goal:
Make the current Commander surface dependable, persistent, and easier to use every day.

Scope:

- move Commander state into dedicated local persistence
- split the page into reusable modules
- strengthen setup-detection logic
- improve CSV parsing and validation
- add clearer error states and empty states
- improve trade-plan readability and journaling flow

Deliverables:

- saved levels, order-flow rows, plans, and journal entries
- cleaner component structure
- more reliable setup scoring
- better validation around bad inputs

Success criteria:

- user can close and reopen the app without losing Commander work
- manual workflow feels stable enough for repeated use
- no single giant page component bottlenecks future growth

### Phase 2: Commander Data Layer

Goal:
Introduce a real persistence model and prepare the product for multi-device use.

Scope:

- migrate Commander entities to Supabase
- add Supabase auth
- connect level manager, order-flow rows, trade plans, and journal entries to database storage
- add user scoping and row-level security
- support screenshot storage

Deliverables:

- working Supabase-backed Commander workspace
- authenticated user sessions
- durable journal and plan history

Success criteria:

- users can log in and access their own Commander workspace
- all Commander data survives refreshes, redeploys, and device changes

### Phase 3: Dedicated Commander App Structure

Goal:
Move from “Commander page in Kaizen” to “Commander product architecture.”

Scope:

- migrate Commander to Next.js
- create route-based areas for:
  - dashboard
  - levels
  - order-flow input
  - trade plans
  - journal
  - analytics
  - settings
- add shared layout and reusable Commander UI primitives

Deliverables:

- Next.js Commander app shell
- route-based product structure
- clearer feature ownership

Success criteria:

- Commander can evolve independently without fighting the current CRA structure
- feature work becomes faster because the app is no longer one large page

### Phase 4: Analytics and Review Depth

Goal:
Turn journaling into feedback and measurable improvement.

Scope:

- build analytics page with Recharts
- add performance breakdowns by:
  - instrument
  - direction
  - session
  - setup type
  - mistake tag
- calculate:
  - total trades
  - win rate
  - average R
  - profit factor
  - best and worst setup types
- add review summaries for recent sessions

Deliverables:

- analytics dashboard
- trade review summaries
- mistake frequency tracking

Success criteria:

- user can identify what setups, sessions, and habits are actually helping or hurting

### Phase 5: Smart Workflow Enhancements

Goal:
Make the manual assistant faster and sharper without pretending to automate edge.

Scope:

- better setup scoring explanations
- confidence and quality breakdown by category
- explainable “why valid” and “why skip” outputs
- session-aware warnings
- better news-risk workflow
- optional watchlist presets by instrument and session

Deliverables:

- more transparent setup engine
- better trader decision support
- less friction in pre-trade planning

Success criteria:

- user understands not just the score, but why the score exists
- the app reduces decision chaos instead of just adding more data

### Phase 6: External Integration Readiness

Goal:
Prepare for future integrations without building broker execution too early.

Scope:

- define adapter boundaries for:
  - NinjaTrader
  - Quantower
  - Sierra Chart
  - future broker and data-feed connectors
- define ingestion contracts for live order-flow feeds
- separate domain logic from UI logic

Deliverables:

- integration-ready architecture
- typed ingestion contracts
- adapter strategy docs

Success criteria:

- future live integrations can plug into a stable domain layer
- we do not need to rewrite scoring, plans, and journaling logic later

## Improvement Backlog

Below is the practical improvement list, grouped by priority.

### P0: Immediate Improvements

- persist Commander state locally with versioned storage keys
- extract Commander types and logic into dedicated files
- extract setup engine into pure functions with tests
- extract risk engine into pure functions with tests
- strengthen CSV parser to handle invalid headers, empty rows, and bad number values gracefully
- add reset and clear actions for imported data and journal drafts
- add active and inactive filtering for levels

### P1: High-Impact UX Improvements

- add inline editing for levels instead of form reload only
- add session presets for `London`, `New York AM`, `New York PM`, and `Asia`
- add score breakdown card showing category points
- add visual map of nearest support and resistance levels
- add better table sorting and filtering for order-flow rows
- add plan copy/export action
- add journal entry detail view

### P2: Analytics Improvements

- setup win-rate by setup type
- session performance by time block
- mistake-tag frequency chart
- long vs short breakdown
- instrument heatmap for `MNQ`, `MES`, and `GC`
- rolling 10-trade and 30-trade quality summaries

### P3: Product Architecture Improvements

- move Commander into Next.js app router structure
- replace local demo persistence with Supabase-backed repositories
- add feature folders for `levels`, `orderflow`, `plans`, `journal`, and `analytics`
- add test coverage for:
  - setup scoring
  - setup detection
  - risk sizing
  - CSV import mapping

### P4: Advanced Workflow Improvements

- configurable setup templates
- custom scoring weights
- session lockout after 2 losses
- manual news-event calendar entry
- screenshot upload and chart annotation
- saved playbooks by setup type

## Recommended Build Order

If we want the fastest path to a serious usable product, the recommended sequence is:

1. Persist Commander locally
2. Extract logic and types from the page
3. Add tests for scoring and risk
4. Improve CSV and validation UX
5. Add analytics from saved journal records
6. Move Commander to Supabase
7. Migrate Commander into a dedicated Next.js structure

## Risks To Avoid

- building broker execution too early
- mixing domain logic deeply into UI components
- creating opaque scores with no explanation
- letting the journal stay too shallow to be useful
- overcomplicating phase 1 before persistence and modularity are solved

## Definition Of A Strong Version 1

Version 1 should feel complete if it can do all of the following well:

- save and organize levels
- capture order-flow rows manually or by CSV
- produce a readable setup score with reasons
- size risk cleanly for MNQ, MES, and GC
- generate a trade plan with valid and skip reasons
- save reviewed outcomes in a meaningful journal
- show performance summaries by setup, session, and instrument

That is the right foundation before any live-feed or broker integration work.
