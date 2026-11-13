import React, { useState, useRef } from 'react';
import {
  Settings,
  Clock,
  Bluetooth,
  Download,
  Upload,
  Trash2,
  Check,
  AlertTriangle,
  RotateCcw,
  Eye,
  Volume2
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useSessionStore } from '../stores/useSessionStore';
import { solveRepository } from '../database/solveRepository';
import type { InspectionTime, TimerPrecision } from '../types';

export const SettingsPage: React.FC = () => {
  const {
    inspection,
    precision,
    holdToReadyMs,
    soundEnabled,
    autoStartOnCubeMove,
    autoStopOnCubeSolved,
    show3DPreview,
    setInspection,
    setPrecision,
    setHoldToReadyMs,
    setSoundEnabled,
    setAutoStartOnCubeMove,
    setAutoStopOnCubeSolved,
    setShow3DPreview,
    resetDefaults
  } = useSettingsStore();

  const { activeSessionId, reloadSolves, clearAll } = useSessionStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Export JSON Backup
  const handleExportJSON = async () => {
    try {
      const json = await solveRepository.exportJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cubetime-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus('JSON Backup Downloaded');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const csv = await solveRepository.exportCSV(activeSessionId || undefined);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cubetime-solves-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus('CSV File Downloaded');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Import JSON Backup
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await solveRepository.importJSON(text);
      await reloadSolves();
      setImportStatus(`Imported ${result.solveCount} solves in ${result.sessionCount} sessions!`);
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: unknown) {
      alert('Failed to import backup: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Clear all data
  const handleClearAll = async () => {
    await clearAll();
    setIsConfirmingClear(false);
    alert('All solves and custom sessions have been deleted.');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 py-6 md:px-8 max-w-5xl mx-auto w-full select-none">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/70">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-text flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Preferences & Settings
          </h2>
          <p className="text-xs md:text-sm text-text-muted mt-0.5">
            Configure timer behavior, Smart Cube automation, and local storage data
          </p>
        </div>

        <button
          onClick={resetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-xs text-text-muted hover:text-text transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="space-y-6 mt-6">
        {/* Timer Behavior Card */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Timer Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* WCA Inspection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">WCA Inspection Time</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 0, label: 'Disabled' },
                  { value: 15, label: '15 seconds' },
                  { value: 17, label: '17s (Strict)' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setInspection(opt.value as InspectionTime)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${inspection === opt.value
                        ? 'bg-primary text-background border-primary shadow-sm'
                        : 'bg-surface-elevated border-border text-text-muted hover:text-text'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-text-muted">
                {inspection > 0
                  ? 'Counts down before solve. Standard WCA rules (+2 at 15s, DNF at 17s).'
                  : 'Timer starts immediately upon releasing Space or screen.'}
              </p>
            </div>

            {/* Display Precision */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Timer Precision</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'hundredths', label: 'Hundredths (0.01s)' },
                  { value: 'thousandths', label: 'Thousandths (0.001s)' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPrecision(opt.value as TimerPrecision)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${precision === opt.value
                        ? 'bg-primary text-background border-primary shadow-sm'
                        : 'bg-surface-elevated border-border text-text-muted hover:text-text'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-text-muted">
                WCA official records display times in hundredths of a second.
              </p>
            </div>

            {/* Hold to Ready Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text">Hold-to-Ready Delay</label>
                <span className="font-mono text-xs font-bold text-primary">{holdToReadyMs} ms</span>
              </div>
              <input
                type="range"
                min="100"
                max="800"
                step="50"
                value={holdToReadyMs}
                onChange={(e) => setHoldToReadyMs(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <p className="text-[11px] text-text-muted">
                Required hold duration before the timer turns green and is ready to start.
              </p>
            </div>

            {/* 3D Preview Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Visuals & Feedback</label>
              <label className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated border border-border cursor-pointer">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-text">Show 3D Cube Preview on Timer</span>
                </div>
                <input
                  type="checkbox"
                  checked={show3DPreview}
                  onChange={(e) => setShow3DPreview(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Smart Cube Preferences */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
            <Bluetooth className="w-4 h-4 text-primary" />
            GAN Smart Cube Automation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-elevated border border-border cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-text">Auto-start on First Turn</div>
                <div className="text-[11px] text-text-muted">
                  Starts timer on the first physical turn of your GAN cube
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoStartOnCubeMove}
                onChange={(e) => setAutoStartOnCubeMove(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer ml-3"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-elevated border border-border cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-text">Auto-stop on Solved State</div>
                <div className="text-[11px] text-text-muted">
                  Validates cube state and stops the timer automatically
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoStopOnCubeSolved}
                onChange={(e) => setAutoStopOnCubeSolved(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer ml-3"
              />
            </label>
          </div>
        </div>

        {/* Data Persistence, Backup & Restore */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              Local Storage, Backup & Export
            </h3>
            {exportStatus && (
              <span className="text-xs text-success font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {exportStatus}
              </span>
            )}
            {importStatus && (
              <span className="text-xs text-success font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {importStatus}
              </span>
            )}
          </div>

          <p className="text-xs text-text-muted">
            All solves and sessions are safely stored locally in your browser’s IndexedDB database. You can export backups at any time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface-elevated hover:bg-border border border-border text-xs font-semibold text-text transition-colors"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Export Solves (CSV)</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface-elevated hover:bg-border border border-border text-xs font-semibold text-text transition-colors"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Full Backup (JSON)</span>
            </button>

            <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface-elevated hover:bg-border border border-border text-xs font-semibold text-text cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-primary" />
              <span>Restore Backup (JSON)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Danger Zone: Clear all solves */}
          <div className="mt-6 pt-5 border-t border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-danger flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Clear All Data
              </div>
              <div className="text-[11px] text-text-muted">
                Permanently wipes all recorded solves and sessions from IndexedDB.
              </div>
            </div>

            {isConfirmingClear ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 rounded-lg bg-danger text-background text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  Yes, Delete Everything
                </button>
                <button
                  onClick={() => setIsConfirmingClear(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-xs text-text-muted hover:text-text"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingClear(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger/10 hover:bg-danger/20 border border-danger/30 text-danger text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Solves</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};