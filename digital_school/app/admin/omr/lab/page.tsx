"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, FlaskConical, CheckCircle, BarChart3, AlertTriangle, ShieldCheck } from 'lucide-react';
import { generateGroundTruth, renderSyntheticCanvasBuffer, evaluateBenchmarkAccuracy, AccuracyReport, GroundTruthData } from '@/lib/omr/lab-generator';
import { generateTemplateGeometry, CANONICAL_WIDTH, CANONICAL_HEIGHT } from '@/lib/omr/geometry-template';
import { DigitBubbleReader } from '@/lib/omr/digit-bubble-reader';
import { QuestionClassifier } from '@/lib/omr/question-classifier';

export default function OMRLabPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [seed, setSeed] = useState(42);
  const [markStrength, setMarkStrength] = useState(0.85);
  const [report, setReport] = useState<AccuracyReport | null>(null);
  const [groundTruth, setGroundTruth] = useState<GroundTruthData | null>(null);

  const runSyntheticBenchmark = async () => {
    setIsRunning(true);
    try {
      const gt = generateGroundTruth(seed);
      setGroundTruth(gt);

      // Render synthetic sheet image buffer
      const canvas = renderSyntheticCanvasBuffer(gt, { lightStrength: markStrength });
      const geometry = generateTemplateGeometry('C_11_12', 1);

      // Execute Scanner Engine against synthetic sheet
      const rollRes = DigitBubbleReader.readMatrix(
        canvas.data,
        CANONICAL_WIDTH,
        CANONICAL_HEIGHT,
        geometry.roll.columns,
        geometry.roll.cells
      );

      const regRes = DigitBubbleReader.readMatrix(
        canvas.data,
        CANONICAL_WIDTH,
        CANONICAL_HEIGHT,
        geometry.registration.columns,
        geometry.registration.cells
      );

      const ansRes = QuestionClassifier.classifyQuestions(
        canvas.data,
        CANONICAL_WIDTH,
        CANONICAL_HEIGHT,
        geometry.answers.questionCount,
        geometry.answers.cells
      );

      const benchReport = evaluateBenchmarkAccuracy(gt, rollRes.value, regRes.value, ansRes.answers);
      setReport(benchReport);
    } catch (err) {
      console.error('Benchmark failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/omr/review" className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <FlaskConical className="w-8 h-8 text-indigo-400" /> OMR LAB & BENCHMARK SUITE
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Synthetic ground truth answer sheet generator & multi-feature scanner accuracy benchmarking.
          </p>
        </div>

        <button
          onClick={runSyntheticBenchmark}
          disabled={isRunning}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
        >
          <Play className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running Benchmark...' : 'Run Automated Benchmark'}
        </button>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
              Synthetic Sheet Generator Parameters
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Random Seed</label>
                <input
                  type="number"
                  value={seed}
                  onChange={e => setSeed(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-white font-mono text-sm outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
                  <span>Ballpoint Fill Strength</span>
                  <span>{(markStrength * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="1.00"
                  step="0.05"
                  value={markStrength}
                  onChange={e => setMarkStrength(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>

          {groundTruth && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">
                Ground Truth Summary
              </h2>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-800 py-1">
                  <span className="text-slate-400">Roll Number:</span>
                  <span className="text-indigo-400 font-bold">{groundTruth.rollNumber}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 py-1">
                  <span className="text-slate-400">Registration:</span>
                  <span className="text-indigo-400 font-bold">{groundTruth.registrationNo}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Set Code:</span>
                  <span className="text-indigo-400 font-bold">{groundTruth.setCode}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
            <BarChart3 className="w-5 h-5 text-emerald-400" /> Benchmark Accuracy Metrics
          </h2>

          {report ? (
            <div className="space-y-6">
              {/* Score Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <div className="text-2xl font-black text-emerald-400">{report.questionAccuracy.toFixed(2)}%</div>
                  <div className="text-xs text-slate-400 mt-1 font-semibold">Question Accuracy</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <div className="text-2xl font-black text-sky-400">{report.rollAccuracy.toFixed(2)}%</div>
                  <div className="text-xs text-slate-400 mt-1 font-semibold">Roll Accuracy</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <div className="text-2xl font-black text-amber-400">{report.registrationAccuracy.toFixed(2)}%</div>
                  <div className="text-xs text-slate-400 mt-1 font-semibold">Registration Accuracy</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <div className="text-2xl font-black text-indigo-400">{report.studentIdentityAccuracy.toFixed(2)}%</div>
                  <div className="text-xs text-slate-400 mt-1 font-semibold">Identity Match</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <div className="text-2xl font-black text-emerald-400">{report.finalScoreAccuracy.toFixed(2)}%</div>
                  <div className="text-xs text-slate-400 mt-1 font-semibold">Score Accuracy</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <div className="text-2xl font-black text-purple-400">{report.bubbleAccuracy.toFixed(2)}%</div>
                  <div className="text-xs text-slate-400 mt-1 font-semibold">Overall Bubble Accuracy</div>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  report.questionAccuracy >= 99.9
                    ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                    : 'bg-amber-950/50 border-amber-800 text-amber-300'
                }`}
              >
                <ShieldCheck className="w-6 h-6 flex-shrink-0" />
                <div className="text-xs font-medium">
                  <strong>Validation Result:</strong> Evaluated {report.totalEvaluated} questions. Passed:{' '}
                  {report.passedCount}, Failed: {report.failedCount}. Target accuracy threshold status:{' '}
                  {report.questionAccuracy >= 99.9 ? 'PASSED (High Precision)' : 'REQUIRES REVIEW'}.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 text-center">
              <FlaskConical className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Click "Run Automated Benchmark" to generate synthetic OMR data and evaluate engine accuracy.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
