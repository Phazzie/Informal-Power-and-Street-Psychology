# THE ZERO-SLACK ARCHITECTURE & SECURITY MASTER PLAN

This document merges strict Clean Architecture (SOLID, KISS, DRY) with adversarial SRE / Penetration Testing constraints. It is the roadmap to a diamond-grade, unbreakable production system.

## PHASE 1: THE IMPENETRABLE BACKEND (SECURITY & INTEGRITY)
- [x] **1.1 Authenticated REST APIs (`firebase-admin`):** The `/api/chat` and `/api/analyze` routes are currently unprotected open proxies. We must implement an Express middleware that verifies Firebase JWT `Authorization: Bearer <token>` headers to ensure only authenticated users can spend the Gemini API quota. [COMPLETED]
- [x] **1.2 WebSocket Ticketing:** The `/api/live` WebSocket cannot send headers. We must expose an `/api/live/ticket` REST endpoint that dispenses a 30-second cryptographic ticket, which the client passes in the WS query parameters for validation. [COMPLETED]
- [x] **1.3 Compute Rate Limiting:** Implement `express-rate-limit` to prevent brute-force or buggy clients from exhausting backend memory and triggering Google API blacklists. [COMPLETED]
- [x] **1.4 Runtime Boundary Validation (Zod):** Express routes and WebSockets currently blindly trust JSON payloads. We will enforce strict `zod` schemas on every request; if a payload is malformed, it drops immediately with a 400 Bad Request. [COMPLETED]
- [x] **1.5 Telemetry & Global Exception Filter:** Eradicate `console.log`. Funnel all crashes through an Express Global Error Middleware with request-tracing UUIDs. [COMPLETED - Winston logging + Helmet + Error Filter]

## PHASE 2: THE FRONTEND PERFORMANCE VANGUARD
- [x] **2.1 The DOM Meltdown Fix (Markdown Memoization):** Isolate individual Chat messages in a `React.memo` component with a custom `areEqual` function. Stop the entire chat history from re-parsing React-Markdown on every high-frequency AI stream chunk. [COMPLETED]
- [ ] **2.2 Optimistic UI & Offline Queues:** Prevent Silent Data Loss. When pushing a chat message or saving a project, update the UI instantly. If the network call fails, catch the error, inform the user, and queue the payload locally (IndexedDB/Fallback).
- [x] **2.3 Network Race Condition Abortions:** Use `AbortController`. If a user clicks away while an analysis or chat is streaming, kill the fetch request to free up CPU and network overhead. [COMPLETED on LLM requests]
- [x] **2.4 Bulletproof UX States:** Replaced `window.alert()` with non-blocking Toasts and wrapped application in a top-level `ErrorBoundary` catching fatal renders. [COMPLETED]

## PHASE 3: STRUCTURAL SOLID PURITY (REFACTORING)
- [x] **3.1 Annihilate Prop-Drilling:** `AppLayout.tsx` takes too many props. Implement `ProjectContext` and `AuthContext` to segregate data so child components request their own dependencies directly, eliminating middleman component coupling. [COMPLETED utilizing AppProvider]
- [x] **3.2 Hexagonal Dependency Injection:** Stop hardcoding `dbService.ts` inside `useAnalysis`. Create TypeScript interfaces (`IStoragePort`) and inject the adapter. [COMPLETED]
- [x] **3.3 Explicit State Machines:** Replace the "boolean soup" (`isImporting`, `isLoading`, `isVoiceOpen`) with a strictly typed `useReducer` State Machine to mathematically prevent impossible UI states. [COMPLETED for App / useChat]
- [ ] **3.4 Rich Domain Entities:** Upgrade data interfaces to ES6 Classes that encapsulate their own validation logic (e.g., `project.addConversation()`) instead of letting React components mutate raw arrays.

## PHASE 4: ACCESSIBILITY & ADA COMPLIANCE
- [x] **4.1 Focus Trapping:** Lock the keyboard `Tab` loop inside Modals (`FileImport`, `VoiceSession`) so screen readers don't wander into the background. [COMPLETED using react-focus-lock]
- [x] **4.2 ARIA Topography:** Apply rigorous `aria-labels`, `role="status"`, and `aria-live="polite"` tags to the chat typing indicators and icon buttons. [COMPLETED]

## PHASE 5: THE SEAM TESTS
- [ ] **5.1 Vitest / Supertest Initialization:** Write pure automated assertions for the core State Machine and backend validation rules.

## PHASE 6: SEAM DRIVEN DEVELOPMENT (SDD) ENFORCEMENT AUDIT
*A bounty hunter auditing the app for Testability and Port/Adapter boundaries would identify severe tightly coupled monolithic blocks that make unit testing practically impossible without mocking entire environments.*

- [x] **6.1 The Hardware Lock (Microphone Port):** `liveService.ts` calls `navigator.mediaDevices.getUserMedia` directly. This makes it impossible to run automated tests in a CI pipeline (which has no physical microphone). 
  *Fix:* We must define an `IMediaPort` interface that defines `getAudioStream()`. The production app injects a `BrowserMediaAdapter`, while the test suite injects a `MockMediaAdapter`. [COMPLETED]
- [x] **6.2 The SDK Lock (LLM Port):** `aiService.ts` tightly couples the Google GenAI SDK. If we wanted to test the chat history parsing logic offline, we would trigger real network requests or be forced to write massive mocking libraries for Google's specific SDK structure.
  *Fix:* Define an `ILLMPort` interface outlining `analyzeVoice()` and `streamChat()`. The backend logic tests against an `InMemoryLLMAdapter` to prove behavior. [COMPLETED]
- [x] **6.3 The Database Lock (Storage Port):** React hooks (`useAnalysis`, `useChat`) directly call `dbService.ts`, which reaches straight into Firebase.
  *Fix:* React components should rely on a generic `IStoragePort`. This prevents the "Mocking Firebase" anti-pattern. We simply inject a fake map-based implementation during TDD to prove the UI updates locally. [COMPLETED]
- [x] **6.4 Temporal Decoupling (Time Port):** Direct calls to `Date.now()` or `new Date()` within domain logic make testing date-based features (e.g. active timeouts, JWT evaluations) flaky. We need to inject an `ITimeProvider`. [COMPLETED]
