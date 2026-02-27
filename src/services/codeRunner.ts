const CODE_EXECUTION_APIS = [
  "https://api.jdoodle.com/v1/execute",
  "https://emkc.org/api/v2/piston/execute",
  "https://onecompiler.com/api/v1/execute"
];

interface RextesterRuntime {
  language: string;
  version: string;
}

interface RextesterExecuteResponse {
  stdout?: string;
  output?: string;
  stderr?: string;
  errors?: string;
  code?: number;
  exit_code?: number;
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
    // Try multiple execution APIs in order
    for (const apiUrl of CODE_EXECUTION_APIS) {
      try {
        let requestBody;
        let responseFormat: string;
        
        // Different APIs require different request formats
        if (apiUrl.includes("jdoodle")) {
          requestBody = {
            script: code,
            language: runtime.language,
            versionIndex: "0",
            stdin: stdin || "",
          };
          responseFormat = "jdoodle";
        } else if (apiUrl.includes("piston")) {
          requestBody = {
            language: runtime.language,
            version: runtime.version,
            files: [{ name: filename, content: code }],
            stdin: stdin || "",
          };
          responseFormat = "piston";
        } else {
          // Default format
          requestBody = {
            language: runtime.language,
            version: runtime.version,
            code: code,
            stdin: stdin || "",
          };
          responseFormat = "default";
        }
        
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (res.ok) {
          const data = await res.json();
          
          // Parse response based on API format
          if (responseFormat === "jdoodle") {
            return {
              stdout: data.output || "",
              stderr: data.error || "",
              exitCode: data.exitCode || 0,
              isError: !!data.error,
            };
          } else if (responseFormat === "piston") {
            const stdout = data.run?.stdout || "";
            const stderr = data.run?.stderr || "";
            return {
              stdout: stdout,
              stderr: stderr,
              exitCode: data.run?.code || 0,
              isError: data.run?.code !== 0,
            };
          } else {
            // Default format
            const stdout = data.stdout || data.output || "";
            const stderr = data.stderr || data.errors || "";
            const exitCode = data.code || data.exit_code || 0;
            return {
              stdout: stdout,
              stderr: stderr,
              exitCode: exitCode,
              isError: exitCode !== 0,
            };
          }
        }
      } catch (apiError) {
        console.warn(`API ${apiUrl} failed:`, apiError);
        continue; // Try next API
      }
    }
    
    // If all APIs fail, try local execution for simple cases
    return tryLocalExecution(code, language, stdin);
    
  } catch (error) {
    return {
      stdout: "",
      stderr: error instanceof Error ? error.message : "Failed to execute code",
      exitCode: 1,
      isError: true,
    };
  }
}

// Local execution fallback for simple cases
function tryLocalExecution(code: string, language: string, stdin?: string): RunResult {
  try {
    // Only support simple JavaScript execution locally
    if (language === "javascript" || language === "js") {
      // Create a safe execution environment
      const consoleOutput: string[] = [];
      const customConsole = {
        log: (...args: any[]) => {
          consoleOutput.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' '));
        },
        error: (...args: any[]) => {
          consoleOutput.push('ERROR: ' + args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' '));
        }
      };

      // Create a function with the code and execute it
      const executeCode = new Function('console', code);
      executeCode(customConsole);

      return {
        stdout: consoleOutput.join('\n'),
        stderr: "",
        exitCode: 0,
        isError: false,
      };
    }

    // For other languages, provide helpful guidance
    return {
      stdout: "",
      stderr: `Local execution is only supported for JavaScript. For ${language}, please:\n1. Use an online compiler like CodePen, Replit, or JSFiddle\n2. Install a local compiler/interpreter\n3. Try again later when external services are available`,
      exitCode: 1,
      isError: true,
    };
  } catch (error) {
    return {
      stdout: "",
      stderr: `Local execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      exitCode: 1,
      isError: true,
    };
  }
}
