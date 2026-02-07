import { ArrowRight, Copy, Check, Github, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { saveCodeToGitHub } from "@/services/github";
import CodeRunner from "./CodeRunner";

interface CodeComparisonProps {
  originalCode: string;
  rewrittenCode: string;
  language: string;
}

const FILE_EXT_MAP: Record<string, string> = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  java: "java",
  csharp: "cs",
  cpp: "cpp",
  c: "c",
  go: "go",
  rust: "rs",
  ruby: "rb",
  php: "php",
  swift: "swift",
  kotlin: "kt",
};

const CodeComparison = ({
  originalCode,
  rewrittenCode,
  language,
}: CodeComparisonProps) => {
  const [copied, setCopied] = useState(false);
  const [isSavingToGH, setIsSavingToGH] = useState(false);
  const [savedToGH, setSavedToGH] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [customFileName, setCustomFileName] = useState("");
  const { githubToken } = useAuth();
  const { toast } = useToast();

  const ext = FILE_EXT_MAP[language] || "txt";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rewrittenCode);
    setCopied(true);
    toast({ title: "Copied!", description: "Rewritten code copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const openSaveDialog = () => {
    if (!githubToken) {
      toast({
        title: "GitHub not connected",
        description: "Sign in with GitHub to save codes to your repository.",
        variant: "destructive",
      });
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    setCustomFileName(`optimized_${timestamp}`);
    setShowNameDialog(true);
  };

  const handleSaveToGitHub = async () => {
    if (!githubToken) return;
    setShowNameDialog(false);
    setIsSavingToGH(true);

    const finalName = customFileName.trim()
      ? `${customFileName.trim().replace(/\.[^.]+$/, "")}.${ext}`
      : undefined;

    try {
      await saveCodeToGitHub(githubToken, rewrittenCode, language, finalName);
      setSavedToGH(true);
      toast({
        title: "Saved to GitHub!",
        description: `Saved as "${finalName}" in your private 'codeReview' repo.`,
      });
      setTimeout(() => setSavedToGH(false), 3000);
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save to GitHub.",
        variant: "destructive",
      });
    } finally {
      setIsSavingToGH(false);
    }
  };

  const CodeBlock = ({
    code,
    title,
    variant,
  }: {
    code: string;
    title: string;
    variant: "original" | "rewritten";
  }) => {
    const lines = code.split("\n");

    return (
      <div className="flex-1 rounded-xl border border-border overflow-hidden code-editor">
        <div
          className={`flex items-center justify-between px-4 py-2 border-b border-border/50 ${
            variant === "original"
              ? "bg-severity-critical/5"
              : "bg-primary/5"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                variant === "original" ? "bg-severity-critical" : "bg-primary"
              }`}
            />
            <span className="text-sm font-medium text-foreground">{title}</span>
          </div>
          {variant === "rewritten" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-xs"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          )}
        </div>
        <div className="flex max-h-[400px] overflow-auto scrollbar-thin">
          <div className="flex-shrink-0 w-10 py-4 text-right pr-3 bg-secondary/10 border-r border-border/30">
            {lines.map((_, i) => (
              <div
                key={i + 1}
                className="text-xs font-mono text-muted-foreground/50 leading-6"
              >
                {i + 1}
              </div>
            ))}
          </div>
          <pre className="flex-1 p-4 overflow-x-auto">
            <code className="text-sm font-mono leading-6 text-foreground/90">
              {code}
            </code>
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-semibold text-foreground">Code Comparison</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Original</span>
            <ArrowRight className="w-4 h-4" />
            <span className="text-primary">Optimized</span>
          </div>
          {githubToken && (
            <Button
              variant="outline"
              size="sm"
              onClick={openSaveDialog}
              disabled={isSavingToGH}
              className="h-8"
            >
              {isSavingToGH ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : savedToGH ? (
                <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" />
              ) : (
                <Github className="w-3.5 h-3.5 mr-1.5" />
              )}
              {savedToGH ? "Saved!" : "Save to GitHub"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CodeBlock code={originalCode} title="Original Code" variant="original" />
        <CodeBlock
          code={rewrittenCode}
          title="Rewritten Code"
          variant="rewritten"
        />
      </div>

      <div className="border-t border-border/50 pt-4">
        <CodeRunner code={rewrittenCode} language={language} />
      </div>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save to GitHub</DialogTitle>
            <DialogDescription>
              Choose a file name for your optimized code. It will be saved to
              your private "codeReview" repo under the {language}/ folder.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder="Enter file name"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && customFileName.trim()) handleSaveToGitHub();
              }}
            />
            <span className="text-sm text-muted-foreground">.{ext}</span>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNameDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveToGitHub}
              disabled={!customFileName.trim()}
              className="glow-effect"
            >
              <Github className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CodeComparison;
