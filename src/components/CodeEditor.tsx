import { useRef, useEffect } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder?: string;
  readOnly?: boolean;
}

const CodeEditor = ({
  value,
  onChange,
  language,
  placeholder,
  readOnly = false,
}: CodeEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = value.split("\n");
  const lineCount = Math.max(lines.length, 1);

  useEffect(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, [value]);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className="relative rounded-xl border border-border bg-[hsl(222,47%,5%)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-secondary/30">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-editor-dot-red/80" />
            <div className="w-3 h-3 rounded-full bg-editor-dot-yellow/80" />
            <div className="w-3 h-3 rounded-full bg-editor-dot-green/80" />
          </div>
        </div>
        <span className="text-xs text-muted-foreground font-mono uppercase">
          {language}
        </span>
      </div>

      {/* Editor */}
      <div className="flex min-h-[350px] max-h-[500px]">
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 w-12 py-4 text-right pr-3 overflow-hidden select-none bg-secondary/20 border-r border-border/30"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i + 1}
              className="text-xs font-mono text-muted-foreground/50 leading-6"
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          placeholder={placeholder}
          spellCheck={false}
          className="flex-1 p-4 bg-transparent resize-none outline-none font-mono text-sm leading-6 text-foreground placeholder:text-muted-foreground/40 scrollbar-thin"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 bg-secondary/20 text-xs text-muted-foreground">
        <span>{lineCount} lines</span>
        <span>{value.length} characters</span>
      </div>
    </div>
  );
};

export default CodeEditor;
