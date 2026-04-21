export interface ITimePort {
  /**
   * Returns the current timestamp in milliseconds since Unix Epoch.
   */
  now(): number;

  /**
   * Freezes execution for a specified amount of time.
   */
  sleep(ms: number): Promise<void>;
}
