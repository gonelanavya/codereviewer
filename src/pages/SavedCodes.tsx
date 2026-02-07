import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  FileCode,
  Trash2,
  Save,
  ArrowLeft,
  FolderOpen,
  Github,
  Edit3,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import CodeEditor from "@/components/CodeEditor";
import CodeRunner from "@/components/CodeRunner";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  listSavedCodes,
  getFileContent,
  updateFileOnGitHub,
  deleteFileOnGitHub,
  getGitHubFileUrl,
  SavedCodeFile,
} from "@/services/github";

const SavedCodes = () => {
  const { githubToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [files, setFiles] = useState<SavedCodeFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<SavedCodeFile | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const loadFiles = useCallback(async () => {
    if (!githubToken) return;
    setIsLoading(true);
    try {
      const result = await listSavedCodes(githubToken);
      setFiles(result);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load saved codes from GitHub.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [githubToken, toast]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleSelectFile = async (file: SavedCodeFile) => {
    if (!githubToken) return;
    setSelectedFile(file);
    setIsLoadingContent(true);
    setIsEditing(false);
    try {
      const content = await getFileContent(githubToken, file.path);
      setFileContent(content);
      setEditedContent(content);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load file content.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleSave = async () => {
    if (!githubToken || !selectedFile) return;
    setIsSaving(true);
    try {
      await updateFileOnGitHub(
        githubToken,
        selectedFile.path,
        editedContent,
        selectedFile.sha
      );
      setFileContent(editedContent);
      setIsEditing(false);
      toast({ title: "Saved!", description: "File updated on GitHub." });
      await loadFiles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save file.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!githubToken || !selectedFile) return;
    setIsDeleting(true);
    try {
      await deleteFileOnGitHub(githubToken, selectedFile.path, selectedFile.sha);
      toast({ title: "Deleted", description: "File removed from GitHub." });
      setSelectedFile(null);
      setFileContent("");
      await loadFiles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!githubToken) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="relative container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center">
              <Github className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                GitHub Connection Required
              </h2>
              <p className="text-muted-foreground max-w-md">
                Sign in with GitHub to save and access your optimized code
                snippets. Your codes are stored in a private "codeReview"
                repository on your GitHub account.
              </p>
            </div>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-grid-pattern bg-[size:50px_50px] opacity-[0.02] pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <Navbar />

      <main className="relative container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/editor")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Editor
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Saved Codes</h1>
              <p className="text-sm text-muted-foreground">
                Your optimized codes from the private GitHub "codeReview" repo
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadFiles} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FolderOpen className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File List */}
          <div className="glass-card rounded-2xl p-4 lg:col-span-1">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-primary" />
              Files ({files.length})
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No saved codes yet. Use "AI Rewrite" and save your optimized
                  code!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
                {files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => handleSelectFile(file)}
                    className={`w-full text-left p-3 rounded-xl border transition-all hover:scale-[1.01] ${
                      selectedFile?.path === file.path
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/50 bg-secondary/20 hover:bg-secondary/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 flex items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold font-mono flex-shrink-0">
                        {file.language.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {file.language}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* File Content */}
          <div className="glass-card rounded-2xl p-5 lg:col-span-2">
            {!selectedFile ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-center">
                <FileCode className="w-12 h-12 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">
                    Select a file to view
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click on a file from the list to view, edit, or run it
                  </p>
                </div>
              </div>
            ) : isLoadingContent ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {selectedFile.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedFile.path}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditing(false);
                            setEditedContent(fileContent);
                          }}
                          className="h-8"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={isSaving || editedContent === fileContent}
                          className="h-8 glow-effect"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-1" />
                          )}
                          Save
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                          className="h-8"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (!githubToken || !selectedFile) return;
                            try {
                              const url = await getGitHubFileUrl(githubToken, selectedFile.path);
                              window.open(url, "_blank");
                            } catch {
                              toast({
                                title: "Error",
                                description: "Could not open GitHub link.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="h-8"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          GitHub
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="h-8"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-1" />
                          )}
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <CodeEditor
                    value={editedContent}
                    onChange={setEditedContent}
                    language={selectedFile.language}
                  />
                ) : (
                  <CodeEditor
                    value={fileContent}
                    onChange={() => {}}
                    language={selectedFile.language}
                    readOnly
                  />
                )}

                <CodeRunner
                  code={isEditing ? editedContent : fileContent}
                  language={selectedFile.language}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SavedCodes;
