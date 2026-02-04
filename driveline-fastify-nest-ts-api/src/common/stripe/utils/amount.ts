/**
 * Utility functions for handling Stripe amounts
 * Stripe uses the smallest currency unit (e.g., cents for USD)
 */

export class AmountUtils {
  /**
   * Convert a decimal amount to Stripe's smallest currency unit
   * @param amount - Amount in decimal (e.g., 10.99)
   * @param currency - ISO currency code
   * @returns Amount in smallest unit (e.g., 1099 cents)
   */
  static toStripeAmount(amount: number, currency: string = 'usd'): number {
    const zeroDecimalCurrencies = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];

    if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
      return Math.round(amount);
    }

    // Standard currencies use 2 decimal places
    return Math.round(amount * 100);
  }

  /**
   * Convert Stripe's smallest currency unit to decimal amount
   * @param stripeAmount - Amount in smallest unit (e.g., 1099 cents)
   * @param currency - ISO currency code
   * @returns Amount in decimal (e.g., 10.99)
   */
  static fromStripeAmount(stripeAmount: number, currency: string = 'usd'): number {
    const zeroDecimalCurrencies = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];

    if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
      return stripeAmount;
    }

    return stripeAmount / 100;
  }

  /**
   * Format amount for display
   * @param amount - Amount in decimal
   * @param currency - ISO currency code
   * @param locale - Locale for formatting
   * @returns Formatted currency string
   */
  static formatForDisplay(amount: number, currency: string = 'usd', locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  /**
   * Validate amount is within Stripe's limits
   * @param amount - Amount in smallest currency unit
   * @param currency - ISO currency code
   * @returns Validation result
   */
  static validateAmount(amount: number, currency: string = 'usd'): { valid: boolean; error?: string } {
    // Stripe minimum is typically 50 cents (or equivalent)
    const minimumAmounts: Record<string, number> = {
      usd: 50,
      eur: 50,
      gbp: 30,
      jpy: 50,
      // Add more as needed
    };

    const minimum = minimumAmounts[currency.toLowerCase()] ?? 50;

    if (amount < minimum) {
      return {
        valid: false,
        error: `Amount must be at least ${minimum} ${currency.toUpperCase()} cents`,
      };
    }

    // Stripe maximum is typically 99999999 (in smallest unit)
    if (amount > 99999999) {
      return {
        valid: false,
        error: 'Amount exceeds maximum allowed',
      };
    }

    if (!Number.isInteger(amount)) {
      return {
        valid: false,
        error: 'Amount must be an integer (smallest currency unit)',
      };
    }

    return { valid: true };
  }
}
