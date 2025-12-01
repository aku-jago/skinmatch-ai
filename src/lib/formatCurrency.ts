/**
 * Format number to Indonesian Rupiah currency
 * @param amount - The price amount in IDR
 * @returns Formatted string like "Rp 150.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
