/**
 * Shared formatting utilities.
 */
export function formatMl(ml: number): string {
  if (ml >= 1000) {
    const liters = ml / 1000;
    return `${Number.isInteger(liters) ? liters : liters.toFixed(2)}L`;
  }
  return `${ml}ml`;
}