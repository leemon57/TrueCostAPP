type Frequency = 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY';

interface LoanInput {
  principal: number;
  months: number;
  rate: number; // Annual rate as decimal (e.g. 0.05 for 5%)
  frequency: string; // "MONTHLY" | "BIWEEKLY" | "WEEKLY"
}

export function calculateLoan({ principal, months, rate, frequency }: LoanInput) {
  if (!principal || !months) return { payment: 0, totalInterest: 0, totalPaid: 0 };

  const paymentsPerYear = frequency === 'BIWEEKLY' ? 26 : frequency === 'WEEKLY' ? 52 : 12;
  const n_periods = (months / 12) * paymentsPerYear;
  const r_period = rate / paymentsPerYear;

  let payment = 0;
  
  if (rate === 0) {
    payment = principal / n_periods;
  } else {
    payment = principal * (r_period * Math.pow(1 + r_period, n_periods)) / (Math.pow(1 + r_period, n_periods) - 1);
  }

  const totalPaid = payment * n_periods;
  const totalInterest = totalPaid - principal;

  return {
    payment,
    totalPaid,
    totalInterest,
    // Useful for UI scaling
    ratio: principal > 0 ? (totalInterest / principal) * 100 : 0
  };
}