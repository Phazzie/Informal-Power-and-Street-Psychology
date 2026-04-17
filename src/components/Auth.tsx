import React from 'react';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

interface AuthProps {
  user: User | null;
}

export function Auth({ user }: AuthProps) {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="w-6 h-6 rounded-full border border-border-main" referrerPolicy="no-referrer" />
          ) : (
            <UserIcon className="w-5 h-5 text-text-dim" />
          )}
          <span className="text-[0.75rem] font-bold text-text-dim/80 uppercase tracking-widest hidden sm:inline">
            {user.displayName?.split(' ')[0]}
          </span>
        </div>
        <button 
          onClick={handleLogout}
          className="text-text-dim/40 hover:text-accent-orange transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin}
      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-1.5 rounded text-[0.8rem] font-bold uppercase tracking-widest text-text-main transition-all"
    >
      <LogIn className="w-3.5 h-3.5" />
      Sign In
    </button>
  );
}
