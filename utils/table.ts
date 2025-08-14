// utils/table-utils.ts
import { RowData } from "@/types/table";
import {
  TableWidgetConfig,
  TableWidgetField,
  TableRow,
} from "@/types/table";

// Base record data interface
export interface RecordDataItem {
  record_label: string;
  record_type: string;
  record_value?: string;
  record_value_text?: string;
  record_value_date?: string;
  record_value_number?: number;
}

// Feature data interface
export interface ApiFeatureData {
  record_data: RecordDataItem[];
}

// More data interface (dynamic key-value pairs)
export interface MoreData {
  [key: string]: string | number | boolean;
  wild_search: string;
}

// Main API response interface
export interface ApiRecord {
  record_id: string;
  feature_name: string;
  added_by: string;
  record_status: "active" | "inactive";
  created_on_date: string;
  feature_data: ApiFeatureData;
  more_data: MoreData;
  doc_position?: number;
}

export const generateEmptyRecord = (tableConfigRows1: TableRow[]) => {
  const config =
    typeof tableConfigRows1 === "string"
      ? JSON.parse(tableConfigRows1)
      : tableConfigRows1;

  const result: Record<string, string> = {};

  config.forEach((row: TableRow) => {
    row.fields.forEach((field) => {
      result[field.label] = "";
    });
  });

  return result;
};

export const getAllDisplayColumns = (
  config: TableWidgetConfig
): TableWidgetField[] => {
  return config?.rows?.reduce((acc: TableWidgetField[], row) => {
    const displayFields = row?.fields?.filter(
      (field) => field.display_settings?.table_view === "true"
    );

    const correctedFields = displayFields.map((field) => {
      if (field?.record_path?.includes("record_label")) {
        return {
          ...field,
          record_path: `feature_data.record_data.${field.record_label}`,
        };
      }
      return field;
    });

    return [...acc, ...correctedFields];
  }, []);
};

interface RecordItem2 {
  record_label: string;
  record_value?: string | number | boolean | null;
  record_value_text?: string | null;
  record_value_date?: string | Date | null;
  record_value_number?: number | null;
}

interface FeatureData {
  record_data?: RecordItem2[];
}

interface YourObjectType {
  feature_data?: FeatureData;
}

const isValidPrimitive = (val: unknown): val is string | number | boolean =>
  typeof val == "string" || typeof val === "number" || typeof val === "boolean";

const capitalizeFirstLetter = (val: string): string =>
  val.charAt(0).toUpperCase() + val.slice(1);

export const getValueByPath = (
  obj: RowData,
  path: string,
  label: string
): string | number | boolean => {
  if (!path || typeof path !== "string") return "-";

  // Handle feature_data.record_data paths
  if (path.startsWith("feature_data.record_data")) {
    const recordItem = (obj as YourObjectType).feature_data?.record_data?.find(
      (item) => item.record_label === label
    );

    const value =
      recordItem?.record_value ??
      recordItem?.record_value_text ??
      recordItem?.record_value_number ??
      recordItem?.record_value_date;

    return isValidPrimitive(value) ? value : "-";
  }

  // Handle default_main
  if (path === "default_main") {
    const value = obj[label];
    return isValidPrimitive(value) && typeof value === "string"
      ? capitalizeFirstLetter(value)
      : "-";
  }

  // ✅ NEW: Handle any nested dot path, like "more_data.subscription"
  try {
    const keys = path.split(".");
    let current: unknown = obj;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return "-";
      }
    }

    return isValidPrimitive(current) ? current : "-";
  } catch (err) {
    console.error("Error accessing path:", path, err);
    return "-";
  }
};
