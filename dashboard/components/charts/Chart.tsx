"use client";

import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartData,
  type ChartOptions,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type TooltipItem,
} from "chart.js";
import { Chart as ReactChart } from "react-chartjs-2";
import { type Tokens, useTokens } from "@/lib/theme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Tooltip,
  Legend,
);
ChartJS.defaults.font.family = 'system-ui, -apple-system, "Segoe UI", sans-serif';

const height = { md: 260, lg: 300 } as const;

const markStyle = {
  lineWidth: 2,
  ruleWidth: 1,
  dotRadius: 2.5,
  hoverRadius: 5,
  lineHoverRadius: 4,
  hitRadius: 10,
  barRadius: 4,
  barCategory: 0.85,
  barWidth: 0.9,
} as const;

const chrome = {
  tickPadding: 6,
  autoSkipPadding: 12,
  titleSize: 12,
  legendBox: 12,
  legendLine: 2,
  legendPadding: 12,
  tooltipPadding: 10,
  tooltipSwatch: 8,
  tooltipBorder: 1,
} as const;

/** Series colors by role; values come from the theme. */
const colorRole = {
  series1: (tk: Tokens) => tk.series1,
  series2: (tk: Tokens) => tk.series2,
  series3: (tk: Tokens) => tk.series3,
  reference: (tk: Tokens) => tk.textMuted,
  muted: (tk: Tokens) => tk.dots,
} as const;
export type SeriesColor = keyof typeof colorRole;

export type Series = {
  label: string;
  data: (number | null)[];
  /** dots: one point per x; line/step: connected; bars; rule: thin reference line. */
  mark: "dots" | "line" | "step" | "bars" | "rule";
  color: SeriesColor;
};

function dataset(s: Series, tk: Tokens) {
  const color = colorRole[s.color](tk);
  const base = { label: s.label, data: s.data, borderColor: color, backgroundColor: color };
  switch (s.mark) {
    case "bars":
      return {
        ...base,
        type: "bar" as const,
        order: 1,
        borderRadius: { topLeft: markStyle.barRadius, topRight: markStyle.barRadius },
        borderSkipped: "bottom" as const,
        categoryPercentage: markStyle.barCategory,
        barPercentage: markStyle.barWidth,
      };
    case "dots":
      return {
        ...base,
        type: "line" as const,
        order: 0,
        showLine: false,
        pointRadius: markStyle.dotRadius,
        pointHoverRadius: markStyle.hoverRadius,
        pointHitRadius: markStyle.hitRadius,
        pointBorderWidth: 0,
      };
    default:
      return {
        ...base,
        type: "line" as const,
        // Lines draw over bars.
        order: 0,
        stepped: s.mark === "step" ? ("after" as const) : false,
        borderWidth: s.mark === "rule" ? markStyle.ruleWidth : markStyle.lineWidth,
        pointRadius: 0,
        pointHoverRadius: s.mark === "rule" ? 0 : markStyle.lineHoverRadius,
        pointHitRadius: markStyle.hitRadius,
        spanGaps: true,
      };
  }
}

export type ChartProps = {
  labels: (string | number)[];
  series: Series[];
  xTitle?: string;
  yTitle?: string;
  stacked?: boolean;
  size?: keyof typeof height;
  format?: (value: number) => string;
  /** Tooltip title for the hovered x index. */
  title?: (index: number) => string;
  /** Extra tooltip lines for the hovered x index. */
  footer?: (index: number) => string | string[];
  /** Called with the x index under the pointer when the plot is clicked. */
  onSelect?: (index: number) => void;
};

function options(tk: Tokens, p: ChartProps): ChartOptions {
  const axis = (title: string | undefined) => ({
    stacked: !!p.stacked,
    border: { color: tk.axis },
    grid: { color: tk.grid, drawTicks: false },
    ticks: { color: tk.textMuted, padding: chrome.tickPadding, maxRotation: 0, autoSkipPadding: chrome.autoSkipPadding },
    title: title
      ? { display: true, text: title, color: tk.textSecondary, font: { size: chrome.titleSize } }
      : undefined,
  });
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: "index", intersect: false },
    onClick: p.onSelect
      ? (_event, elements) => {
          if (elements.length) p.onSelect?.(elements[0].index);
        }
      : undefined,
    onHover: p.onSelect
      ? (event, elements) => {
          const canvas = event.native?.target as HTMLCanvasElement | undefined;
          if (canvas) canvas.style.cursor = elements.length ? "pointer" : "default";
        }
      : undefined,
    scales: {
      x: { ...axis(p.xTitle), grid: { display: false } },
      y: { ...axis(p.yTitle), beginAtZero: true },
    },
    plugins: {
      // A single series is named by the card title; two or more get a legend.
      legend: {
        display: p.series.length > 1,
        position: "top",
        align: "start",
        labels: {
          color: tk.textSecondary,
          boxWidth: chrome.legendBox,
          boxHeight: chrome.legendLine,
          padding: chrome.legendPadding,
        },
      },
      tooltip: {
        backgroundColor: tk.surface,
        titleColor: tk.textPrimary,
        bodyColor: tk.textSecondary,
        footerColor: tk.textMuted,
        borderColor: tk.axis,
        borderWidth: chrome.tooltipBorder,
        padding: chrome.tooltipPadding,
        boxWidth: chrome.tooltipSwatch,
        boxHeight: chrome.tooltipSwatch,
        callbacks: {
          title: (items: TooltipItem<"line" | "bar">[]) =>
            p.title && items.length ? p.title(items[0].dataIndex) : String(items[0]?.label ?? ""),
          label: (item: TooltipItem<"line" | "bar">) => {
            const y = item.parsed.y;
            if (y == null || Number.isNaN(y)) return "";
            return ` ${item.dataset.label}: ${p.format ? p.format(y) : y}`;
          },
          footer: (items: TooltipItem<"line" | "bar">[]) => (p.footer && items.length ? p.footer(items[0].dataIndex) : ""),
        },
      },
    },
  } as ChartOptions;
}

export function Chart(props: ChartProps) {
  const tk = useTokens();
  const style = { position: "relative" as const, height: height[props.size ?? "md"] };
  if (!tk) return <div style={style} />;
  const type = props.series.some((s) => s.mark === "bars") ? "bar" : "line";
  const data = {
    labels: props.labels,
    datasets: props.series.map((s) => dataset(s, tk)),
  } as unknown as ChartData<"bar" | "line">;
  return (
    <div style={style}>
      <ReactChart type={type} data={data} options={options(tk, props)} />
    </div>
  );
}
