# THE BOUNTY HUNTER'S AUDIT: CRITICAL LAWSUITS & SERVER MELTDOWNS

This document represents the findings of an adversarial penetration tester and SRE (Site Reliability Engineer) attempting to extract $10,000 bounties for every undocumented vulnerability, performance cliff, and data-loss vector present in the application.

---

## 1. THE "WIDE OPEN WALLET" VULNERABILITY ($30,000 Bounty)
*The Express backend currently protects its endpoints with... nothing. You extracted the Gemini API calls to the backend, but left the backend endpoints entirely unauthenticated.*

### 1.1 Unauthenticated REST APIs
**The Flaw:** Anyone who finds the `/api/chat` or `/api/analyze` URL can send infinite POST requests. They are using your server as an open proxy to spend your Google Gemini API quota without needing a Firebase account.
**Atomic Tasks:**
- [ ] Install `firebase-admin` on the Node.js backend.
- [ ] Create an Express middleware `requireAuth` that reads the `Authorization: Bearer <token>` header.
- [ ] Use `firebase-admin` to verify the JWT token on every incoming REST request.
- [ ] Update the React `aiService.ts` to fetch the current user's JWT token and attach it to the `fetch` headers.

### 1.2 The Open WebSocket Sinkhole
**The Flaw:** WebSockets cannot easily send HTTP headers during the upgrade request. The current WebSocket at `/api/live` accepts connections from anyone, immediately opening a bi-directional audio stream to Gemini on your dime.
**Atomic Tasks:**
- [ ] Expose an endpoint `/api/live/ticket` that requires standard JWT auth and returns a short-lived (30 second) cryptographic ticket.
- [ ] Modify the React client to fetch a ticket before connecting to the WebSocket, passing the ticket in the WS query parameters.
- [ ] Modify the Express WS upgrade handler to intercept the query parameter, validate the ticket, and drop the connection if invalid.

### 1.3 Missing Rate Limiting (DDoS & Quota Exhaustion)
**The Flaw:** Even with auth, a single malicious (or buggy) user can spam "Analyze" 1,000 times a second, crashing the Node server and hitting Google's rate limits, blacklisting the app globally.
**Atomic Tasks:**
- [ ] Install `express-rate-limit`.
- [ ] Configure a global sliding window limit (e.g., max 100 requests / 15 mins per IP).
- [ ] Configure a strict "Compute Limit" specifically for the AI endpoints (e.g., max 5 AI requests / minute per User ID).

---

## 2. THE FRONT-END CPU MELTDOWN ($20,000 Bounty)
*The React code is functioning, but it is deeply un-optimized for high-frequency streaming.*

### 2.1 The Markdown Re-render Inferno
**The Flaw:** In `Chat.tsx`, when the AI streams a response, it adds one chunk at a time to the state. React re-renders the *entire* list of messages, and `react-markdown` re-parses the *entire* text string from scratch, 10+ times a second. On a 5-minute chat, this will freeze the user's browser, throttle their CPU, and drain laptop batteries.
**Atomic Tasks:**
- [ ] Extract the single message rendering into a `MemoizedMessage` component wrapped in `React.memo()`.
- [ ] Provide a custom `areEqual` comparison function so only the actively streaming message re-renders, not the historical ones.
- [ ] Throttle/debounce the React state updates for the streaming chunk so it only commits to the DOM every ~50ms instead of on every micro-chunk.

### 2.2 Network Race Conditions & Orphaned Promises
**The Flaw:** If a user clicks "Refresh Lens", gets bored waiting 5 seconds, and clicks another project, the first request is still running in the background. When it finishes, it will force a state update on an unmounted component, potentially overwriting the newly selected project's state.
**Atomic Tasks:**
- [ ] Implement `AbortController` inside `useAnalysis` and `useChat`.
- [ ] On component unmount, or when the user triggers a *new* request, fire `abortController.abort()`.
- [ ] Wrap backend `fetch` calls to consume the abort signal, canceling the HTTP request and saving bandwidth/compute.

---

## 3. SILENT DATA LOSS & NETWORK PARTITIONS ($20,000 Bounty)
*We are treating the internet like it represents an uninterrupted, localized cable.*

### 3.1 Absent Optimistic Concurrency
**The Flaw:** When a user saves a project or chats, we wait for the database round-trip before updating the UI. If the user's WiFi drops on a train, the UI hangs, then crashes, and their textual input is vaporized.
**Atomic Tasks:**
- [ ] Implement "Optimistic UI" updates: instantly push the chat message into the local state arrays so the user sees it immediately.
- [ ] Wrap the `dbService` call in a try/catch.
- [ ] If the DB call fails, remove the temporary message, trigger a UI Toast stating "Network error: Input saved locally," and tuck the payload into an IndexedDB offline queue.

### 3.2 Idempotency Failures
**The Flaw:** If a network hiccup occurs and a REST request retries, our backend might execute the same analysis twice, charging us twice, and corrupting the database arrays.
**Atomic Tasks:**
- [ ] Generate a UUID `Idempotency-Key` on the client for every write/action.
- [ ] Track processed `Idempotency-Key`s in Redis or memory (short-lived) on the Express backend.
- [ ] If the backend sees the same key twice within 2 minutes, return the cached successful response without re-triggering the Gemini API.

---

## 4. ADA COMPLIANCE & ACCESSIBILITY LAWSUITS ($10,000 Bounty)
*Modern web apps require strict accessibility. This application treats screen readers and keyboard-only users like they don't exist.*

### 4.1 Focus Trapping and Keyboard Jail
**The Flaw:** When the "Import Material" modal opens, a user can press `Tab` and accidentally select elements hidden *behind* the modal. A screen reader will read the blurred background content, totally confusing the user.
**Atomic Tasks:**
- [ ] Implement a Focus Trap (via `react-focus-lock` or manual event listeners) inside `FileImport.tsx`.
- [ ] Automatically shift DOM focus to the first input field when the modal opens.
- [ ] When the modal closes, shift DOM focus exactly back to the button that originally opened it.

### 4.2 Missing ARIA Topography
**The Flaw:** Icons and buttons like "Refresh Lens" or the SVG icons inside the Chat represent critical actions, but they have no `aria-label`s or `role` definitions. Screen readers just announce "Button."
**Atomic Tasks:**
- [ ] Run an `axe-core` accessibility audit on the DOM.
- [ ] Add explicit `aria-label`, `aria-describedby`, and `role="status"` (for the loading spinners and typing indicators) across all interactive elements.

---

## 5. PRODUCTION SRE & TELEMETRY ($10,000 Bounty)
*When this breaks on a Friday night, the developer will have no idea why.*

### 5.1 Console.log is a Blackhole
**The Flaw:** `console.error` inside a Cloud Run container is virtually useless. It lacks context, timestamp synchronization, and request tracing. If a WebSocket dies, we won't know which user it was or what they were doing.
**Atomic Tasks:**
- [ ] Remove all `console.log` and `console.error` calls.
- [ ] Implement a structured logger (like `Pino`) on the backend.
- [ ] Inject a unique `Request-ID` middleware at the start of the Express pipeline and attach it to all log outputs, binding the user's UID to their specific backend crash stack traces.
