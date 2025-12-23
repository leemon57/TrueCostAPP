type Frequency = 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY';

interface LoanInput {
  principal: number;
  months: number;
  rate: number; // Annual rate as decimal (e.g. 0.05 for 5%)
  frequency: string; // "MONTHLY" | "BIWEEKLY" | "WEEKLY"
}

export const PAYMENTS_PER_YEAR: Record<Frequency, number> = {
  MONTHLY: 12,
  BIWEEKLY: 26,
  WEEKLY: 52,
};

const normalizeFrequency = (freq: string | undefined): Frequency => {
  const upper = (freq || '').toUpperCase() as Frequency;
  return upper === 'BIWEEKLY' || upper === 'WEEKLY' ? upper : 'MONTHLY';
};

export function calculateLoan({ principal, months, rate, frequency }: LoanInput) {
  if (!principal || !months) {
    return { payment: 0, totalInterest: 0, totalPaid: 0, ratio: 0 };
  }

  const freq = normalizeFrequency(frequency);
  const paymentsPerYear = PAYMENTS_PER_YEAR[freq];
  const periods = Math.max(1, Math.round((months / 12) * paymentsPerYear));
  const periodRate = rate > 0 ? Math.pow(1 + rate, 1 / paymentsPerYear) - 1 : 0;

  const payment =
    periodRate === 0
      ? principal / periods
      : (principal * periodRate * Math.pow(1 + periodRate, periods)) /
        (Math.pow(1 + periodRate, periods) - 1);

  const totalPaid = payment * periods;
  const totalInterest = totalPaid - principal;

  return {
    payment,
    totalPaid,
    totalInterest,
    // Useful for UI scaling
    ratio: principal > 0 ? (totalInterest / principal) * 100 : 0,
  };
}
