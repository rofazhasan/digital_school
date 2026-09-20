'use client';

import React, { useState, useEffect } from 'react';
import { CombinedExamItem } from '../../types';
import { AddPersonalExamModal } from './AddPersonalExamModal';
import { ExamPrepGeneratorModal } from './ExamPrepGeneratorModal';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  BookOpen,
  Award,
  AlertCircle,
  Trash2,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { deletePersonalExamAction } from '../../actions/exam-actions';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: '1', text: 'Core syllabus & textbook chapters covered', done: false },
  { id: '2', text: 'Key formulas & concept notes summarized', done: false },
  { id: '3', text: 'Previous years board/school questions solved', done: false },
  { id: '4', text: 'Timed mock practice exam completed', done: false },
  { id: '5', text: 'Stationery, admit card & calculator prepared', done: false },
];

interface ExamAwarenessViewProps {
  initialExams: CombinedExamItem[];
  availableTopics?: any[];
  onRefresh?: () => void;
}

export function ExamAwarenessView({ initialExams, availableTopics = [], onRefresh }: ExamAwarenessViewProps) {
  const [exams, setExams] = useState<CombinedExamItem[]>(initialExams);
  const [addExamOpen, setAddExamOpen] = useState(false);
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [prepExam, setPrepExam] = useState<any | null>(null);

  // Map of examId -> checklist
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({});

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('student_corner_exam_checklists');
      if (stored) {
        setChecklists(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const getExamChecklist = (examId: string): ChecklistItem[] => {
    return checklists[examId] || DEFAULT_CHECKLIST;
  };

  const toggleChecklistItem = (examId: string, itemId: string) => {
    const current = getExamChecklist(examId);
    const updated = current.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    const newMap = { ...checklists, [examId]: updated };
    setChecklists(newMap);
    try {
      localStorage.setItem('student_corner_exam_checklists', JSON.stringify(newMap));
    } catch (e) {}
  };

  const getReadinessPercentage = (examId: string): number => {
    const list = getExamChecklist(examId);
    const completed = list.filter((i) => i.done).length;
    return Math.round((completed / list.length) * 100);
  };

  const handleDeletePersonalExam = async (examId: string) => {
    try {
      const res = await deletePersonalExamAction(examId);
      if (res.success) {
        toast.success('Exam removed');
        setExams(exams.filter((e) => e.id !== examId));
        onRefresh?.();
      } else {
        toast.error(res.error || 'Failed to delete');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting exam');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-linear-to-r from-indigo-900/10 via-purple-900/5 to-transparent border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Exam Awareness
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Upcoming Academic Milestones
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Keep upcoming school tests and personal exams in sight. Track readiness checklist completion to avoid last-minute panic.
          </p>
        </div>

        <Button
          onClick={() => setAddExamOpen(true)}
          className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 h-9 shadow-md shadow-indigo-500/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Personal Exam</span>
        </Button>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.length > 0 ? (
          exams.map((exam) => {
            const formattedDate = format(new Date(exam.examDate), 'EEE, d MMMM yyyy');
            const readiness = getReadinessPercentage(exam.id);
            const isExpanded = expandedExamId === exam.id;
            const currentList = getExamChecklist(exam.id);

            return (
              <div
                key={exam.id}
                className="relative flex flex-col justify-between p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div>
                  {/* Badge & Source */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        exam.isLmsExam
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                      }`}
                    >
                      {exam.isLmsExam ? 'LMS Exam' : 'Personal Exam'}
                    </span>

                    {/* Countdown Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono border ${
                        exam.daysRemaining <= 3
                          ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800 animate-pulse'
                          : exam.daysRemaining <= 7
                          ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
                          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {exam.daysRemaining === 0 ? 'TODAY' : `${exam.daysRemaining}d left`}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                    {exam.title}
                  </h3>

                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {exam.subject}
                  </p>

                  <div className="space-y-1.5 mt-3 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>

                    {exam.startTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {exam.startTime} {exam.durationMinutes ? `(${exam.durationMinutes} min)` : ''}
                        </span>
                      </div>
                    )}

                    {exam.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{exam.location}</span>
                      </div>
                    )}
                  </div>

                    {/* Readiness Progress Bar (Item 40-41) */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-500" /> Prep Readiness
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPrepExam(exam)}
                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            title="Generate Arena preparation tasks for this exam"
                          >
                            <span>+ Prep in Arena</span>
                          </button>
                          <span className={readiness === 100 ? 'text-emerald-600' : 'text-indigo-600'}>
                            {readiness}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            readiness === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${readiness}%` }}
                        />
                      </div>

                    {/* Toggle Checklist */}
                    <button
                      type="button"
                      onClick={() => setExpandedExamId(isExpanded ? null : exam.id)}
                      className="w-full mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white py-1"
                    >
                      <span>Checklist ({currentList.filter((i) => i.done).length}/{currentList.length})</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* Expandable Checklist Items */}
                    {isExpanded && (
                      <div className="pt-2 space-y-1.5 text-xs">
                        {currentList.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleChecklistItem(exam.id, item.id)}
                            className="w-full flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors"
                          >
                            {item.done ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            )}
                            <span
                              className={`text-[11px] leading-tight ${
                                item.done
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-700 dark:text-slate-300 font-medium'
                              }`}
                            >
                              {item.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer details or delete personal */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  {exam.totalMarks ? (
                    <span className="text-[11px] font-semibold text-slate-500">
                      Total: {exam.totalMarks} marks
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Self-guided Prep</span>
                  )}

                  {!exam.isLmsExam && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePersonalExam(exam.id)}
                      className="h-7 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 text-[11px]"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No upcoming exams found
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add your personal upcoming exam dates or check back when school exam routines are published.
            </p>
          </div>
        )}
      </div>

      {/* Add Exam Modal */}
      <AddPersonalExamModal
        open={addExamOpen}
        onClose={() => setAddExamOpen(false)}
        onCreated={() => {
          onRefresh?.();
          toast.success('Personal exam scheduled');
        }}
      />

      {/* Exam Prep Generator Modal */}
      <ExamPrepGeneratorModal
        exam={prepExam}
        availableTopics={availableTopics}
        open={!!prepExam}
        onClose={() => setPrepExam(null)}
      />
    </div>
  );
}
