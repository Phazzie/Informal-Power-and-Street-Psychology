# CHANGELOG & ARCHITECTURAL LESSONS LEARNED

## Overview
This document chronicles the "Zero-Slack Architecture" pivot. The application transformed from a standard React/Express prototype into a robust, Test-Driven, Hexagonal (Ports & Adapters) production system designed to withstand adversarial penetration testing and prevent common React anti-patterns.

## The Bounty Hunter Audit (Phase 1-6) completely resolved.

### Change Log

**1. Hexagonal Dependency Injection (Seam Driven Development)**
*   **Removed:** Hardcoded imports to `dbService.ts`, `liveService.ts`, and `aiService.ts`.
*   **Added:** Strict Typescript Interfaces (`ILLMPort`, `IStoragePort`, `IMediaPort`, `IRealtimePort`).
*   **Added:** `DIContext.tsx` to handle providing Concrete Adapters (e.g. `FirebaseStorageAdapter`, `HttpLLMAdapter`).
*   **Result:** The UI no longer knows *how* the database or LLM works. It only knows the contract. This makes offline testing and backend swaps mathematically safe.

**2. The Impenetrable Backend (Security & Integrity)**
*   **Added:** `express-rate-limit` to prevent brute force quota attacks against `/api/analyze`.
*   **Added:** `zod` schema runtime validation on all Express boundaries. Malformed JSON drops immediately before parsing.
*   **Added:** Enterprise telemetry via `winston` and `helmet` for HTTP headers. UUIDs are generated per request for error tracing.
*   **Added:** Strict Firebase JWT Authentication (`auth.middleware.ts`) across REST points, and a secure 30-second ticking system (`ticketCache.ts`) to authorize WebSocket connections since standard `ws:` protocols do not support HTTP Authorization Headers natively.

**3. Frontend Performance Vanguard**
*   **Added:** `React.memo` isolation for Chat messages with a custom `areEqual` function, entirely eliminating the DOM Meltdown caused by high-frequency chunk streaming from the Gemini API repainting the entire markdown history.
*   **Added:** `AbortController` injection across `useChat` and `useAnalysis` through to the `ILLMPort`. If a user swaps views, the fetch race conditions are aborted, saving memory and CPU spikes.
*   **Added:** Complete un-drilling of props via `AppProvider` context machine. UI states (`isImporting`, `isVoiceOpen`) are now explicit Reducer dispatches (`dispatch({ type: 'OPEN_VOICE' })`), mathematically preventing impossible UI states.
*   **Added:** Background asynchronous upload. Import events fire and aggressively update React UI immediately while utilizing `FirebaseStorageAdapter`'s native IndexedDB offline capabilities.

**4. Rich Domain Entities & Vitest Initialization**
*   **Added:** `ProjectEntity.ts` moving business logic ("addConversation", "addMessage") out of raw React components and into encapsulated ES6 Classes using strict validation.
*   **Added:** `vitest` assertions locally to enforce Domain encapsulation rules and API `Zod` schemas.

**5. ADA Topography compliance**
*   **Added:** `react-focus-lock` to all Modals, locking tab traversals out of the background.
*   **Added:** Rigorous `aria-labels` and `aria-live="polite"` feedback mechanisms.

---

## Lessons Learned & Systemic Philosophies

1. **"Boolean Soup" is a Time Bomb:**
   Having components manage `isLoading`, `isError`, and `isSuccess` independently inevitably leads to a state where `isLoading=true` and `isError=true` simultaneously. Refactoring `useChat.ts` to `useReducer` proved that State Machines eliminate this class of bug entirely.

2. **Wait for DOM, not for Network (Optimistic UI):**
   Rethinking the "Save" workflow inside `App.tsx` from an `await` blocking operation into a fire-and-forget payload over an offline-capable Adapter drastically improved the app's snappy, responsive feel. We must trust our Reducer to update UI instantly.

3. **SDKs are Hidden Technical Debt:**
   Before this refactor, `useAnalysis` directly invoked `geminiService` which explicitly required Google's SDK shape. By mapping the payload down to an `ILLMPort`, we reclaimed ownership of our data flow. If we ever swap to Anthropic or OpenAI, only the `HttpLLMAdapter` changes. The React frontend is completely unaware of the shift.

4. **WebSockets are Blind to Auth Headers:**
   A critical security realization occurred. You cannot inject `Authorization: Bearer` headers securely into native browser `new WebSocket(url)` constructors. Writing a secondary REST `/ticket` endpoint to exchange a JWT for a 30-second UUID token solved the gap without compromising the backend firewall.

5. **Security starts at the Seam (Validation):**
   Typescript only guarantees boundaries at compile time. Real-world JSON payloads will lie. Using `zod` at the very edge of the API enforces the Typescript contract at runtime. 
    
END OF REPORT.
