// import React from "react";
// import { TemplatePieChartProps } from "../index";
// import {
//   PieChart as RechartsPieChart,
//   Pie,
//   Cell,
//   Tooltip,
//   ResponsiveContainer,
//   Legend,
//   TooltipProps,
// } from "recharts";

// const middleColorPalette = [
//   "#92BFFF",
//   "#9F9FF8",
//   "#96E2D6",
//   "#AEC7ED",
//   "#94E9B8",
//   "#FFC107",
//   "#F78DA7",
//   "#00C49F",
//   "#FFBB28",
// ];

// type ProcessedDataItem = {
//   [key: string]: number; // all values must be numbers
//   percentage: number;
// };

// const Template1PieChart: React.FC<TemplatePieChartProps> = ({
//   widgetData,
//   formattedData,
//   loading,
//   error,
// }) => {
//   if (loading)
//     return <div className="text-center py-4">Loading chart data...</div>;
//   if (error) return <div className="alert alert-danger">{error}</div>;
//   if (!formattedData.length)
//     return <div className="alert alert-info">No data available</div>;

//   // Calculate total value for percentage calculation
//   const totalValue = formattedData.reduce(
//     (sum, item) => sum + (item[widgetData.config.value_key] as number),
//     0
//   );

//   const processedData: ProcessedDataItem[] = formattedData
//     .map((item) => {
//       const value = item[
//         widgetData.config.value_key as keyof typeof item
//       ] as number;
//       return {
//         ...item,
//         percentage: (value / totalValue) * 100,
//       };
//     })
//     .sort((a, b) => {
//       const aVal = a[widgetData.config.value_key as keyof typeof a] as number;
//       const bVal = b[widgetData.config.value_key as keyof typeof b] as number;
//       return bVal - aVal;
//     });

//  const getColorByIndex = (index: number) => {
//   const length = processedData.length;

//   // For 1 item
//   if (length === 1) return "#000000";

//   // Highest (first after sorting)
//   if (index === 0) return "#000000";

//   // Lowest (last after sorting)
//   if (index === length - 1) return "#FF6B6B";

//   // Middle items from palette
//   const paletteIndex = (index - 1) % middleColorPalette.length;
//   return middleColorPalette[paletteIndex];
// };

//   // Custom tooltip content
//   const renderTooltipContent = (props: TooltipProps<number, string>) => {
//     const { payload } = props;
//     if (!payload || !payload.length) return null;

//     const data = payload[0].payload as ProcessedDataItem;
//     return (
//       <div className="custom-tooltip bg-white p-2 border rounded">
//         <p className="font-weight-bold">{data[widgetData.config.name_key]}</p>
//         <p>{`Value: ${payload[0].value}`}</p>
//         <p>{`Percentage: ${data.percentage.toFixed(1)}%`}</p>
//       </div>
//     );
//   };

//   return (
//     <div className="card custom-card rounded-card">
//       <div className="card-header bg-white">
//         <h5 className="mb-0 text-center">{widgetData?.config?.title}</h5>
//       </div>
//       <hr />
//       <div className="card-body">
//         <ResponsiveContainer width="100%" height={400}>
//           <RechartsPieChart>
//             <Pie
//               data={processedData}
//               dataKey={widgetData.config.value_key}
//               nameKey={widgetData.config.name_key}
//               cx="50%"
//               cy="50%"
//               outerRadius="80%"
//               label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
//               labelLine={false}
//             >
//               {processedData.map((entry, index) => (
//                 <Cell key={`cell-${index}`} fill={getColorByIndex(index)} />
//               ))}
//             </Pie>
//             <Tooltip content={renderTooltipContent} />
//             <Legend
//               layout="horizontal"
//               verticalAlign="bottom"
//               align="left"
//               wrapperStyle={{
//                 paddingTop: "20px",
//               }}
//               content={({ payload }) => (
//                 <div
//                   style={{
//                     display: "flex",
//                     flexWrap: "wrap",
//                     justifyContent: "flex-start",
//                     alignItems: "center",
//                     gap: "16px",
//                     paddingLeft: "10px",
//                   }}
//                 >
//                   {payload
//                     ?.sort((a, b) => {
//                       const aValue =
//                         (processedData.find(
//                           (d) => d[widgetData.config.name_key] === a.value
//                         )?.[widgetData.config.value_key] as number) || 0;
//                       const bValue =
//                         (processedData.find(
//                           (d) => d[widgetData.config.name_key] === b.value
//                         )?.[widgetData.config.value_key] as number) || 0;
//                       return bValue - aValue;
//                     })
//                     .map((entry, index) => (
//                       <div
//                         key={`legend-item-${index}`}
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           marginRight: "10px",
//                         }}
//                       >
//                         <div
//                           style={{
//                             width: "12px",
//                             height: "12px",
//                             backgroundColor: entry.color,
//                             marginRight: "6px",
//                             borderRadius: "2px",
//                           }}
//                         />
//                         <span style={{ fontSize: "12px" }}>
//                           {`${entry.value}`}
//                         </span>
//                       </div>
//                     ))}
//                 </div>
//               )}
//             />
//           </RechartsPieChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// };

