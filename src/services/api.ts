import { ReviewIssue } from "@/components/ReviewResults";

const API_URL = "https://ai-code-review-backend-3m23.onrender.com";

interface ReviewResponse {
  review: {
    Critical: string[];
    High: string[];
    Medium: string[];
    Low: string[];
  };
}

interface RewriteResponse {
  rewritten_code: string;
}

export type { ReviewIssue };

export const analyzeCode = async (
  code: string,
  language: string,
  task: "review" | "rewrite"
): Promise<ReviewIssue[] | string> => {
  // Add strict instructions to the request
  const strictInstructions = task === "review" 
    ? `CRITICAL: Only identify REAL defects (bugs, security issues, undefined behavior, performance bottlenecks).
      DO NOT suggest refactoring unless there is a real problem.
      DO NOT add time/space complexity analysis for simple programs.
      DO NOT add comments, documentation, or extra abstractions unless necessary.
      If code is correct and follows conventions, respond: "No issues found. The code is correct and does not require changes."
      Keep suggestions minimal and necessary only.`
    : `CRITICAL: Only rewrite if it meaningfully improves clarity, safety, or performance.
      DO NOT over-engineer or add unnecessary complexity.
      Preserve beginner-friendliness and simplicity.
      If no real improvement is needed, return original code unchanged.`;

  const response = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      code, 
      language, 
      task,
      instructions: strictInstructions
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Failed to analyze code");
  }

  if (task === "review") {
    const data: ReviewResponse = await response.json();
    return parseReviewResponse(data.review);
  } else {
    const data: RewriteResponse = await response.json();
    const rewrittenCode = stripCodeFences(data.rewritten_code);
    
    // If the rewritten code is the same as original, return original
    // This prevents unnecessary rewrites of correct code
    const normalizedOriginal = code.replace(/\s+/g, ' ').trim();
    const normalizedRewritten = rewrittenCode.replace(/\s+/g, ' ').trim();
    
    if (normalizedOriginal === normalizedRewritten) {
      return code; // Return original unchanged
    }
    
    return rewrittenCode;
  }
};

