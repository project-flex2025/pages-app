// "use client";
// import React, { useCallback, useEffect, useState } from "react";
// import {
//   LineChart,
//   Line,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";

// const LineCharts = ({ widgetData }: any) => {
//   const [formattedData, setFormattedData] = useState([]);
//   const [loading, setLoading] = useState(true);

//   console.log("widgetData...............111111111", widgetData);

//   const aggregateDataByKey = (data, config) => {
//     if (!config) return [];

//     const aggregated = {};
//     const xKey = config;

//     data.forEach((item) => {
//       const keyValue = item[xKey];

//       if (!aggregated[keyValue]) {
//         aggregated[keyValue] = { [xKey]: keyValue };

//         // Initialize all bar values to 0
//         widgetData?.config?.lines.forEach((bar) => {
//           aggregated[keyValue][bar.dataKey] = 0;
//         });
//       }

//       // Sum up all specified bar values
//       widgetData?.config?.lines.forEach((bar) => {
//         aggregated[keyValue][bar.dataKey] += item[bar.dataKey] || 0;
//       });
//     });

//     return Object.values(aggregated);
//   };

//   const fetchData = useCallback(async () => {
//     const conditions = [
//       {
//         field: "feature_name",
//         value: widgetData?.config?.feature_name,
//         search_type: "exact",
//       },
//     ];
//     const requestBody = {
//       conditions,
//       combination_type: "and",
//       sort: [{ record_id: "desc" }],
//       dataset: "feature_data",
//     };
//     try {
//       const response = await fetch("/api/proxy", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//           "X-API-TYPE": "search",
//         },
//         body: JSON.stringify(requestBody),
//       });

//       if (!response.ok) throw new Error("Failed to fetch data");

//       const jsonData = await response.json();
//       return {
//         data: jsonData.data ?? [],
//         total_results: jsonData.total_results ?? 0,
//       };
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       return { data: [], total_results: 0 };
//     }
//   }, []);

//   useEffect(() => {
//     const transformChartData = (data) => {
//       return data.map((item) => {
//         const record = {};

//         item.feature_data.record_data.forEach((entry) => {
//           const key = entry.record_label;
//           const value =
//             entry.record_type === "type_number"
//               ? entry.record_value_number
//               : entry.record_value;
//           record[key] = value;
//         });

//         return record;
//       });
//     };

//     const fetchTableData = async () => {
//       setLoading(true);
//       const res = await fetchData();
//       const formatted = transformChartData(res.data);
//       setFormattedData(
//         aggregateDataByKey(formatted, widgetData?.config?.X_value)
//       );
//       setLoading(false);
//     };

//     fetchTableData();
//   }, []);

//   if (!formattedData.length) return <p>No data available</p>;

//   return (
//     <div className="container mt-5">
//       <div className="card shadow-sm">
//         <div className="card-header bg-primary text-white">
//           <h2 className="h5 text-center">{widgetData?.config?.title}</h2>
//         </div>
//         <div className="card-body">
//           <ResponsiveContainer width="100%" height={400}>
//             <LineChart
//               data={formattedData}
//               margin={{
//                 top: 20,
//                 right: 30,
//                 left: 20,
//                 bottom: formattedData.length > 10 ? 100 : 50,
//               }}
//             >
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis
//                 dataKey={widgetData?.config?.X_value}
//                 interval={formattedData.length > 10 ? "preserveStartEnd" : 0}
//                 angle={formattedData.length > 10 ? -45 : 0}
//                 textAnchor={formattedData.length > 10 ? "end" : "middle"}
//                 label={{
//                   value: widgetData?.config?.xAxisLabel,
//                   position: "insideBottom",
//                   offset: -15,
//                   style: { fontWeight: "bold" },
//                 }}
//               />
//               <YAxis
//                 label={{
//                   value: widgetData?.config?.yAxisLabel,
//                   angle: -90,
//                   position: "insideLeft",
//                   style: { fontWeight: "bold", textAnchor: "middle" },
//                 }}
//               />
//               <Tooltip />
//               <Legend verticalAlign="top" height={36} />
//               {widgetData?.config?.lines.map((line, index) => (
//                 <Line
//                   key={index}
//                   type="monotone"
//                   dataKey={line.dataKey}
//                   stroke={line.color}
//                   strokeWidth={2}
//                   name={line.name || line.dataKey}
//                   dot={formattedData.length <= 10} // Show dots when data points are 10 or less
//                   activeDot={{ r: 8 }} // Larger dot when hovered
//                 />
//               ))}
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LineCharts;

"use client";

import { useState, useEffect, useCallback } from "react";
import { templates, TemplateType } from "./templates";
import {
  LineWidgetData,
  TransformedRecord,
  APIRecord,
  RecordData,
} from "@/types/charts";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

const LineChart: React.FC<{ widgetData: LineWidgetData }> = ({
  widgetData,
}) => {
  const [formattedData, setFormattedData] = useState<TransformedRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // console.log("widgetData...............111111111", widgetData);

  const selectedTemplate = useSelector(
    (state: RootState) => state.templateRef.selectedTemplate
  ) as TemplateType;

  const aggregateDataByKey = (
    data: TransformedRecord[],
    config: string
  ): TransformedRecord[] => {
    if (!config) return [];

    const aggregated: Record<string, TransformedRecord> = {};
    const xKey = config;

    data.forEach((item: TransformedRecord) => {
      const keyValue = item[xKey] as string;

      if (!aggregated[keyValue]) {
        aggregated[keyValue] = { [xKey]: keyValue };

        // Initialize all line values to 0
        widgetData?.config?.lines.forEach((line) => {
          aggregated[keyValue][line.dataKey] = 0;
        });
      }

      // Sum up all specified line values
      widgetData?.config?.lines.forEach((line) => {
        const currentValue = (item[line.dataKey] as number) || 0;
        aggregated[keyValue][line.dataKey] =
          (aggregated[keyValue][line.dataKey] as number) + currentValue;
      });
    });

    return Object.values(aggregated);
  };

  const fetchData = useCallback(async () => {
    const conditions = [
      {
        field: "feature_name",
        value: widgetData?.config?.data_source,
        search_type: "exact",
      },
    ];
    const requestBody = {
      conditions,
      combination_type: "and",
      sort: [{ record_id: "desc" }],
      dataset: "feature_data",
    };
    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-TYPE": "search",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const jsonData = await response.json();
      return {
        data: jsonData.data ?? [],
        total_results: jsonData.total_results ?? 0,
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  }, [widgetData?.config?.data_source]);

  const transformChartData = (data: APIRecord[]): TransformedRecord[] => {
    return data.map((item: APIRecord) => {
      const record: TransformedRecord = {};

      item.feature_data.record_data.forEach((entry: RecordData) => {
        const key = entry.record_label;
        const value =
          entry.record_type === "type_number"
            ? entry.record_value_number || 0
            : entry.record_value || entry.record_value_date || "";
        record[key] = value;
      });

      return record;
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchData();
        const transformed = transformChartData(res.data as APIRecord[]);
        const aggregated = aggregateDataByKey(
          transformed,
          widgetData?.config?.X_value
        );
        setFormattedData(aggregated);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load chart data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchData, widgetData?.config?.X_value]);

  const LineChartComponent = templates[selectedTemplate]?.LineChart;

  if (!LineChartComponent) {
    return <div className="alert alert-danger">Invalid template selected</div>;
  }

  return (
    <LineChartComponent
      widgetData={widgetData}
      formattedData={formattedData}
      loading={loading}
      error={error}
    />
  );
};

export default LineChart;
