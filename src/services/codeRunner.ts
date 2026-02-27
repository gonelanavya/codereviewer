const PISTON_API = "https://emkc.org/api/v2/piston";

interface PistonRuntime {
  language: string;
  version: string;
}

interface PistonExecuteResponse {
  run: {
    stdout: string;
    stderr: string;
    code: number;
    output: string;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
    output: string;
  };
}

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  isError: boolean;
}

const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  javascript: { language: "javascript", version: "18.15.0" },
  typescript: { language: "typescript", version: "5.0.3" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  csharp: { language: "csharp", version: "6.12.0" },
  cpp: { language: "c++", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
  go: { language: "go", version: "1.16.2" },
  rust: { language: "rust", version: "1.68.2" },
  ruby: { language: "ruby", version: "3.0.1" },
  php: { language: "php", version: "8.2.3" },
  swift: { language: "swift", version: "5.3.3" },
  kotlin: { language: "kotlin", version: "1.8.20" },
};

function getFileExtension(language: string): string {
  const extMap: Record<string, string> = {
    javascript: "js",
    typescript: "ts",
    python: "py",
    java: "Main.java",
    csharp: "main.cs",
    cpp: "main.cpp",
    c: "main.c",
    go: "main.go",
    rust: "main.rs",
    ruby: "main.rb",
    php: "main.php",
    swift: "main.swift",
    kotlin: "main.kt",
  };
  return extMap[language] || "txt";
}

export async function runCode(
  code: string,
  language: string,
  stdin?: string
): Promise<RunResult> {
  const runtime = LANGUAGE_MAP[language];
  if (!runtime) {
    return {
      stdout: "",
      stderr: `Language "${language}" is not supported for execution.`,
      exitCode: 1,
      isError: true,
    };
  }

  const filename = getFileExtension(language);

  try {
    const res = await fetch(`${PISTON_API}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [{ name: filename, content: code }],
        stdin: stdin || "",
        compile_timeout: 10000,
        run_timeout: 10000,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      
      // Provide helpful error messages based on common issues
      let errorMessage = `Execution service error: ${errText}`;
      
      if (errText.includes("whitelist") || errText.includes("Public Piston API")) {
        errorMessage = "Code execution is temporarily unavailable due to API restrictions. Please try again later.";
      } else if (errText.includes("CORS") || errText.includes("corsproxy")) {
        errorMessage = "Code execution service is experiencing network issues. Please try again in a few moments.";
      } else if (res.status === 429) {
        errorMessage = "Too many requests. Please wait a moment before trying again.";
      } else if (res.status >= 500) {
        errorMessage = "Execution service is temporarily unavailable. Please try again later.";
      }
      
      return {
        stdout: "",
        stderr: errorMessage,
        exitCode: 1,
        isError: true,
      };
    }

    const data: PistonExecuteResponse = await res.json();

    if (data.compile && data.compile.code !== 0) {
      return {
        stdout: "",
        stderr: data.compile.stderr || data.compile.output || "Compilation failed",
        exitCode: data.compile.code,
        isError: true,
      };
    }

    const stdout = data.run.stdout || "";
    const stderr = data.run.stderr || "";
    const fallbackOutput = (!stdout && !stderr && data.run.output) ? data.run.output : "";

    return {
      stdout: stdout || fallbackOutput,
      stderr,
      exitCode: data.run.code,
      isError: data.run.code !== 0,
    };
  } catch (error) {
    return {
      stdout: "",
      stderr: error instanceof Error ? error.message : "Failed to execute code",
      exitCode: 1,
      isError: true,
    };
  }
}
