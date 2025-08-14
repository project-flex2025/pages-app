import React from "react";
import { TemplateBarChartProps } from "../index";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const colorPalette = [
  "#92BFFF",
  "#9F9FF8",
  "#96E2D6",
  "#666565",
  "#92BFFF",
  "#AEC7ED",
  "#94E9B8",
];

// Helper function to check if a value is a valid date
// const isDate = (value: string) => {
//   try {
//     const date = new Date(value);
//     return !isNaN(date.getTime());
//   } catch {
//     return false;
//   }
// };

// Format date as dd/mm if it's a date, otherwise return as-is
// const formatXValue = (value: string) => {
//   if (isDate(value)) {
//     const date = new Date(value);
//     const day = date.getDate().toString().padStart(2, "0");
//     const month = (date.getMonth() + 1).toString().padStart(2, "0");
//     return `${day}/${month}`;
//   }
//   return value;
// };

const Template1BarChart: React.FC<TemplateBarChartProps> = ({
  widgetData,
  formattedData,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className="card custom-card rounded-card">
        <div className="card-body">
          <h5 className="card-title mb-0">
            {widgetData?.config?.title || "Loading..."}
          </h5>
        </div>
        <div
          className="card-body d-flex justify-content-center align-items-center"
          style={{ height: "400px" }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-2">Loading chart data...</span>
        </div>
      </div>
    );
  }

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!formattedData.length)
    return <div className="alert alert-info">No data available</div>;

  const xKey = widgetData?.config?.X_value;
  const bars = widgetData?.config?.bars || [];
  const hasMultipleBars = bars.length > 1;
  const dataCount = formattedData.length;

  // Calculate optimal bar width and spacing based on data count
  const getBarSize = () => {
    if (dataCount <= 5) return 40;
    if (dataCount <= 10) return 30;
    if (dataCount <= 20) return 20;
    return 15;
  };

  // Calculate category gap based on number of bars
  const getCategoryGap = () => {
    if (hasMultipleBars) {
      return dataCount <= 10 ? "20%" : "15%";
    }
    return dataCount <= 10 ? "30%" : "20%";
  };

  return (
    <div className="card custom-card rounded-card">
      <div className="card-body">
        <h5 className="mb-0 card-title">{widgetData?.config?.title}</h5>
      </div>
      <hr className="m-0" />
      <div className="card-body">
        <ResponsiveContainer width="100%" height={400}>
          <RechartsBarChart
            data={formattedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            barCategoryGap={getCategoryGap()}
            barGap={hasMultipleBars ? 4 : 0}
          >
            <XAxis
              dataKey={xKey}
              height={40}
              label={{
                value: widgetData?.config?.xAxisLabel,
                position: "insideBottom",
                offset: -15,
              }}
            />
            <YAxis
              label={{
                value: widgetData?.config?.yAxisLabel,
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                borderRadius: "4px",
                padding: "10px",
              }}
            />

            {/* Only show legend when there are multiple bars */}
            {hasMultipleBars && (
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{
                  paddingBottom: "20px",
                }}
              />
            )}

            {hasMultipleBars
              ? bars.map((bar, index) => (
                  <Bar
                    key={bar.dataKey}
                    dataKey={bar.dataKey}
                    name={bar.name || bar.dataKey}
                    fill={
                      bar.color || colorPalette[index % colorPalette.length]
                    }
                    barSize={getBarSize()}
                    radius={[4, 4, 0, 0]}
                  />
                ))
              : bars.length > 0 && (
                  <Bar
                    dataKey={bars[0].dataKey}
                    name={bars[0].name || bars[0].dataKey}
                    barSize={getBarSize()}
                    radius={[4, 4, 0, 0]}
                  >
                    {formattedData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colorPalette[index % colorPalette.length]}
                      />
                    ))}
                  </Bar>
                )}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Template1BarChart;
