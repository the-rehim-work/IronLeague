# IronLeague — Frontend TODO

> **Context for AI:** IronLeague is an online multiplayer football manager game. The backend is a fully complete ASP.NET Core API (C#, EF Core, SQL Server, SignalR hubs). The frontend is React + TypeScript + Vite. Your job is to make every frontend page fully functional, connected to the real backend API, polished, and production-ready. Do NOT touch backend code — it is done and frozen.

---

## Project Facts

- **Backend base URL:** `http://localhost:5221/api`
- **Auth:** JWT Bearer tokens (stored client-side), 7-day expiry
- **Real-time:** SignalR hubs at `/hubs/match`, `/hubs/league`, `/hubs/notifications`, `/hubs/chat`
- **SignalR auth:** pass `access_token` as query param on hub connection
- **Frontend stack:** React 18+, TypeScript, Vite, TailwindCSS
- **No SSR** — pure SPA with client-side routing (react-router-dom)

---

## Backend API Surface (complete reference)

Use this as the source of truth for every fetch, mutation, and SignalR subscription.

### Auth — `POST /api/auth/*`
| Method | Endpoint | Body / Query | Returns |
|--------|----------|--------------|---------|
| POST | `/auth/register` | `{ userName, password, email?, displayName? }` | `{ token, user }` |
| POST | `/auth/login` | `{ userOrEmail, password }` | `{ token, user }` |
| GET | `/auth/me` | — | `{ id, userName, email, displayName, isAdmin, roles }` |
| PUT | `/auth/profile` | `{ displayName?, email? }` | `{ id, userName, email, displayName }` |
| POST | `/auth/change-password` | `{ currentPassword, newPassword }` | `{ message }` |
| GET | `/auth/usernames/check?name=X` | — | `{ available, reason? }` |
| GET | `/auth/emails/check?email=X` | — | `{ available, reason? }` |
| POST | `/auth/logout` | — | `{ message }` |

### Manager — `POST/GET /api/Manager/*`
| POST | `/Manager` | `{ name, nationality, earlyBonus }` | ManagerDto |
| GET | `/Manager/{id}` | — | ManagerDto |
| GET | `/Manager/mine` | — | ManagerDto[] |

**ManagerDto:** `{ id, name, nationality, age, physical, mental, technical, reputation, personalBalance, isRetired, currentTeamId, currentTeamName, leagueInstanceId, languages[] }`

### League Instance — `/api/LeagueInstance/*`
| POST | `/LeagueInstance` | `{ name, baseLeagueId?, isPrivate, password?, maxPlayers, governance? }` | LeagueInstanceDto |
| GET | `/LeagueInstance/{id}` | — | LeagueInstanceDto |
| GET | `/LeagueInstance/public` | — | LeagueInstanceDto[] |
| GET | `/LeagueInstance/mine` | — | LeagueInstanceDto[] |
| POST | `/LeagueInstance/join` | `{ leagueInstanceId, managerId, teamId, password? }` | OK |
| POST | `/LeagueInstance/{id}/start` | — | OK |

### Game (main gameplay controller) — `/api/Game/*`
| POST | `/Game/leagueinstance/{id}/advance` | `?simulateOwn=bool` | SimulationResult |
| POST | `/Game/leagueinstance/{id}/advance-until-match` | `?simulateOwn=bool` | SimulationResult |
| GET | `/Game/leagueinstance/{id}/teams` | — | LeagueTeamDto[] |
| GET | `/Game/leagueinstance/{id}/competitions` | — | CompetitionSummaryDto[] |
| GET | `/Game/competition/{id}` | — | CompetitionDto |
| GET | `/Game/competition/{id}/standings` | — | LeagueTeamInstanceDto[] |
| GET | `/Game/competition/{id}/fixtures` | — | FixtureDto[] |
| GET | `/Game/leagueinstance/{id}/fixtures` | — | fixture list (inline shape) |
| GET | `/Game/leagueinstance/{id}/fixtures/grouped` | — | `{ userTeamInstanceId, weeks[] }` |
| GET | `/Game/leagueinstance/{id}/fixtures/upcoming?count=N` | — | FixtureDto[] |
| GET | `/Game/leagueinstance/{id}/results?count=N` | — | FixtureDto[] |
| GET | `/Game/leagueinstance/{id}/myteam` | — | team + squad + standings |
| GET | `/Game/leagueinstance/{id}/myfixtures` | — | FixtureDto[] |
| GET | `/Game/team/{teamInstanceId}/detail` | — | full team detail + squad |
| POST | `/Game/fixture/{fixtureId}/simulate` | — | MatchSimResult |
| GET | `/Game/player/{playerId}` | — | PlayerDetailDto |
| GET | `/Game/player/search?name=&position=&minOverall=&maxAge=&maxValue=&limit=` | — | PlayerDto[] |

### Match — `/api/Match/*`
| GET | `/Match/{id}` | — | MatchDto |
| POST | `/Match/start` | StartMatchDto | MatchDto |
| POST | `/Match/demo` | — | MatchDto (creates demo league + fixture + starts) |

### Transfer — `/api/Transfer/*`
| GET | `/Transfer/freeagents` | — | PlayerDto[] |
| POST | `/Transfer/offer` | CreateTransferOfferDto | TransferDto |

### Notification — `/api/Notification/*`
| GET | `/Notification` | — | NotificationDto[] |
| POST | `/Notification/{id}/read` | — | OK |
| POST | `/Notification/read-all` | — | OK |

### Data (reference/seed) — `/api/Data/*`
| GET | `/Data/countries` | — | CountryDto[] |
| GET | `/Data/leagues` | — | LeagueDto[] |
| GET | `/Data/teams/{leagueId}` | — | TeamDto[] |
| GET | `/Data/players/{teamId}` | — | PlayerSummaryDto[] |

### Admin — `/api/Admin/*` (requires Admin role)
| POST | `/Admin/seed` | — | OK |
| POST | `/Admin/country` | AdminCreateCountryDto | OK |
| POST | `/Admin/league` | CreateLeagueDto | OK |
| POST | `/Admin/team` | AdminCreateTeamDto | OK |
| POST | `/Admin/player` | AdminCreatePlayerDto | OK |

### Tactic — `/api/Tactic/*`
| GET | `/Tactic/{id}` | — | TacticDto |
| GET | `/Tactic/team/{teamInstanceId}` | — | TacticDto[] |
| POST | `/Tactic/team/{teamInstanceId}` | CreateTacticDto | TacticDto |
| PUT | `/Tactic/{id}` | CreateTacticDto | TacticDto |
| DELETE | `/Tactic/{id}` | — | OK |
| POST | `/Tactic/team/{teamInstanceId}/default/{tacticId}` | — | OK |

### Training — `/api/Training/*`
| GET | `/Training/{sessionId}` | — | TrainingSessionDto |
| GET | `/Training/team/{teamInstanceId}?limit=N` | — | TrainingSessionDto[] |
| POST | `/Training/team/{teamInstanceId}` | CreateTrainingSessionDto | TrainingSessionDto |
| POST | `/Training/{sessionId}/process` | — | OK |

### Youth Academy — `/api/YouthAcademy/*`
| GET | `/YouthAcademy/team/{teamId}` | — | YouthAcademyDto |
| POST | `/YouthAcademy/team/{teamId}` | — | YouthAcademyDto (create) |
| POST | `/YouthAcademy/{academyId}/upgrade` | — | OK |
| POST | `/YouthAcademy/{academyId}/intake` | — | YouthPlayerDto[] |
| POST | `/YouthAcademy/promote/{youthPlayerId}` | — | PlayerDto |

### Friendship — `/api/Friendship/*`
| GET | `/Friendship` | — | FriendshipDto[] |
| GET | `/Friendship/pending` | — | FriendshipDto[] |
| POST | `/Friendship/request` | `{ userId }` | FriendshipDto |
| POST | `/Friendship/{id}/accept` | — | OK |
| POST | `/Friendship/{id}/decline` | — | OK |
| DELETE | `/Friendship/{id}` | — | OK |
| POST | `/Friendship/block/{userId}` | — | OK |

### League Invite — `/api/LeagueInvite/*`
| GET | `/LeagueInvite/pending` | — | LeagueInviteDto[] |
| POST | `/LeagueInvite` | `{ leagueInstanceId, userId }` | LeagueInviteDto |
| POST | `/LeagueInvite/{id}/accept` | — | OK |
| POST | `/LeagueInvite/{id}/decline` | — | OK |
| DELETE | `/LeagueInvite/{id}` | — | OK |

### Press — `/api/Press/*`
| GET | `/Press/league/{leagueInstanceId}?limit=N` | — | PressEventDto[] |
| POST | `/Press/match/{matchId}/report` | — | PressEventDto |
| POST | `/Press/scandal` | `{ leagueInstanceId, managerId?, playerId? }` | PressEventDto |
| POST | `/Press/rumor` | `{ playerId, interestedTeamId?, leagueInstanceId }` | PressEventDto |

### Contract — `/api/Contract/*`
| GET | `/Contract/player/{playerId}` | — | ContractDto |
| POST | `/Contract` | CreateContractDto | ContractDto |
| DELETE | `/Contract/player/{playerId}` | — | OK |
| PUT | `/Contract/player/{playerId}/extend` | `{ additionalYears, newWage? }` | OK |
| GET | `/Contract/team/{teamId}/expiring?monthsAhead=N` | — | ContractDto[] |

### International — `/api/International/*`
| GET | `/International/teams` | — | InternationalTeamDto[] |
| GET | `/International/teams/{id}` | — | InternationalTeamDto |
| GET | `/International/breaks?count=N` | — | InternationalBreakDto[] |
| GET | `/International/breaks/{id}/callups` | — | InternationalCallDto[] |
| POST | `/International/callup` | `{ internationalTeamId, playerId, breakId }` | InternationalCallDto |
| POST | `/International/breaks/{id}/process-return` | — | OK |

### Vote — `/api/Vote/*`
| POST | `/Vote/skip` | `{ leagueInstanceId }` | VoteResult |
| GET | `/Vote/status/{leagueInstanceId}` | — | VoteResult |

### Save — `/api/Save/*`
| POST | `/Save/export/{leagueInstanceId}` | — | SaveExportDto |
| POST | `/Save/import` | `{ jsonData, expectedHash }` | OK |
| GET | `/Save/exports` | — | SaveExportDto[] |

### Instruction — `/api/Instruction/*`
| GET | `/Instruction` | — | InGameInstructionDto[] |
| GET | `/Instruction/available?reputation=N` | — | InGameInstructionDto[] |
| POST | `/Instruction/seed` | — | OK |

### Chat — `/api/chat/*`
| GET | `/chat/threads` | — | thread list |
| GET | `/chat/threads/{withUserName}?take=50&skip=0` | — | `{ threadId, items[] }` |
| POST | `/chat/start` | `{ withUserName }` | `{ threadId }` |
| POST | `/chat/send` | `{ threadId, content }` | message |
| POST | `/chat/mark-read/{withUserName}` | — | `{ count }` |
| GET | `/api/users/search?q=X` | — | `{ id, userName, displayName }[]` |

### SignalR Hubs
| Hub | Path | Client → Server | Server → Client |
|-----|------|-----------------|-----------------|
| MatchHub | `/hubs/match` | `JoinMatch(matchId)`, `LeaveMatch(matchId)`, `StartMatch(dto)`, `PauseMatch(matchId)`, `ResumeMatch(matchId)`, `GiveSpeech(dto)` | `MatchState`, `MatchInfo`, `MatchEvent`, `MatchStarted`, `MatchPaused`, `MatchResumed`, `MatchEnded`, `SecondHalfStarted`, `SpeechResult`, `SpeechGiven`, `Error` |
| LeagueHub | `/hubs/league` | `JoinLeague(id)`, `LeaveLeague(id)` | (future broadcasts) |
| NotificationHub | `/hubs/notifications` | `JoinUserChannel(userId)`, `LeaveUserChannel(userId)` | (future push notifications) |
| ChatHub | `/hubs/chat` | `JoinThread(threadId)`, `LeaveThread(threadId)` | (future real-time messages) |

---

## Frontend Architecture Requirements

### Foundation Layer (build first)
```
src/
├── api/
│   ├── client.ts              axios instance, baseURL from env, Bearer interceptor, 401 refresh
│   ├── auth.ts                register, login, me, updateProfile, changePassword, checkUsername, checkEmail
│   ├── game.ts                all /Game/* endpoints
│   ├── match.ts               /Match/* endpoints
│   ├── manager.ts             /Manager/* endpoints
│   ├── league.ts              /LeagueInstance/* endpoints
│   ├── data.ts                /Data/* endpoints (countries, leagues, teams, players)
│   ├── transfer.ts            /Transfer/* endpoints
│   ├── tactic.ts              /Tactic/* endpoints
│   ├── training.ts            /Training/* endpoints
│   ├── youth.ts               /YouthAcademy/* endpoints
│   ├── press.ts               /Press/* endpoints
│   ├── contract.ts            /Contract/* endpoints
│   ├── friendship.ts          /Friendship/* endpoints
│   ├── invite.ts              /LeagueInvite/* endpoints
│   ├── international.ts       /International/* endpoints
│   ├── notification.ts        /Notification/* endpoints
│   ├── chat.ts                /chat/* endpoints
│   ├── vote.ts                /Vote/* endpoints
│   ├── save.ts                /Save/* endpoints
│   ├── instruction.ts         /Instruction/* endpoints
│   └── admin.ts               /Admin/* endpoints
├── hooks/
│   ├── useAuth.ts             wraps auth store, provides login/logout/register actions
│   ├── useSignalR.ts          generic hook: connect to hub, subscribe to events, auto-reconnect
│   ├── useMatchHub.ts         specific: join/leave match, listen for MatchState/MatchEvent/MatchInfo
│   ├── useLeagueHub.ts        join/leave league room
│   ├── useNotificationHub.ts  join user channel, listen for push
│   ├── useChatHub.ts          join/leave thread, listen for messages
│   └── useGameState.ts        holds current leagueInstanceId, current date, user team info
├── stores/
│   ├── authStore.ts           zustand — token, user, isAuthenticated, persist to localStorage
│   └── gameStore.ts           zustand — active leagueInstanceId, currentDate, userTeamInstanceId
├── types/
│   └── index.ts               ALL TypeScript interfaces matching backend DTOs exactly
├── lib/
│   ├── signalr.ts             HubConnectionBuilder factory with token injection
│   └── utils.ts               formatDate, formatMoney, positionOrder, colorUtils
├── components/                reusable UI (see below)
├── pages/                     route-level components (see below)
├── app/
│   ├── router.tsx             all routes with layout nesting and auth guards
│   ├── providers.tsx          QueryClientProvider, Toaster, theme
│   └── AuthGuard.tsx          redirect to /login if no token
├── App.tsx
├── main.tsx
└── index.css                  tailwind directives
```

---

## Task List

### Phase 0 — Skeleton & Infra
| ID | Task | Details |
|----|------|---------|
| F00 | Project scaffold | Vite + React + TS + Tailwind + react-router-dom + @tanstack/react-query + zustand + @microsoft/signalr + axios + sonner (toast). Path alias `@/` → `./src/` |
| F01 | `api/client.ts` | Axios instance. Request interceptor attaches `Authorization: Bearer {token}` from authStore. Response interceptor catches 401 → logout + redirect `/login`. |
| F02 | `types/index.ts` | Every DTO as a TypeScript interface. Copy the exact field names from the backend DTOs section above. Use `Guid` as `string`. |
| F03 | `stores/authStore.ts` | Zustand with persist. Fields: `token`, `user` (id, userName, displayName, email, isAdmin, roles), `isAuthenticated`. Actions: `setAuth(token, user)`, `logout()`, `updateUser(partial)`. |
| F04 | `stores/gameStore.ts` | Zustand. Fields: `leagueInstanceId`, `currentDate`, `userTeamInstanceId`, `userManagerId`. Actions: `setLeague(...)`, `clearLeague()`. |
| F05 | All API modules | One file per domain. Each exports typed async functions using `client`. No hooks here — just raw fetches. |
| F06 | `lib/signalr.ts` | Factory: `createHubConnection(path)` → returns `HubConnection` with `accessTokenFactory` reading from authStore, auto-reconnect enabled. |
| F07 | `hooks/useSignalR.ts` | Generic hook: `useSignalR(hubPath, { onConnect?, handlers: Record<string, Function> })`. Manages connection lifecycle, cleanup on unmount. |
| F08 | `hooks/useAuth.ts` | Calls `api/auth.ts`, updates authStore on success. Exposes `login()`, `register()`, `logout()`, `user`, `isAuthenticated`, `isAdmin`. |
| F09 | `app/router.tsx` | All routes defined. Public: `/login`, `/register`. Protected (wrapped in AuthGuard): everything else. Nested layout with sidebar + header. |
| F10 | `app/AuthGuard.tsx` | If no token in store → redirect to `/login`. Otherwise render `<Outlet />`. |

### Phase 1 — Core Pages (playable game loop)
| ID | Task | Details |
|----|------|---------|
| F11 | **LoginPage** | Form: username/email + password. Calls `login()`. On success → redirect to `/dashboard`. Show validation errors from API. |
| F12 | **RegisterPage** | Form: username, password, email (optional), displayName (optional). Real-time username availability check (debounced call to `/auth/usernames/check`). |
| F13 | **DashboardPage** (`/dashboard`) | Landing after login. Shows: user's managers list, active league instances, pending invites count, unread notifications count. Links to create manager, browse public leagues, or continue active league. |
| F14 | **CreateManagerPage** | Form: name, nationality (dropdown from `/Data/countries`), earlyBonus toggle. POST to `/Manager`. Redirect to dashboard. |
| F15 | **BrowseLeaguesPage** | Lists public leagues from `/LeagueInstance/public`. Each card shows: name, owner, player count/max, base league name. "Join" button opens team picker modal. Also shows `/LeagueInstance/mine` in separate tab. |
| F16 | **CreateLeaguePage** | Form: name, base league (dropdown from `/Data/leagues`), private toggle + password, max players, governance preset selector. POST to `/LeagueInstance`. |
| F17 | **JoinLeagueFlow** | After selecting a public league: fetch available teams (`/Game/leagueinstance/{id}/teams` → filter !isControlledByPlayer), pick team, select manager, optional password → POST `/LeagueInstance/join`. |
| F18 | **LeagueHubPage** (`/league/:leagueInstanceId`) | The main game screen after joining. Tabs/sidebar navigation to: Overview, Fixtures, Standings, My Team, Transfers, Press, Training, Tactics, Youth Academy, Chat. Shows current in-game date prominently. "Advance Day" and "Advance Until Match" buttons. |
| F19 | **LeagueOverviewTab** | Current date, next fixture for user, recent results (last 5), standings snapshot (top 5 + user position), latest press headlines (3). All fetched from respective Game endpoints. |
| F20 | **StandingsTab** | Full league table from `/Game/competition/{id}/standings`. Columns: pos, team (colored badge), P, W, D, L, GF, GA, GD, Pts. Highlight user's team row. Click team → team detail. |
| F21 | **FixturesTab** | Grouped by matchday from `/Game/leagueinstance/{id}/fixtures/grouped`. Each matchday collapsible. Completed fixtures show score. User's fixtures highlighted. Click fixture → match detail or "Play" button if it's the user's unplayed fixture. |
| F22 | **MyTeamTab** | From `/Game/leagueinstance/{id}/myteam`. Shows: team info card (name, colors, stadium, budget), squad table (sortable by position, overall, age, value, fitness, morale), staff list. |
| F23 | **PlayerDetailModal/Page** | From `/Game/player/{id}`. Shows all attributes as a radar/hexagon chart or bar chart. Contract info, languages, attributes. Position badge, age, nationality flag. |
| F24 | **TeamDetailPage** (`/league/:id/team/:teamInstanceId`) | From `/Game/team/{teamInstanceId}/detail`. Same as MyTeamTab but for any team. Read-only for non-owned teams. |

### Phase 2 — Match Experience
| ID | Task | Details |
|----|------|---------|
| F25 | **PreMatchPage** | Shown when AdvanceDay returns `playerMatchUpcoming`. Shows: fixture info (home vs away, date), formation selector dropdown, tactics selector. "Start Match" button. |
| F26 | **LiveMatchPage** | Full SignalR-driven match viewer. Connect to MatchHub, `JoinMatch(matchId)`. Listen for `MatchInfo` (team names, formations, weather, attendance), `MatchState` (tick, ball position, score, momentum, possession), `MatchEvent` (goals, cards, fouls — render in event feed). Show: scoreboard header, minute counter (tick/60), momentum bars, event timeline (scrollable), ball position indicator (simple pitch graphic). Pause/Resume buttons. Speech button (opens modal with type/target/tone selectors). |
| F27 | **PostMatchPage** | After `MatchEnded` event. Show final score, key events summary, option to generate match report (POST `/Press/match/{id}/report`). "Continue" button → back to league hub. |
| F28 | **MatchHistoryView** | For completed fixtures: fetch `/Match/{id}`, display events list, final score. Accessible from fixture list clicks. |

### Phase 3 — Management Features
| ID | Task | Details |
|----|------|---------|
| F29 | **TacticsTab** | List saved tactics (`/Tactic/team/{teamInstanceId}`). Create/Edit form: name, formation dropdown, sliders (defensive line, width, tempo, pressing 0-100), boolean toggles (counterAttack, playOutFromBack, directPassing, highPress, parkTheBus). Set default button. Delete non-default. |
| F30 | **TrainingTab** | List past sessions (`/Training/team/{teamInstanceId}`). Create session form: type dropdown (General/Attacking/Defending/Physical/Tactical/SetPiece/Recovery), intensity slider 0-100, optional focus attribute, optional excluded players multi-select. Show results: player name, fitness change, morale change, attribute improved. |
| F31 | **TransferTab** | Sub-tabs: Free Agents (`/Transfer/freeagents`), Make Offer form, Expiring Contracts (`/Contract/team/{teamId}/expiring`). Free agents table: sortable, filterable. Offer form: select player, offered fee, wage, contract years, loan toggle + loan fields. |
| F32 | **YouthAcademyTab** | Show academy info (`/YouthAcademy/team/{teamId}`). Upgrade button. Generate Intake button → show new youth players. Youth player cards with potential range bar. Promote button → confirms and calls API. |
| F33 | **PressTab** | Feed of press events (`/Press/league/{leagueInstanceId}`). Each event: headline, content preview, type badge (Positive/Negative/Scandal/Rumor), timestamp, impact indicators (reputation/morale/fanMood). |
| F34 | **ContractManagement** | Accessible from player detail. Show current contract. Extend form (additional years + new wage). Terminate button with confirmation. |

### Phase 4 — Social & Meta
| ID | Task | Details |
|----|------|---------|
| F35 | **ChatPage/Panel** | Thread list (`/chat/threads`), sorted by last message. Click thread → message list (`/chat/threads/{userName}`). Send message form. Connect to ChatHub for real-time. User search (`/api/users/search?q=`) to start new threads. Unread count badges. Mark-read on open. |
| F36 | **FriendsPage** | Friends list (`/Friendship`). Pending requests (`/Friendship/pending`) with accept/decline. Add friend: search users, send request. Remove/block actions. |
| F37 | **NotificationsDropdown** | In header. Fetch unread (`/Notification`). Mark individual or all as read. Badge count. Connect to NotificationHub for real-time push. Each notification links somewhere (linkUrl field). |
| F38 | **LeagueInvitesPanel** | Pending invites (`/LeagueInvite/pending`). Accept/decline. Send invite from league hub (search user → POST). |
| F39 | **ProfilePage** | Show/edit displayName, email. Change password form. List of user's managers. Stats: matchesPlayed, wins, draws, losses, trophies. |
| F40 | **VoteSkipPanel** | In league hub. Show vote status (`/Vote/status/{id}`). "Vote to Skip" button. Progress bar: X/Y votes. |

### Phase 5 — Polish & Advanced
| ID | Task | Details |
|----|------|---------|
| F41 | **InternationalTab** | List international teams. Upcoming breaks. Call-up interface (if user manages international team — future feature). Show which of user's players are called up. |
| F42 | **SaveManagement** | Export league (`/Save/export/{id}`). Import save. List past exports. |
| F43 | **AdminPanel** | Only if user.isAdmin. Seed data button. Create country/league/team/player forms. |
| F44 | **Responsive Layout** | Sidebar collapses to hamburger on mobile. Match view stacks vertically. Tables become card lists on small screens. |
| F45 | **Loading & Error States** | Every page: skeleton loaders while fetching. Error boundaries with retry. Toast notifications (sonner) for all mutations. Empty states with helpful messages. |
| F46 | **Dark Theme** | Tailwind dark mode. Toggle in header. Persist preference to localStorage. All components respect dark class. |

---

## Reusable Components Needed

Build these as you hit them — don't pre-build everything.

| Component | Used By | Notes |
|-----------|---------|-------|
| `Layout` (sidebar + header + main) | All authenticated pages | Sidebar: nav links context-aware (league-specific when inside a league). Header: user menu, notifications, theme toggle. |
| `DataTable<T>` | Standings, squad, fixtures, transfers, press | Generic typed table. Sortable columns, optional filters, optional pagination. |
| `PlayerCard` | Squad views, youth academy, search results | Compact: name, position badge, overall, age, nationality. |
| `FixtureCard` | Fixture lists | Home vs Away with colors, score if completed, date, status badge. |
| `FormField` | All forms | Label + input/select/slider + error message. Consistent styling. |
| `Modal` | Confirmations, player detail, speech, offer | Generic overlay with title, content slot, action buttons. |
| `Badge` | Position, status, event type | Colored pill with text. Variants: position, status, eventType. |
| `StatBar` | Player attributes, momentum | Horizontal bar with label, value, color based on value. |
| `PitchGraphic` | Live match | Simple SVG football pitch. Ball dot positioned by (ballX, ballY). Optional player dots. |
| `MomentumBar` | Live match | Dual-sided bar: home momentum left, away momentum right. |
| `TeamBadge` | Everywhere teams are shown | Colored circle/shield with team short name. Uses primaryColor. |
| `CountdownTimer` | Match halftime | Simple countdown from N seconds. |

---

## Key Implementation Notes

1. **State flow for "Advance Day":** Call POST `/Game/leagueinstance/{id}/advance`. Response contains `simulatedMatches[]` (show results), `playerMatchUpcoming` (if non-null → redirect to PreMatch), `newDate` (update gameStore). If `playerMatchUpcoming` is null and no matches → just update date and show toast.

2. **Match lifecycle:** PreMatch → user picks formation/tactics → `StartMatch` via SignalR (not REST) → MatchHub fires `MatchStarted` → listen for `MatchState` every ~1s → `MatchEvent` for goals/cards → `MatchEnded` with final score → PostMatch.

3. **SignalR MatchInfo event:** Fired on `JoinMatch` and on `StartMatch`. Contains `{ homeTeamName, awayTeamName, homeFormation, awayFormation, weather, attendance }`. Use this to populate the match header — don't rely on separate REST calls.

4. **Auth token refresh:** There is no refresh token endpoint. On 401 → just logout and redirect to login. Token lasts 7 days.

5. **Governance settings:** These control match simulation weights. For the frontend, the create league form should expose a preset selector (Balanced, Chaos, Realistic, etc.) with option to customize individual weights. Map the GovernanceSettingsDto fields to sliders.

6. **Player overall calculation:** `(pace + shooting + passing + dribbling + defending + physical) / 6`. This is consistent across backend — use the same formula on frontend for any local display.

7. **Positioning convention:** Ball/player positions are 0-100 on both X and Y. (0,0) is top-left of pitch. Home team attacks left→right.

---

## Prompt for Next Chat

Paste this entire file as context, then say:

> I need you to build the IronLeague frontend. The backend is complete — all endpoints are documented above. Start with Phase 0 (scaffold + infra), then Phase 1 core pages. I'll provide existing frontend files if any exist. Build everything in TypeScript, use the exact API surface documented here, and make it look like a proper football manager game — dark theme, clean data tables, team colors everywhere. Go.