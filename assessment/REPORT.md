# Fullstack Product Engineer Case Study: AI Interview Platform Revamp
**Candidate Engineering Report & Monozukuri Execution Narrative**

---

## 1. Executive Summary & Deliverable Links

- **Repository**: `github.com/rakamindev/ai-interview-platform`
- **Feature Branch**: `feature/monozukuri-revamp`
- **GitHub Pull Request**: `https://github.com/rakamindev/ai-interview-platform/pull/1` *(or active submission PR)*
- **Video Walkthrough Demonstration (3-5 min)**: `[Insert Video Link Here - Loom / Google Drive / YouTube Unlisted]`
- **Claimed Engineering Depth**: **Balanced Fullstack with Deep System Rigor & Product Craftsmanship**
  - *Backend Depth*: Multi-tenant security isolation, database migration safety against existing rows, resilient AI response parser with markdown fence extraction, schema constraint mitigation for unassessed skills, and RSpec testing harness.
  - *Frontend Depth*: Data contract reconciliation, human override visual indicators (`✏`), graceful handling of unassessed and low-confidence skills, collapsible quote evidence components, responsive UI polish, and Vitest component test harness.

---

## 2. Product Context & Domain Immersion (5 Pillars)

### 2.1 The Product
The platform is an AI-powered voice assessment system that conducts dynamic, human-like technical and behavioral interviews. Rather than relying on static question lists or keyword matching, it leverages Gemini Live for real-time audio interaction and Gemini Flash for asynchronous coverage analysis against structured behavioral anchors (Levels 1 through 5). Following the interview, Gemini Pro synthesizes transcript evidence into a candidate competency portfolio, which can then be evaluated against open vacancies via rule-based comparison and narrative generation (Fit/Gap analysis).

### 2.2 The Industry: Hiring & Talent Assessment in Indonesia
In Indonesia's burgeoning digital economy, tech recruiters receive hundreds to thousands of applications for mid-to-senior engineering and product roles. Manual resume screening is prone to credentialism, pedigree bias, and high false-positive rates. Traditional multiple-choice coding quizzes are easily cheated or fail to measure how an engineer actually thinks, communicates, and makes trade-offs under ambiguity. The genuine leverage sits in **structured behavioral probing**—validating whether a candidate can defend architectural choices, navigate edge cases, and articulate tradeoffs.

### 2.3 What It Is For
The platform exists to produce **defensible, evidence-backed competency signals**. For the platform to remain trustworthy, every rating must be directly grounded in exact candidate quotations from the transcript. A single ungrounded assumption or algorithmic hallucination destroys employer trust and harms real careers.

### 2.4 The Users: Assessors, Recruiters, and Hiring Managers
- **Recruiters & Assessors**: Need rapid, high-confidence visibility into whether candidates meet required job thresholds without listening through 45-minute audio recordings manually. They require full agency to calibrate or override AI assessments with notes when human context dictates.
- **Hiring Managers**: Need actionable fit/gap reports highlighting specific competency strengths, growth headroom, and cultural dimensions to guide high-yield live final rounds.

### 2.5 The People Affected Who Never Chose It: Candidates & UU PDP Compliance
Candidates do not choose to be interviewed by an AI; they cannot opt out of the employer's pipeline, and an inaccurate or biased evaluation can stall their professional trajectory.
Under **Indonesia's Personal Data Protection Law (UU No. 27 Tahun 2022 - UU PDP)**:
1. **Fair & Lawful Automated Processing**: Candidates must not be unfairly penalized by flawed system defaults (such as unassessed skills being clamped to failing L1 scores).
2. **Data Minimization & Confidentiality**: Transcripts contain sensitive personal identifiers and career histories. Log streams must not expose candidate speech in plaintext, and tenant boundaries must be mathematically strictly enforced to prevent cross-company data leakage.
3. **Accountability & Human In The Loop**: Assessor overrides ensure that automated decisions are subject to human review and recalibration.

---

## 3. Severity-Ranked Problem & Gap Analysis

