# ATOMIC ZERO-SLACK REMEDIATION CHECKLIST

This document translates the Bounty Hunter Audit feedback into granular, exact, testable tasks for immediate execution. These apply to Type Safety, Tight Coupling, God Objects, Weak Dependency Injection, Vulnerabilities, Validation Constraints, Magic Strings, Code Duplicaton, Test Coverage, and Missing Config Patterns.

## PHASE 1: TYPE SAFETY (`any` DEBT) & VALIDATION
- [ ] 1.1 **Remove Type Bypass in `useChat.ts`:** Replace `catch (error: any)` with strict unknown/Error casting. Ensure `ConversationMessage` mapping is exact.
- [ ] 1.2 **Remove Type Bypass in `Chat.tsx`:** Fix `handleSubmit(e as any)` inside `onKeyDown` by properly typing `React.KeyboardEvent`.
- [ ] 1.3 **Remove Type Bypass in `App.tsx`:** Replace `catch (e: any)` in `handleImport` with Error guard.
- [ ] 1.4 **Secure JSON Ingestion (`parser.ts`):** 
  - Add strict `Zod` validation schemas for Imported Projects and Messages.
  - Ban `any` in `parseClaudeExport`.
- [ ] 1.5 **Eliminate Math API for Crypto (`parser.ts`):** Replace `Math.random().toString(36)` with `uuidv4()` or standard `crypto.randomUUID()`.

## PHASE 2: TIGHT COUPLING & MAGIC STRINGS
- [ ] 2.1 **Create `config/constants.ts`:** Extract endpoints (`/api/analyze`, `/api/chat`, `/api/live/ticket`), local storage keys, and WS protocol URLs.
- [ ] 2.2 **Harmonize Context Limits:** Define `MAX_AUTHOR_VOICE_BYTES = 200000` in `config/constants.ts` and uniformly enforce it across `parser.ts` validation and `routes.ts` Zod validation, replacing the scattered 50000/100000/200000 limits.
- [ ] 2.3 **Refactor Adapters to Constants:** Eradicate string URLs in `HttpLLMAdapter` and `WebsocketRealtimeAdapter`, pointing them to `config/constants.ts`.

## PHASE 3: ENVIRONMENTAL CONFIGURATION
- [ ] 3.1 **Create `config/environment.ts`:**
  - Map `process.env` (for Backend) and `import.meta.env` (for Vite Frontend) onto a unified exported `env` structure.
  - Remove hardcoded model invocations in backend and map to `env.MODEL_NAME_FLASH` or `env.GEMINI_LIVE_MODEL`.
- [ ] 3.2 **Refactor AIService to Config:** Inject model definitions gracefully instead of statically typing `gemini-2.5-flash`.

## PHASE 4: GOD OBJECT FRAGMENTATION
- [ ] 4.1 **Split `AnalysisDashboard` (240 lines):** Fragment into `PlotTab.tsx`, `CharacterTab.tsx`, `VoiceTab.tsx`, and `ThemeTab.tsx` located in `src/components/dashboard/`.
- [ ] 4.2 **Split `App.tsx` (216 lines):** Isolate the "Empty State / Welcome Page" and "Loading State" into dedicated components, leaving `App.tsx` strictly responsible for Layout composition and Data wire-up.
- [ ] 4.3 **Fragment `AIService.ts` (132 lines):** Split text-based GenAI orchestration and WebSockets Live configuration logic into two explicit services (e.g., `TextAIService.ts` and `LiveAIService.ts`).

## PHASE 5: CODE DUPLICATION & WEAK DI
- [ ] 5.1 **Centralize Voice Extraction:** Move the `exportAuthorVoice` logic from `utils/parser.ts` explicitly into `ProjectEntity.ts` as `project.getAuthorVoiceBlob()`. Delete the scattered inline parsing found in the codebase.
- [ ] 5.2 **Graceful Downgrade DI Context:** Modify `DIContext.tsx` and `main.tsx`. If `BrowserMediaAdapter` throws an error because the browser has no physical Microphone hardware (e.g. CI environments), it should cleanly wrap the container injection and gracefully disable the "Live" feature instead of crashing the Container injection tree.

## PHASE 6: SILENT ERROR & TEST INJECTIONS
- [ ] 6.1 **Destroy Empty Catch Blocks:** Re-write `try { ... } catch (e) {}` in `websocket.ts:65` with the `winston` structured server logger equivalent to actively log WebSocket proxy failure metrics.
- [ ] 6.2 **Missing Test Vectors:** 
  - Add `HttpLLMAdapter.test.ts` to mock `IAuthPort` and test the fetch proxy bounds.
  - Add `parser.test.ts` to strictly test the Zod implementations resolving the legacy Math.random structures.
