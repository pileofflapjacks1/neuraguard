"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import type { CognitiveState } from "@/lib/types";

interface Props {
  history: CognitiveState[];
}

export function StateCharts({ history }: Props) {
  const data = history.map((s) => ({
    t: new Date(s.t).toLocaleTimeString([], {
      minute: "2-digit",
      second: "2-digit",
    }),
    load: Math.round(s.cognitiveLoad * 10) / 10,
    focus: Math.round(s.focus * 10) / 10,
    fatigue: Math.round(s.fatigue * 10) / 10,
    agency: Math.round(s.agency * 10) / 10,
    anomaly: Math.round(s.anomalyScore * 10) / 10,
  }));

  if (data.length < 2) {
    return (
      <div className="guard-card flex h-64 items-center justify-center text-sm text-guard-muted">
        Start the simulator to populate live charts (last ~5–10 minutes).
      </div>
    );
  }

  return (
    <div className="guard-card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-guard-fg">
          State time-series
        </h2>
        <span className="text-xs text-guard-muted">{data.length} points</span>
      </div>
      <div className="h-72 w-full" role="img" aria-label="Cognitive state charts">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis
              dataKey="t"
              tick={{ fill: "#8b9bb0", fontSize: 11 }}
              minTickGap={40}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#8b9bb0", fontSize: 11 }}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "#0f141c",
                border: "1px solid #243041",
                borderRadius: 8,
                color: "#e8eef7",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#8b9bb0" }} />
            <Line
              type="monotone"
              dataKey="load"
              name="Load"
              stroke="#fbbf24"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="focus"
              name="Focus"
              stroke="#34d399"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="fatigue"
              name="Fatigue"
              stroke="#f87171"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="agency"
              name="Agency"
              stroke="#22d3ee"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="anomaly"
              name="Anomaly"
              stroke="#c084fc"
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
