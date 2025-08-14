// Template4LineChart.tsx
import React from "react";
import { TemplateLineChartProps } from "../index";
import {
  LineChart as RechartsLineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer, 
} from "recharts";

const Template4LineChart: React.FC<TemplateLineChartProps> = ({
  widgetData,
  formattedData,
  loading,
  error,
}) => {
  if (loading) return <div className="text-center py-4">Loading chart data...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!formattedData.length) return <div className="alert alert-info">No data available</div>;

  return (
    <div className="card shadow rounded">
      <div className="card-header">
        <h5 className="mb-0">{widgetData?.config?.title}</h5>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={400}>
          <RechartsLineChart data={formattedData}>
            <defs>
              {widgetData?.config?.lines.map((line, index) => (
                <linearGradient
                  key={index}
                  id={`colorGradient${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={line.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={line.color} stopOpacity={0.2} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={widgetData?.config?.X_value} />
            <YAxis />
            <Tooltip />
            <Legend />
            {widgetData?.config?.lines.map((line, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={line.dataKey}
                stroke={`url(#colorGradient${index})`}
                strokeWidth={2}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Template4LineChart;
