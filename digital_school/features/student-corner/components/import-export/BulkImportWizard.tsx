'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  downloadExcelTemplateAction,
  validateExcelUploadAction,
  commitExcelImportAction,
} from '../../actions/import-export-actions';
import { ParsedImportRow, ImportErrorItem } from '../../services/excel-service';
import { toast } from 'sonner';

export function BulkImportWizard() {
  const [file, setFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validRows, setValidRows] = useState<ParsedImportRow[]>([]);
  const [errors, setErrors] = useState<ImportErrorItem[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      toast.info('Generating official template...');
      const res = await downloadExcelTemplateAction();
      if (res.success && res.data) {
        const byteCharacters = atob(res.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.fileName || 'student_corner_template.xlsx';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Template downloaded successfully!');
      } else {
        toast.error(res.error || 'Failed to download template');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error downloading template');
    }
  };

  // Upload and parse spreadsheet
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds maximum 5MB limit');
      return;
    }

    setFile(selectedFile);
    setIsValidating(true);
    setValidRows([]);
    setErrors([]);
    setImportSuccessCount(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await validateExcelUploadAction(base64);

        if (res.success) {
          setValidRows(res.validRows || []);
          setErrors(res.errors || []);
          if (res.errors && res.errors.length > 0) {
            toast.warning(`Found ${res.errors.length} validation issues in spreadsheet`);
          } else {
            toast.success(`Validated ${res.validRows?.length || 0} challenge rows successfully!`);
          }
        } else {
          toast.error(res.error || 'Validation failed');
        }
        setIsValidating(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      toast.error(err.message || 'Failed to read file');
      setIsValidating(false);
    }
  };

  // Commit valid rows in safe concurrent chunks to prevent timeouts
  const CHUNK_SIZE = 50;
  const handleCommit = async () => {
    if (validRows.length === 0) return;

    setIsImporting(true);
    setImportProgress({ current: 0, total: validRows.length });
    let totalImported = 0;

    try {
      for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
        const chunk = validRows.slice(i, i + CHUNK_SIZE);
        const res = await commitExcelImportAction(chunk);
        if (!res.success) {
          throw new Error(
            res.error || `Failed while importing challenges ${i + 1} to ${Math.min(validRows.length, i + CHUNK_SIZE)}`
          );
        }
        totalImported += res.count ?? chunk.length;
        setImportProgress({
          current: Math.min(validRows.length, i + chunk.length),
          total: validRows.length,
        });
      }

      setImportSuccessCount(totalImported);
      toast.success(`Successfully imported all ${totalImported} challenges!`);
    } catch (err: any) {
      toast.error(err.message || 'Error importing challenges');
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Step 1: Download Template */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            1. Download Official Excel Template
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pre-configured spreadsheet with dates, subject headers, categories, and duration bounds.
          </p>
        </div>
        <Button
          onClick={handleDownloadTemplate}
          variant="outline"
          className="rounded-xl text-xs font-bold flex items-center gap-2 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download .xlsx Template</span>
        </Button>
      </div>

      {/* Step 2: Upload */}
      <div className="p-8 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-center relative">
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isValidating || isImporting}
        />
        <div className="max-w-sm mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {file ? file.name : 'Click or Drag & Drop your filled .xlsx here'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Maximum 500 rows per batch. Safe streaming verification.
            </p>
          </div>
        </div>
      </div>

      {isValidating && (
        <div className="p-4 text-center text-xs font-semibold text-indigo-600 animate-pulse">
          Validating spreadsheet cells, dates, and categories...
        </div>
      )}

      {/* Errors list if any */}
      {errors.length > 0 && (
        <div className="p-6 rounded-3xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>Validation Issues ({errors.length})</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            The following rows contain errors and will be skipped. You can still import the valid rows below.
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs text-rose-700 dark:text-rose-400 font-mono">
            {errors.map((err, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-rose-200/50">
                Row {err.rowNumber} [{err.column}]: {err.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Valid Rows Preview & Commit */}
      {validRows.length > 0 && !importSuccessCount && (
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Ready to Import: {validRows.length} Challenges
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review verified challenges before adding to your arenas.
              </p>
            </div>
            <Button
              onClick={handleCommit}
              disabled={isImporting}
              className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-md shadow-indigo-500/20"
            >
              {isImporting
                ? `Importing ${importProgress?.current || 0}/${importProgress?.total || validRows.length}...`
                : 'Confirm & Create Challenges'}
            </Button>
          </div>

          {/* Real-time batch progress indicator */}
          {importProgress && (
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  Writing challenges to database in parallel batches...
                </span>
                <span className="font-mono">
                  {importProgress.current} / {importProgress.total} (
                  {Math.round((importProgress.current / importProgress.total) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${Math.round((importProgress.current / importProgress.total) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto space-y-2">
            {validRows.slice(0, 15).map((row, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs"
              >
                <div className="space-x-2">
                  <span className="font-bold text-slate-900 dark:text-white">{row.title}</span>
                  <span className="text-slate-400">({row.category})</span>
                  {row.subject && <span className="text-indigo-600">• {row.subject}</span>}
                </div>
                <div className="text-slate-500 font-mono">
                  {row.date} | {row.durationMinutes}m
                </div>
              </div>
            ))}
            {validRows.length > 15 && (
              <p className="text-center text-xs text-slate-400 pt-2">
                ...and {validRows.length - 15} more rows
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success Banner */}
      {importSuccessCount !== null && (
        <div className="p-6 rounded-3xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
            Import Completed!
          </h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-sm mx-auto">
            Successfully created {importSuccessCount} challenges. You can now open your arena to review your planned routine.
          </p>
          <Button
            onClick={() => (window.location.href = '/student/student-corner/arena')}
            className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-5"
          >
            Open My Arena
          </Button>
        </div>
      )}
    </div>
  );
}
