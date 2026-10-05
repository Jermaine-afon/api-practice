export interface SoraDailyRecord {
  date: string; // YYYY-MM-DD
  rate: number; // Volume-weighted SORA overnight rate (% p.a.)
  volume: number; // Aggregate volume in SGD billions
  soraIndex: number; // SORA Index base 1.000000000 on 2020-01-03
  comp1M?: number; // 1-Month Compounded SORA (% p.a.)
  comp3M?: number; // 3-Month Compounded SORA (% p.a.)
  comp6M?: number; // 6-Month Compounded SORA (% p.a.)
  p10?: number; // 10th percentile
  p25?: number; // 25th percentile
  p75?: number; // 75th percentile
  p90?: number; // 90th percentile
}

export type SoraTenor = '1M' | '3M' | '6M' | 'custom';

export type RepaymentType = 'amortizing' | 'interest_only';

export interface LoanParams {
  loanAmount: number; // SGD
  tenureYears: number;
  tenureMonths: number;
  soraTenor: SoraTenor;
  benchmarkRate: number; // Base SORA rate in % p.a.
  bankSpread: number; // Bank margin in % p.a.
  repaymentType: RepaymentType;
  interestOnlyMonths: number;
  startDate: string; // YYYY-MM-DD
  prepaymentAmount: number; // One-time lump sum
  prepaymentMonth: number; // Month index (1-based)
}

export interface AmortizationRow {
  month: number;
  date: string;
  startingBalance: number;
  payment: number;
  principal: number;
  interest: number;
  extraPayment: number;
  endingBalance: number;
  applicableRate: number;
  daysInMonth: number;
}

export interface AnnualSummary {
  year: number;
  totalPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  endingBalance: number;
}

export interface CalculationResult {
  monthlyPayment: number;
  effectiveRate: number; // benchmark + spread
  totalPayment: number;
  totalInterest: number;
  totalMonths: number;
  payoffDate: string;
  stressedMonthlyPayment: number; // at MAS 4.0% floor or user stress rate
  stressRate: number;
  schedule: AmortizationRow[];
  annualSummaries: AnnualSummary[];
}

export interface TdsrParams {
  monthlyIncome: number;
  otherDebts: number;
  propertyType: 'residential_hdb' | 'residential_private' | 'commercial';
  stressRate: number; // Default 4.0% MAS floor
}

export interface TdsrResult {
  tdsrRatio: number; // % of income
  tdsrLimit: number; // 55% MAS limit
  isTdsrCompliant: boolean;
  msrRatio?: number; // for HDB, 30% limit
  msrLimit?: number;
  isMsrCompliant?: boolean;
  maxAffordableLoan: number;
}

export interface BackendConfig {
  mode: 'offline_archive' | 'public_api' | 'custom_backend';
  customEndpointUrl: string;
  apiKey?: string;
  lastConnectedAt?: string;
  isCustomConnected: boolean;
}