function isNoiseItem(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.startsWith("###")) return true;
  if (trimmed.startsWith("```")) return true;
  if (/^(None identified|No .* identified|N\/A|Here'?s an? updated)/i.test(trimmed)) return true;
  if (/^(In this updated|I added|I used|I raised|- I )/i.test(trimmed)) return true;
  if (/^(def |class |import |from |return |if |for |while |try |except )/.test(trimmed)) return true;
  if (/^["']/.test(trimmed) && /["']$/.test(trimmed)) return true;
  if (trimmed.length < 15) return true;
  if (/^(Consider (adding|using)|You (could|should|might|may) (also )?consider)/i.test(trimmed)) return true;
  if (/^(It('s| is) (a )?good practice|As a (best|general) practice|For better)/i.test(trimmed)) return true;
  if (/^(Add(ing)? comments|Missing comments|No comments|Comment your)/i.test(trimmed)) return true;
  if (/^(Use (more )?descriptive|Variable naming|Rename (the )?variable)/i.test(trimmed)) return true;
  return false;
}

const MAX_ISSUES = 5;

function isDuplicate(existing: ReviewIssue[], newTitle: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const norm = normalize(newTitle);
  return existing.some((e) => {
    const existNorm = normalize(e.title);
    return existNorm === norm || existNorm.includes(norm) || norm.includes(existNorm);
  });
}

function parseReviewResponse(review: ReviewResponse["review"]): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  let idCounter = 1;

  const severityMap: Record<string, "critical" | "high" | "medium" | "low"> = {
    Critical: "critical",
    High: "high",
    Medium: "medium",
    Low: "low",
  };

  const severityOrder: (keyof ReviewResponse["review"])[] = ["Critical", "High", "Medium", "Low"];

  // Additional guardrails to prevent over-engineering
  const isOverEngineered = (title: string, suggestion: string): boolean => {
    const titleLower = title.toLowerCase();
    const suggestionLower = suggestion.toLowerCase();
    
    // Block generic refactoring suggestions
    if (titleLower.includes("refactor") || suggestionLower.includes("refactor")) return true;
    if (titleLower.includes("restructure") || suggestionLower.includes("restructure")) return true;
    
    // Block generic complexity additions
    if (titleLower.includes("complex") || suggestionLower.includes("complex")) return true;
    if (titleLower.includes("abstract") || suggestionLower.includes("abstract")) return true;
    
    // Block unnecessary documentation/comments
    if (titleLower.includes("comment") || suggestionLower.includes("comment")) return true;
    if (titleLower.includes("document") || suggestionLower.includes("document")) return true;
    
    // Block generic "consider" suggestions unless specific
    if (titleLower.startsWith("consider") && suggestionLower.length < 30) return true;
    
    // Block time/space complexity for simple code
    if (titleLower.includes("time complexity") || titleLower.includes("space complexity")) return true;
    if (titleLower.includes("big o") || titleLower.includes("o(n)")) return true;
    
    return false;
  };

// Post-processing filter to detect and remove generic suggestions
function filterGenericSuggestions(issues: ReviewIssue[]): ReviewIssue[] {
  return issues.filter(issue => {
    // Simple safety check
    if (!issue || !issue.title || !issue.suggestion) return false;
    
    const titleLower = issue.title.toLowerCase();
    const suggestionLower = issue.suggestion.toLowerCase();
    
    // Generic improvement phrases that indicate over-engineering
    const genericPhrases = [
      "consider refactoring",
      "improve readability",
      "best practices",
      "time complexity",
      "space complexity",
      "add comments",
      "improve structure",
      "make code more",
      "enhance performance",
      "optimize further",
      "better approach",
      "cleaner code",
      "more efficient",
      "simplify logic",
      "reduce complexity"
    ];
    
    // Check if title or suggestion contains generic phrases
    const isGeneric = genericPhrases.some(phrase => 
      titleLower.includes(phrase) || suggestionLower.includes(phrase)
    );
    
    // Also block very short, vague suggestions
    const isVague = issue.title.length < 15 || suggestionLower.length < 20;
    
    // Block if generic OR vague
    if (isGeneric || isVague) return false;
    
    return true;
  });
}

  for (const severity of severityOrder) {
    const items = review[severity] || [];
    for (const item of items) {
      if (issues.length >= MAX_ISSUES) break;

      const cleaned = item.replace(/^[-*]\s*/, "").trim();
      if (!cleaned || isNoiseItem(cleaned)) continue;

      const { title, description, suggestion } = extractParts(cleaned);
      
      // Final guardrail: filter out over-engineered suggestions
      if (isOverEngineered(title, suggestion)) continue;
      if (isDuplicate(issues, title)) continue;

      issues.push({
        id: String(idCounter++),
        severity: severityMap[severity] || "low",
        title,
        description,
        suggestion,
      });
    }
    if (issues.length >= MAX_ISSUES) break;
  }

  // Temporarily disable filtering to debug blank page issue
  return issues;
}

function extractParts(text: string): {
  title: string;
  description: string;
  suggestion: string;
} {
  const cleaned = text.replace(/^[-*]\s*\*?\*?/, "").trim();

  const sentenceMatch = cleaned.match(/^([^.!?]+[.!?])\s*(.*)$/s);
  let title: string;
  let rest: string;

  if (sentenceMatch) {
    title = sentenceMatch[1].trim();
    rest = sentenceMatch[2].trim();
  } else {
    title = cleaned.slice(0, 80);
    rest = "";
  }

  if (title.length > 80) {
    title = title.slice(0, 77) + "...";
  }

  const suggestion =
    rest ||
    "Consider refactoring this part of the code to follow best practices.";

  return { title, description: cleaned, suggestion };
}

function stripCodeFences(code: string): string {
  let stripped = code.trim();
  stripped = stripped.replace(/^```[a-zA-Z]*\n?/, "");
  stripped = stripped.replace(/\n?```$/, "");
  return stripped.trim();
}
