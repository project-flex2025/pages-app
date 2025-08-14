import React from "react";
import { TemplateLineChartProps } from "../index";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
} from "recharts";

interface TooltipProps {
  active?: boolean;
  payload?: {
    name: string;
    value: number;
    stroke: string;
  }[];
  label?: string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="p-2 rounded shadow text-sm">
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.stroke }}>
            {entry.name}: {formatLargeNumber(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Format large numbers (1000+)
const formatLargeNumber = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }
  return value.toString();
};

// Improved format function that handles both dates and strings
const formatXValue = (value: string | number) => {
  try {
    const date = new Date(String(value));
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      return `${day}/${month}`;
    }
  } catch (e) {
    console.warn("Date parsing failed, using raw value", e);
  }
  return String(value);
};

// Define a type for the data items
interface ChartDataItem {
  [key: string]: string | number;
}

// Helper function to check if values are dates
const isDateData = (data: ChartDataItem[], xKey: string) => {
  if (!data.length) return false;
  try {
    const date = new Date(String(data[0][xKey]));
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

const Template3LineChart: React.FC<TemplateLineChartProps> = ({
  widgetData,
  formattedData,
  loading,
  error,
}) => {
  if (loading)
    return (
      <div className="text-center py-4 text-black">Loading chart data...</div>
    );
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!formattedData.length)
    return <div className="alert alert-info">No data available</div>;

  const lines = widgetData?.config?.lines || [];
  const xKey = widgetData?.config?.X_value || "";
  const isDateXAxis = isDateData(formattedData, xKey);

  // Find the maximum value in the data to determine if we should use k formatting
  const maxValue = Math.max(
    ...formattedData.map((item) =>
      Math.max(...lines.map((line) => Number(item[line.dataKey]) || 0))
    )
  );
  const shouldFormatYAxis = maxValue >= 1000;

  return (
    <div className="card custom-card p-4 rounded-card">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h5 className="card-title">{widgetData?.config?.title}</h5>
        <div className="d-flex align-items-center flex-nowrap overflow-auto">
          {lines.map((line, index) => (
            <div key={index} className="d-flex align-items-center me-3">
              <span
                className="d-inline-block rounded-circle me-1"
                style={{
                  backgroundColor: line.color,
                  width: "15px",
                  height: "15px",
                  minWidth: "15px",
                }}
              ></span>
              <span className="text-body text-nowrap">
                {line.name || line.dataKey}
              </span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart data={formattedData}>
          <XAxis
            dataKey={xKey}
            stroke="#999"
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: "#ccc", strokeWidth: 0.5 }}
            tickLine={false}
            tickFormatter={formatXValue}
            angle={isDateXAxis ? -45 : 0}
            height={isDateXAxis ? 70 : 40}
            textAnchor={isDateXAxis ? "end" : "middle"}
          />
          <YAxis
            stroke="#666"
            axisLine={false}
            tickLine={false}
            tickFormatter={shouldFormatYAxis ? formatLargeNumber : undefined}
          />
          <Tooltip
            content={<CustomTooltip />}
            labelFormatter={formatXValue}
            formatter={(value: number) => formatLargeNumber(value)}
          />
          {/* Area shadow under main line */}
          {lines[0] && (
            <Area
              type="monotone"
              dataKey={lines[0].dataKey}
              stroke="none"
              fill="rgba(0, 0, 0, 0.3)"
              fillOpacity={0.3}
            />
          )}
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={1}
              name={line.name}
              strokeDasharray={index === 1 ? "5 5" : undefined}
              dot={false}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Template3LineChart;
