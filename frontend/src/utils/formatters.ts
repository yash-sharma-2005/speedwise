/**
 * Format number as Indian Rupee (INR) or chosen currency
 * e.g. 145000 -> ₹1,45,000
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '€';
  
  if (currency === 'INR') {
    // Format using Indian numbering system (Lakhs and Crores)
    const formatted = Math.abs(amount).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    });
    return `${amount < 0 ? '-' : ''}${symbol}${formatted}`;
  }
  
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
  return `${amount < 0 ? '-' : ''}${symbol}${formatted}`;
}

/**
 * Format percentage with sign
 * e.g. 12.5 -> +12.5% or -4.2%
 */
export function formatPercentage(value: number, includeSign: boolean = true): string {
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Format standard date
 * e.g. "2026-10-24" -> "24 Oct 2026"
 */
export function formatDate(dateString: string): string {
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return dateString;
  } catch {
    return dateString;
  }
}

/**
 * Relative days helper
 */
export function getDaysRemaining(targetDateStr: string): number {
  try {
    const today = new Date(2026, 9, 27); // 27 Oct 2026 reference
    const parts = targetDateStr.split('-');
    const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}
