import React from "react";
import { TemplateLineChartProps } from "../index";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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
      <div className="p-2 rounded shadow text-sm bg-white">
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.stroke }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}`;
  } catch (e) {
    console.warn(e);
    return dateString;
  }
};

const Template2AreaChart: React.FC<TemplateLineChartProps> = ({
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

  return (
    <div className="bg-white p-4 rounded-md shadow-md mt-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h2 className="h5 fw-semibold text-body me-3 text-nowrap">
          {widgetData?.config?.title}
        </h2>
        <div className="d-flex align-items-center flex-nowrap overflow-auto">
          {lines.map((bar, index) => (
            <div key={index} className="d-flex align-items-center me-3">
              <span
                className="d-inline-block rounded-circle me-1"
                style={{
                  backgroundColor: bar.color,
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

      <ResponsiveContainer width="100%" height={300}>
        <RechartsAreaChart data={formattedData}>
          <defs>
            {lines.map((line, index) => (
              <linearGradient
                key={index}
                id={`gradientColor${index}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={line.color} stopOpacity={0.6} />
                <stop offset="95%" stopColor={line.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          <XAxis
            dataKey={widgetData?.config?.X_value}
            stroke="#999"
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: "#ccc", strokeWidth: 0.5 }}
            tickLine={false}
            tickFormatter={formatDate}
          />
          <YAxis stroke="#666" axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          {lines.map((line, index) => (
            <Area
              key={index}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              fill={`url(#gradientColor${index})`}
              name={line.name}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Template2AreaChart;