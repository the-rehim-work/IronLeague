import { create } from 'zustand';

interface GameState {
  leagueInstanceId: string | null;
  currentDate: string | null;
  userTeamInstanceId: string | null;
  userManagerId: string | null;

  setLeague: (id: string, date: string, teamId?: string, managerId?: string) => void;
  updateDate: (date: string) => void;
  clearLeague: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  leagueInstanceId: null,
  currentDate: null,
  userTeamInstanceId: null,
  userManagerId: null,

  setLeague: (id, date, teamId, managerId) =>
    set({
      leagueInstanceId: id,
      currentDate: date,
      userTeamInstanceId: teamId ?? null,
      userManagerId: managerId ?? null,
    }),

  updateDate: (date) => set({ currentDate: date }),

  clearLeague: () =>
    set({
      leagueInstanceId: null,
      currentDate: null,
      userTeamInstanceId: null,
      userManagerId: null,
    }),
}));