# IronLeague Fix Plan — Opus 4.6 Reference Document

> **Purpose**: This document is a sequenced task list for an AI assistant (Claude Opus 4.6) to implement fixes across multiple chat sessions. Each task is self-contained with exact file paths, what to change, and why. The human will paste relevant source files per task.
>
> **Project**: IronLeague — ASP.NET Core 8 backend + React/TypeScript (Vite) frontend. Football manager multiplayer game.
>
> **Deployment**: Windows (case-insensitive FS — import casing is cosmetic, not blocking)
>
> **Key conventions**: No inline comments. Minimal comments. Consistent naming (PascalCase C#, camelCase TS). Records for DTOs. Services behind interfaces. Controllers thin, services fat.

---

## PHASE 1: BACKEND CRITICAL FIXES

These are bugs in existing, UI-facing features that are currently broken or silently wrong.

---

### TASK B01 — Fix AdminController.IsAdmin() claim check

**File**: `backend/Controllers/AdminController.cs`
**Problem**: `IsAdmin()` checks for claim `"IsAdmin"` with value `"True"`, but the JWT generation in `AuthController.GenerateJwt()` never emits this claim. It only emits role claims (`ClaimTypes.Role`). Result: admin endpoints always return 403.
**Fix**: Either (a) add `new Claim("IsAdmin", user.IsAdmin.ToString())` to the claims list in `AuthController.GenerateJwt()`, or (b) change `IsAdmin()` in AdminController to check `User.IsInRole("Admin")`. Option (b) is cleaner since roles are already working.
**Scope**: Small — one method change.

---

### TASK B02 — Fix TransferController.CreateOffer (dead endpoint)

**File**: `backend/Controllers/GameController.cs` (TransferController class is in this file)
**Problem**: `TransferController.CreateOffer` ignores the userId, never calls `_transferService.CreateOfferAsync()`, and returns `Ok()` with no body. It's supposed to create a transfer offer from the logged-in user's manager.
**Fix**: Get userId from claims, find the user's manager, call `_transferService.CreateOfferAsync(manager.Id, dto)`, return the result or BadRequest.
**Scope**: Small — ~10 lines in one method.

---

### TASK B03 — Fix MatchHub static dictionaries (thread safety)

**File**: `backend/Hubs/MatchHub.cs`
**Problem**: `_runningMatches` is `Dictionary<Guid, CancellationTokenSource>` (not thread-safe). `_matchConnections` is `Dictionary<Guid, HashSet<string>>` with manual `lock` blocks, but `_runningMatches` has no locking. Under concurrent connections this will throw or corrupt.
**Fix**: Change both to `ConcurrentDictionary`. For `_matchConnections`, the values need `lock` on individual `HashSet` access or switch to `ConcurrentBag`/`ConcurrentDictionary<string,byte>`. Remove manual lock blocks where ConcurrentDictionary methods suffice.
**Scope**: Medium — restructure static state management in the class.

---

### TASK B04 — Fix MatchState DB accumulation (performance bomb)

**File**: `backend/Services/MatchEngine.cs` — `ProcessTickAsync` method
**Problem**: Every tick (5400 per match) creates a new `MatchState` entity and calls `SaveChangesAsync()`. That's 5400 DB writes + 5400 rows in the MatchStates table per match. This will destroy DB performance.
**Fix**: 
1. Keep only the current state in memory during the match. Do NOT write a MatchState row every tick.
2. Save MatchState snapshots only at key moments: kickoff, halftime, fulltime, goals, and every ~5 minutes (every 300 ticks).
3. Always persist the final state on match end.
4. The `ProcessTickAsync` method should return the state object without adding it to `match.States` collection every tick. Add a `ShouldSnapshot(int tick, bool hasKeyEvent)` helper.
5. Still call `SaveChangesAsync` periodically (every ~60 ticks / 1 real second) to persist score changes and events, but NOT the full MatchState.
**Files affected**: `MatchEngine.cs` (ProcessTickAsync), `MatchHub.cs` (RunMatchSimulation — it reads from match.States)
**Scope**: Medium — core loop refactor.

---

### TASK B05 — Fix MatchHub live broadcast missing team names

**Files**: `backend/Hubs/MatchHub.cs` — `JoinMatch` and `RunMatchSimulation` methods
**Problem**: When a client joins a match, `JoinMatch` sends the full MatchDto via `GetMatchAsync`, which includes team names. But during `RunMatchSimulation`, the `MatchState` broadcast only sends tick/ball/score data — no team info. If the client connects after the match started, the initial `MatchState` from `JoinMatch` has team info, but subsequent broadcasts don't. The frontend's `matchData` variable only updates if the SignalR message contains `homeTeam`/`awayTeam` properties. After the first state update from `RunMatchSimulation`, the team names get lost because subsequent messages overwrite `matchState` without team info.
**Fix**: On `JoinMatch`, send a separate `MatchInfo` event with static match data (team names, colors, formations, weather, attendance). The tick broadcasts should stay lightweight. Frontend should listen for `MatchInfo` separately from `MatchState`.
**Scope**: Small-Medium — add one new hub event, adjust frontend listener.

---

### TASK B06 — Fix YouthAcademyService missing Include

**File**: `backend/Services/GameServices.cs` — `YouthAcademyService.GenerateIntakeAsync`
**Problem**: Query is `_db.Set<YouthAcademy>().Include(a => a.Team)` but never includes `.ThenInclude(t => t.League)`. So `academy.Team.League?.CountryCode` is always null, defaulting every youth player nationality to "ENG".
**Fix**: Add `.ThenInclude(t => t.League)` to the query. Also the nationality should probably come from the team's country code via the league, not hardcoded fallback.
**Scope**: Tiny — one line.

---

### TASK B07 — Fix PressService.GenerateTransferRumorAsync wrong FK

**File**: `backend/Services/GameServices.cs` — `PressService.GenerateTransferRumorAsync`
**Problem**: Sets `LeagueInstanceId = player.Team?.LeagueId ?? Guid.Empty`. `LeagueId` is the base `League.Id` (template league), NOT a `LeagueInstance.Id`. This will either fail FK constraint or store garbage data.
**Fix**: This method needs context about which LeagueInstance the rumor belongs to. Add `Guid leagueInstanceId` parameter, or derive it by finding the LeagueTeamInstance that references this team's base team. Simplest: add the parameter and require callers to pass it.
**Scope**: Small — signature change + callers.

---

### TASK B08 — Fix SimulationService day advance with no fixtures

**File**: `backend/Services/SimulationService.cs` — `AdvanceDayAsync`
**Problem**: When there are no fixtures on the current day, the method advances the date and returns `Success=true` with empty `SimulatedMatches` and null `Message`. The frontend has no feedback that "nothing happened today, just advanced the calendar."
**Fix**: Add a message like `"Day advanced. No matches today."` when `todaysFixtures` is empty. Also: this is where training sessions, press events, and international break processing SHOULD be triggered. For now, just add the message. The service integrations come in Phase 3.
**Scope**: Tiny — add one conditional message.

---

### TASK B09 — Wire ManagerDto to include LeagueInstanceId

**File**: `backend/Services/GameServices.cs` — `ManagerService.MapManager`
**Problem**: The `ManagerDto` record does not include `LeagueInstanceId`. The frontend type `Manager` has `leagueInstanceId?: string` and uses it to filter managers in the join modal (`managers.filter(m => !m.leagueInstanceId)`). Since it's never returned, the filter never works — managers already in a league still appear in the join modal.
**Fix**: Add `Guid? LeagueInstanceId` to `ManagerDto` record. Update `MapManager` to include `m.LeagueInstanceId`.
**File also**: `backend/Model/DTOs.cs` — `ManagerDto` record definition.
**Scope**: Tiny — two lines.

---

## PHASE 2: BACKEND NEW FEATURES

### TASK B10 — Implement ChatController with entities

**Files to create/modify**:
- `backend/Model/Entities.cs` — add `DirectThread`, `DirectThreadMember`, `DirectMessage` entities
- `backend/Data/AppDbContext.cs` — add DbSets and configure relationships
- `backend/Controllers/ChatController.cs` — uncomment and fix
- `backend/Hubs/` — optionally add a `ChatHub.cs` for real-time messages
- New migration needed after entity changes

**Entities to add**:
```
DirectThread: Id (Guid), CreatedAt (DateTime)
DirectThreadMember: Id (Guid), ThreadId (Guid FK→DirectThread), UserId (Guid FK→AppUser)  
DirectMessage: Id (Guid), ThreadId (Guid FK→DirectThread), SenderId (Guid FK→AppUser), 
  Content (string), SentAt (DateTime), ReadAt (DateTime?), IsEncrypted (bool)
```

**Notes**: The existing commented-out ChatController references encrypted messaging fields (KeyId, NonceB64, MacB64, CiphertextB64, BodyHashHex). For now, implement plain text messaging — encryption is a future concern. Drop the crypto fields and use a simple `Content` string field. Keep the thread-based model (1:1 DMs via threads).

**Controller endpoints**:
- `GET /api/chat/threads` — list my threads with last message preview and unread count
- `GET /api/chat/threads/{withUserName}` — get messages with a specific user
- `POST /api/chat/start` — create or get thread with another user
- `POST /api/chat/send` — send a message (body: `{ threadId, content }`)
- `POST /api/chat/mark-read/{withUserName}` — mark messages as read
- `GET /api/users/search?q=` — search users by username (for starting new chats)

**Optional**: Add `ChatHub` for real-time message delivery via SignalR group per thread.

**Scope**: Large — new entities, migration, full controller, optional hub.

---

### TASK B11 — Add controllers for dormant services (Tactics)

**File to create**: `backend/Controllers/TacticController.cs`
**Service**: `ITacticService` (already implemented in `GameServices.cs`)
**Endpoints**:
- `GET /api/tactic/{id}` — get tactic by id
- `GET /api/tactic/team/{teamInstanceId}` — get all tactics for a team
- `POST /api/tactic/team/{teamInstanceId}` — create tactic
- `PUT /api/tactic/{id}` — update tactic
- `DELETE /api/tactic/{id}` — delete tactic
- `POST /api/tactic/team/{teamInstanceId}/default/{tacticId}` — set default

**Auth**: All endpoints require `[Authorize]`. Validate that the requesting user's manager owns the team instance.
**Scope**: Small — thin controller, service already done.

---

### TASK B12 — Add controllers for dormant services (Training)

**File to create**: `backend/Controllers/TrainingController.cs`
**Service**: `ITrainingService` (already implemented)
**Endpoints**:
- `GET /api/training/{sessionId}` — get session
- `GET /api/training/team/{teamInstanceId}` — get recent sessions
- `POST /api/training/team/{teamInstanceId}` — create session
- `POST /api/training/{sessionId}/process` — process training results

**Scope**: Small.

---

### TASK B13 — Add controllers for dormant services (Youth Academy)

**File to create**: `backend/Controllers/YouthAcademyController.cs`
**Service**: `IYouthAcademyService` (already implemented)
**Endpoints**:
- `GET /api/youthacademy/team/{teamId}` — get academy
- `POST /api/youthacademy/team/{teamId}` — create academy
- `POST /api/youthacademy/{academyId}/upgrade` — upgrade
- `POST /api/youthacademy/{academyId}/intake` — generate intake
- `POST /api/youthacademy/promote/{youthPlayerId}` — promote to senior

**Scope**: Small.

---

### TASK B14 — Add controllers for dormant services (Friendships)

**File to create**: `backend/Controllers/FriendshipController.cs`
**Service**: `IFriendshipService` (already implemented)
**Endpoints**:
- `GET /api/friendship` — get friends
- `GET /api/friendship/pending` — get pending requests
- `POST /api/friendship/request` — send request (body: `{ userId }`)
- `POST /api/friendship/{id}/accept` — accept
- `POST /api/friendship/{id}/decline` — decline
- `DELETE /api/friendship/{id}` — remove friend
- `POST /api/friendship/block/{userId}` — block user

**Scope**: Small.

---

### TASK B15 — Add controllers for dormant services (League Invites)

**File to create**: `backend/Controllers/LeagueInviteController.cs`
**Service**: `ILeagueInviteService` (already implemented)
**Endpoints**:
- `GET /api/leagueinvite/pending` — get pending invites
- `POST /api/leagueinvite` — send invite
- `POST /api/leagueinvite/{id}/accept`
- `POST /api/leagueinvite/{id}/decline`
- `DELETE /api/leagueinvite/{id}` — cancel

**Scope**: Small.

---

### TASK B16 — Add controllers for dormant services (Press)

**File to create**: `backend/Controllers/PressController.cs`
**Service**: `IPressService` (already implemented)
**Endpoints**:
- `GET /api/press/league/{leagueInstanceId}` — get press events
- `POST /api/press/match/{matchId}/report` — generate match report
- `POST /api/press/scandal` — generate scandal (admin/test)
- `POST /api/press/rumor` — generate transfer rumor (admin/test)

**Scope**: Small.

---

### TASK B17 — Add controllers for dormant services (Contracts)

**File to create**: `backend/Controllers/ContractController.cs`
**Service**: `IContractService` (already implemented)
**Endpoints**:
- `GET /api/contract/player/{playerId}` — get contract
- `POST /api/contract` — create contract
- `DELETE /api/contract/player/{playerId}` — terminate
- `PUT /api/contract/player/{playerId}/extend` — extend (body: `{ additionalYears, newWage? }`)
- `GET /api/contract/team/{teamId}/expiring` — get expiring contracts

**Scope**: Small.

---

### TASK B18 — Add controllers for dormant services (International)

**File to create**: `backend/Controllers/InternationalController.cs`
**Service**: `IInternationalService` (already implemented)
**Endpoints**:
- `GET /api/international/teams` — list international teams
- `GET /api/international/teams/{id}` — get team detail
- `GET /api/international/breaks` — upcoming breaks
- `GET /api/international/breaks/{id}/callups` — callups for a break
- `POST /api/international/callup` — call up player
- `POST /api/international/breaks/{id}/process-return` — process break return

**Scope**: Small.

---

### TASK B19 — Add controllers for dormant services (remaining)

**File to create**: `backend/Controllers/MiscController.cs` (or split into individual files)
**Services**: `IVoteService`, `ISaveExportService`, `IInGameInstructionService`
**Endpoints**:
- `POST /api/vote/skip` — vote to skip (body: `{ leagueInstanceId }`)
- `GET /api/vote/status/{leagueInstanceId}` — vote status
- `POST /api/save/export/{leagueInstanceId}` — export save
- `POST /api/save/import` — import save
- `GET /api/save/exports` — list user's exports
- `GET /api/instructions` — get all in-game instructions
- `GET /api/instructions/available` — get available for manager reputation
- `POST /api/instructions/seed` — seed defaults (admin)

**Scope**: Small-Medium.

---

### TASK B20 — Integrate services into simulation loop

**File**: `backend/Services/SimulationService.cs` — `AdvanceDayAsync`
**Problem**: Day advancement only processes fixtures. Training, press events, international breaks, contract expirations, youth academy intake — none of it runs.
**Fix**: After processing fixtures, add calls to:
1. Auto-run a default training session for AI teams (if a match wasn't played that day)
2. Random press event generation (~5% chance per day)
3. Check if current date falls within an international break → process callups/returns
4. (Future) Check for expiring contracts warnings

Inject `ITrainingService`, `IPressService`, `IInternationalService` into SimulationService.
**Scope**: Medium — wiring multiple services together with conditional logic.

---

## PHASE 3: FRONTEND FIXES

---

### TASK F01 — Fix Match page: listen for MatchInfo event for team names

**File**: `frontend/src/pages/Match.tsx`
**Problem**: Team names show as "Home" / "Away" during live matches because the SignalR `MatchState` broadcast doesn't include team info.
**Fix**: After connecting to the hub, listen for a new `MatchInfo` event (added in TASK B05) that sends `{ homeTeamName, awayTeamName, homeTeamColor, awayTeamColor, weather, attendance, homeFormation, awayFormation }`. Store this in `matchData`. Fall back to the initial MatchDto data from `JoinMatch` if `MatchInfo` hasn't arrived yet.
**Depends on**: TASK B05.
**Scope**: Small.

---

### TASK F02 — Fix SpeechModal: pass actual players

**File**: `frontend/src/pages/Match.tsx`
**Problem**: `<SpeechModal players={[]} />` — always empty array. "Single Player" target is unusable.
**Fix**: When match data loads (from the initial `MatchState` or `MatchInfo` event), extract the player list for the user's team. Pass it to `SpeechModal`. If player list isn't available from SignalR, fetch it via REST (`/api/game/team/{teamInstanceId}/detail`) using the team ID from match info.
**Scope**: Small-Medium.

---

### TASK F03 — Fix LeagueDetail available teams logic

**File**: `frontend/src/pages/LeagueDetail.tsx` — `loadLeague` function
**Problem**: Finds base league by string name comparison (`baseLeagues.find(l => l.name === leagueData.baseLeagueName)`). Fragile.
**Fix**: The `LeagueInstance` already has `baseLeagueId` (returned from backend but not currently on the frontend type). Add `baseLeagueId?: string` to the `LeagueInstance` type, then use it directly instead of name matching.
**Files**: `frontend/src/types/index.ts` (add field), `frontend/src/pages/LeagueDetail.tsx` (use it).
**Scope**: Tiny.

---

### TASK F04 — Add frontend API + pages for Chat

**Files to create**:
- `frontend/src/api/chat.ts` — API client for chat endpoints
- `frontend/src/pages/Chat.tsx` — chat page with thread list and message view
- `frontend/src/lib/signalr.ts` — add `ChatHubClient` class (if B10 includes ChatHub)

**Files to modify**:
- `frontend/src/App.tsx` — add `/chat` route
- `frontend/src/components/Layout.tsx` — add Chat nav item
- `frontend/src/types/index.ts` — add `ChatThread`, `ChatMessage` types

**UI spec**:
- Left panel: list of threads (other user's name, last message preview, unread badge)
- Right panel: message list with input at bottom
- User search to start new conversation
- Real-time message delivery if ChatHub exists, otherwise poll

**Scope**: Large.

---

### TASK F05 — Add frontend API + pages for Tactics

**Files to create**:
- `frontend/src/api/tactics.ts`
- `frontend/src/pages/TacticEditor.tsx` — formation picker, sliders for line/width/tempo/pressing, toggles for style options

**Files to modify**:
- `frontend/src/types/index.ts` — add `Tactic` type
- `frontend/src/pages/TeamDetail.tsx` — add "Tactics" tab
- `frontend/src/pages/Match.tsx` — add tactical change button (calls hub or REST)

**Scope**: Medium-Large.

---

### TASK F06 — Add frontend for Training, Youth Academy

**Files to create**:
- `frontend/src/api/training.ts`
- `frontend/src/api/youthAcademy.ts`
- Components/sections within `TeamDetail.tsx` or new pages

**Scope**: Medium.

---

### TASK F07 — Add frontend for Friendships, League Invites, Notifications panel

**Files to create/modify**:
- `frontend/src/api/friendships.ts`
- `frontend/src/api/leagueInvites.ts`
- `frontend/src/components/NotificationPanel.tsx` — dropdown in Layout showing unread notifications
- `frontend/src/pages/Friends.tsx`
- Update `Layout.tsx` nav + notification bell icon
- Connect `NotificationHub` via SignalR for real-time notification badges

**Scope**: Medium-Large.

---

### TASK F08 — Add frontend for Press, Contracts, International

**Lower priority UI work**:
- Press events feed in LeagueDetail (new tab)
- Contract details in PlayerDetail (already partially there)
- International section (low priority — mostly admin/background system)

**Scope**: Medium.

---

## PHASE 4: POLISH

### TASK P01 — Split GameController into focused controllers

**File**: `backend/Controllers/GameController.cs`
**Problem**: 15+ endpoints, 7 injected services, god controller.
**Fix**: Keep `GameController` for simulation/advance endpoints only. Move team endpoints to a dedicated controller, competition/standings to another, fixture queries to another. Player search/detail already partially lives in GameController but should be in a `PlayerController`.
**Scope**: Medium — refactor, no logic changes.

---

### TASK P02 — Add global exception handling middleware

**File to create**: `backend/Middleware/ExceptionMiddleware.cs`
**Register in**: `backend/Program.cs`
**Behavior**: Catch unhandled exceptions, log them, return consistent `ErrorDto` JSON response. Don't leak stack traces in production.
**Scope**: Small.

---

### TASK P03 — Add pagination to list endpoints

**Priority endpoints**: Player search, fixture lists, press events, notifications.
**Pattern**: Use `PagedResultDto<T>` (already defined in DTOs) with `page` and `pageSize` query params.
**Scope**: Medium — touches multiple controllers and services.

---

## EXECUTION ORDER (recommended)

```
B01 → B02 → B09 → B06 → B07 → B08  (quick fixes, 30 min total)
B03 → B04 → B05                      (match system fixes)
F01 → F02 → F03                      (frontend fixes for match + league)
B10                                   (chat backend)
F04                                   (chat frontend)  
B11 → B12 → B13 → B14 → B15 → B16 → B17 → B18 → B19  (controller stubs)
B20                                   (simulation integration)
F05 → F06 → F07 → F08               (frontend for new features)
P01 → P02 → P03                      (polish)
```

---

## NOTES FOR AI SESSIONS

- Human will paste the relevant source file(s) per task and reference the task ID (e.g., "do B04").
- Respond with the **complete modified file** or **complete new file** — no partial snippets, no diffs.
- If a task says "File to create", write the full file from scratch.
- If a task modifies an existing file, the human will paste the current version. Return the full updated version.
- No inline comments unless the human asks.
- Keep the same code style as existing files (records for DTOs, expression-bodied members where already used, etc.)
- If a new DB migration is needed, mention it but don't generate migration files — human will run `dotnet ef migrations add X`.