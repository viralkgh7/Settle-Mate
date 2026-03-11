/**
 * Format a number as a currency string (Rupee).
 * @param amount - The amount to format.
 * @returns Formatted string (e.g., "₹150.00")
 */
export const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
};
