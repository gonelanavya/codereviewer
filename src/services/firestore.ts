import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ReviewIssue } from "@/components/ReviewResults";

interface CodeSnippetData {
  userId: string;
  email: string;
  language: string;
  task: "review" | "rewrite";
  code: string;
  result: ReviewIssue[] | string;
}

export const saveCodeSnippet = async (data: CodeSnippetData) => {
  const docRef = await addDoc(collection(db, "code_snippets"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};
