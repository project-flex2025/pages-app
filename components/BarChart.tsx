// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { templates, TemplateType } from "./templates";
// import {
//   BarWidgetData,
//   TransformedRecord,
//   APIRecord,
//   RecordData,
// } from "@/types/charts";
// import { useSelector } from "react-redux";
// import { RootState } from "../../redux/store";

// const BarChart: React.FC<{ widgetData: BarWidgetData }> = ({ widgetData }) => {
//   const [formattedData, setFormattedData] = useState<TransformedRecord[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   const selectedTemplate = useSelector(
//     (state: RootState) => state.templateRef.selectedTemplate
//   ) as TemplateType;

//   const aggregateDataByKey = useCallback(
//     (data: TransformedRecord[], config: string): TransformedRecord[] => {
//       if (!config) return [];

//       const aggregated: Record<string, TransformedRecord> = {};
//       const xKey = config;

//       data.forEach((item: TransformedRecord) => {
//         const keyValue = item[xKey] as string;

//         if (!aggregated[keyValue]) {
//           aggregated[keyValue] = { [xKey]: keyValue };
//           widgetData?.config?.bars.forEach((bar) => {
//             aggregated[keyValue][bar.dataKey] = 0;
//           });
//         }

//         widgetData?.config?.bars.forEach((bar) => {
//           const currentValue = (item[bar.dataKey] as number) || 0;
//           aggregated[keyValue][bar.dataKey] =
//             (aggregated[keyValue][bar.dataKey] as number) + currentValue;
//         });
//       });

//       return Object.values(aggregated);
//     },
//     [widgetData?.config?.bars]
//   );

//   const fetchData = useCallback(async () => {
//     const conditions = [
//       {
//         field: "feature_name",
//         value: widgetData?.config?.data_source,
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
//       throw error;
//     }
//   }, [widgetData?.config?.data_source]);

//   const transformChartData = useCallback(
//     (data: APIRecord[]): TransformedRecord[] => {
//       return data.map((item: APIRecord) => {
//         const record: TransformedRecord = {};

//         item.feature_data.record_data.forEach((entry: RecordData) => {
//           const key = entry.record_label;
//           const value =
//             entry.record_type === "type_number"
//               ? entry.record_value_number || 0
//               : entry.record_value || entry.record_value_date || "";
//           record[key] = value;
//         });

//         return record;
//       });
//     },
//     []
//   );

//   useEffect(() => {
//     const loadData = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const res = await fetchData();
//         const transformed = transformChartData(res.data as APIRecord[]);
//         const aggregated = aggregateDataByKey(
//           transformed,
//           widgetData?.config?.X_value
//         );
//         setFormattedData(aggregated);
//       } catch (err) {
//         setError(
//           err instanceof Error ? err.message : "Failed to load chart data"
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//   }, [
//     fetchData,
//     transformChartData,
//     aggregateDataByKey,
//     widgetData?.config?.X_value,
//   ]);

//   const BarChartComponent = templates[selectedTemplate]?.BarChart;

//   if (!BarChartComponent) {
//     return <div className="alert alert-danger">Invalid template selected</div>;
//   }

//   return (
//     <BarChartComponent
//       widgetData={widgetData}
//       formattedData={formattedData}
//       loading={loading}
//       error={error}
//     />
//   );
// };

// export default BarChart;

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { templates, TemplateType } from "./templates";
import {
  BarWidgetData,
  TransformedRecord,
  APIRecord,
  RecordData,
} from "@/types/charts";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

const BarChart: React.FC<{ widgetData: BarWidgetData }> = ({ widgetData }) => {
  const [formattedData, setFormattedData] = useState<TransformedRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useSelector(
    (state: RootState) => state.templateRef.selectedTemplate
  ) as TemplateType;

  // Memoize the widget config to prevent unnecessary recalculations
  const widgetConfig = useMemo(() => widgetData?.config, [widgetData]);

  const aggregateDataByKey = useCallback(
    (data: TransformedRecord[], xKey: string): TransformedRecord[] => {
      if (!xKey || !widgetConfig?.bars) return [];

      const aggregated: Record<string, TransformedRecord> = {};

      data.forEach((item: TransformedRecord) => {
        const keyValue = item[xKey] as string;

        if (!aggregated[keyValue]) {
          aggregated[keyValue] = { [xKey]: keyValue };
          widgetConfig.bars.forEach((bar) => {
            aggregated[keyValue][bar.dataKey] = 0;
          });
        }

        widgetConfig.bars.forEach((bar) => {
          const currentValue = (item[bar.dataKey] as number) || 0;
          aggregated[keyValue][bar.dataKey] =
            (aggregated[keyValue][bar.dataKey] as number) + currentValue;
        });
      });

      return Object.values(aggregated);
    },
    [widgetConfig]
  );

  const fetchData = useCallback(async () => {
    if (!widgetConfig?.data_source) return { data: [], total_results: 0 };

    const conditions = [
      {
        field: "feature_name",
        value: widgetConfig.data_source,
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
  }, [widgetConfig?.data_source]);

  const transformChartData = useCallback(
    (data: APIRecord[]): TransformedRecord[] => {
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
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchData();
        if (!isMounted) return;

        const transformed = transformChartData(res.data as APIRecord[]);
        const aggregated = aggregateDataByKey(
          transformed,
          widgetConfig?.X_value
        );

        if (isMounted) {
          setFormattedData(aggregated);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load chart data"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [
    fetchData,
    transformChartData,
    aggregateDataByKey,
    widgetConfig?.X_value,
  ]);

  const BarChartComponent = useMemo(() => {
    return templates[selectedTemplate]?.BarChart;
  }, [selectedTemplate]);

  if (!BarChartComponent) {
    return <div className="alert alert-danger">Invalid template selected</div>;
  }

  return (
    <BarChartComponent
      widgetData={widgetData}
      formattedData={formattedData}
      loading={loading}
      error={error}
    />
  );
};

export default BarChart;
