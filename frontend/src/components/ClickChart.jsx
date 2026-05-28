// ============================================================
// frontend/src/components/ClickChart.jsx
// A responsive line chart showing daily click counts over the
// last 7 days. Built with Recharts.
// Props:
//   data — array of { date: "YYYY-MM-DD", clicks: number }
//          Always exactly 7 items (filled with 0s by backend).
// ============================================================

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// ============================================================
// HELPER — formatXAxisDate
// Converts "YYYY-MM-DD" to a short label like "Jan 15"
// for the X axis ticks.
// ============================================================

const formatXAxisDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString + "T00:00:00"); // force local time
  return date.toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
  });
};

// ============================================================
// CUSTOM TOOLTIP
// Shown when the user hovers over a data point on the chart.
// Replaces the default Recharts tooltip with our styled version.
// ============================================================

const CustomTooltip = ({ active, payload, label }) => {
  // `active` is true when the user is hovering over a data point
  if (!active || !payload || payload.length === 0) return null;

  const clicks = payload[0]?.value ?? 0;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3
      shadow-2xl shadow-black/50">
      {/* Date label */}
      <p className="text-gray-400 text-xs mb-1">
        {formatXAxisDate(label)}
      </p>
      {/* Click count */}
      <p className="text-white font-semibold text-sm">
        {clicks.toLocaleString()}{" "}
        <span className="text-gray-400 font-normal">
          {clicks === 1 ? "click" : "clicks"}
        </span>
      </p>
    </div>
  );
};

// ============================================================
// CUSTOM DOT
// Renders the dot on each data point of the line.
// We make it larger and more visible on hover.
// ============================================================

const CustomDot = (props) => {
  const { cx, cy, value } = props;

  // Don't render a dot if there were 0 clicks on that day
  if (value === 0) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#7c3aed"          // violet-700
      stroke="#a78bfa"        // violet-400
      strokeWidth={2}
    />
  );
};

// ============================================================
// CUSTOM ACTIVE DOT
// Shown when the user hovers exactly on a data point.
// Larger than the regular dot to indicate interaction.
// ============================================================

const CustomActiveDot = (props) => {
  const { cx, cy } = props;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill="#7c3aed"
      stroke="#c4b5fd"        // violet-300
      strokeWidth={2.5}
    />
  );
};

// ============================================================
// MAIN COMPONENT — ClickChart
// ============================================================

const ClickChart = ({ data }) => {

  // ── Guard: show empty state if no data ────────────────────
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <svg className="w-10 h-10 text-gray-700 mb-3" fill="none"
          stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-500 text-sm">No click data available yet.</p>
        <p className="text-gray-600 text-xs mt-1">
          Share your link to start seeing activity here.
        </p>
      </div>
    );
  }

  // ── Check if ALL values are zero ──────────────────────────
  // If so, we still render the chart but with a flat line at 0
  // and a helpful note so the user understands there's no data.
  const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0);
  const allZero     = totalClicks === 0;

  // ── Compute the Y axis upper bound ────────────────────────
  // We add a small buffer (10% or at least 1) above the max value
  // so the line doesn't hug the top of the chart.
  const maxClicks = Math.max(...data.map((d) => d.clicks));
  const yMax      = allZero ? 5 : Math.ceil(maxClicks * 1.2) || 5;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="w-full">
      {/* Zero-data note */}
      {allZero && (
        <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/50
          rounded-xl px-4 py-2.5 mb-4 text-sm text-gray-400">
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none"
            stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          No clicks in the last 7 days. Share your link to see activity here.
        </div>
      )}

      {/*
        ResponsiveContainer — makes the chart fill its parent width.
        Height is fixed at 260px.
        We use AreaChart instead of LineChart so we can add a gradient
        fill beneath the line for a more polished look.
      */}
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          {/*
            SVG defs — define the gradient fill used under the line.
            id="clickGradient" is referenced by the Area's fill prop.
          */}
          <defs>
            <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
              {/* Top of the gradient — violet with 30% opacity */}
              <stop offset="5%"   stopColor="#7c3aed" stopOpacity={0.3} />
              {/* Bottom of the gradient — fully transparent */}
              <stop offset="95%"  stopColor="#7c3aed" stopOpacity={0}   />
            </linearGradient>
          </defs>

          {/*
            CartesianGrid — subtle dotted grid lines for readability.
            strokeDasharray="3 3" creates a dashed pattern.
          */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"        // gray-700
            vertical={false}        // only horizontal lines
          />

          {/*
            XAxis — shows date labels at the bottom.
            dataKey="date" maps to the `date` field in our data array.
            tickFormatter converts "YYYY-MM-DD" to "Jan 15".
          */}
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxisDate}
            tick={{
              fill:     "#6b7280", // gray-500
              fontSize: 11,
            }}
            axisLine={{ stroke: "#374151" }}
            tickLine={false}
            dy={8}                  // push labels down slightly
          />

          {/*
            YAxis — shows click count on the left.
            allowDecimals={false} ensures we show whole numbers only.
            tickCount={5} limits the number of Y axis labels.
          */}
          <YAxis
            allowDecimals={false}
            tickCount={5}
            domain={[0, yMax]}
            tick={{
              fill:     "#6b7280",
              fontSize: 11,
            }}
            axisLine={false}
            tickLine={false}
          />

          {/*
            Tooltip — our custom styled tooltip component.
            cursor shows a vertical guide line while hovering.
          */}
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke:        "#4b5563", // gray-600
              strokeWidth:   1,
              strokeDasharray: "4 4",
            }}
          />

          {/*
            Area — the filled region beneath the line.
            type="monotone" creates smooth curves between points.
            dot and activeDot use our custom components.
          */}
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="#7c3aed"          // violet-700 — the line color
            strokeWidth={2.5}
            fill="url(#clickGradient)" // reference the SVG gradient above
            dot={<CustomDot />}
            activeDot={<CustomActiveDot />}
            animationDuration={800}    // ms — smooth entrance animation
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* ── Summary row below the chart ──────────────────────── */}
      <div className="flex items-center justify-between mt-4 pt-4
        border-t border-gray-800">
        <div className="flex items-center gap-2">
          {/* Legend dot */}
          <span className="w-3 h-3 rounded-full bg-violet-600 inline-block" />
          <span className="text-gray-500 text-xs">Daily clicks</span>
        </div>
        <div className="text-right">
          <span className="text-gray-400 text-xs">
            Total this week:{" "}
            <span className="text-white font-semibold">
              {totalClicks.toLocaleString()}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClickChart;