import React from "react";
import { TemplateBarChartProps } from "../index";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Template4BarChart: React.FC<TemplateBarChartProps> = ({
  widgetData,
  formattedData,
  loading,
  error,
}) => {
  if (loading)
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!formattedData.length)
    return <div className="alert alert-info">No data to display</div>;

  return (
    <div className="card border rounded shadow-sm">
      <div className="card-header bg-white text-center">
        <h5 className="mb-0">{widgetData?.config?.title}</h5>
      </div>
      <div className="card-body pt-3 pb-4 px-3">
        <ResponsiveContainer width="100%" height={400}>
          <RechartsBarChart
            data={formattedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey={widgetData?.config?.X_value}
              angle={-45}
              textAnchor="end"
              height={70}
              label={{
                value: widgetData?.config?.xAxisLabel,
                position: "insideBottom",
                offset: -10,
              }}
              tick={{ fill: "#555" }}
            />
            <YAxis
              label={{
                value: widgetData?.config?.yAxisLabel,
                angle: -90,
                position: "insideLeft",
              }}
              tick={{ fill: "#555" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                borderRadius: 6,
              }}
              labelStyle={{ color: "#555" }}
              itemStyle={{ color: "#444" }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-dark fw-semibold">{value}</span>
              )}
            />
            {widgetData?.config?.bars.map((bar, index) => (
              <Bar
                key={index}
                dataKey={bar.dataKey}
                name={bar.name || bar.dataKey}
                fill={bar.color || "#8884d8"}
                barSize={50}
                radius={[6, 6, 0, 0]}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Template4BarChart;
