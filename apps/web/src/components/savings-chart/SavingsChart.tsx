import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { t } from "../../i18n/en.ts";
import { formatEur } from "../../lib/format.ts";

export interface SavingsPoint {
  label: string;
  range: [number, number];
  medianEur: number;
}

interface RangeShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: SavingsPoint;
}

function RangeShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  payload,
}: RangeShapeProps) {
  if (!payload) return null;
  const left = Math.min(x, x + width);
  const barWidth = Math.abs(width);
  const [low, high] = payload.range;
  const share = high > low ? (payload.medianEur - low) / (high - low) : 0.5;
  const centerY = y + height / 2;
  return (
    <g>
      <rect
        x={left}
        y={centerY - 4}
        width={barWidth}
        height={8}
        rx={4}
        fill="var(--series-1)"
        opacity={0.45}
      />
      <circle
        cx={left + barWidth * share}
        cy={centerY}
        r={5}
        fill="var(--series-1)"
        stroke="var(--surface)"
        strokeWidth={2}
      />
    </g>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: readonly { payload?: SavingsPoint }[];
}

function SavingsTooltip({ active, payload }: TooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="card" style={{ margin: 0, padding: "8px 12px" }}>
      <strong>{point.label}</strong>
      <div>
        {t.results.median}: {formatEur(point.medianEur)}
      </div>
      <div className="muted">
        {t.results.range}: {formatEur(point.range[0])} to{" "}
        {formatEur(point.range[1])}
      </div>
    </div>
  );
}

const formatThousandsEur = (value: number): string =>
  `€${String(Math.round(value / 100) / 10)}k`;

const ROW_HEIGHT = 26;
const AXIS_HEIGHT = 48;

export function SavingsChart({ points }: { points: SavingsPoint[] }) {
  const positive = points.filter((p) => p.medianEur > 0).length;
  const axisTick = { fill: "var(--text-secondary)", fontSize: 12 };
  return (
    <figure style={{ margin: 0 }}>
      <div
        role="img"
        aria-label={`${t.results.chartTitle}. ${t.results.chartSummary(positive, points.length)}`}
        style={{ height: points.length * ROW_HEIGHT + AXIS_HEIGHT }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={points}
            layout="vertical"
            margin={{ top: 4, right: 20, bottom: 4, left: 4 }}
          >
            <CartesianGrid horizontal={false} stroke="var(--grid)" />
            <XAxis
              type="number"
              tick={axisTick}
              stroke="var(--border)"
              tickFormatter={formatThousandsEur}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={150}
              interval={0}
              tick={axisTick}
              stroke="var(--border)"
            />
            <ReferenceLine x={0} stroke="var(--text-secondary)" />
            <Tooltip
              content={<SavingsTooltip />}
              cursor={{ fill: "var(--neutral-bg)", opacity: 0.5 }}
            />
            <Bar
              dataKey="range"
              isAnimationActive={false}
              shape={(props: unknown) => (
                <RangeShape {...(props as RangeShapeProps)} />
              )}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="muted">
        {t.results.chartHint} {t.results.chartSummary(positive, points.length)}
      </figcaption>
    </figure>
  );
}