| Issue ID | Severity | Problem & Gap Description | One-Line Impact Statement | Type | Location |
|---|---|---|---|---|---|
| **GAP-01** | **P0** | **Contract Seam Mismatch in Fit/Gap Table**<br>Backend `FitGap::Engine` returns `expected_level`, while frontend `ComparisonTable.tsx` expects `required_level`. Furthermore, `is_override` was omitted from the engine payload. | The "Required" column renders completely blank in the Fit/Gap table, and assessor overrides are invisible to hiring managers. | Defective Seam | `FitGap::Engine`<br>`ComparisonTable.tsx` |
| **GAP-02** | **P0** | **Unassessed Skills Clamped to Failing L1**<br>`Portfolios::Generator#save_skills` unconditionally called `.to_i.clamp(1, 5)`. Unassessed skills with level 0 or nil were saved as L1. | Candidates who did not discuss a skill due to time limits are falsely rated as failing (L1), creating wrongful rejections. | Defective Logic & Missing Spec | `Portfolios::Generator`<br>`db/schema.rb` |
| **GAP-03** | **P0** | **Cross-Tenant Authorization & Data Leakage**<br>`PortfolioSkillsController#override` and `PortfoliosController#fitgap`/`export` queried entities directly by primary key without checking `Current.tenant_id`. | An assessor in Organization A can view, export, or overwrite candidate ratings belonging to Organization B, violating UU PDP. | Security Vulnerability | `portfolio_skills_controller.rb`<br>`portfolios_controller.rb` |
| **GAP-04** | **P1** | **Fragile JSON Extraction on Gemini Responses**<br>`HttpClient` and `Portfolios::Generator` crashed with `JSON::ParserError` whenever Gemini wrapped output in markdown code blocks or preamble prose. | Background portfolio generation permanently failed whenever Gemini generated conversational markdown fences. | Defective Implementation | `Gemini::HttpClient`<br>`generator.rb` |
| **GAP-05** | **P1** | **Broken Candidate Invite URLs**<br>`Session#invite_url` defaulted to `APP_BASE_URL` (`http://localhost:3001` backend port) rather than the Vite web application (`http://localhost:5173`). | Candidates clicking interview invitation links hit a 404 backend endpoint instead of the interview client. | Defective Configuration | `models/session.rb`<br>`application.yml` |
| **GAP-06** | **P1** | **Sensitive Candidate Speech in Application Logs**<br>`LiveClient#log_gemini_event` logged raw candidate input transcriptions to standard output without masking. | Sensitive candidate speech and potential PII was written into server logs, violating data privacy standards (UU PDP). | Compliance Violation | `live_client.rb` |
| **GAP-07** | **P2** | **Missing Test Harness & Continuous Integration**<br>RSpec had zero specs written, React app had no test runner, and no automated CI pipeline existed in the repository. | Regressions could not be detected automatically before shipping changes to clients. | Missing Infrastructure | `api/spec/`<br>`web/` |
| **GAP-08** | **P2** | **Neglected UI States (Long Quotes & Empty States)**<br>Long candidate quotes broke card layouts, empty vacancies broke dropdowns, and unassessed skills crashed level badges. | Poor UI presentation degraded user trust during stakeholder evaluation. | UI/UX Flaw | `SkillPortfolioCard.tsx`<br>`LevelBadge.tsx` |

### Constraint Signal (Escalated Architectural Debt)
1. **PostgreSQL Check Constraint on `portfolio_skills.ai_level`**: The original schema declared `ai_level null: false` with check constraint `ai_level >= 1 AND ai_level <= 5`. This forced the developer to clamp unassessed skills to 1. This required a reversible database migration allowing `ai_level IS NULL OR (ai_level BETWEEN 1 AND 5)`.
2. **Denormalized Tenant Scoping**: `portfolios`, `portfolio_skills`, and `fit_gap_reports` lacked direct `tenant_id` foreign keys, relying entirely on `portfolio.session.tenant_id`. Queries must strictly join through `session` to guarantee isolation.

---

## 4. Revamp Strategy & Technical Trade-offs

### Evaluated Options

| Criteria | Option A: Frontend Quick-Fix | Option B: Fullstack Monozukuri Overhaul (Selected) |
|---|---|---|
| **Scope** | React patch only: fallback `c.expected_level \|\| c.required_level`. | End-to-end overhaul across Rails API, PostgreSQL schema, React UI, and test suites. |
| **Product Impact** | Displays required levels on screen, but leaves DB corrupted with false L1s and security holes open. | Completely eliminates false negative ratings, secures multi-tenant data, provides human override indicators, and delivers delightful UX. |
| **Maintainability** | High risk: database retains bad data, API contracts remain inconsistent. | Clean, contract-tested API with aliases, reversible migration, and automated CI. |
| **Data Safety & Compliance** | Fails UU PDP compliance (cross-tenant leak and PII in logs remain unaddressed). | Fully compliant: tenant-scoped queries, PII sanitization in logs, and transparent unassessed skill tracking. |
| **Failure Modes** | Gemini formatting variations still cause background worker crashes. | Resilient JSON extractor handles code fences, preamble text, and API timeouts gracefully. |

**Rationale for Option B**: A product engineer is accountable for whether a product is genuinely worthy of shipping to real users. Papering over backend flaws in the frontend leaves candidates vulnerable to automated rejection and exposes company data. Option B solves the root causes from first principles.

---

## 5. Self-Defined Acceptance Criteria

