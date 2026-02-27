import { useState } from "react";
import { Play, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import CodeEditor from "@/components/CodeEditor";
import LanguageSelector from "@/components/LanguageSelector";
import ReviewResults, { ReviewIssue } from "@/components/ReviewResults";
import CodeComparison from "@/components/CodeComparison";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { saveCodeSnippet } from "@/services/firestore";
import { analyzeCode } from "@/services/api";

const Index = () => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [reviewIssues, setReviewIssues] = useState<ReviewIssue[]>([]);
  const [reviewAttempted, setReviewAttempted] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [rewrittenCode, setRewrittenCode] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();

  const saveToFirestore = async (
    task: "review" | "rewrite",
    result: ReviewIssue[] | string
  ) => {
    if (!user) return;

    try {
      await saveCodeSnippet({
        userId: user.uid,
        email: user.email || "",
        language,
        task,
        code,
        result,
      });
      console.log("Snippet saved to Firestore");
    } catch (error) {
      console.error("Failed to save snippet:", error);
    }
  };

  const handleReviewCode = async () => {
    if (!code.trim()) return;
    
    setIsReviewing(true);
    setShowComparison(false);
    setReviewAttempted(true);
    setReviewIssues([]);

    try {
      const result = await analyzeCode(code, language, "review");
      const reviewResult = result as ReviewIssue[];
      setReviewIssues(reviewResult);
      await saveToFirestore("review", reviewResult);
      
      toast({
        title: "Review Complete",
        description: `Found ${reviewResult.length} issue${reviewResult.length !== 1 ? "s" : ""} in your code.`,
      });
    } catch (error) {
      console.error("Review failed:", error);
      // Set empty issues array to prevent blank page
      setReviewIssues([]);
      toast({
        title: "Review Failed",
        description: error instanceof Error ? error.message : "Failed to analyze code",
        variant: "destructive",
      });
    } finally {
      setIsReviewing(false);
    }
  };

  const handleRewriteCode = async () => {
    if (!code.trim()) return;
    
    setIsRewriting(true);

    try {
      const result = await analyzeCode(code, language, "rewrite");
      const rewriteResult = result as string;
      setRewrittenCode(rewriteResult);
      setShowComparison(true);
      await saveToFirestore("rewrite", rewriteResult);
      
      toast({
        title: "Rewrite Complete",
        description: "Your code has been optimized and improved.",
      });
    } catch (error) {
      console.error("Rewrite failed:", error);
      toast({
        title: "Rewrite Failed",
        description: error instanceof Error ? error.message : "Failed to rewrite code",
        variant: "destructive",
      });
    } finally {
      setIsRewriting(false);
    }
  };

  const handleReset = () => {
    setCode("");
    setReviewIssues([]);
    setShowComparison(false);
    setRewrittenCode("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-grid-pattern bg-[size:50px_50px] opacity-[0.02] pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <Navbar />
      
      <main className="relative container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Analysis</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text leading-tight">
            Intelligent Code Review
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg md:text-xl leading-relaxed">
            Submit your code for deep analysis. Get instant feedback on security, 
            performance, and best practices.
          </p>

        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          {/* Left Panel - Code Input */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <LanguageSelector value={language} onChange={setLanguage} />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={!code && reviewIssues.length === 0}
                  className="border-border hover:bg-secondary transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              placeholder="// Paste your code here for AI review...

function example() {
  // Your code will be analyzed for:
  // - Security vulnerabilities
  // - Performance issues
  // - Best practices
  // - Code quality
}"
            />

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleReviewCode}
                disabled={!code.trim() || isReviewing}
                className="flex-1 sm:flex-none glow-effect h-11"
              >
                {isReviewing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {isReviewing ? "Analyzing..." : "Review Code"}
              </Button>
              
              <Button
                variant="secondary"
                onClick={handleRewriteCode}
                disabled={!code.trim() || isRewriting}
                className="flex-1 sm:flex-none h-11"
              >
                {isRewriting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {isRewriting ? "Rewriting..." : "AI Rewrite"}
              </Button>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="glass-card rounded-2xl p-5 md:p-6">
            <ReviewResults issues={reviewIssues} isLoading={isReviewing} reviewAttempted={reviewAttempted} />
          </div>
        </div>

        {/* Code Comparison Section */}
        {showComparison && (
          <div className="mt-8 glass-card rounded-2xl p-5 md:p-6">
            <CodeComparison
              originalCode={code}
              rewrittenCode={rewrittenCode}
              language={language}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
