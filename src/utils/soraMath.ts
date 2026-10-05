import {
  LoanParams,
  CalculationResult,
  AmortizationRow,
  AnnualSummary,
  TdsrParams,
  TdsrResult,
} from '../types/sora';

/**
 * Standard monthly mortgage payment formula (French annuity amortization):
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * where r = annualRate / 12 / 100, n = total months
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRatePct: number,
  totalMonths: number
): number {
  if (totalMonths <= 0 || principal <= 0) return 0;
  if (annualRatePct <= 0) return principal / totalMonths;

  const monthlyRate = annualRatePct / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const payment = (principal * (monthlyRate * factor)) / (factor - 1);
  return isFinite(payment) ? payment : 0;
}

/**
 * Monthly Interest-Only payment:
 * I = Principal * (annualRate / 12 / 100)
 */
export function calculateInterestOnlyPayment(
  principal: number,
  annualRatePct: number
): number {
  if (principal <= 0 || annualRatePct <= 0) return 0;
  return principal * (annualRatePct / 100 / 12);
}

/**
 * Singapore ACT/365 Fixed Interest calculation for a given number of days:
 * Interest = Principal * (annualRate / 100) * (days / 365)
 */
export function calculateAct365Interest(
  principal: number,
  annualRatePct: number,
  days: number
): number {
  return principal * (annualRatePct / 100) * (days / 365);
}

/**
 * MAS Official SORA Compounding Formula:
 * Compounded SORA = [ Product(1 + (SORA_i / 100) * n_i / 365) - 1 ] * (365 / d_c) * 100
 */
export interface CompoundingStep {
  date: string;
  rate: number;
  daysSpanned: number; // n_i
  factor: number; // 1 + (rate/100) * n_i / 365
  cumulativeProduct: number;
}

export function computeMasCompoundedRate(
  rates: { date: string; rate: number; daysSpanned: number }[]
): {
  compoundedRate: number;
  totalCalendarDays: number;
  steps: CompoundingStep[];
} {
  if (!rates || rates.length === 0) {
    return { compoundedRate: 0, totalCalendarDays: 0, steps: [] };
  }

  let product = 1.0;
  let totalCalendarDays = 0;
  const steps: CompoundingStep[] = [];

  for (const item of rates) {
    const dailyFraction = (item.rate / 100) * (item.daysSpanned / 365);
    const factor = 1 + dailyFraction;
    product *= factor;
    totalCalendarDays += item.daysSpanned;

    steps.push({
      date: item.date,
      rate: item.rate,
      daysSpanned: item.daysSpanned,
      factor,
      cumulativeProduct: product,
    });
  }

  if (totalCalendarDays === 0) {
    return { compoundedRate: 0, totalCalendarDays: 0, steps };
  }

  const compoundedRate = (product - 1) * (365 / totalCalendarDays) * 100;
  return {
    compoundedRate: Number(compoundedRate.toFixed(4)),
    totalCalendarDays,
    steps,
  };
}

/**
 * Compounded rate derived from SORA Index:
 * Rate = (Index_end / Index_start - 1) * (365 / days) * 100
 */
export function computeFromSoraIndex(
  startIndex: number,
  endIndex: number,
  calendarDays: number
): number {
  if (startIndex <= 0 || calendarDays <= 0) return 0;
  const rate = (endIndex / startIndex - 1) * (365 / calendarDays) * 100;
  return Number(rate.toFixed(4));
}

/**
 * Generate full loan calculation with amortization schedule, annual summaries,
 * support for interest-only introductory period and optional lump-sum prepayment.
 */
