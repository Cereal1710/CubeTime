import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { BarChart3, TrendingUp, Clock, Info } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { useSessionStore } from '../stores/useSessionStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { computeSessionMetrics, generateChartData, generateDistribution } from '../statistics/metrics';
import { formatTime } from '../statistics/averages';

export const StatisticsPage: React.FC = () => {
  const { solves, sessions, activeSessionId, switchSession } = useSessionStore();
  const { precision } = useSettingsStore();

  const metrics = useMemo(() => computeSessionMetrics(solves), [solves]);
  const chartData = useMemo(() => generateChartData(solves), [solves]);
  const distributionData = useMemo(() => generateDistribution(solves), [solves]);

  const activeSession = useMemo(
    () => sessions.find(s => s.id === activeSessionId) || sessions[0],
    [sessions, activeSessionId]
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 py-6 md:px-8 max-w-7xl mx-auto w-full select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-text flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Session Statistics & Analytics
          </h2>
          <p className="text-xs md:text-sm text-text-muted mt-0.5">
            WCA-compliant rolling averages, progress trends, and solve distribution for {activeSession?.name || 'current session'}
          </p>
        </div>

        {/* Session selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Session:</span>
          <select
            value={activeSessionId || ''}
            onChange={(e) => switchSession(e.target.value)}
            className="bg-surface hover:bg-surface-elevated border border-border px-3 py-1.5 rounded-lg text-sm font-semibold text-text focus:outline-none focus:border-primary cursor-pointer"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
        <StatCard
          label="Total Solves"
          value={`${metrics.totalSolves}`}
          subtext={`${metrics.completedSolves} completed, ${metrics.dnfCount} DNF`}
        />
        <StatCard
          label="Best Single"
          value={formatTime(metrics.bestSingle, precision)}
          isPB={metrics.bestSingle !== null && metrics.totalSolves > 0}
        />
        <StatCard
          label="Current Ao5"
          value={formatTime(metrics.currentAo5, precision)}
          subtext={metrics.bestAo5 ? `Best: ${formatTime(metrics.bestAo5, precision)}` : undefined}
        />
        <StatCard
          label="Current Ao12"
          value={formatTime(metrics.currentAo12, precision)}
          subtext={metrics.bestAo12 ? `Best: ${formatTime(metrics.bestAo12, precision)}` : undefined}
        />
        <StatCard
          label="Best Ao100"
          value={formatTime(metrics.bestAo100, precision)}
          subtext={metrics.totalSolves >= 100 ? 'Achieved' : `Needs 100 solves (${metrics.totalSolves}/100)`}
        />
        <StatCard
          label="Average TPS"
          value={metrics.averageTPS ? `${metrics.averageTPS}` : '--'}
          subtext="Turns / second"
        />
      </div>

      {solves.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-text-muted">
          <Clock className="w-12 h-12 opacity-30 text-primary mb-3" />
          <h3 className="text-base font-semibold text-text">No Solves in this Session Yet</h3>
          <p className="text-xs text-text-muted max-w-sm mt-1">
            Head over to the Timer page and record some solves to view progression charts and averages!
          </p>
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {/* Progression Chart */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Solve Progression (Time & Rolling Averages)
              </h3>
              <div className="text-xs text-text-muted">
                Times in seconds
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#344155" opacity={0.5} />
                  <XAxis
                    dataKey="index"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    name="Attempt"
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    domain={['auto', 'auto']}
                    unit="s"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#192333',
                      borderColor: '#344155',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="timeSeconds"
                    name="Single (s)"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#38BDF8' }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ao5Seconds"
                    name="Ao5 (s)"
                    stroke="#22C55E"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ao12Seconds"
                    name="Ao12 (s)"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribution & Rules Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Distribution Bar Chart */}
            <div className="lg:col-span-8 p-5 rounded-2xl bg-surface border border-border shadow-sm">
              <h3 className="text-sm font-bold text-text flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                Solve Time Distribution
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#344155" opacity={0.5} />
                    <XAxis dataKey="range" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#192333',
                        borderColor: '#344155',
                        borderRadius: '8px',
                        color: '#F1F5F9',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="count" name="Solves" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* WCA Averaging Information Card */}
            <div className="lg:col-span-4 p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-text flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-primary" />
                  WCA Averaging Methodology
                </h3>
                <div className="text-xs text-text-muted space-y-2.5 leading-relaxed">
                  <p>
                    <strong className="text-text">Average of 5 (Ao5):</strong> The fastest and slowest solves from the last 5 attempts are discarded. The remaining 3 solves are averaged.
                  </p>
                  <p>
                    <strong className="text-text">Average of 12 (Ao12):</strong> The fastest and slowest solves from the last 12 attempts are discarded. The remaining 10 solves are averaged.
                  </p>
                  <p>
                    <strong className="text-text">Penalties:</strong> A <span className="text-warning font-semibold">+2</span> penalty adds 2000ms to raw time. A <span className="text-danger font-semibold">DNF</span> counts as the worst time. More than 1 DNF in an Ao5 results in an overall DNF average.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-text-muted/80">
                CubeTime complies with standard World Cube Association Article 9 regulations.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
