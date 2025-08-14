"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { templates, TemplateType } from "./templates";
import {
  WidgetData,
  WidgetConfig,
  CardData,
  ApiResponse,
  ApiDataItem,
} from "@/types/table";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

interface DynamicCardsProps {
  widgetData: WidgetData;
  cardData?: CardData;
}

// Helper Functions
const parseNumericValue = (value: unknown): number | null => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  return null;
};

const calculateStatistic = (
  data: ApiDataItem[],
  config: WidgetConfig
): number | "N/A" => {
  if (!config.props?.value) return "N/A";

  const values: number[] = [];

  data.forEach((item) => {
    const recordItem = item.feature_data?.record_data?.find(
      (data) => data.record_label === config.props?.value
    );

    if (recordItem) {
      const numValue =
        parseNumericValue(recordItem.record_value_number) ??
        parseNumericValue(recordItem.record_value);

      if (numValue !== null) {
        values.push(numValue);
      }
    }
  });

  if (values.length === 0) return "N/A";

  switch (config.type) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "avg":
      return Number(
        (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
      );
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    default:
      return "N/A";
  }
};

// Main Component
const DynamicCards: React.FC<DynamicCardsProps> = ({
  widgetData,
  cardData: initialCardData,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [cardData, setCardData] = useState<CardData | null>(
    initialCardData || null
  );
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useSelector(
    (state: RootState) => state.templateRef.selectedTemplate
  ) as TemplateType;

  const config = useMemo(() => widgetData?.config, [widgetData]);

  const fetchCardInfo = useCallback(async (): Promise<void> => {
    if (initialCardData) {
      setLoading(false);
      return;
    }

    if (!config) {
      setError("No configuration provided");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "search",
        },
        body: JSON.stringify({
          conditions: config.conditions || [],
          combination_type: config.combination_type || "and",
          limit: 10000,
          dataset: config.dataset || config.data_source,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (!result.status && result.message) {
        throw new Error(result.message);
      }

      let value: string | number = "N/A";

      if (config.type === "count") {
        value = result?.total_results ?? 0;
      } else if (result.data && result.data.length > 0) {
        value = calculateStatistic(result.data, config);
      }

      setCardData({
        title: config.title,
        value,
        description: config.description || "",
        icon: config.icon,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch data";
      setError(errorMessage);
      console.error("Error in DynamicCards:", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [config, initialCardData]);

  useEffect(() => {
    fetchCardInfo();
  }, [fetchCardInfo]);

  const CardComponent = templates[selectedTemplate]?.DynamicCard;

  if (!CardComponent) {
    return <p className="text-danger">Invalid template selected.</p>;
  }

  if (loading) {
    return (
      <div className="col col-stats ms-3 ms-sm-0">
        <div className="numbers">
          <div className="d-flex justify-content-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col col-stats ms-3 ms-sm-0">
        <div className="numbers">
          <p className="text-danger small">{error}</p>
        </div>
      </div>
    );
  }

  if (!cardData) return null;

  return (
    <CardComponent
      widgetData={widgetData}
      cardData={cardData}
      loading={loading}
      error={error}
    />
  );
};

export default DynamicCards;