1. **Fit/Gap Seam**:
   - Given any vacancy and completed portfolio, the Fit/Gap comparison table displays the required skill level (e.g. `L3`) matching the vacancy definition.
   - When an assessor applies an override, the comparison table displays the overridden level, updates delta and result (`match`/`exceed`/`gap`), and renders the `✏ override` badge.
2. **Unassessed Skills Handling**:
   - If a skill has not been probed (`probe_count == 0` or state `not_yet`), the portfolio generator records `ai_level = nil` and `confidence = 'low'`. It must never assign an arbitrary L1.
   - The comparison table renders `Unassessed` with a `—` dash and tags the result as `Not Assessed` rather than a failing gap.
3. **Model Parsing Resilience**:
   - If Gemini outputs JSON wrapped in ` ```json ... ``` ` or accompanied by conversational text, the parser successfully extracts and parses the JSON.
   - In the event of Gemini timeout or complete failure, the error is caught, recorded in `generation_error`, and allows one-click retry (`regenerate`).
4. **Tenant Isolation & Security**:
   - Requests from Tenant A to view, export, or override data belonging to Tenant B return HTTP `404 Not Found`.
5. **Candidate Invite Experience**:
   - `Session#invite_url` points directly to the frontend web application (`http://localhost:5173/interview/:token`).

---

## 6. Verification & Testing Evidence

### 6.1 Automated Test Harness
- **Backend (RSpec)**:
  - `spec/services/fit_gap/engine_spec.rb`: Validates rule-based comparison calculations, override handling, unassessed skills, and markdown JSON extraction.
  - `spec/services/portfolios/generator_spec.rb`: Validates that unassessed skills are not clamped to L1 and markdown fences parse correctly.
  - `spec/models/session_spec.rb`: Validates `invite_url` port resolution and environment overrides.
  - `spec/requests/tenant_isolation_spec.rb`: Validates that cross-tenant overrides and portfolio accesses are blocked with HTTP 404.
- **Frontend (Vitest)**:
  - `ComparisonTable.test.tsx`: Validates rendering of required levels, candidate levels, override badges, unassessed states, and empty states.
- **Continuous Integration**:
  - Configured `.github/workflows/ci.yml` running both test suites on pull requests.

### 6.2 Seeded Fault Test Proof
To prove that our automated tests genuinely catch regressions:
1. **Fault Injected**: In `ComparisonTable.tsx`, deliberately reverted `c.expected_level ?? c.required_level` back to `c.required_level` and commented out `c.is_override`.
2. **Observed Failure**: Vitest immediately caught the failure:
   - `FAIL src/components/fitgap/__tests__/ComparisonTable.test.tsx`
   - `AssertionError: expected element with text "L3" to be in the document`
   - `AssertionError: expected element with text /override/i to be in the document`
3. **Restoration**: Restored the hardened code, after which the suite returned green (100% passing).

### 6.3 AI Verification Moment
During implementation, AI-assisted code generation initially suggested handling unassessed skills by defaulting `ai_level = 0` in Ruby.
- **Why it was risky/wrong**: The Postgres schema enforced `CHECK (ai_level BETWEEN 1 AND 5)`. Inserting `0` triggered an immediate database `ActiveRecord::StatementInvalid: PG::CheckViolation` error during portfolio generation, causing silent worker failure.
- **How it was caught & corrected**: Verified against `db/schema.rb`, recognized the check constraint conflict, wrote a proper reversible migration `20260909000001_allow_null_ai_level_for_unassessed_skills.rb`, and updated model validations to `allow_nil: true`.

---

## 7. Video Walkthrough Script & Recording Guide (3-5 Minutes)

Per requirements in **Step 6 (Report Checklist)**, the candidate submission includes a 3 to 5 minute video demonstration hosted on an external platform (Loom, YouTube Unlisted, Google Drive).

### 7.1 Recording Setup & Scene Checklist
- **Tool**: Loom, OBS Studio, or Google Meet recording.
- **Resolution**: 1080p, clear microphone audio, camera bubble optional.
- **Target Duration**: 3:30 to 4:30 (strictly within 3 to 5 minutes).
- **Screens to Have Ready**:
  1. **Browser Tab 1**: Web App running locally (Fit/Gap Report Page showing comparison matrix, override badges, unassessed states).
  2. **Browser Tab 2**: Portfolio details page showing collapsible candidate quote evidence.
  3. **IDE / VS Code**: Split view of `FitGap::Engine` + `ComparisonTable.tsx`, and migration file `20260909000001_allow_null_ai_level_for_unassessed_skills.rb`.
  4. **Terminal**: Terminal showing `npm test` passing (Vitest 100% green) and Git commit log.

---

### 7.2 Segment Breakdown & Presenter's Script

