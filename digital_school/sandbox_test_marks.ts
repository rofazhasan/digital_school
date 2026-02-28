import { evaluateMCQuestion } from "./lib/evaluation/mcEvaluation";
import { evaluateINTQuestion } from "./lib/evaluation/intEvaluation";
import { evaluateARQuestion } from "./lib/evaluation/arEvaluation";
import { evaluateMTFQuestion } from "./lib/evaluation/mtfEvaluation";

const mcQuestion = { marks: 2, options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }] };
const intQuestion = { marks: 2, answer: 5 };
const arQuestion = { marks: 2, correctOption: 1, assertion: "A", reason: "R" };
const mtfQuestion = { marks: 2, leftColumn: [{ id: "l1" }], rightColumn: [{ id: "r1" }], matches: { l1: "r1" } };

console.log("MC Empty:", evaluateMCQuestion(mcQuestion, { selectedOptions: [] } as any, { negativeMarking: 0, partialMarking: true, hasAttempted: false }));
console.log("MC Null:", evaluateMCQuestion(mcQuestion, null as any, { negativeMarking: 0, partialMarking: true, hasAttempted: false }));

console.log("INT Empty Obj:", evaluateINTQuestion(intQuestion, {} as any));
console.log("INT Null:", evaluateINTQuestion(intQuestion, null as any));
console.log("INT string zero:", evaluateINTQuestion(intQuestion, "0" as any));

console.log("AR Empty Obj:", evaluateARQuestion(arQuestion, {} as any));
console.log("AR Null:", evaluateARQuestion(arQuestion, null as any));

console.log("MTF Empty Obj:", evaluateMTFQuestion(mtfQuestion, {} as any));
console.log("MTF Null:", evaluateMTFQuestion(mtfQuestion, null as any));
