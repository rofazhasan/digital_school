import { QuestionType, Difficulty } from "@prisma/client";

export async function fetchQuestions(filters?: Partial<{ subject: string; type: QuestionType }>) {
  const query = new URLSearchParams(filters as any).toString();
  const res = await fetch(`/api/questions?${query}`);
  if (!res.ok) throw new Error("Failed to fetch questions");
  return res.json();
}

export async function createQuestion(data: any) {
  const res = await fetch("/api/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create question");
  return res.json();
}

export async function updateQuestion(id: string, data: any) {
  const res = await fetch(`/api/questions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update question");
  return res.json();
}

export async function deleteQuestion(id: string) {
  const res = await fetch(`/api/questions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete question");
  return res.json();
}

export async function generateAIQuestions(payload: {
  subject: string;
  topic: string;
  classLevel: number;
  count: number;
  type: QuestionType;
}) {
  const res = await fetch(`/api/questions/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("AI question generation failed");
  return res.json();
} 