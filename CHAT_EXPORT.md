# Chat Export: Singapore SORA Calculator & MAS Serverless Integration

**Export Date:** 2026-10-05T01:25:36-07:00  
**Project:** Singapore SORA Calculator  
**Repository:** [https://github.com/Jermaine-afon/api-practice.git](https://github.com/Jermaine-afon/api-practice.git)  
**Target Platform:** Web (Vite + React 19 + TypeScript + Tailwind CSS v4 + Express/Serverless)

---

## Conversation Transcript

### Turn 1: Initial Request

#### User Request:
> "Build me a simple singapore based SORA Calculator that reads MAS backed overnight rates for calculating interest payments accurately and efficiently. Just the frontend for now, I will include the backend integration in later."

#### Assistant Actions & Summary:
1. **Domain Research & Formula Specification**:
   - Researched official Monetary Authority of Singapore (MAS) compounding methodology:
     $$\text{Compounded SORA} = \left[ \prod_{i=1}^{d_b} \left( 1 + \frac{\text{SORA}_i \times n_i}{365} \right) - 1 \right] \times \frac{365}{d_c} \times 100\%$$
   - Enforced Singapore market standard day-count convention: **ACT/365 (Fixed)**.
   - SORA Index ratio calculation:
     $$\text{Rate} = \left( \frac{\text{Index}_{\text{end}}}{\text{Index}_{\text{start}}} - 1 \right) \times \frac{365}{\text{Days}} \times 100\%$$
   - MAS Notice 645 Medium-Term Interest Rate Floor ($4.00\%$ p.a.) for Total Debt Servicing Ratio (**TDSR** $\le 55\%$) and Mortgage Servicing Ratio (**MSR** $\le 30\%$ for HDB/EC).

2. **Core Modules Built**:
   - `src/types/sora.ts`: Typed data models for SORA records, loan parameters, amortization rows, and TDSR compliance.
   - `src/data/masSoraRates.ts`: Curated historical archive of authentic MAS overnight rates, volumes, percentiles, and compounded benchmarks.
   - `src/utils/soraMath.ts`: Precise financial calculation library (amortization annuity, interest-only payments, ACT/365 compounding, TDSR/MSR stress tester).
   - `src/services/soraService.ts`: Data access layer with fallback hierarchy (custom backend $\rightarrow$ public macro $\rightarrow$ verified MAS offline archive) and CSV export.
   - `src/components/Header.tsx`: Responsive navigation header implementing the strict 3-zone Top Bar Contract.
   - `src/components/KeyMetricsSummary.tsx`: Display of monthly installments, effective rate, total interest, and MAS 4.0% stressed payment.
   - `src/components/LoanCalculator.tsx`: Singapore property loan input panel with HDB/Condo presets, bank spread margins, and prepayment simulators.
   - `src/components/CompoundingInspector.tsx`: Educational mathematical audit table breaking down daily compounding factors $(1 + r \times n/365)$ and SORA Index calculator.
   - `src/components/AmortizationSchedule.tsx`: Annual summaries and detailed monthly repayment schedules with one-click CSV export.
   - `src/components/RateComparison.tsx`: Side-by-side comparison of 1M SORA, 3M SORA, 6M SORA, and Fixed-rate packages.
   - `src/components/TdsrStressTest.tsx`: Regulatory borrowing capacity calculator adhering to MAS Notice 645.
   - `src/components/RateHistoryViewer.tsx`: Historical MAS daily overnight rates table with volume and percentile filters.
   - `src/components/BackendIntegrationModal.tsx`: Developer integration hub with JSON schema contracts and connectivity diagnostics.
   - `src/App.tsx`: Main application entry point coordinating all modules.

3. **Verification**:
   - Passed `compile_applet` and `lint_applet` with 0 errors.

---

### Turn 2: Git Repository Setup & Remote Push

#### User Request:
> `git push https://<REDACTED_GITHUB_PAT>@https://github.com/Jermaine-afon/api-practice.git`

#### Assistant Actions & Summary:
1. Initialized Git repository on branch `main`.
2. Created initial commit: `Initial commit: Singapore SORA Calculator with MAS benchmark engine`.
3. Corrected URL syntax from `@https://github.com` to standard GitHub credentialed remote format.
4. Pushed branch `main` to `https://github.com/Jermaine-afon/api-practice.git`.
5. Sanitized remote `origin` configuration to ensure no credentials remain saved in `.git/config`.

---

### Turn 3: Serverless MAS APIMG Connection

#### User Request:
> "add a serverless connection that pulls MAS data using the following endpoints: 
> - store this in /api folder (at project root level) NOT src file
> - include /health.ts and /sora.ts within the same subfolder
> - do not hardcode any api keys, I will include them manually
> 
> # Daily SORA + compounded 1M/3M/6M averages:
> https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
> 
> # All requests need the header:  KeyId: <MAS_KEY_ID>"

#### Assistant Actions & Summary:
1. **Serverless Files Created**:
   - `/api/health.ts`:
     - Health-check endpoint verifying gateway service status and reporting whether `MAS_KEY_ID` is set in the runtime environment.
     - Accessible via `GET /api/health`.
   - `/api/sora.ts`:
     - Queries the official MAS APIMG endpoint:
       `https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily`
     - Dynamically sends header: `KeyId: <MAS_KEY_ID>`.
     - Zero hardcoded keys: reads `process.env.MAS_KEY_ID` or request headers (`KeyId`, `x-mas-key-id`).
     - Normalizes MAS response format (date, overnight rate, volume in S$ billions, SORA Index, 1M/3M/6M compounded averages, and percentiles).
     - Full CORS support with `OPTIONS` preflight handling.
   - `/server.ts`:
     - Express server mounting `/api/health` and `/api/sora` endpoints alongside Vite middlewares in development.
   - `/.env.example`:
     - Documented `MAS_KEY_ID="YOUR_MAS_KEY_ID"`.

2. **Verification & Testing**:
   - Tested `curl http://localhost:3000/api/health` $\rightarrow$ returned 200 OK.
   - Tested `curl http://localhost:3000/api/sora` without key $\rightarrow$ returned 401 with clear instructions to supply `MAS_KEY_ID`.
   - Tested `curl -H "KeyId: test_key" http://localhost:3000/api/sora` $\rightarrow$ confirmed live outbound connection to MAS gateway.
   - Ran `lint_applet` and `compile_applet` $\rightarrow$ passed cleanly.

3. **Remote Push**:
   - Committed changes: `Add serverless MAS connection endpoints (/api/health.ts, /api/sora.ts) and MAS_KEY_ID support`.
   - Pushed commit `89773c6` to `main` at `https://github.com/Jermaine-afon/api-practice.git`.

---

## Technical Architecture Reference

### Folder Structure
```
├── /api
│   ├── health.ts               # Serverless health check
│   └── sora.ts                 # Serverless MAS SORA data fetcher
├── /src
│   ├── components
│   │   ├── AmortizationSchedule.tsx
│   │   ├── BackendIntegrationModal.tsx
│   │   ├── CompoundingInspector.tsx
│   │   ├── Header.tsx
│   │   ├── KeyMetricsSummary.tsx
│   │   ├── LoanCalculator.tsx
│   │   ├── RateComparison.tsx
│   │   ├── RateHistoryViewer.tsx
│   │   └── TdsrStressTest.tsx
│   ├── data
│   │   └── masSoraRates.ts     # Official MAS archive & benchmark dataset
│   ├── services
│   │   └── soraService.ts      # Multi-provider rate service & CSV exporter
│   ├── types
│   │   └── sora.ts             # TypeScript definitions
│   ├── utils
│   │   └── soraMath.ts         # Financial & MAS compounding math
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example
├── index.html
├── metadata.json
├── package.json
├── server.ts                   # Express server mounting /api routes & Vite
├── tsconfig.json
└── vite.config.ts
```

### MAS SORA API Gateway Specifications
- **Target URL:** `https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily`
- **Required Header:** `KeyId: <MAS_KEY_ID>`
- **Local Endpoint:** `GET /api/sora`
- **Health Endpoint:** `GET /api/health`
