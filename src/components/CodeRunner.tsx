import { useState } from "react";
import { Play, Loader2, Terminal, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { runCode, RunResult } from "@/services/codeRunner";

interface CodeRunnerProps {
  code: string;
  language: string;
}

const CodeRunner = ({ code, language }: CodeRunnerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [stdin, setStdin] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [outputExpanded, setOutputExpanded] = useState(true);

  const handleExecute = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    setResult(null);
    setOutputExpanded(true);

    try {
      const res = await runCode(code, language, stdin);
      setResult(res);
    } catch {
      setResult({
        stdout: "",
        stderr: "Failed to connect to execution service.",
        exitCode: 1,
        isError: true,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleClear = () => {
    setResult(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setResult(null);
    setStdin("");
  };

  const codeLines = code.split("\n");

  return (
    <div className="space-y-3">
      <Button
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!code.trim()}
        className="h-9 px-4 glow-effect"
      >
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 mr-1.5" />
        ) : (
          <Play className="w-3.5 h-3.5 mr-1.5" />
        )}
        {isOpen ? "Hide Runner" : "Run Code"}
      </Button>

      {isOpen && (
        <div className="rounded-xl border border-border overflow-hidden bg-[hsl(222,47%,3%)] animate-in slide-in-from-top-2 duration-200">
          {/* Code Preview */}
          <div className="border-b border-border/50">
            <div className="flex items-center justify-between px-3 py-2 bg-secondary/20 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  Code Preview ({language})
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex max-h-[200px] overflow-auto scrollbar-thin">
              <div className="flex-shrink-0 w-10 py-3 text-right pr-3 bg-secondary/10 border-r border-border/30">
                {codeLines.map((_, i) => (
                  <div
                    key={i}
                    className="text-xs font-mono text-muted-foreground/40 leading-5"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <pre className="flex-1 p-3 overflow-x-auto">
                <code className="text-sm font-mono leading-5 text-foreground/80">
                  {code}
                </code>
              </pre>
            </div>
          </div>

          {/* Custom Input */}
          <div className="border-b border-border/50 p-3">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Custom Input (stdin)
            </label>
            <Textarea
              placeholder="Enter input for your program..."
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              className="font-mono text-sm h-20 resize-none bg-[hsl(222,47%,6%)] border-border/50 focus:border-primary/50"
            />
          </div>

          {/* Execute Button */}
          <div className="px-3 py-2.5 bg-secondary/10 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {result
                ? result.isError
                  ? "Execution failed"
                  : "Execution successful"
                : "Ready to execute"}
            </span>
            <Button
              size="sm"
              onClick={handleExecute}
              disabled={isRunning || !code.trim()}
              className="h-8 px-4 glow-effect"
            >
              {isRunning ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 mr-1.5" />
              )}
              {isRunning ? "Running..." : "Execute"}
            </Button>
          </div>

          {/* Output */}
          {result && (
            <div className="border-t border-border/50">
              <div
                className="flex items-center justify-between px-3 py-2 bg-secondary/20 cursor-pointer"
                onClick={() => setOutputExpanded(!outputExpanded)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      result.isError ? "bg-red-500" : "bg-green-500"
                    )}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    Output (exit code: {result.exitCode})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                  {outputExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {outputExpanded && (
                <div className="p-3 max-h-[250px] overflow-auto scrollbar-thin">
                  {result.stdout && (
                    <pre className="font-mono text-sm text-green-400 whitespace-pre-wrap break-words">
                      {result.stdout}
                    </pre>
                  )}
                  {result.stderr && (
                    <pre className="font-mono text-sm text-red-400 whitespace-pre-wrap break-words">
                      {result.stderr}
                    </pre>
                  )}
                  {!result.stdout && !result.stderr && (
                    <p className="text-sm text-muted-foreground italic">
                      No output produced.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeRunner;
