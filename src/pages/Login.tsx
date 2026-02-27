import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Mail, Lock, Chrome, Github, Code2, Sparkles, Shield, Zap, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import TwoFactorAuth from "@/components/TwoFactorAuth";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, loading: authLoading, pendingUser, signIn, signUp, signInWithGoogle, signInWithGithub, cancel2FA } = useAuth();
  const { toast } = useToast();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/editor" replace />;
  }

  if (pendingUser) {
    return <TwoFactorAuth onBack={cancel2FA} />;
  }

  function getFriendlyError(error: any): string {
    const code = error?.code || "";
    const map: Record<string, string> = {
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/invalid-credential": "Invalid email or password. Please try again.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
      "auth/network-request-failed": "Network error. Check your connection.",
      "auth/popup-closed-by-user": "Sign-in popup was closed.",
      "auth/unauthorized-domain": "This domain is not authorized. Add it in Firebase Console > Authentication > Settings > Authorized domains.",
    };
    return map[code] || error?.message || "Authentication failed. Please try again.";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (!isLogin && name.trim().length < 2) {
      toast({ title: "Error", description: "Please enter your full name.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        // 2FA verification will be shown automatically
      } else {
        await signUp(name.trim(), email, password);
        // 2FA verification will be shown automatically
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: getFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast({ title: "Welcome!", description: "Successfully signed in with Google." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Google sign-in failed.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGithub();
      toast({ title: "Welcome!", description: "Successfully signed in with GitHub." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "GitHub sign-in failed.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-grid-pattern bg-[size:50px_50px] opacity-[0.02] pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:flex-1 relative items-center justify-center p-12">
        <div className="max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Code2 className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold">
              Code<span className="text-primary">Review</span>
            </span>
          </div>

          <h1 className="text-4xl font-bold gradient-text leading-tight">
            AI-Powered Code Analysis
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Get instant feedback on security vulnerabilities, performance issues, and best practices. Let AI rewrite your code for optimal efficiency.
          </p>

          <div className="space-y-4">
            {[
              { icon: Shield, label: "Security Scanning", desc: "Detect vulnerabilities in real-time" },
              { icon: Zap, label: "Performance Analysis", desc: "Identify bottlenecks and optimize" },
              { icon: Sparkles, label: "AI Code Rewrite", desc: "Get optimized code suggestions" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Code2 className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold">
              Code<span className="text-primary">Review</span>
            </span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isLogin
                ? "Sign in to access your code reviews and history."
                : "Get started with AI-powered code analysis."}
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <Chrome className="h-4 w-4 mr-2" />
              Continue with Google
            </Button>

            <Button
              variant="outline"
              className="w-full h-11"
              onClick={handleGithubSignIn}
              disabled={loading}
            >
              <Github className="h-4 w-4 mr-2" />
              Continue with GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-11"
                    required
                    minLength={2}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                  minLength={6}
                />
              </div>
              {!isLogin && (
                <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-11 glow-effect" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setName("");
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
