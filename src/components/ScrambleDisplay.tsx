import React, { useState } from 'react';
import { Copy, Check, RefreshCw, Box } from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';

interface ScrambleDisplayProps {
  scramble: string;
  onNewScramble: () => void;
}

export const ScrambleDisplay: React.FC<ScrambleDisplayProps> = ({
  scramble,
  onNewScramble,
}) => {
  const [copied, setCopied] = useState(false);
  const { show3DPreview, setShow3DPreview } = useSettingsStore();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scramble);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-3 bg-surface/70 backdrop-blur-sm rounded-xl border border-border flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
      {/* Scramble Text */}
      <div className="flex-1 text-center md:text-left overflow-x-auto py-1">
        <span className="font-mono text-base md:text-lg lg:text-xl font-medium tracking-wider text-text selection:bg-primary/30">
          {scramble || 'Generating scramble...'}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setShow3DPreview(!show3DPreview)}
          title={show3DPreview ? 'Hide 3D Preview' : 'Show 3D Preview'}
          className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
            show3DPreview
              ? 'bg-primary/15 border-primary/40 text-primary'
              : 'bg-surface-elevated border-border text-text-muted hover:text-text'
          }`}
        >
          <Box className="w-4 h-4" />
          <span className="hidden sm:inline">3D</span>
        </button>

        <button
          onClick={handleCopy}
          title="Copy scramble"
          className="p-2 rounded-lg bg-surface-elevated hover:bg-border/60 border border-border text-text-muted hover:text-text text-xs flex items-center gap-1.5 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-success" />
              <span className="text-success hidden sm:inline">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>

        <button
          onClick={onNewScramble}
          title="Next scramble"
          className="p-2 rounded-lg bg-primary hover:bg-primary-hover text-background font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-primary/20"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Next</span>
        </button>
      </div>
    </div>
  );
};

