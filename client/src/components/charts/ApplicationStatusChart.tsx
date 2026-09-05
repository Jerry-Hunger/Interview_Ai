import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { BarChart, PieChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsCoreOption } from "echarts/core";

// 只注册仪表盘实际使用的图表，避免完整 ECharts 包进入首屏资源。
echarts.use([BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

export type ApplicationChartStage = {
  label: string;
  value: number;
  color: string;
};

type ApplicationStatusChartProps = {
  stages: ApplicationChartStage[];
  total: number;
  type: "pie" | "bar";
};

/** 使用 ECharts 渲染申请状态统计，统一处理尺寸变化与图表销毁。 */
const ApplicationStatusChart = ({ stages, total, type }: ApplicationStatusChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    // 主题切换时重绘 ECharts，防止图例与网格线沿用浅色配色。
    const observer = new MutationObserver(() => setIsDark(document.documentElement.classList.contains("dark")));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = chartRef.current;
    if (!container) return;

    const chart = echarts.init(container);
    const stageMap = new Map(stages.map((stage) => [stage.label, stage]));
    const textColor = isDark ? "#CBD5E1" : "#475569";
    const mutedTextColor = isDark ? "#94A3B8" : "#64748B";
    const lineColor = isDark ? "#334155" : "#E2E8F0";
    const option: EChartsCoreOption = type === "pie"
      ? {
          tooltip: {
            trigger: "item",
            formatter: "{b}<br/>{c} 人（{d}%）",
          },
          series: [{
            type: "pie",
            radius: ["55%", "76%"],
            center: ["50%", "43%"],
            avoidLabelOverlap: true,
            itemStyle: { borderColor: isDark ? "#181C2F" : "#FFFFFF", borderWidth: 4, borderRadius: 4 },
            label: { show: false },
            emphasis: { scale: true, scaleSize: 8 },
            data: stages.map((stage) => ({ name: stage.label, value: stage.value, itemStyle: { color: stage.color } })),
          }],
          legend: {
            bottom: 0,
            left: "center",
            itemWidth: 8,
            itemHeight: 8,
            itemGap: 16,
            textStyle: { color: mutedTextColor, fontSize: 12 },
            // 图例同时展示状态、人数和占比，避免用户只能凭颜色理解图表。
            formatter: (name: string) => {
              const stage = stageMap.get(name);
              if (!stage) return name;
              const percent = total > 0 ? Math.round(stage.value / total * 100) : 0;
              return `${name}  ${stage.value} 人 · ${percent}%`;
            },
          },
        }
      : {
          // 右侧为“人数 + 占比”标签保留空间，避免最大值时被容器裁切。
          grid: { left: 82, right: 96, top: 8, bottom: 8, containLabel: false },
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            formatter: (params: unknown) => {
              const item = (params as { axisValue: string; value: number }[])[0];
              const percent = total > 0 ? Math.round(item.value / total * 100) : 0;
              return `${item.axisValue}<br/>${item.value} 人（${percent}%）`;
            },
          },
          xAxis: {
            type: "value",
            minInterval: 1,
            axisLabel: { color: mutedTextColor, formatter: (value: number) => `${value}` },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: lineColor, type: "dashed" } },
          },
          yAxis: {
            type: "category",
            data: stages.map((stage) => stage.label),
            axisLabel: { color: textColor, fontSize: 13, fontWeight: 500 },
            axisTick: { show: false },
            axisLine: { show: false },
          },
          series: [{
            type: "bar",
            barWidth: 20,
            barMinHeight: 6,
            showBackground: true,
            backgroundStyle: { color: isDark ? "#29354A" : "#F1F5F9", borderRadius: [0, 8, 8, 0] },
            label: {
              show: true,
              position: "right",
              color: textColor,
              fontSize: 12,
              formatter: (params: { value: number }) => {
                const percent = total > 0 ? Math.round(params.value / total * 100) : 0;
                return `${params.value} 人 · ${percent}%`;
              },
            },
            data: stages.map((stage) => ({ value: stage.value, itemStyle: { color: stage.color, borderRadius: [0, 8, 8, 0] } })),
          }],
        };

    chart.setOption(option);
    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [isDark, stages, total, type]);

  const description = stages.map((stage) => `${stage.label} ${stage.value} 人`).join("，");

  return (
    <div className="relative h-[280px] w-full" role="img" aria-label={`申请状态统计图：${description}`}>
      <div ref={chartRef} className="h-full w-full" />
      {type === "pie" && (
        // 使用 HTML 覆盖层与圆环中心共用百分比坐标，避免 Canvas 文本基线导致的视觉偏移。
        <div className="pointer-events-none absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-[28px] font-bold leading-9 text-indigo-600 dark:text-indigo-400 tabular-nums">{total}</p>
          <p className="text-xs leading-[18px] text-slate-400 dark:text-slate-400">总申请</p>
        </div>
      )}
    </div>
  );
};

export default ApplicationStatusChart;
