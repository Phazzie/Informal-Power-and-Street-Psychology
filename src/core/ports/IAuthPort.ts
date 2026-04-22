export interface IAuthPort {
  /**
   * Retrieves a secure cryptographic token representing the active session.
   * Required for backend adapter interactions (e.g., LLM, WebSockets).
   */
  getSessionToken(): Promise<string | null>;
  getCurrentUserId(): string | null;
}
