import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart, PieChart } from "echarts/charts";
import { GraphicComponent, GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsCoreOption } from "echarts/core";

// 只注册仪表盘实际使用的图表，避免完整 ECharts 包进入首屏资源。
echarts.use([BarChart, PieChart, GraphicComponent, GridComponent, TooltipComponent, CanvasRenderer]);

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

  useEffect(() => {
    const container = chartRef.current;
    if (!container) return;

    const chart = echarts.init(container);
    const option: EChartsCoreOption = type === "pie"
      ? {
          tooltip: {
            trigger: "item",
            formatter: "{b}<br/>{c} 人（{d}%）",
          },
          series: [{
            type: "pie",
            radius: ["56%", "78%"],
            center: ["50%", "50%"],
            avoidLabelOverlap: true,
            itemStyle: { borderColor: "#ffffff", borderWidth: 4, borderRadius: 4 },
            label: { show: false },
            emphasis: { scale: true, scaleSize: 8 },
            data: stages.map((stage) => ({ name: stage.label, value: stage.value, itemStyle: { color: stage.color } })),
          }],
          graphic: [{
            type: "text",
            left: "center",
            top: "center",
            style: {
              text: `{total|${total}}\n{label|总申请}`,
              align: "center",
              rich: {
                total: { fontSize: 28, fontWeight: "bold", fill: "#4F46E5", lineHeight: 38 },
                label: { fontSize: 12, fill: "#9CA3AF", lineHeight: 18 },
              },
            },
          }],
        }
      : {
          grid: { left: 74, right: 28, top: 16, bottom: 12 },
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: "{b}<br/>{c} 人" },
          xAxis: {
            type: "value",
            minInterval: 1,
            axisLabel: { color: "#9CA3AF" },
            splitLine: { lineStyle: { color: "#E5E7EB" } },
          },
          yAxis: {
            type: "category",
            data: stages.map((stage) => stage.label),
            axisLabel: { color: "#9CA3AF" },
            axisTick: { show: false },
            axisLine: { show: false },
          },
          series: [{
            type: "bar",
            barMaxWidth: 24,
            label: { show: true, position: "right", formatter: "{c} 人", color: "#9CA3AF" },
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
  }, [stages, total, type]);

  return <div ref={chartRef} className="h-[260px] w-full" role="img" aria-label="申请状态统计图" />;
};

export default ApplicationStatusChart;
