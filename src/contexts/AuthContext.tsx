import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  OAuthCredential,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  githubToken: string | null;
  pendingUser: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  cancel2FA: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GITHUB_TOKEN_KEY = "codereview_github_token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [githubToken, setGithubToken] = useState<string | null>(
    () => sessionStorage.getItem(GITHUB_TOKEN_KEY)
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (!user) {
        setGithubToken(null);
        sessionStorage.removeItem(GITHUB_TOKEN_KEY);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    setPendingUser(credential.user);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    setPendingUser({ ...credential.user, displayName: name } as User);
  };

  const verify2FA = async (code: string) => {
    if (!pendingUser) throw new Error("No pending user verification");
    
    // Simple 2FA: use a fixed code "123456" for demo
    // In production, this would use Firebase's multi-factor auth or SMS/email verification
    if (code === "123456") {
      setUser(pendingUser);
      setPendingUser(null);
    } else {
      throw new Error("Invalid verification code");
    }
  };

  const cancel2FA = () => {
    setPendingUser(null);
    if (auth.currentUser) {
      firebaseSignOut(auth);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider();
    provider.addScope("repo");
    const result = await signInWithPopup(auth, provider);
    const credential: OAuthCredential | null = GithubAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setGithubToken(credential.accessToken);
      sessionStorage.setItem(GITHUB_TOKEN_KEY, credential.accessToken);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setGithubToken(null);
    sessionStorage.removeItem(GITHUB_TOKEN_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, githubToken, pendingUser, signIn, signUp, signInWithGoogle, signInWithGithub, signOut, verify2FA, cancel2FA }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
