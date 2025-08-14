"use client";

import { useState, useEffect, useCallback } from "react";
import { templates, TemplateType } from "./templates";
import {
  PieWidgetData,
  TransformedRecord,
  APIRecord,
  RecordData,
} from "@/types/charts";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

const PieChart: React.FC<{ widgetData: PieWidgetData }> = ({ widgetData }) => {
  const [formattedData, setFormattedData] = useState<TransformedRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useSelector(
    (state: RootState) => state.templateRef.selectedTemplate
  ) as TemplateType;

  const getAggregatedData = useCallback((): TransformedRecord[] => {
    if (!widgetData?.config) return [];

    const aggregated: Record<string, number> = {};
    formattedData.forEach((item: TransformedRecord) => {
      const category = item[widgetData.config.name_key] as string;
      const value = item[widgetData.config.value_key] as number;
      if (!aggregated[category]) {
        aggregated[category] = 0;
      }
      aggregated[category] += value;
    });
    return Object.keys(aggregated).map((category) => ({
      [widgetData.config.name_key]: category,
      [widgetData.config.value_key]: aggregated[category],
    }));
  }, [formattedData, widgetData?.config]);

  const fetchData = useCallback(async () => {
    if (!widgetData?.config?.data_source) return [];

    const conditions = [
      {
        field: "feature_name",
        value: widgetData.config.data_source,
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
      return jsonData.data ?? [];
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  }, [widgetData?.config?.data_source]);

  const transformChartData = useCallback(
    (data: APIRecord[]): TransformedRecord[] => {
      return data.map((item: APIRecord) => {
        const record: TransformedRecord = {};

        item.feature_data.record_data.forEach((entry: RecordData) => {
          const key = entry.record_label;
          const value =
            entry.record_type === "type_number"
              ? entry.record_value_number || 0
              : entry.record_value || "";
          record[key] = value;
        });

        return record;
      });
    },
    []
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchData();
        const transformed = transformChartData(res as APIRecord[]);
        setFormattedData(transformed);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load chart data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchData, transformChartData]);

  const PieChartComponent = templates[selectedTemplate]?.PieChart;

  if (!PieChartComponent) {
    return <div className="alert alert-danger">Invalid template selected</div>;
  }

  const pieData = getAggregatedData();

  return (
    <PieChartComponent
      widgetData={widgetData}
      formattedData={pieData}
      loading={loading}
      error={error}
    />
  );
};

export default PieChart;