// export default Template1PieChart;












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

// const middleColorPalette = [
//   "#92BFFF",
//   "#9F9FF8",
//   "#96E2D6",
//   "#AEC7ED",
//   "#94E9B8",
//   "#FFC107",
//   "#F78DA7",
//   "#00C49F",
//   "#FFBB28",
// ];

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
// const middleColorPalette = [
//   "#3cdebb",
//   "#50b1e6",
//   "#5071e6",
//   "#a550e6",
//   "#BF83FF",
//   "#FFC107",
//   "#F78DA7",
//   "#00C49F",
//   "#FFBB28",
// ];

type ProcessedDataItem = {
  [key: string]: number | string; // Updated to include string values
  percentage: number;
};

interface CustomLegendItem {
  value: string;
  color: string;
}

interface CustomLegendProps {
  items: CustomLegendItem[];
}

const Template1PieChart: React.FC<TemplatePieChartProps> = ({
  widgetData,
  formattedData,
  loading,
  error,
}) => {
  if (loading) return <div className="text-center py-4">Loading chart data...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!formattedData.length) return <div className="alert alert-info">No data available</div>;

  const totalValue = formattedData.reduce(
    (sum, item) => sum + (item[widgetData.config.value_key] as number),
    0
  );

  const processedData: ProcessedDataItem[] = formattedData
    .map((item) => {
      const value = item[widgetData.config.value_key as keyof typeof item] as number;
      return {
        ...item,
        percentage: (value / totalValue) * 100,
      };
    })
    .sort((a, b) => {
      const aVal = a[widgetData.config.value_key as keyof typeof a] as number;
      const bVal = b[widgetData.config.value_key as keyof typeof b] as number;
      return bVal - aVal;
    });

  const getColorByIndex = (index: number) => {
    const length = processedData.length;
    if (length === 1) return "#696868";
    if (index === 0) return "#696868";
    if (index === length - 1) return "#ef4444";
    const paletteIndex = (index - 1) % middleColorPalette.length;
    return middleColorPalette[paletteIndex];
  };

  const renderTooltipContent = (props: TooltipProps<number, string>) => {
    const { payload } = props;
    if (!payload || !payload.length) return null;

    const data = payload[0].payload as ProcessedDataItem;
    const roundedValue = Number(payload[0].value?.toFixed(2));
    const roundedPercentage = Number(data.percentage.toFixed(2));

    return (
      <div className="custom-tooltip bg-white p-2 border rounded">
        <p className="fw-bold">{String(data[widgetData.config.name_key])}</p>
        <p>Value: <strong>{roundedValue}</strong></p>
        <p>Percentage: <strong>{roundedPercentage}%</strong></p>
      </div>
    );
  };

  const legendItems: CustomLegendItem[] = processedData.map((item, index) => ({
    value: String(item[widgetData.config.name_key]), // Explicitly convert to string
    color: getColorByIndex(index),
  }));

 

  const CustomLegend: React.FC<CustomLegendProps> = ({ items }) => {
  if (!items.length) return null;

  const halfLength = Math.ceil(items.length / 2);
  const firstColumn = items.slice(0, halfLength);
  const secondColumn = items.slice(halfLength);

  return (
    <div style={{ 
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
    }}>
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        marginRight: '40px' // Space between columns
      }}>
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
            <span style={{ fontSize: "12px" }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
      <div style={{ 
        display: 'flex',
        flexDirection: 'column'
      }}>
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
            <span style={{ fontSize: "12px" }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

  return (
    <div className="card custom-card rounded-card">
      <div className="card-body">
        <h5 className="mb-0 card-title">{widgetData?.config?.title}</h5>
      </div>
      <hr />
      <div className="card-body">
        <ResponsiveContainer width="100%" height={400}>
          <RechartsPieChart>
            <Pie
              data={processedData}
              dataKey={widgetData.config.value_key}
              nameKey={widgetData.config.name_key}
              cx="50%"
              cy="50%"
              outerRadius="80%"
              startAngle={90}
              endAngle={-360}
              label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
              labelLine={false}
            >
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColorByIndex(index)} />
              ))}
            </Pie>
            <Tooltip content={renderTooltipContent} />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: "20px" }}
              content={<CustomLegend items={legendItems} />}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Template1PieChart;