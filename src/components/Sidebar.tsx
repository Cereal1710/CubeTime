import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Timer,
  Bluetooth,
  BarChart3,
  History,
  GraduationCap,
  Settings,
  Battery,
  Circle
} from 'lucide-react';
import { useSmartCubeStore } from '../stores/useSmartCubeStore';

const NAV_ITEMS = [
  { path: '/', label: 'Timer', icon: Timer },
  { path: '/smart-cube', label: 'Smart Cube', icon: Bluetooth },
  { path: '/statistics', label: 'Statistics', icon: BarChart3 },
  { path: '/history', label: 'History', icon: History },
  { path: '/training', label: 'Training', icon: GraduationCap },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { status, deviceInfo } = useSmartCubeStore();

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/15 border border-success/30 text-success text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="truncate max-w-[90px]">{deviceInfo?.name || 'Connected'}</span>
            {deviceInfo?.batteryLevel !== null && deviceInfo?.batteryLevel !== undefined && (
              <span className="flex items-center gap-0.5 text-[10px] opacity-80">
                <Battery className="w-3 h-3" />
                {deviceInfo.batteryLevel}%
              </span>
            )}
          </div>
        );
      case 'scanning':
      case 'connecting':
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span>Connecting...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-danger/15 border border-danger/30 text-danger text-xs font-medium">
            <Circle className="w-2 h-2 fill-danger" />
            <span>BLE Error</span>
          </div>
        );
      case 'unsupported':
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-elevated border border-border text-text-muted text-xs">
            <Circle className="w-2 h-2 fill-border" />
            <span>No BLE</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-elevated/80 border border-border text-text-muted text-xs">
            <Circle className="w-2 h-2 fill-text-muted/40" />
            <span>Cube Offline</span>
          </div>
        );
    }
  };

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md+) */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border shrink-0 select-none">
        {/* Brand Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-primary/40 flex items-center justify-center shadow-sm shadow-primary/10">
              <img src="/logo.svg" alt="CubeTime" className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-text tracking-tight flex items-center gap-1.5">
                CubeTime
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25">
                  PRO
                </span>
              </h1>
              <p className="text-xs text-text-muted">Smart Rubik Timer</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-background font-semibold shadow-md shadow-primary/20'
                      : 'text-text-muted hover:text-text hover:bg-surface-elevated'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Device Status */}
        <div className="p-4 border-t border-border bg-surface/50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-text-muted">GAN Cube</div>
            <NavLink to="/smart-cube" className="hover:opacity-90 transition-opacity">
              {getStatusBadge()}
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (visible below md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around py-2 px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-text-muted hover:text-text'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

