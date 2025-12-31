import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

export function getFormColor(form: number): string {
  if (form >= 75) return 'text-green-600';
  if (form >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

export function getMoraleColor(morale: number): string {
  if (morale >= 75) return 'text-green-600';
  if (morale >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

export function getTeamGradient(primaryColor: string, secondaryColor: string): string {
  return `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
}
