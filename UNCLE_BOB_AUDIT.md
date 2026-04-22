# THE UNCLE BOB / BOUNTY HUNTER REPORT

Below is the definitive list of critical code smells, security leaks, anemic structures, and missing protections identified during the Zero-Slack audit. They represent the barrier to true hexagonal, secure, memory-safe perfection.

## 1. Memory Leak (Backend Ticket Cache)
`ticketCache.ts` uses an unbounded JS `Map` to hold WebSocket auth tickets. They expire conditionally, but if a ticket is never consumed by the client, the Map grows indefinitely, establishing a vector for OOM (Out Of Memory) Denial of Service attacks. 
**Status: COMPLETED (Injected setInterval Garbage Collector)**

## 2. Missing Websocket Origin Check (Security)
`websocket.ts` accepts incoming connections blindly without verifying `Sec-WebSocket-Origin` against trusted domains, which permits Cross-Site WebSocket hijacking if an attacker frames the application.
**Status: COMPLETED (Hardened with Origin rejection)**

## 3. Zod Prototype Pollution (Security)
The Backend input validation `AnalyzeSchema` and `ChatSchema` successfully validate payload shapes, but lack the `.strict()` directive. Extraneous, massive, or prototype-polluting payloads can bypass the validator and reach the core. 
**Status: COMPLETED (Forced .strict() on array inner objects and root boundaries)**

## 4. Silent Data Loss (Domain Execution)
In `useChat.ts`, AI messages stream directly into the local Reducer state representing the active conversation. However, when the stream finalizes, the `saveProject` adapter method is *never invoked*. Refreshing the page wipes session data entirely because the view is decoupled from the storage persistence.
**Status: COMPLETED (Hook now properly instantiates ProjectEntity, binds messages to a Sandbox Session, and saves over IStoragePort)**

## 5. Hexagonal Violation (Auth Port)
`HttpLLMAdapter.ts` and `WebsocketRealtimeAdapter.ts` directly import `getAuth()` from `firebase/auth`. An adapter's job is to adapt *one* external boundary to the core, not to reach across the system and implicitly depend on a different adapter's library. Auth resolution must be injected via an `IAuthPort`.
**Status: COMPLETED (Created IAuthPort, FirebaseAuthAdapter, and explicitly injected via DIContext constructors)**

## 6. Anemic Domain Hydration (Entity Structure)
Phase 3.4 introduced `ProjectEntity.ts`, an encapsulated class to manipulate data perfectly. However, `FirebaseStorageAdapter` currently just casts snapshot queries (`snapshot.data() as Project`). The UI receives raw JS objects stripped of their prototype methods, meaning `.clone()` or `.addMessage()` crashes at runtime. 
**Status: COMPLETED (Adapter explicitly hydrates incoming snapshots using ProjectEntity.fromDTO())**

## 7. React Re-render Avalanche (Performance)
`AppContext.tsx` bundles `state` and `dispatch` into a single React Context. Any micro-change in state (like `isVoiceOpen` toggling) re-renders *every* component subscribing to `useAppState` purely to grab `dispatch()`. Contexts must be split.
**Status: COMPLETED (Divided into AppStateContext and AppDispatchContext)**

## 8. Type Laziness (TypeScript)
`let aiSession: any = null;` inside the WebSocket server allows bypass of strict typing on the backend AI session pipeline. Uncle Bob weeps.
**Status: COMPLETED (Strong interface mapping added for LiveSessionProtocol & WsIncomingMessage)**

## 9. Coupled Constants (DRY Violation)
`localStorage.getItem('subsurface_selected_project')` relies on hard-typing a magic string instead of centralized configuration. 
**Status: COMPLETED (Abstracted to LOCAL_STORAGE_KEY constant)**

## 10. Chat Reducer Append Fallibility (State Architecture)
The chat reducer blindly relies on predicting index ranges `state.messages.length - 1` to apply stream chunks. If UI events race network events, messages can truncate. We require explicit ID-bound updating for append operations.
**Status: COMPLETED (Reducer now updates explicitly using action.payload.id against m.id)**

---
*THE ZERO-SLACK MATRIX IS SECURE. END OF AUDIT.*
