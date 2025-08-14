import React from "react";
import { TemplatePieChartProps } from "../index";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps,
} from "recharts";

const middleColorPalette = [
  "#58c8dd",
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#BF83FF",
  "#FFC107",
  "#F78DA7",
  "#00C49F",
  "#FFBB28",
];

type ProcessedDataItem = {
  [key: string]: number | string;
  percentage: number;
};

// Type for legend item
interface CustomLegendItem {
  value: string;
  color: string;
}

// Props for custom legend component
interface CustomLegendProps {
  items: CustomLegendItem[];
}

const Template3PieChart: React.FC<TemplatePieChartProps> = ({
  widgetData,
  formattedData,
  loading,
  error,
}) => {
  if (loading) {
    return <div className="text-center py-4">Loading chart data...</div>;
  }
  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }
  if (!formattedData.length) {
    return <div className="alert alert-info">No data available</div>;
  }

  // Calculate total value for percentage calculation
  const totalValue = formattedData.reduce(
    (sum, item) => sum + (item[widgetData.config.value_key] as number),
    0
  );

  const processedData: ProcessedDataItem[] = formattedData
    .map((item) => {
      const value = item[
        widgetData.config.value_key as keyof typeof item
      ] as number;
      return {
        ...item,
        percentage: (value / totalValue) * 100,
      };
    })
    .sort((a, b) => {
      const aVal = a[widgetData.config.value_key as keyof typeof a] as number;
      const bVal = b[widgetData.config.value_key as keyof typeof b] as number;
      return bVal - aVal; // Sort in descending order
    });

  const getColorByIndex = (index: number) => {
    const length = processedData.length;

    // For 1 item - dark gray gradient
    if (length === 1) return "#696868";

    // Highest (first after sorting) - darkest gray in gradient
    if (index === 0) return "#696868";

    // Lowest (last after sorting) - keep original red
    if (index === length - 1) return "#FF6B6B";

    // Middle items - keep original palette colors
    const paletteIndex = (index - 1) % middleColorPalette.length;
    return middleColorPalette[paletteIndex];
  };

  // Custom tooltip content
  const renderTooltipContent = (props: TooltipProps<number, string>) => {
    const { payload } = props;
    if (!payload || !payload.length) return null;

    const data = payload[0].payload as ProcessedDataItem;
    const roundedValue = Number(payload[0].value?.toFixed(2));
    const roundedPercentage = Number(data.percentage.toFixed(2));

    return (
      <div className="custom-tooltip bg-white p-2 border rounded">
        <p className="fw-bold">{data[widgetData.config.name_key] as string}</p>
        <p>
          Value: <strong>{roundedValue}</strong>
        </p>
        <p>
          Percentage: <strong>{roundedPercentage}%</strong>
        </p>
      </div>
    );
  };

  // Create legend items based on processed data
  const legendItems: CustomLegendItem[] = processedData.map((item, index) => ({
    value: item[widgetData.config.name_key] as string,
    color: getColorByIndex(index),
  }));

  // Custom legend component
  const CustomLegend: React.FC<CustomLegendProps> = ({ items }) => {
    if (!items.length) return null;

    const halfLength = Math.ceil(items.length / 2);
    const firstColumn = items.slice(0, halfLength);
    const secondColumn = items.slice(halfLength);

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginRight: "30px", // Space between columns
          }}
        >
          {firstColumn.map((item, index) => (
            <div
              key={`legend-item-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: item.color,
                  marginRight: "8px",
                  borderRadius: "2px",
                }}
              />
              <span style={{ fontSize: "12px", textAlign: "left" }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginRight: "10px", // Space between columns
          }}
        >
          {secondColumn.map((item, index) => (
            <div
              key={`legend-item-${index + halfLength}`}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: item.color,
                  marginRight: "8px",
                  borderRadius: "2px",
                }}
              />
              <span style={{ fontSize: "12px", textAlign: "left" }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="card custom-card p-4 rounded-card">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h5 className="card-title">{widgetData?.config?.title}</h5>
      </div>

      {/* <hr /> */}
      <div className="card-body">
        <ResponsiveContainer width="100%" height={350}>
          <RechartsPieChart>
            <defs>
              <radialGradient
                id="blackToGray"
                cx="50%"
                cy="50%"
                r="70%"
                fx="50%"
                fy="50%"
              >
                <stop offset="0%" stopColor="#000000" />
                <stop offset="100%" stopColor="#696868" />
              </radialGradient>
            </defs>
            <Pie
              data={processedData}
              dataKey={widgetData.config.value_key}
              nameKey={widgetData.config.name_key}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="80%"
              startAngle={90}
              endAngle={-360}
              label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
              labelLine={false}
              stroke="#fff" // This will be the color of the gap
              strokeWidth={2}
            >
              {processedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === 0 ? "url(#blackToGray)" : getColorByIndex(index)
                  }
                  stroke="#fff" // Set stroke on cells too
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={renderTooltipContent} />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                paddingTop: "10px",
              }}
              content={<CustomLegend items={legendItems} />}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Template3PieChart;
