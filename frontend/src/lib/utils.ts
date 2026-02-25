import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}K`;
  return `€${amount.toFixed(0)}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function getMatchMinute(tick: number): number {
  return Math.floor(tick / 60);
}

export function playerOverall(p: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number }): number {
  return Math.round((p.pace + p.shooting + p.passing + p.dribbling + p.defending + p.physical) / 6);
}

export function positionColor(pos: string): string {
  if (pos === 'GK') return 'bg-amber-500';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) return 'bg-sky-500';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'bg-emerald-500';
  if (['LW', 'RW', 'CF', 'ST'].includes(pos)) return 'bg-rose-500';
  return 'bg-gray-500';
}

export function ovrColor(ovr: number): string {
  if (ovr >= 85) return 'text-yellow-400';
  if (ovr >= 75) return 'text-emerald-400';
  if (ovr >= 65) return 'text-sky-400';
  return 'text-gray-400';
}

export function conditionColor(val: number): string {
  if (val >= 80) return 'text-emerald-400';
  if (val >= 60) return 'text-yellow-400';
  if (val >= 40) return 'text-orange-400';
  return 'text-red-400';
}

export function statBarColor(val: number): string {
  if (val >= 85) return 'bg-emerald-500';
  if (val >= 75) return 'bg-green-500';
  if (val >= 65) return 'bg-yellow-500';
  if (val >= 55) return 'bg-orange-500';
  return 'bg-red-500';
}

export function statusBadge(status: string): string {
  switch (status) {
    case 'Active':
    case 'InProgress':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'Lobby':
    case 'Scheduled':
      return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
    case 'Completed':
    case 'Finished':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'Paused':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}