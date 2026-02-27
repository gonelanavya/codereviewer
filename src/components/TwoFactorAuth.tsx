import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const TwoFactorAuth = ({ onBack }: { onBack: () => void }) => {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { verify2FA, cancel2FA, pendingUser } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsVerifying(true);
    try {
      await verify2FA(code);
      toast({
        title: "Success!",
        description: "Two-factor authentication verified successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    cancel2FA();
    onBack();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Two-Factor Authentication</CardTitle>
          <CardDescription className="text-center">
            Enter the 6-digit verification code sent to your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-lg tracking-widest"
                maxLength={6}
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                Demo: Use code <span className="font-mono bg-muted px-1 rounded">123456</span>
              </p>
            </div>
            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={code.length !== 6 || isVerifying}
              >
                {isVerifying ? "Verifying..." : "Verify Code"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleCancel}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </form>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Didn't receive a code? Check your email or spam folder.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TwoFactorAuth;
