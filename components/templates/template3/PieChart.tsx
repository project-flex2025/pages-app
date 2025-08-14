
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

const Template2PieChart: React.FC<TemplatePieChartProps> = ({
  widgetData,
  formattedData,
  loading,
  error,
}) => {
  if (loading)
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  if (error) return <div className="alert alert-dark">{error}</div>;
  if (!formattedData.length)
    return <div className="alert alert-dark">No data to display</div>;

  // Get colors from config or use default colors
  const colors = widgetData.config?.colors || [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
  ];

  return (
    <div className="card border-0">
      <div className="card-header border-secondary">
        <h3 className="text-center mb-0">{widgetData?.config?.title}</h3>
      </div>
      <div className="card-body p-0">
        <ResponsiveContainer width="100%" height={400}>
          <RechartsPieChart margin={{ top: 20, right: 0, left: 0, bottom: 40 }}>
            <Pie
              data={formattedData}
              dataKey={widgetData.config.value_key}
              nameKey={widgetData.config.name_key}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="70%"
              paddingAngle={0}
              // label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {formattedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                  stroke="none"
                />
              ))}
            </Pie>

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;

                const data = payload[0].payload;
                const valueKey = widgetData.config.value_key;

                // Calculate total to get percent
                const total = formattedData.reduce(
                  (sum, item) => sum + Number(item[valueKey]),
                  0
                );
                const value = data[valueKey];
                const percent = ((value / total) * 100).toFixed(2);

                return (
                  <div
                    style={{
                      backgroundColor: "white",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          backgroundColor: payload[0].color,
                          marginRight: 8,
                          borderRadius: "2px",
                        }}
                      />
                      <strong>{data[widgetData.config.name_key]}</strong>
                    </div>
                    <div>Value: {value}</div>
                    <div>Percentage: {percent}%</div>
                  </div>
                );
              }}
            />

            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="left"
              wrapperStyle={{
                paddingTop: "20px", // Add space above the legend
              }}
              content={({ payload }) => (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: "16px", // This adds space between legend items
                    paddingLeft: "10px",
                  }}
                >
                  {payload?.map((entry, index) => {
                    return (
                      <div
                        key={`legend-item-${index}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginRight: "10px", // Additional margin if needed
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            backgroundColor: entry.color,
                            marginRight: "6px",
                            borderRadius: "2px",
                          }}
                        />
                        <span style={{ fontSize: "12px" }}>
                          {`${entry.value}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Template2PieChart;
