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
  const response = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, language, task }),
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
    return stripCodeFences(data.rewritten_code);
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

  for (const severity of severityOrder) {
    const items = review[severity] || [];
    for (const item of items) {
      if (issues.length >= MAX_ISSUES) break;

      const cleaned = item.replace(/^[-*]\s*/, "").trim();
      if (!cleaned || isNoiseItem(cleaned)) continue;

      const { title, description, suggestion } = extractParts(cleaned);
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
