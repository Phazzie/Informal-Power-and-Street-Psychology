import { getAuth } from 'firebase/auth';
import { IAuthPort } from '../core/ports/IAuthPort';

export class FirebaseAuthAdapter implements IAuthPort {
  async getSessionToken(): Promise<string | null> {
    const user = getAuth().currentUser;
    if (!user) return null;
    return await user.getIdToken();
  }

  getCurrentUserId(): string | null {
    return getAuth().currentUser?.uid || null;
  }
}
