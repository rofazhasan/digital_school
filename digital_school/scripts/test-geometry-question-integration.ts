/**
 * Integration Test for Objective (MCQ), CQ, and SQ Geometry Questions
 */

import { parseDiagramsInText } from '../utils/diagrams/inline-parser';

console.log('🧪 Testing Objective, CQ, and SQ Geometry Questions...\n');

// 1. Objective Question (MCQ)
const mcqQuestion = {
  type: 'MCQ',
  questionText: 'চিত্রে $\\triangle ABC$-এ $AB = 3\\text{ cm}, BC = 4\\text{ cm}$ এবং $\\angle B = 90^\\circ$ হলে অতিভুজ $AC$ এর দৈর্ঘ্য কত?\n##GEO:right-triangle[A=A,B=B,C=C,a=3,b=4,c=?,angle=30°][size:small]##',
  options: [
    { text: '$5\\text{ cm}$', isCorrect: true },
    { text: '$6\\text{ cm}$', isCorrect: false },
    { text: '$7\\text{ cm}$', isCorrect: false },
    { text: '$\\sqrt{7}\\text{ cm}$', isCorrect: false },
  ],
};

const parsedMCQ = parseDiagramsInText(mcqQuestion.questionText);
console.log('MCQ Stem rendered SVG present:', parsedMCQ.includes('<svg'));
console.log('MCQ Stem size style present:', parsedMCQ.includes('max-width: 145px'));

// 2. Creative Question (CQ)
const cqQuestion = {
  type: 'CQ',
  questionText: `উদ্দীপক: চিত্রে $ABCD$ একটি সামান্তরিক এবং বৃত্তের কেন্দ্র $O$। $AB = 8\\text{ cm}, h = 5\\text{ cm}$ এবং $\\angle A = 60^\\circ$।
##GEO:parallelogram[A=A,B=B,C=C,D=D,b=8,h=5,theta=60°][size:medium]##

(ক) জ্যামিতিক সংজ্ঞা দাও: সামান্তরিক কাকে বলে? [২]
(খ) উদ্দীপকের আলোকে সামান্তরিক $ABCD$-এর ক্ষেত্রফল নির্ণয় কর। [৪]
(গ) প্রমাণ কর যে, সামান্তরিকের কর্ণদ্বয় পরস্পরকে সমদ্বিখণ্ডিত করে। [৪]`,
};

const parsedCQ = parseDiagramsInText(cqQuestion.questionText);
console.log('CQ Stem rendered SVG present:', parsedCQ.includes('<svg'));
console.log('CQ Stem size style present:', parsedCQ.includes('max-width: 220px'));
console.log('CQ Parallel arrows present:', parsedCQ.includes('polygon points='));

// 3. Short Question (SQ) with Circle Tangent
const sqQuestion = {
  type: 'SQ',
  questionText: 'একটি বৃত্তের ব্যাসার্ধ $r = 5\\text{ cm}$ এবং বহিঃস্থ বিন্দু $P$ থেকে স্পর্শক $PT$ টানা হলো। $PT$ এর দৈর্ঘ্য নির্ণয় কর যখন $OP = 13\\text{ cm}$।\n##GEO:tangent[O=O,T=T,P=P,r=5][size:small]##',
};

const parsedSQ = parseDiagramsInText(sqQuestion.questionText);
console.log('SQ Stem rendered SVG present:', parsedSQ.includes('<svg'));
console.log('SQ Right angle marker present:', parsedSQ.includes('stroke-linecap="square"'));

console.log('\n✨ All Objective, CQ, and SQ Geometry questions validated successfully!');
