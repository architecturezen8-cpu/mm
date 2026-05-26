import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format strike rate to 1 decimal */
export function formatSR(sr: number): string {
  if (sr == null || isNaN(sr)) return '0.0';
  return sr.toFixed(1);
}

/** Format economy rate to 2 decimals */
export function formatEcon(econ: number): string {
  if (econ == null || isNaN(econ)) return '0.00';
  return econ.toFixed(2);
}
