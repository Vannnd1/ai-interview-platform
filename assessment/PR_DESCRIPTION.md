# feat: Monozukuri revamp — fix data seam, unassessed skills, tenant isolation & dual DB migrations

## 📌 Executive Summary
This Pull Request delivers a comprehensive, production-grade hardening and architectural revamp of the AI Interview Platform following high-craftsmanship standards (**Monozukuri**). It addresses critical data seam mismatches, restores fairness under Indonesian Personal Data Protection regulations (UU PDP No. 27/2022), enforces multi-tenant boundary security, and introduces robust automated test harnesses across both backend (Rails) and frontend (React).

---

## 🔍 Problems Identified & Resolved (Severity-Ranked)

| Gap ID | Severity | Problem & Root Cause | Shipped Solution | Impact |
|---|---|---|---|---|
| **GAP-01** | **P0** | **Fit/Gap Data Seam Disconnect**: Backend `FitGap::Engine` emitted `expected_level`, while frontend `ComparisonTable.tsx` read `required_level`. Assessor manual overrides lacked `is_override` flag. | Reconciled API response contract to provide both aliases and explicit `is_override` flag. | Solved empty vacancy standard column; ensures human assessor calibration is immediately visible. |
| **GAP-02** | **P0** | **Unassessed Candidates Wrongly Failed**: Generator forced `.clamp(1, 5)`. Skills untried during interviews (`probe_count == 0`) were saved as Level 1 (fail). | Replaced clamp with explicit `NULL` for unassessed skills; classified as `not_assessed` with badge "Belum Dinilai". | Prevents false candidate rejections; enforces fair automated evaluation under UU PDP. |
| **GAP-03** | **P0** | **Multi-Tenant Authorization Leak**: `PortfolioSkillsController#override` and `PortfoliosController#fitgap` queried records directly without scoping to `Current.tenant_id`. | Strictly scoped all queries to tenant context; returns HTTP 404 for cross-tenant access. | Guarantees complete data segregation across enterprise clients. |
| **GAP-04** | **P1** | **Gemini JSON Parsing Fragility**: AI responses enclosed in markdown code blocks (` ```json `) caused `JSON::ParserError` crashes in background workers. | Added resilient JSON extractor and markdown stripping in `Gemini::HttpClient`. | Immune to varying LLM response formats; prevents stalled background jobs. |
| **GAP-05** | **P1** | **Candidate Invite URL Misdirection**: `Session#invite_url` pointed to Rails API port 3001 instead of React web port 5173. | Updated URL generator to reference `FRONTEND_BASE_URL` (`localhost:5173`). | Candidate invite links open the interview client directly without 404 errors. |
| **GAP-06** | **P2** | **Raw PII & Transcript Logging**: `LiveClient#log_gemini_event` logged raw conversation transcripts to server stdout. | Redacted raw candidate conversation text from public stdout logs. | Eliminates exposure of sensitive candidate voice transcripts (UU PDP compliance). |

---

## 🛠️ Key Architectural Changes

### 1. Dual Reversible Database Migrations (Zero Data Loss)
* **Migration 1 (`20260909000001`)**: Altered `portfolio_skills` check constraint to `CHECK (ai_level IS NULL OR (ai_level BETWEEN 1 AND 5))`.
* **Migration 2 (`20260909000002`)**: Altered `assessor_overrides` check constraint and removed `NOT NULL` on `ai_level` to allow assessors to override skills that were previously unassessed without triggering `PG::NotNullViolation`.
* Both migrations feature explicit, reversible `down` blocks.

### 2. Frontend Polish & UX Enhancements
* **Fit/Gap Matrix**: Clear visual states for `[Sesuai]`, `[Melampaui]`, `[Kesenjangan]`, and `[Belum Dinilai]` with summary totals.
* **Human Calibration Indicator**: Distinct `[Override]` badge when an assessor manually updates a skill score.
* **Collapsible Transcript Quotes**: Expandable/collapsible drawer on `SkillPortfolioCard` to inspect evidence without layout clutter.

---

## 🧪 Automated Testing & Verification

### Test Harness Results
* **Frontend Component Tests (Vitest)**:
  * `src/components/fitgap/__tests__/ComparisonTable.test.tsx` (4 passing)
  * `src/components/portfolio/__tests__/SkillPortfolioCard.test.tsx` (3 passing)
  * **Total: 2 test files, 7 tests — 100% Green**
* **Backend Unit & Integration Tests (RSpec)**:
  * `spec/services/portfolios/generator_spec.rb` (Unassessed NULL handling, markdown JSON extraction)
  * `spec/services/fit_gap/engine_spec.rb` (Rule-based comparison, alias handling, fallback synthesis)
  * `spec/requests/tenant_isolation_spec.rb` (Cross-tenant override & fitgap HTTP 404 isolation)
  * `spec/models/session_spec.rb` (Frontend invite URL verification)
  * **Total: 4 test files, 9 scenarios — 100% Green**
* **Production Build**: `tsc && vite build` succeeded with 0 errors (1842 modules transformed).

### Seeded Fault Test Proof
* Injected intentional regression in `ComparisonTable.tsx` reverting `expected_level` fallback.
* Vitest suite immediately caught the regression with `AssertionError: expected element with text "L3" to be in the document`.
* Reverted to stable code; test suite returned to 100% green.

### AI Verification Moments
1. **AI Misguidance on Schema Check**: AI suggested setting default `ai_level = 0` for unassessed skills. Rejected because PostgreSQL `CHECK (ai_level BETWEEN 1 AND 5)` would trigger `PG::CheckViolation`. Solved safely with `NULL` support and DB migration.
2. **Cascading Bug Discovery**: Discovered `assessor_overrides.ai_level NOT NULL` constraint during code review that would crash on overriding unassessed skills. Solved via second reversible migration `20260909000002`.

---

## ⚖️ Non-Negotiable Disqualifiers Check
- [x] No test assertions weakened or removed.
- [x] No credentials, secrets, or real PII committed.
- [x] Full code comprehension and live technical defense readiness.
- [x] Handled failure paths, partial writes, timeouts, and edge cases (not just happy paths).
- [x] High visual and UI/UX design standards applied.
