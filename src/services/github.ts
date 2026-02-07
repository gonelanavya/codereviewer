const REPO_NAME = "codeReview";
const API_BASE = "https://api.github.com";

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  download_url: string;
}

export interface SavedCodeFile {
  name: string;
  path: string;
  sha: string;
  language: string;
  content?: string;
}

function getFileExtension(language: string): string {
  const extMap: Record<string, string> = {
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
  return extMap[language] || "txt";
}

function getLanguageFromExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    java: "java",
    cs: "csharp",
    cpp: "cpp",
    c: "c",
    go: "go",
    rs: "rust",
    rb: "ruby",
    php: "php",
    swift: "swift",
    kt: "kotlin",
  };
  return langMap[ext] || "javascript";
}

async function githubFetch(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  return res;
}

async function getAuthenticatedUser(token: string): Promise<string> {
  const res = await githubFetch("/user", token);
  if (!res.ok) throw new Error("Failed to get GitHub user info");
  const data = await res.json();
  return data.login;
}

export async function getGitHubFileUrl(
  token: string,
  filePath: string
): Promise<string> {
  const username = await getAuthenticatedUser(token);
  return `https://github.com/${username}/${REPO_NAME}/blob/main/${filePath}`;
}

async function ensureRepoExists(token: string): Promise<string> {
  const username = await getAuthenticatedUser(token);

  const checkRes = await githubFetch(`/repos/${username}/${REPO_NAME}`, token);
  if (checkRes.ok) return username;

  const createRes = await githubFetch("/user/repos", token, {
    method: "POST",
    body: JSON.stringify({
      name: REPO_NAME,
      private: true,
      description: "Optimized code snippets saved from CodeReview AI",
      auto_init: true,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create GitHub repository");
  }

  return username;
}

export async function saveCodeToGitHub(
  token: string,
  code: string,
  language: string,
  filename?: string
): Promise<string> {
  const username = await ensureRepoExists(token);
  const ext = getFileExtension(language);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const finalName = filename || `optimized_${timestamp}.${ext}`;
  const path = `${language}/${finalName}`;

  const existingRes = await githubFetch(
    `/repos/${username}/${REPO_NAME}/contents/${path}`,
    token
  );
  let sha: string | undefined;
  if (existingRes.ok) {
    const existing = await existingRes.json();
    sha = existing.sha;
  }

  const body: Record<string, string> = {
    message: sha
      ? `Update ${finalName}`
      : `Add optimized ${language} code: ${finalName}`,
    content: btoa(unescape(encodeURIComponent(code))),
  };
  if (sha) body.sha = sha;

  const res = await githubFetch(
    `/repos/${username}/${REPO_NAME}/contents/${path}`,
    token,
    { method: "PUT", body: JSON.stringify(body) }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to save code to GitHub");
  }

  return `https://github.com/${username}/${REPO_NAME}/blob/main/${path}`;
}

export async function listSavedCodes(token: string): Promise<SavedCodeFile[]> {
  const username = await ensureRepoExists(token);
  const files: SavedCodeFile[] = [];

  const rootRes = await githubFetch(
    `/repos/${username}/${REPO_NAME}/contents/`,
    token
  );
  if (!rootRes.ok) return files;

  const rootItems: GitHubFile[] = await rootRes.json();
  const folders = rootItems.filter(
    (item: any) => item.type === "dir"
  );

  for (const folder of folders) {
    const folderRes = await githubFetch(
      `/repos/${username}/${REPO_NAME}/contents/${folder.path}`,
      token
    );
    if (!folderRes.ok) continue;

    const folderItems: GitHubFile[] = await folderRes.json();
    for (const file of folderItems) {
      if ((file as any).type === "file") {
        files.push({
          name: file.name,
          path: file.path,
          sha: file.sha,
          language: getLanguageFromExtension(file.name),
        });
      }
    }
  }

  return files;
}

export async function getFileContent(
  token: string,
  path: string
): Promise<string> {
  const username = await getAuthenticatedUser(token);
  const res = await githubFetch(
    `/repos/${username}/${REPO_NAME}/contents/${path}`,
    token
  );

  if (!res.ok) throw new Error("Failed to fetch file content");

  const data = await res.json();
  return decodeURIComponent(escape(atob(data.content.replace(/\n/g, ""))));
}

export async function updateFileOnGitHub(
  token: string,
  path: string,
  content: string,
  sha: string
): Promise<void> {
  const username = await getAuthenticatedUser(token);

  const res = await githubFetch(
    `/repos/${username}/${REPO_NAME}/contents/${path}`,
    token,
    {
      method: "PUT",
      body: JSON.stringify({
        message: `Update ${path.split("/").pop()}`,
        content: btoa(unescape(encodeURIComponent(content))),
        sha,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update file on GitHub");
  }
}

export async function deleteFileOnGitHub(
  token: string,
  path: string,
  sha: string
): Promise<void> {
  const username = await getAuthenticatedUser(token);

  const res = await githubFetch(
    `/repos/${username}/${REPO_NAME}/contents/${path}`,
    token,
    {
      method: "DELETE",
      body: JSON.stringify({
        message: `Delete ${path.split("/").pop()}`,
        sha,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete file from GitHub");
  }
}
