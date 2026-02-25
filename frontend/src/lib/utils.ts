import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  if (amount >= 1000000) {
    return `€${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `€${(amount / 1000).toFixed(0)}K`;
  }
  return `€${amount.toFixed(0)}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getMatchMinute(tick: number): number {
  return Math.floor(tick / 60);
}

export function getPlayerOverall(player: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number }): number {
  return Math.round((player.pace + player.shooting + player.passing + player.dribbling + player.defending + player.physical) / 6);
}

export function getPositionColor(position: string): string {
  if (position === 'GK') return 'bg-yellow-500';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position)) return 'bg-blue-500';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(position)) return 'bg-green-500';
  if (['LW', 'RW', 'CF', 'ST'].includes(position)) return 'bg-red-500';
  return 'bg-gray-500';
}

export function getOverallColor(overall: number): string {
  if (overall >= 85) return 'text-yellow-400';
  if (overall >= 75) return 'text-green-400';
  if (overall >= 65) return 'text-blue-400';
  return 'text-gray-400';
}

export function getMoraleColor(value: number): string {
  if (value >= 80) return 'text-green-400';
  if (value >= 60) return 'text-green-300';
  if (value >= 40) return 'text-yellow-400';
  if (value >= 20) return 'text-orange-400';
  return 'text-red-400';
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Active':
    case 'InProgress':
      return 'bg-green-500/20 text-green-400';
    case 'Lobby':
    case 'Scheduled':
      return 'bg-blue-500/20 text-blue-400';
    case 'Completed':
    case 'Finished':
      return 'bg-gray-500/20 text-gray-400';
    case 'Paused':
      return 'bg-yellow-500/20 text-yellow-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}