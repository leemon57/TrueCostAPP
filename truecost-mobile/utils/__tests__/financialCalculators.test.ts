import {
  calculateCreditCardPayoff,
  calculateTimeCost,
} from '../financialCalculators';

describe('calculateTimeCost', () => {
  it('returns zeros when hourlyRate is not positive', () => {
    const result = calculateTimeCost({ price: 100, hourlyRate: 0 });

    expect(result.totalHours).toBe(0);
    expect(result.netHourlyRate).toBe(0);
    expect(result.display).toEqual({ days: 0, hours: 0, minutes: 0 });
  });

  it('uses the default tax rate and formats the display breakdown', () => {
    const result = calculateTimeCost({ price: 400, hourlyRate: 40 });

    expect(result.netHourlyRate).toBeCloseTo(30);
    expect(result.totalHours).toBeCloseTo(13.3333333333);
    expect(result.display).toEqual({ days: 1, hours: 5, minutes: 20 });
  });

  it('applies a custom tax rate', () => {
    const result = calculateTimeCost({
      price: 100,
      hourlyRate: 50,
      taxRate: 0.1,
    });

    expect(result.netHourlyRate).toBeCloseTo(45);
    expect(result.totalHours).toBeCloseTo(2.2222222222);
    expect(result.display).toEqual({ days: 0, hours: 2, minutes: 13 });
  });

  it('allows minute rounding to reach 60 when the fractional hour is nearly whole', () => {
    const result = calculateTimeCost({
      price: 119.94,
      hourlyRate: 60,
      taxRate: 0,
    });

    expect(result.totalHours).toBeCloseTo(1.999, 3);
    expect(result.display).toEqual({ days: 0, hours: 1, minutes: 60 });
  });
});

describe('calculateCreditCardPayoff', () => {
  it('pays off using minimum payment defaults', () => {
    const result = calculateCreditCardPayoff({
      balance: 1000,
      interestRate: 0.18,
    });

    expect(result.months).toBe(120);
    expect(result.isDebtFree).toBe(true);
    expect(result.totalInterestPaid).toBeCloseTo(798.88628432797, 8);
    expect(result.totalPaid).toBeCloseTo(1798.8862843279705, 8);
  });

  it('honors a fixed monthlyPaymentOverride', () => {
    const result = calculateCreditCardPayoff({
      balance: 1000,
      interestRate: 0.24,
      monthlyPaymentOverride: 200,
    });

    expect(result.months).toBe(6);
    expect(result.isDebtFree).toBe(true);
    expect(result.totalInterestPaid).toBeCloseTo(64.538226624, 8);
    expect(result.totalPaid).toBeCloseTo(1064.538226624, 8);
  });

  it('uses the payment floor when it is larger than the percentage minimum', () => {
    const result = calculateCreditCardPayoff({
      balance: 200,
      interestRate: 0.2,
      minPaymentPct: 0.03,
      minPaymentFloor: 50,
    });

    expect(result.months).toBe(5);
    expect(result.isDebtFree).toBe(true);
    expect(result.totalInterestPaid).toBeCloseTo(8.7581754115, 8);
    expect(result.totalPaid).toBeCloseTo(208.7581754115, 8);
  });

  it('pays off faster when extraPayment is added on top of the minimum', () => {
    const baseline = calculateCreditCardPayoff({
      balance: 1500,
      interestRate: 0.24,
    });
    const withExtra = calculateCreditCardPayoff({
      balance: 1500,
      interestRate: 0.24,
      extraPayment: 50,
    });

    expect(withExtra.months).toBeLessThan(baseline.months);
    expect(withExtra.totalPaid).toBeLessThan(baseline.totalPaid);
  });

  it('hits the MAX_MONTHS safety break when payments never cover interest', () => {
    const result = calculateCreditCardPayoff({
      balance: 5000,
      interestRate: 0.36,
      minPaymentPct: 0.01,
      minPaymentFloor: 10,
    });

    expect(result.months).toBe(600);
    expect(result.isDebtFree).toBe(false);
  });

  it('exits immediately when balance is already zero or less', () => {
    const result = calculateCreditCardPayoff({ balance: 0, interestRate: 0.2 });

    expect(result.months).toBe(0);
    expect(result.totalInterestPaid).toBe(0);
    expect(result.totalPaid).toBe(0);
    expect(result.isDebtFree).toBe(true);
  });
});
