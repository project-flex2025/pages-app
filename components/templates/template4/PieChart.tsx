import React from "react";
import { TemplatePieChartProps } from "../index";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const Template4PieChart: React.FC<TemplatePieChartProps> = ({
  widgetData,
  formattedData,
  loading,
  error,
}) => {
  if (loading)
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-muted" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  if (error) return <div className="alert alert-light border">{error}</div>;
  if (!formattedData.length)
    return <div className="alert alert-light border">No data available</div>;

  return (
    <div className="card custom-card">
      <div className="card-header text-center d-flex justify-content-center">
        <h5 className="mb-0 text-center">{widgetData?.config?.title}</h5>
      </div>
      <hr className="m-0" />
      <div className="card-body p-5">
        <ResponsiveContainer width="100%" height={450}>
          <RechartsPieChart>
            <Pie
              data={formattedData}
              dataKey={widgetData.config.value_key}
              nameKey={widgetData.config.name_key}
              cx="50%"
              cy="50%"
              outerRadius="90%"
              label={({ name }) => name}
              labelLine={true}
            >
              {formattedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    widgetData.config.colors?.[
                      index % widgetData.config.colors.length
                    ] ||
                    `hsl(${(index * 360) / formattedData.length}, 70%, 50%)`
                  }
                  stroke="#fff"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "rgba(255, 255, 255, 0.98)",
                border: "1px solid #eee",
                borderRadius: "4px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                padding: "10px",
                borderRadius: "4px",
              }}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Template4PieChart;
