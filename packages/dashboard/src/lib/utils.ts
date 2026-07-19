import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function formatUsd(n: number, digits = 2): string {
  return `$${formatNumber(n, digits)}`;
}

export function formatBpsAsPct(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function shortenAddress(addr: string, prefix = 4, suffix = 4): string {
  if (!addr || addr.length <= prefix + suffix + 3) return addr;
  return `${addr.slice(0, prefix)}…${addr.slice(-suffix)}`;
}
