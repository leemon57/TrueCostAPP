// utils/financialCalculators.ts

/**
 * --- 1. TIME-COST CALCULATOR ---
 * Calculates how many work hours an item costs based on income.
 */

interface TimeCostInput {
  price: number;
  hourlyRate: number;      // Your gross hourly wage
  taxRate?: number;        // Optional: Decimal (e.g., 0.25 for 25%). Defaults to 0.
}

interface TimeCostResult {
  totalHours: number;      // Raw decimal hours (e.g., 4.5)
  display: {
    days: number;          // Assuming an 8-hour work day
    hours: number;         // Remainder hours
    minutes: number;       // Remainder minutes
  };
  netHourlyRate: number;   // The "real" money you take home per hour
}

export function calculateTimeCost({ price, hourlyRate, taxRate = 0.25 }: TimeCostInput): TimeCostResult {
  // 1. Calculate Net Pay (Take-home pay)
  // If user provides 0 hourly rate, avoid division by zero
  if (!hourlyRate || hourlyRate <= 0) {
    return {
      totalHours: 0,
      display: { days: 0, hours: 0, minutes: 0 },
      netHourlyRate: 0,
    };
  }

  const netHourlyRate = hourlyRate * (1 - taxRate);
  
  // 2. Calculate raw hours needed
  const rawHours = price / netHourlyRate;

  // 3. Convert to Days/Hours/Minutes for friendly UI
  // Assuming 1 work day = 8 hours
  const days = Math.floor(rawHours / 8);
  const remainderHours = rawHours % 8;
  
  const hours = Math.floor(remainderHours);
  const minutes = Math.round((remainderHours - hours) * 60);

  return {
    totalHours: rawHours,
    display: {
      days,
      hours,
      minutes
    },
    netHourlyRate
  };
}

/**
 * --- 2. CREDIT CARD PAYOFF CALCULATOR ---
 * Simulates paying off a credit card to reveal the "Minimum Payment Trap".
 */

interface CreditCardInput {
  balance: number;
  interestRate: number;       // Annual APR (e.g., 0.1999 for 19.99%)
  minPaymentPct?: number;     // Standard is usually 2% to 3% (0.02 or 0.03)
  minPaymentFloor?: number;   // The absolute minimum (usually $10 or $25)
  monthlyPaymentOverride?: number; // If the user chooses to pay a fixed amount (e.g., $200)
  extraPayment?: number;      // Extra money added ON TOP of the calculated minimum
}

interface PayoffResult {
  months: number;
  totalInterestPaid: number;
  totalPaid: number;
  isDebtFree: boolean;        // False if debt grows faster than payments (infinite loop safety)
}

export function calculateCreditCardPayoff({
  balance,
  interestRate,
  minPaymentPct = 0.03,       // Default 3%
  minPaymentFloor = 10,       // Default $10 floor
  monthlyPaymentOverride,
  extraPayment = 0
}: CreditCardInput): PayoffResult {
  
  let currentBalance = balance;
  let totalInterestPaid = 0;
  let totalPaid = 0;
  let months = 0;
  
  // Safety break to prevent infinite loops (e.g. if interest > payment)
  const MAX_MONTHS = 600; // 50 years cap

  // Monthly interest rate
  const monthlyRate = interestRate / 12;

  while (currentBalance > 0 && months < MAX_MONTHS) {
    months++;

    // 1. Calculate Interest for this month
    const interestAccrued = currentBalance * monthlyRate;
    
    // 2. Determine Required Payment
    let paymentAmount = 0;

    if (monthlyPaymentOverride) {
      // Strategy: Fixed Payment (e.g. User pays $200/mo flat)
      paymentAmount = monthlyPaymentOverride;
    } else {
      // Strategy: Minimum Payment (Percentage of balance OR floor, whichever is higher)
      const calculatedMin = currentBalance * minPaymentPct;
      paymentAmount = Math.max(calculatedMin, minPaymentFloor);
    }

    // Add any "Snowball" extra payment
    paymentAmount += extraPayment;

    // 3. Handle End of Loan Logic
    // If payment is more than balance + interest, just pay what's left
    const amountOwed = currentBalance + interestAccrued;
    
    if (paymentAmount >= amountOwed) {
      totalPaid += amountOwed;
      totalInterestPaid += interestAccrued;
      currentBalance = 0;
      break;
    }

    // 4. Warning: Negative Amortization check
    // If payment covers less than interest, balance grows. 
    // We let the loop run to hit MAX_MONTHS or balance hits infinity.
    
    // Apply payment
    // Standard order: Interest is paid first, remainder goes to principal.
    totalPaid += paymentAmount;
    totalInterestPaid += interestAccrued;
    const principalPaid = paymentAmount - interestAccrued;
    
    currentBalance -= principalPaid;
  }

  return {
    months,
    totalInterestPaid,
    totalPaid,
    isDebtFree: currentBalance <= 0.01 // Floating point tolerance
  };
}