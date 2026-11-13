import React, { useState, useEffect } from 'react';
import {
  Bluetooth,
  Battery,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Power,
  Cpu,
  Info,
  Radio,
  Sliders
} from 'lucide-react';
import { Cube3D } from '../components/Cube3D';
import { cubeEngine } from '../cube/cubeEngine';
import { useSmartCubeStore } from '../stores/useSmartCubeStore';
import { useSettingsStore } from '../stores/useSettingsStore';

export const SmartCubePage: React.FC = () => {
  const { status, deviceInfo, lastEvent, error, isSupported, connect, disconnect } = useSmartCubeStore();
  const {
    autoStartOnCubeMove,
    autoStopOnCubeSolved,
    setAutoStartOnCubeMove,
    setAutoStopOnCubeSolved,
  } = useSettingsStore();

  const [facelets, setFacelets] = useState<string>(cubeEngine.getFacelets());
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const unsub = cubeEngine.subscribe((newFacelets) => {
      setFacelets(newFacelets);
    });
    return unsub;
  }, []);

  const handleResetVirtualCube = () => {
    setIsResetting(true);
    cubeEngine.reset();
    setTimeout(() => setIsResetting(false), 500);
  };

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting' || status === 'scanning';

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 py-6 md:px-8 max-w-6xl mx-auto w-full select-none">
      {/* Page Title */}
      <div className="flex items-center justify-between pb-4 border-b border-border/70">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-text flex items-center gap-2">
            <Bluetooth className="w-6 h-6 text-primary" />
            GAN Smart Cube Manager
          </h2>
          <p className="text-xs md:text-sm text-text-muted mt-0.5">
            Connect your GAN Smart Cube via Web Bluetooth for real-time move tracking and automated timing
          </p>
        </div>

        {/* Quick Connection Action Button */}
        <div>
          {isConnected ? (
            <button
              onClick={disconnect}
              className="flex items-center gap-2 px-4 py-2 bg-danger/15 hover:bg-danger/25 text-danger border border-danger/30 rounded-xl text-sm font-semibold transition-colors"
            >
              <Power className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting || !isSupported}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-background rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary/20"
            >
              <Bluetooth className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
              <span>{isConnecting ? 'Scanning...' : 'Connect GAN Cube'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Unsupported Browser Warning */}
      {!isSupported && (
        <div className="mt-4 p-4 rounded-xl bg-danger/10 border border-danger/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-semibold text-danger">Web Bluetooth is not supported in this browser</h4>
            <p className="text-text-muted text-xs mt-1">
              Apple Safari, iOS browsers, and Mozilla Firefox do not support the Web Bluetooth API.
              For direct GAN Cube BLE integration, please open CubeTime in Google Chrome, Microsoft Edge, Opera, or Chromium on Android.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && isSupported && (
        <div className="mt-4 p-3.5 rounded-xl bg-danger/10 border border-danger/30 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm text-text">
            <span className="font-medium text-danger">{error}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Left Panel (Device Info & Settings), Right Panel (3D Cube Live Tracking) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Device Status & Diagnostics Card */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Status Box */}
          <div className="p-5 rounded-2xl bg-surface border border-border flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Device Status
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConnected
                      ? 'bg-success animate-pulse'
                      : isConnecting
                      ? 'bg-primary animate-ping'
                      : 'bg-text-muted/40'
                  }`}
                />
                <span className="text-xs font-semibold capitalize text-text">
                  {status}
                </span>
              </div>
            </div>

            {/* Device Info */}
            {isConnected && deviceInfo ? (
              <div className="space-y-3 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Device Name:</span>
                  <span className="text-sm font-semibold text-text">{deviceInfo.name}</span>
                </div>

                {deviceInfo.hardwareName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Hardware:</span>
                    <span className="text-xs font-mono text-text">{deviceInfo.hardwareName}</span>
                  </div>
                )}

                {deviceInfo.softwareVersion && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Firmware:</span>
                    <span className="text-xs font-mono text-text">{deviceInfo.softwareVersion}</span>
                  </div>
                )}

                {deviceInfo.batteryLevel !== null && deviceInfo.batteryLevel !== undefined ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Battery:</span>
                    <div className="flex items-center gap-1.5 font-semibold text-success text-sm">
                      <Battery className="w-4 h-4" />
                      <span>{deviceInfo.batteryLevel}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Battery:</span>
                    <span className="text-xs text-text-muted">Not reported by hardware</span>
                  </div>
                )}

                {deviceInfo.gyroSupported !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Gyroscope:</span>
                    <span className="text-xs font-semibold text-text">
                      {deviceInfo.gyroSupported ? 'Supported' : 'Not installed'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-text-muted text-xs flex flex-col items-center gap-2">
                <Radio className="w-8 h-8 opacity-40 text-primary" />
                <span>No GAN Smart Cube connected. Click Connect above to pair.</span>
              </div>
            )}

            {/* Diagnostics stream */}
            <div className="p-3 bg-background rounded-xl border border-border/60 text-xs font-mono flex items-center justify-between">
              <span className="text-text-muted">Latest BLE Event:</span>
              <span className="text-primary font-medium">{lastEvent || 'Idle'}</span>
            </div>
          </div>

          {/* Smart Cube Automation Settings */}
          <div className="p-5 rounded-2xl bg-surface border border-border flex flex-col gap-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              Smart Cube Preferences
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated border border-border/80 cursor-pointer">
                <div>
                  <div className="text-sm font-semibold text-text">Auto-start Timer on First Move</div>
                  <div className="text-xs text-text-muted">
                    Starts timing the instant you make a turn on your GAN cube
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoStartOnCubeMove}
                  onChange={(e) => setAutoStartOnCubeMove(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer ml-3"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated border border-border/80 cursor-pointer">
                <div>
                  <div className="text-sm font-semibold text-text">Auto-stop Timer on Cube Solved</div>
                  <div className="text-xs text-text-muted">
                    Automatically stops the timer when the cube reaches the solved state
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

          {/* Supported Models Info */}
          <div className="p-4 rounded-xl bg-surface-elevated/60 border border-border text-xs space-y-2">
            <div className="font-semibold text-text flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-primary" />
              Supported GAN Hardware Models
            </div>
            <p className="text-text-muted leading-relaxed">
              Compatible with GAN Smart Cubes utilizing the official GAN BLE protocol:
              <strong className="text-text block mt-1">
                GAN 356 i, GAN 356 i Carry, GAN 356 i Carry 2, GAN 356 i 3, GAN 12 ui, GAN 14 ui FreeFlag
              </strong>
            </p>
          </div>
        </div>

        {/* Right Panel: Live 3D Cube & Reset controls */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-surface border border-border flex flex-col flex-1 shadow-sm min-h-[420px]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-text flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  Live Cube State
                </h3>
                <span className="text-xs text-text-muted">
                  Drag to rotate 3D camera. Turns made on your GAN cube are reflected live.
                </span>
              </div>

              <button
                onClick={handleResetVirtualCube}
                title="Reset virtual cube to solved state"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-border text-text-muted hover:text-text text-xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Reset Virtual</span>
              </button>
            </div>

            {/* 3D Cube Render */}
            <div className="flex-1 w-full bg-background/50 rounded-xl border border-border/60 flex items-center justify-center relative overflow-hidden">
              <Cube3D facelets={facelets} showControls={true} className="w-full h-full min-h-[360px]" />
            </div>

            {/* Solved Status Pill */}
            <div className="mt-3 flex items-center justify-between text-xs text-text-muted px-1">
              <span>Current State:</span>
              {cubeEngine.isSolved() ? (
                <span className="text-success font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cube is Solved
                </span>
              ) : (
                <span className="text-warning font-medium">Scrambled</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