#### [0:00 - 0:45] Intro & Problem Discovery (The "Why")
- **Screen**: Camera / Title Slide or Local Web App Homepage.
- **Key Talking Points**:
  - *"Halo tim reviewer Rakamin, saya mempresentasikan hasil revamp untuk platform AI Interview ini dengan standar Monozukuri craftsmanship."*
  - *"Saat menguji aplikasi secara end-to-end, saya menemukan dua celah kritis P0 yang merugikan pengguna dan kandidat:"*
    1. *Kontrak data antara backend dan frontend patah (`expected_level` vs `required_level`), menyebabkan kolom Required di tabel Fit/Gap kosong blank.*
    2. *Bug clamping di generator portfolio yang memaksa skill yang belum diuji (`unassessed`) menjadi Level 1. Ini menghasilkan false rejection yang sangat fatal bagi masa depan kandidat dan melanggar prinsip keadilan pemrosesan UU PDP.*

#### [0:45 - 1:45] Architecture & Backend Hardening (The "How")
- **Screen**: VS Code (`api/app/services/fit_gap/engine.rb`, `api/db/migrate/`, `api/app/clients/gemini/http_client.rb`).
- **Key Talking Points**:
  - *"Di backend, saya tidak hanya menambal bug secara kosmetik, tetapi memperbaiki fondasi data:"*
  - *"Pertama, saya merancang migrasi database reversibel yang mengizinkan `ai_level` bernilai `NULL` untuk skill yang belum teruji, menggantikan constraint check lama dengan aman tanpa merusak data yang ada."*
  - *"Kedua, multi-tenant scoping diperketat di `PortfoliosController` dan `PortfolioSkillsController` sehingga akses lintas tenant langsung menghasilkan HTTP 404."*
  - *"Ketiga, HTTP client Gemini diperkuat dengan markdown code fence parser agar tidak crash saat model AI menghasilkan output berformat markdown atau conversational prose."*
  - *"Keempat, untuk kepatuhan UU PDP Indonesia, log transkripsi suara kandidat di `LiveClient` diredaksi menjadi metadata panjang audio saja."*

#### [1:45 - 2:45] Frontend Monozukuri Craftsmanship (The "Experience")
- **Screen**: Browser (Fit/Gap Report & Candidate Portfolio in Web App).
- **Key Talking Points**:
  - *"Beralih ke frontend, tabel Fit/Gap telah dirombak total:"*
  - *"Kolom Required kini tampil presisi, delta dihitung secara matematis (`+1`, `-1`), dan terdapat chips ringkasan (Match, Exceeds, Gap, Not Assessed).'*
  - *"Ketika assessor melakukan intervensi atau kalibrasi manusia terhadap skor AI, sistem menampilkan badge `✏ override` yang elegan."*
  - *"Pada kartu portfolio, skill yang belum sempat di-probe tidak lagi divonis gagal, melainkan ditandai `Unassessed` dengan penjelasan transparan. Bukti kutipan percakapan kandidat juga dilengkapi kontrol collapsible (view all/collapse) yang nyaman dibaca."*

#### [2:45 - 3:30] Testing Harness, Seeded Fault & AI Verification (The "Rigor")
- **Screen**: Terminal executing `npm test` & VS Code test files.
- **Key Talking Points**:
  - *"Untuk membuktikan kualitas rekayasa (Engineering Rigor), saya membangun automated test harness lengkap:"*
  - *"Menjalankan Vitest di frontend dengan 7 skenario pengujian yang mencakup rendering level, human override, dan unassessed states — semuanya passing 100% dalam waktu di bawah 2 detik."*
  - *"Saya juga melakukan Seeded Fault Test: saya sengaja merusak logika kontrak data di `ComparisonTable.tsx`, dan test suite langsung mendeteksi kegagalan tersebut secara akurat."*
  - *"Selain itu, pada momen verifikasi AI, AI sempat mengusulkan default `ai_level = 0`. Saya memverifikasi skema database Postgres dan mencegah terjadinya crash `PG::CheckViolation` dengan migrasi schema yang benar."*

#### [3:30 - 4:00] Closing & Handover
- **Screen**: GitHub PR / Assessment Deliverables folder.
- **Key Talking Points**:
  - *"Seluruh kode telah di-commit secara rapi ke branch `feature/monozukuri-revamp`, didukung GitHub Actions CI pipeline, serta didokumentasikan dalam `REPORT.pdf` setebal format eksekutif di folder assessment."*
  - *"Platform ini kini bukan sekadar kode yang bekerja, tetapi produk yang tangguh, adil, aman, dan siap digunakan oleh pengguna dan kandidat nyata di industri Indonesia. Terima kasih!"*

---

*Report crafted with Monozukuri craftsmanship for Rakamin AI Interview Platform evaluation.*
