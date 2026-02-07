import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileCode } from "lucide-react";

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const languages = [
  { value: "javascript", label: "JavaScript", icon: "JS" },
  { value: "typescript", label: "TypeScript", icon: "TS" },
  { value: "python", label: "Python", icon: "PY" },
  { value: "java", label: "Java", icon: "JV" },
  { value: "csharp", label: "C#", icon: "C#" },
  { value: "cpp", label: "C++", icon: "C+" },
  { value: "c", label: "C", icon: "C" },
  { value: "go", label: "Go", icon: "GO" },
  { value: "rust", label: "Rust", icon: "RS" },
  { value: "ruby", label: "Ruby", icon: "RB" },
  { value: "php", label: "PHP", icon: "PH" },
  { value: "swift", label: "Swift", icon: "SW" },
  { value: "kotlin", label: "Kotlin", icon: "KT" },
];

const LanguageSelector = ({ value, onChange }: LanguageSelectorProps) => {
  const selectedLanguage = languages.find((l) => l.value === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] bg-secondary/50 border-border hover:bg-secondary/70 transition-colors">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-primary" />
          <SelectValue>
            {selectedLanguage?.label || "Select language"}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="bg-popover border-border">
        {languages.map((lang) => (
          <SelectItem
            key={lang.value}
            value={lang.value}
            className="cursor-pointer hover:bg-secondary/50"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 flex items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold font-mono">
                {lang.icon}
              </span>
              <span>{lang.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