export function generateLoanSchedule(params: LoanParams): CalculationResult {
  const {
    loanAmount,
    tenureYears,
    tenureMonths,
    benchmarkRate,
    bankSpread,
    repaymentType,
    interestOnlyMonths,
    startDate,
    prepaymentAmount,
    prepaymentMonth,
  } = params;

  const effectiveRate = Number((benchmarkRate + bankSpread).toFixed(4));
  const totalMonths = tenureYears * 12 + tenureMonths;

  // MAS Notice 645 medium-term stress rate floor is 4.00% p.a.
  const masStressRate = Math.max(4.0, effectiveRate);
  const stressedMonthlyPayment = calculateMonthlyPayment(
    loanAmount,
    masStressRate,
    totalMonths
  );

  if (totalMonths <= 0 || loanAmount <= 0) {
    return {
      monthlyPayment: 0,
      effectiveRate,
      totalPayment: 0,
      totalInterest: 0,
      totalMonths: 0,
      payoffDate: startDate,
      stressedMonthlyPayment: 0,
      stressRate: masStressRate,
      schedule: [],
      annualSummaries: [],
    };
  }

  const standardMonthlyPayment = calculateMonthlyPayment(
    loanAmount,
    effectiveRate,
    repaymentType === 'interest_only'
      ? Math.max(1, totalMonths - interestOnlyMonths)
      : totalMonths
  );

  const initialMonthlyPayment =
    repaymentType === 'interest_only' && interestOnlyMonths > 0
      ? calculateInterestOnlyPayment(loanAmount, effectiveRate)
      : standardMonthlyPayment;

  const schedule: AmortizationRow[] = [];
  const annualMap = new Map<number, AnnualSummary>();

  let currentBalance = loanAmount;
  let totalPaid = 0;
  let totalInterestPaid = 0;

  const startD = new Date(startDate || new Date().toISOString().slice(0, 10));

  for (let m = 1; m <= totalMonths; m++) {
    if (currentBalance <= 0.001) break;

    const rowDate = new Date(startD);
    rowDate.setMonth(startD.getMonth() + m - 1);
    const dateStr = rowDate.toISOString().slice(0, 10);
    const daysInMonth = new Date(
      rowDate.getFullYear(),
      rowDate.getMonth() + 1,
      0
    ).getDate();

    const isInterestOnly =
      repaymentType === 'interest_only' && m <= interestOnlyMonths;

    // Monthly interest: Singapore bank standard monthly rate = effectiveRate / 12 / 100
    const monthlyRate = effectiveRate / 100 / 12;
    const interest = currentBalance * monthlyRate;

    let principal = 0;
    let payment = 0;

    if (isInterestOnly) {
      interestOnlyMonths;
      principal = 0;
      payment = interest;
    } else {
      // Recalculate remaining regular payment if balance was modified by prepayment
      const remainingMonths = totalMonths - m + 1;
      const scheduledPayment = calculateMonthlyPayment(
        currentBalance,
        effectiveRate,
        remainingMonths
      );
      payment = Math.min(scheduledPayment, currentBalance + interest);
      principal = payment - interest;
    }

    // Apply prepayment if triggered this month
    let extraPayment = 0;
    if (prepaymentAmount > 0 && m === prepaymentMonth) {
      extraPayment = Math.min(prepaymentAmount, currentBalance - principal);
    }

    const endingBalance = Math.max(
      0,
      currentBalance - principal - extraPayment
    );

    const actualRowPayment = payment + extraPayment;
    totalPaid += actualRowPayment;
    totalInterestPaid += interest;

    const row: AmortizationRow = {
      month: m,
      date: dateStr,
      startingBalance: Number(currentBalance.toFixed(2)),
      payment: Number(actualRowPayment.toFixed(2)),
      principal: Number(principal.toFixed(2)),
      interest: Number(interest.toFixed(2)),
      extraPayment: Number(extraPayment.toFixed(2)),
      endingBalance: Number(endingBalance.toFixed(2)),
      applicableRate: effectiveRate,
      daysInMonth,
    };

    schedule.push(row);

    // Group into annual summaries
    const yearNumber = Math.ceil(m / 12);
    const existingYear = annualMap.get(yearNumber) || {
      year: yearNumber,
      totalPayment: 0,
      totalPrincipal: 0,
      totalInterest: 0,
      endingBalance: 0,
    };

    existingYear.totalPayment += actualRowPayment;
    existingYear.totalPrincipal += principal + extraPayment;
    existingYear.totalInterest += interest;
    existingYear.endingBalance = endingBalance;
    annualMap.set(yearNumber, existingYear);

    currentBalance = endingBalance;
  }

  const annualSummaries: AnnualSummary[] = Array.from(annualMap.values()).map(
    (item) => ({
      year: item.year,
      totalPayment: Number(item.totalPayment.toFixed(2)),
      totalPrincipal: Number(item.totalPrincipal.toFixed(2)),
      totalInterest: Number(item.totalInterest.toFixed(2)),
      endingBalance: Number(item.endingBalance.toFixed(2)),
    })
  );

  const lastRow = schedule[schedule.length - 1];
  const payoffDate = lastRow ? lastRow.date : startDate;

  return {
    monthlyPayment: Number(initialMonthlyPayment.toFixed(2)),
    effectiveRate,
    totalPayment: Number(totalPaid.toFixed(2)),
    totalInterest: Number(totalInterestPaid.toFixed(2)),
    totalMonths: schedule.length,
    payoffDate,
    stressedMonthlyPayment: Number(stressedMonthlyPayment.toFixed(2)),
    stressRate: masStressRate,
    schedule,
    annualSummaries,
  };
}

/**
 * MAS TDSR (Total Debt Servicing Ratio) and MSR (Mortgage Servicing Ratio) calculation.
 * Under MAS regulations:
 * - TDSR ceiling: 55% of gross monthly income
 * - MSR ceiling (HDB / EC): 30% of gross monthly income
 * - Stress interest rate: Min 4.00% p.a.
 */
export function calculateTdsrCompliance(
  params: TdsrParams,
  monthlyInstallmentAtStressRate: number
): TdsrResult {
  const { monthlyIncome, otherDebts, propertyType, stressRate } = params;

  if (monthlyIncome <= 0) {
    return {
      tdsrRatio: 0,
      tdsrLimit: 55,
      isTdsrCompliant: false,
      maxAffordableLoan: 0,
    };
  }

  const totalMonthlyCommitment = monthlyInstallmentAtStressRate + otherDebts;
  const tdsrRatio = Number(((totalMonthlyCommitment / monthlyIncome) * 100).toFixed(1));
  const isTdsrCompliant = tdsrRatio <= 55;

  let msrRatio: number | undefined;
  let isMsrCompliant: boolean | undefined;

  if (propertyType === 'residential_hdb') {
    msrRatio = Number(((monthlyInstallmentAtStressRate / monthlyIncome) * 100).toFixed(1));
    isMsrCompliant = msrRatio <= 30;
  }

  // Maximum loan affordable under 55% TDSR at stress rate for 25-30 years
  const maxAllowablePayment = Math.max(
    0,
    monthlyIncome * 0.55 - otherDebts
  );

  // Present value of maximum annuity payment at stress rate for 25 years (300 months)
  const stressMonthlyR = (stressRate || 4.0) / 100 / 12;
  const n = 300;
  const factor = Math.pow(1 + stressMonthlyR, n);
  const maxAffordableLoan =
    maxAllowablePayment > 0
      ? (maxAllowablePayment * (factor - 1)) / (stressMonthlyR * factor)
      : 0;

  return {
    tdsrRatio,
    tdsrLimit: 55,
    isTdsrCompliant,
    msrRatio,
    msrLimit: 30,
    isMsrCompliant,
    maxAffordableLoan: Number(maxAffordableLoan.toFixed(0)),
  };
}
