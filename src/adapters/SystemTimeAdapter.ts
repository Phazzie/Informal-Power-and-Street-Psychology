import { ITimePort } from '../core/ports/ITimePort';

export class SystemTimeAdapter implements ITimePort {
  now(): number {
    return Date.now();
  }

  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
