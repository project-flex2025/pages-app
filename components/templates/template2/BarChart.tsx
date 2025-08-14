import React from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { TemplateBarChartProps } from "../index";

const colorPalette = [
  "#92BFFF",
  "#9F9FF8",
  "#96E2D6",
  "#FF6B6B",
  "#92BFFF",
  "#AEC7ED",
  "#94E9B8",
];

// Helper function to check if a value is a valid date
const isDate = (value: string | number) => {
  try {
    const date = new Date(String(value));
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

// Format date as dd MMM if it's a date, otherwise return as-is
const formatXValue = (value: string | number) => {
  if (isDate(value)) {
    const date = new Date(String(value));
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const day = date.getDate().toString().padStart(2, "0");
    const monthName = months[date.getMonth()];
    return `${day} ${monthName}`;
  }
  return String(value);
};

// Format Y-axis values in k (thousands) format
const formatYValue = (value: number) => {
  if (value >= 1000) {
    const formattedValue = value / 1000;
    // Check if the value is a whole number
    return formattedValue % 1 === 0 ? `${formattedValue}k` : `${formattedValue.toFixed(1)}k`;
  }
  return value.toString();
};

interface TooltipPayloadItem {
  name: string;
  value: string | number | null;
  payload: string;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  hasMultipleBars: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  hasMultipleBars,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip bg-white p-3 shadow-sm border rounded">
        <p className="font-weight-bold mb-2">{formatXValue(label || "")}</p>
        <div className="d-flex flex-column">
          {payload.map((entry, index) => (
            <div key={`tooltip-${index}`} className="d-flex align-items-center mb-1">
              <div
                className="color-indicator mr-2"
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: entry.color,
                  borderRadius: "2px",
                }}
              />
              <span className="mr-2">{entry.name}:</span>
              <span
                className="font-weight-bold"
                style={{ color: hasMultipleBars ? "#333" : "#FF6B6B" }}
              >
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const Template3BarChart: React.FC<TemplateBarChartProps> = ({
  widgetData,
  formattedData,
  loading,
  error,
}) => {
  if (loading)
    return <div className="text-center py-5 text-gray-700">Loading chart data...</div>;

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!formattedData.length)
    return <div className="alert alert-info">No data to display</div>;

  const bars = widgetData?.config?.bars || [];
  const hasMultipleBars = bars.length > 1;
  const xKey = widgetData?.config?.X_value || "";
  const firstXValue = formattedData[0]?.[xKey];

  return (
    <div className="card custom-card rounded-card p-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h5 className="card-title">{widgetData?.config?.title}</h5>
        <div className="d-flex align-items-center flex-nowrap overflow-auto">
          {bars.map((bar, index) => (
            <div key={index} className="d-flex align-items-center me-3">
              <span
                className="d-inline-block rounded-circle me-1"
                style={{
                  backgroundColor: hasMultipleBars
                    ? bar.color
                    : colorPalette[index % colorPalette.length],
                  width: "15px",
                  height: "15px",
                  minWidth: "15px",
                }}
              ></span>
              <span className="text-body text-nowrap">
                {bar.name || bar.dataKey}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <RechartsBarChart
          data={formattedData}
          barCategoryGap={hasMultipleBars ? 20 : 10}
          margin={{ top: 0, right: 0, left: 10, bottom: 30 }} 
        >
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 13, fill: "#666" }}
            tickLine={false}
            axisLine={false} 
            tickFormatter={formatXValue}
            height={isDate(firstXValue) ? 70 : 40}
            angle={isDate(firstXValue) ? -45 : 0}
            textAnchor={isDate(firstXValue) ? "end" : "middle"}
            label={{
              value: widgetData?.config?.xAxisLabel || "",
              position: "insideBottom",
              offset: -20,
              fontSize: 13,
              fill: "#666",
            }}
          />
          <YAxis
            tick={{ fontSize: 13, fill: "#666" }}
            tickLine={false}
            axisLine={false} 
            allowDecimals={false}
            tickFormatter={formatYValue}
            label={{
              value: widgetData?.config?.yAxisLabel || "",
              angle: -90,
              position: "insideLeft",
              offset: 0,
              fontSize: 13,
              fill: "#666",
              style: { textAnchor: "middle" },
            }}
          />
          <Tooltip
            content={<CustomTooltip hasMultipleBars={hasMultipleBars} />}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              borderRadius: "6px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          />

          {hasMultipleBars ? (
            bars.map((bar, index) => (
              <Bar
                key={index}
                dataKey={bar.dataKey}
                name={bar.name || bar.dataKey}
                fill={bar.color || colorPalette[index % colorPalette.length]}
                radius={[10, 10, 10, 10]}
                barSize={25}
              />
            ))
          ) : (
            bars.length > 0 && (
              <Bar
                dataKey={bars[0].dataKey}
                name={bars[0].name || bars[0].dataKey}
                radius={[10, 10, 10, 10]}
                barSize={25}
              >
                {formattedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colorPalette[index % colorPalette.length]}
                  />
                ))}
              </Bar>
            )
          )}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Template3BarChart;