'use client';

import React, { useState, useEffect } from 'react';

export function DataEngineeringDashboard() {
  const [loading, setLoading] = useState(false);
  const [warehouseData, setWarehouseData] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [recoveryTable, setRecoveryTable] = useState('Question');
  const [recoveryTime, setRecoveryTime] = useState(new Date().toISOString());
  const [recoveredRecords, setRecoveredRecords] = useState<any[] | null>(null);

  const fetchWarehouseData = async () => {
    try {
      const res = await fetch('/api/admin/data-engineering?action=warehouse');
      const data = await res.json();
      if (data.success) {
        setWarehouseData(data.warehouse);
      }
    } catch (err) {
      console.error('Failed to fetch warehouse data:', err);
    }
  };

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const triggerAction = async (actionName: string) => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/data-engineering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionName }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(`✅ ${data.message}`);
        fetchWarehouseData();
      } else {
        setStatusMessage(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setStatusMessage(`❌ Action failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeTravelRecovery = async () => {
    setLoading(true);
    setRecoveredRecords(null);

    try {
      const res = await fetch(
        `/api/admin/data-engineering?action=recover&table=${recoveryTable}&time=${encodeURIComponent(recoveryTime)}`
      );
      const data = await res.json();
      if (data.success) {
        setRecoveredRecords(data.records);
        setStatusMessage(`⏳ Recovered ${data.records.length} historical records for ${recoveryTable}`);
      }
    } catch (err: any) {
      setStatusMessage(`❌ Recovery failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📊 Data Engineering & Lakehouse Suite
          </h2>
          <p className="text-xs text-slate-400">
            Manage Lakehouse storage, point-in-time recovery, OLAP warehouse & AI training pipelines.
          </p>
        </div>
        {statusMessage && (
          <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs text-indigo-300">
            {statusMessage}
          </span>
        )}
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          onClick={() => triggerAction('snapshot')}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-xs font-semibold text-white hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-50"
        >
          📸 Take Lakehouse Snapshot
        </button>

        <button
          onClick={() => triggerAction('warehouse')}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-semibold text-white hover:bg-indigo-500 transition-all cursor-pointer disabled:opacity-50"
        >
          📊 Sync Data Warehouse
        </button>

        <button
          onClick={() => triggerAction('ai-build')}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-xs font-semibold text-white hover:bg-purple-500 transition-all cursor-pointer disabled:opacity-50"
        >
          🤖 Build AI Datasets
        </button>
      </div>

      {/* Time-Travel Recovery Controls */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          ⏳ Time-Travel Data Recovery Engine
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={recoveryTable}
            onChange={(e) => setRecoveryTable(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
          >
            <option value="Question">Question Table</option>
            <option value="Exam">Exam Table</option>
            <option value="ExamSubmission">ExamSubmission Table</option>
            <option value="User">User Table</option>
          </select>

          <input
            type="text"
            value={recoveryTime}
            onChange={(e) => setRecoveryTime(e.target.value)}
            placeholder="ISO Timestamp e.g. 2026-07-29T21:00:00Z"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
          />

          <button
            onClick={handleTimeTravelRecovery}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-all cursor-pointer"
          >
            Recover Data at Timestamp
          </button>
        </div>

        {recoveredRecords && (
          <div className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs font-mono text-emerald-400">
            <pre>{JSON.stringify(recoveredRecords, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Warehouse Metrics Overview */}
      {warehouseData && (
        <div className="space-y-4 border-t border-slate-800 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            📈 Data Warehouse OLAP Analytics
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Subject Difficulty Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <h4 className="text-xs font-medium text-slate-300 mb-2">Subject Difficulty Metrics</h4>
              <div className="space-y-2 text-xs">
                {warehouseData.subjectMetrics?.map((m: any, idx: number) => (
                  <div key={idx} className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span>{m.subject}</span>
                    <span className="text-indigo-400">{m.difficultyRating} (Avg Marks: {m.averageMarks})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Exam Analytics */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <h4 className="text-xs font-medium text-slate-300 mb-2">Exam Performance Aggregates</h4>
              <div className="space-y-2 text-xs">
                {warehouseData.examMetrics?.map((m: any, idx: number) => (
                  <div key={idx} className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span>{m.examName}</span>
                    <span className="text-purple-400">Pass Rate: {m.passRatePercentage}% (Avg: {m.averageScore})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
