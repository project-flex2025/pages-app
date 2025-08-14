"use client";
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { sendLog } from "@/utils/sendLog";

export interface RecordEntry {
  record_label: string;
  record_type: string;
  record_value?: string;
  record_value_number?: number;
  record_value_date?: string;
  record_value_text?: string;
}
type ExcelRow = Record<string, string | number | boolean>;

type FeatureData = {
  record_data: RecordEntry[]; // or RecordDataItem[] if that's what you're using
};

type FormattedRecord = {
  record_id: string;
  feature_name: string;
  added_by: string;
  record_status: string;
  created_on_date: string;
  feature_data?: FeatureData;
  more_data?: MoreData;
};

type DynamicOption = {
  location?: {
    country?: Array<{ default?: string; lock?: string }>;
    states?: Array<{ default?: string; lock?: string; country_field?: string }>;
    cities?: Array<{
      default?: string;
      lock?: string;
      country_field?: string;
      state_field?: string;
    }>;
  };
  source_id?: string;
};

// Add interface for location data
interface LocationData {
  id?: string;
  name: string;
  iso2?: string;
  iso3?: string;
  state_code?: string;
  label: string; // Make these required
  value: string; // Make these required
  disabled?: boolean;
}

const CustomMultiSelect = ({
  tags,
  selectedTags,
  onAddTag,
  onRemoveTag,
}: {
  tags: TagOption[];
  selectedTags: TagOption[];
  onAddTag: (tag: TagOption) => void;
  onRemoveTag: (tagValue: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const isTagSelected = (tagValue: string) => {
    return selectedTags.some((tag) => tag.value === tagValue);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className="multi-select-wrapper"
      style={{ position: "relative", maxWidth: "75%" }}
      ref={wrapperRef}
    >
      <label className="form-label">Select Tags</label>
      <div
        className="form-control d-flex flex-wrap align-items-center gap-2"
        style={{ minHeight: "40px", cursor: "pointer" }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {selectedTags.length === 0 ? (
          <span className="text-muted">Select tags</span>
        ) : (
          selectedTags.map((tag) => (
            <span
              key={tag.value}
              className="badge bg-light border text-dark d-flex align-items-center gap-1"
            >
              {tag.label}
              <button
                type="button"
                className="btn-close btn-sm"
                style={{ fontSize: "0.6rem" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTag(tag.value);
                }}
              />
            </span>
          ))
        )}
      </div>

      {isOpen && (
        <div
          className="dropdown-menu show w-100 mt-1"
          style={{
            maxHeight: 200,
            overflowY: "auto",
            position: "absolute",
            zIndex: 10,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        >
          {tags
            .filter((tag) => !isTagSelected(tag.value))
            .map((tag) => (
              <button
                key={tag.value}
                className="dropdown-item"
                style={{ fontSize: "0.8rem", color: "#333" }}
                onClick={() => {
                  onAddTag(tag);
                  // setIsOpen(false);
                }}
              >
                {tag.label}
              </button>
            ))}
          {/* {tags?.length === 0 && (
              <div style={{ border: "2px solid blue" }} className="">
                No more tags available
              </div>
            )} */}
          {tags.filter((tag) => !isTagSelected(tag.value)).length === 0 && (
            <div
              style={{
                padding: "5px",
                textAlign: "center",
              }}
            >
              No more tags available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import { TableWidgetData, TableWidgetField } from "@/types/table";
import { getSnowflakeId } from "@/utils/snowflake";
import { ApiRecordData, ApiResponse, TableRow } from "@/types/table";
import { MoreData } from "@/utils/table";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import BulkUploadResultModal from "./BulkUploadModal";
import QuillEditor from "./QuillEditor";

interface FormData {
  [key: string]: string | number | undefined;
}
export type TableConfig = TableRow[];
export type EmptyRecord = Record<string, string>;

interface TagOption {
  label: string;
  value: string;
}

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  recordId?: string | null;
  config: TableConfig;
  widgetData: TableWidgetData;
  emptyRecord: EmptyRecord;
  featureName: string;
  onSuccess: () => void;
  tags: TagOption[];
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({
  open,
  onClose,
  mode,
  recordId,
  widgetData,
  config,
  emptyRecord,
  featureName,
  tags,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>({ ...emptyRecord });
  const [loading, setLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState<
    Record<string, LocationData[]>
  >({});
  const [dynamicFieldConfig, setDynamicFieldConfig] = useState<
    Record<string, { default: string; lock: boolean }>
  >({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log("config....22222", config);

  // const [, setFileName] = useState("");
  const currentUser = useSelector((state: RootState) => state.user.user);
  const [bulkModal, setBulkModal] = useState({
    open: false,
    loading: false,
    passed: 0,
    failed: 0,
  });
  const [failedRecords, setfailedRecords] = useState<
    { row: ExcelRow; errors: string[] }[]
  >([]);
  const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);
  const hasInitialized = useRef(false);

  const fetchDynamicOptions = useCallback(
    async (field: TableWidgetField) => {
      if (!field.dynamic_options || field.dynamic_options.length === 0) {
        return;
      }

      const dynamicOption = field.dynamic_options[0] as DynamicOption;
      const fieldKey = field.record_label;

      // Track initial load
      const isInitialLoad = !dynamicOptions[fieldKey];

      // 1. Handle location-based dynamic options
      if (dynamicOption.location) {
        try {
          let apiUrl = "";
          const params = new URLSearchParams();
          let defaultValue = "";
          let isLocked = false;

          // Safely check for country options
          if (dynamicOption.location.country?.length) {
            apiUrl = "/api/countries";
            const countryConfig = dynamicOption.location.country[0];
            defaultValue = countryConfig?.default || "";
            isLocked = countryConfig?.lock === "true";
          }
          // Safely check for state options
          else if (dynamicOption.location.states?.length) {
            const stateConfig = dynamicOption.location.states[0];
            const countryField = stateConfig?.country_field || "country";
            const selectedCountry = String(formData[countryField] || "");

            if (selectedCountry) {
              apiUrl = "/api/states";
              params.append("country", selectedCountry);
              defaultValue = stateConfig?.default || "";
              isLocked = stateConfig?.lock === "true";
            } else {
              setDynamicOptions((prev) => ({
                ...prev,
                [fieldKey]: [],
              }));
              return;
            }
          }
          // Safely check for city options
          else if (dynamicOption.location.cities?.length) {
            const cityConfig = dynamicOption.location.cities[0];
            const countryField = cityConfig?.country_field || "country";
            const stateField = cityConfig?.state_field || "state";
            const selectedCountry = String(formData[countryField] || "");
            const selectedState = String(formData[stateField] || "");

            if (selectedCountry && selectedState) {
              apiUrl = "/api/cities";
              params.append("country", selectedCountry);
              params.append("state", selectedState);
              defaultValue = cityConfig?.default || "";
              isLocked = cityConfig?.lock === "true";
            } else {
              setDynamicOptions((prev) => ({
                ...prev,
                [fieldKey]: [],
              }));
              return;
            }
          }

          // Store field configuration (only if it's not already set)
          setDynamicFieldConfig((prev) => {
            if (prev[fieldKey]) return prev;
            return {
              ...prev,
              [fieldKey]: { default: defaultValue, lock: isLocked },
            };
          });

          if (apiUrl) {
            const response = await fetch(`${apiUrl}?${params.toString()}`);
            if (response.ok) {
              const data: LocationData[] = await response.json();
              const options = data.map((item) => ({
                ...item,
                label: item.name,
                value: item.name,
              }));

              setDynamicOptions((prev) => ({
                ...prev,
                [fieldKey]: options,
              }));

              // Only set default value on initial load and if field is not locked
              if (isInitialLoad && defaultValue && !isLocked) {
                setFormData((prev) => {
                  // Don't overwrite if there's already a value
                  if (prev[fieldKey]) return prev;
                  return {
                    ...prev,
                    [fieldKey]: defaultValue,
                  };
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching location options:`, error);
        }
        return;
      }

      // 2. Handle all other dynamic options (week, month, etc.)
      try {
        const dynamicType = Object.keys(dynamicOption).find(
          (key) => key !== "location"
        ) as keyof DynamicOption | undefined;

        if (!dynamicType) return;

        // Type-safe access to the dynamic option value
        const recordId =
          dynamicType === "source_id" ? dynamicOption.source_id : undefined;

        if (!recordId) return;

        const response = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-TYPE": "search",
          },
          body: JSON.stringify({
            conditions: [
              {
                field: "feature_name",
                value: "data_center",
                search_type: "exact",
              },
              { field: "record_id", value: recordId, search_type: "exact" },
            ],
            combination_type: "and",
            page: 1,
            limit: 100,
            dataset: "feature_data",
          }),
        });

        if (!response.ok)
          throw new Error(`Failed to fetch ${dynamicType} data`);

        const data = await response.json();

        if (data?.data?.length > 0) {
          const responseData = data.data[0];
          const optionsArray =
            responseData.items || responseData[dynamicType] || [];

          if (Array.isArray(optionsArray)) {
            const options = optionsArray.map((item: string) => ({
              name: item,
              label: item,
              value: item,
            }));

            setDynamicOptions((prev) => ({
              ...prev,
              [field.record_label]: options,
            }));
          }
        }
      } catch (error) {
        console.error(`Error fetching dynamic options:`, error);
      }
    },
    [formData, featureName, tags]
  );
  // Load dynamic options when config changes
  useEffect(() => {
    if (config && config.length > 0 && open) {
      config.forEach((row) => {
        row.fields.forEach((field) => {
          if (field.type === "select" && field.dynamic_options?.length) {
            fetchDynamicOptions(field);
          }
        });
      });
    }
  }, [config, fetchDynamicOptions, open]);

  // Fetch dependent options when parent field values change
  useEffect(() => {
    if (config && config.length > 0 && open) {
      // Add open to condition
      config.forEach((row) => {
        row.fields.forEach((field) => {
          if (
            field.type === "select" &&
            field.dynamic_options &&
            field.dynamic_options.length > 0
          ) {
            const dynamicOption = field.dynamic_options[0];
            if (
              dynamicOption.location?.states ||
              dynamicOption.location?.cities
            ) {
              fetchDynamicOptions(field);
            }
          }
        });
      });
    }
  }, [formData, config, fetchDynamicOptions, open]);

  // Set default values for dynamic fields when dynamicFieldConfig changes
  useEffect(() => {
    Object.entries(dynamicFieldConfig).forEach(([fieldName, config]) => {
      if (config.default && !formData[fieldName]) {
        setFormData((prev) => ({
          ...prev,
          [fieldName]: config.default,
        }));
      }
    });
  }, [dynamicFieldConfig]);

  useEffect(() => {
    const saved = localStorage.getItem("addUserForm");
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("addUserForm", JSON.stringify(formData));
  }, [formData]);

  const generateSampleDownloadFromConfig = (config: TableRow[]) => {
    const headers: string[] = [];

    config.forEach((row) => {
      row.fields.forEach((field: TableWidgetField) => {
        headers.push(field.label);
      });
    });

    const worksheet = XLSX.utils.json_to_sheet([{}], { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sample");

    const wbout = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([wbout], { type: "application/octet-stream" });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", widgetData?.config?.title + ".xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateSampleCSVDownloadFromConfig = (config: TableRow[]) => {
    const headers: string[] = [];

    config.forEach((row) => {
      row.fields.forEach((field) => {
        headers.push(field.label);
      });
    });

    // Create a worksheet with only headers (one empty row)
    const worksheet = XLSX.utils.json_to_sheet([{}], { header: headers });

    // Convert worksheet to CSV string
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    // Create a Blob from the CSV string
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    // Trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", widgetData?.config?.title + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear dependent fields when parent field changes
    clearDependentFields(name);
  };

  // Function to clear dependent fields when parent field changes
  const clearDependentFields = (changedFieldName: string) => {
    if (config && config.length > 0) {
      config.forEach((row) => {
        row.fields.forEach((field) => {
          if (
            field.type === "select" &&
            field.dynamic_options &&
            field.dynamic_options.length > 0
          ) {
            const dynamicOption = field.dynamic_options[0];

            // Check if this field depends on the changed field
            if (dynamicOption.location?.states) {
              const countryField =
                dynamicOption.location.states[0]?.country_field || "country";
              if (countryField === changedFieldName) {
                // Clear state field when country changes
                setFormData((prev) => ({ ...prev, [field.record_label]: "" }));
                setDynamicOptions((prev) => ({
                  ...prev,
                  [field.record_label]: [],
                }));
              }
            } else if (dynamicOption.location?.cities) {
              const countryField =
                dynamicOption.location.cities[0]?.country_field || "country";
              const stateField =
                dynamicOption.location.cities[0]?.state_field || "state";
              if (
                countryField === changedFieldName ||
                stateField === changedFieldName
              ) {
                // Clear city field when country or state changes
                setFormData((prev) => ({ ...prev, [field.record_label]: "" }));
                setDynamicOptions((prev) => ({
                  ...prev,
                  [field.record_label]: [],
                }));
              }
            }
          }
        });
      });
    }
  };

  const transformApiResponse = (
    apiResponse: ApiResponse,
    tableConfig: TableRow[]
  ): Record<string, string> => {
    const transformedData: Record<string, string> = {};

    // Create a map from record_data for fast lookup
    const recordDataMap: Record<string, string> = {};
    apiResponse.feature_data?.record_data?.forEach((record: ApiRecordData) => {
      recordDataMap[record.record_label] =
        record.record_value ??
        record.record_value_date ??
        record.record_value_number ??
        record.record_value_text ??
        "";
    });

    // Handle each field in tableConfig
    tableConfig.forEach((row: TableRow) => {
      row.fields.forEach((field: TableWidgetField) => {
        const { record_label, record_path } = field;

        // Handle feature_data.record_data.* case
        if (record_path.includes("feature_data.record_data")) {
          transformedData[record_label] = recordDataMap[record_label] ?? "";
        }
        // Handle more_data.*
        else if (record_path.startsWith("more_data")) {
          transformedData[record_label] =
            apiResponse.more_data?.[record_label] ?? "";
        }
        // Handle default_main or top-level fields
        else {
          transformedData[record_label] = String(
            apiResponse[record_label as keyof ApiResponse] ?? ""
          );
        }
      });
    });

    return transformedData;
  };

  const fetchUserData = useCallback(async () => {
    if (mode === "edit" && recordId) {
      setLoading(true);
      try {
        const response = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-TYPE": "search",
          },
          body: JSON.stringify({
            conditions: [
              {
                field: "feature_name",
                value: featureName,
                search_type: "exact",
              },
              { field: "record_id", value: recordId, search_type: "exact" },
            ],
            dataset: "feature_data",
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch data");

        const jsonData = await response.json();

        if (jsonData?.data?.length > 0 && config) {
          const userData = transformApiResponse(jsonData.data[0], config);
          setFormData(userData);
          const tagValuesFromAPI = jsonData?.data[0]?.more_data?.tags || [];

          const selectedTagObjects = tags.filter((tag) =>
            tagValuesFromAPI.includes(tag.value)
          );

          setSelectedTags(selectedTagObjects);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
      setLoading(false);
    }
  }, [recordId, config, mode]);

  useEffect(() => {
    if (!open || hasInitialized.current) return;

    if (mode === "edit" && recordId) {
      fetchUserData(); // sets formData inside
    } else if (mode === "add") {
      const saved = localStorage.getItem("addUserForm");
      if (saved) {
        setFormData(JSON.parse(saved));
      } else {
        // Initialize form data with empty record
        const initialData = Object.entries(emptyRecord).reduce(
          (acc, [k, v]) => {
            acc[k] = v;
            return acc;
          },
          {} as FormData
        );

        // Apply dynamic defaults to initial data
        Object.entries(dynamicFieldConfig).forEach(([fieldName, config]) => {
          if (config.default) {
            initialData[fieldName] = config.default;
          }
        });

        setFormData(initialData);
      }
    }

    hasInitialized.current = true;
  }, [open, recordId, config, mode]);

  useEffect(() => {
    if (mode === "add") {
      localStorage.setItem("addUserForm", JSON.stringify(formData));
    }
  }, [formData, mode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const featureData: RecordEntry[] = [];
    const moreData: Record<string, unknown> = {};
    const defaultMain: Record<string, unknown> = {};
    const tagValues = selectedTags.map((tag) => tag.value);

    for (const row of config) {
      for (const field of row.fields) {
        const { record_label, record_path, type } = field;
        let value = formData[record_label];

        if (type === "text" && field?.validations?.required === "true") {
          if (!value) {
            toast.error(`${field.label} is required`);
            return;
          }
        }

        if (type === "email" && field?.validations?.required === "true") {
          if (!value) {
            toast.error(`${field.label} is required`);
            return;
          }
          const pattern = field?.validations?.pattern?.replace(/^\/|\/$/g, "");
          const regex = pattern
            ? new RegExp(pattern)
            : /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!regex.test(String(value))) {
            toast.error(`${field.label} is not in correct format`);
            return;
          }
        }

        if (type === "tel" && field?.validations?.required === "true") {
          if (!value) {
            toast.error(`${field.label} is required`);
            return;
          }
          const mobileRegex = /^[6-9]\d{9}$/;
          if (!mobileRegex.test(String(value))) {
            toast.error(`${field.label} is not in correct format`);
            return;
          }
        }

        if (type === "select") {
          // Check both static and dynamic options for validation
          const hasDynamicOptions =
            field.dynamic_options && field.dynamic_options.length > 0;
          const hasStaticOptions = field.options && field.options.length > 0;
          const dynamicOptionsData = dynamicOptions[field.record_label] || [];

          let isValid = false;

          if (hasDynamicOptions && dynamicOptionsData.length > 0) {
            // Validate against dynamic options
            isValid = dynamicOptionsData.some((opt) => opt.value === value);
          } else if (hasStaticOptions) {
            // Validate against static options
            isValid =
              field.options?.some((opt) => opt.value === value) || false;
          }

          if (!isValid) {
            toast.error(`${field.label} is not a valid option`);
            return;
          }
        }

        if (type === "number") {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            toast.error(`${field.label} must be a number`);
            return;
          }
          if (
            field.validations?.min &&
            numValue < Number(field.validations.min)
          ) {
            toast.error(
              `${field.label} should be at least ${field.validations.min}`
            );
            return;
          }
          if (
            field.validations?.max &&
            numValue > Number(field.validations.max)
          ) {
            toast.error(
              `${field.label} should not exceed ${field.validations.max}`
            );
            return;
          }
        }

        if (type === "date_picker" && field?.validations?.required === "true") {
          const datePattern = /^\d{4}-\d{2}-\d{2}$/;
          if (!value) {
            toast.error(`${field.label} is required`);
            return;
          }
          if (!datePattern.test(String(value))) {
            toast.error(`${field.label} is not in correct format`);
            return;
          }
        }

        if (
          type === "date_range_picker" &&
          field?.validations?.required === "true"
        ) {
          const datePattern = /^\d{4}-\d{2}-\d{2}$/;
          const start = formData[`${field.record_label}_start`] || "";
          const end = formData[`${field.record_label}_end`] || "";
          if (
            !datePattern.test(String(start)) ||
            !datePattern.test(String(end))
          ) {
            toast.error(`${field.label} is not in correct format`);
            return;
          }
          formData[field.record_label] = `${start} to ${end}`;
          value = formData[field.record_label];
        }

        if (type === "time" && field?.validations?.required === "true") {
          const timePattern = /^\d{2}:\d{2}$/;
          if (!value) {
            toast.error(`${field.label} is required`);
            return;
          }
          if (!timePattern.test(String(value))) {
            toast.error(`${field.label} is not in correct format`);
            return;
          }
        }

        const entry =
          field.type === "textarea"
            ? {
                record_label,
                record_value_text: String(value),
                record_type: "type_text",
              }
            : typeof value === "number"
            ? {
                record_label,
                record_value_number: value,
                record_type: "type_number",
              }
            : typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}$/)
            ? {
                record_label,
                record_value_date: value,
                record_type: "type_date",
              }
            : {
                record_label,
                record_value: value,
                record_type: "type_text",
              };

        if (record_path.startsWith("feature_data.record_data")) {
          featureData.push(entry);
        } else if (record_path.startsWith("more_data")) {
          moreData[record_label] = value;
        } else if (record_path.startsWith("default_main")) {
          defaultMain[record_label] = value;
        }
      }
    }

    const wildSearchString = [
      ...featureData.map(
        (d) =>
          (d.record_value ?? d.record_value_number ?? d.record_value_date)
            ?.toString()
            .toLowerCase() || ""
      ),
      ...tagValues.map((tag) => tag.toString().toLowerCase()), // Ensure tag values are also lowercase strings
    ].join(" ");

    const moreDataUpdate = {
      ...moreData,
      wild_search: wildSearchString,
      tags: tagValues,
    };

    const payload =
      mode === "add"
        ? {
            record_id: getSnowflakeId(123),
            feature_name: featureName,
            added_by: currentUser?.record_id,
            record_status: defaultMain["record_status"] || "active",
            created_on_date: new Date().toISOString().split("T")[0],
            feature_data: { record_data: featureData },
            more_data: moreDataUpdate,
          }
        : {
            record_id: recordId,
            feature_name: featureName,
            fields_to_update: {
              "feature_data.record_data": featureData,
              more_data: moreDataUpdate,
              ...(Object.keys(defaultMain).length && {
                record_status: defaultMain["record_status"] || "active",
              }),
            },
          };

    try {
      setButtonLoading(true);
      const endpoint = mode === "add" ? "create" : "update";
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-TYPE": endpoint,
        },
        body: JSON.stringify({ data: payload, dataset: "feature_data" }),
      });

      const result = await response.json();

      if (result?.status == "success") {
        toast.success("Submitted successfully");
        setButtonLoading(false);
        // Reset form data, but preserve dynamic defaults
        const resetData = Object.entries(emptyRecord).reduce((acc, [k, v]) => {
          acc[k] = v;
          return acc;
        }, {} as FormData);

        // Apply dynamic defaults to reset data
        Object.entries(dynamicFieldConfig).forEach(([fieldName, config]) => {
          if (config.default) {
            resetData[fieldName] = config.default;
          }
        });

        setFormData(resetData);
        setSelectedTags([]);
        // Log the add or edit action
        await sendLog({
          data: {
            record_id: `activity_log_${Date.now()}`,
            feature_name: "activity_logs",
            added_by: currentUser?.record_id || "",
            record_status: "active",
            created_on_date: new Date().toISOString().split("T")[0],
            feature_data: {
              record_data: [
                {
                  record_label: "category",
                  record_value_text: "form_data",
                  record_type: "type_text",
                },
                {
                  record_label: "user_id",
                  record_value_text: currentUser?.record_id || "",
                  record_type: "type_text",
                },
                {
                  record_label: "user_role",
                  record_value_text: currentUser?.role_id || "",
                  record_type: "type_text",
                },
                {
                  record_label: "action",
                  record_value_text: mode === "add" ? "add" : "Update",
                  record_type: "type_text",
                },
                {
                  record_label: "records",
                  record_value: [
                    mode === "add" ? payload?.record_id || "" : recordId || "",
                  ],
                  record_type: "type_array",
                },
              ],
            },
            more_data: {},
          },
          dataset: "feature_data",
        });
        // Delay before fetching fresh data
        await new Promise((resolve) => setTimeout(resolve, 500));
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error(`Network error: ${error}`);
    }
  };

  const handleClose = () => {
    setTimeout(() => {
      hasInitialized.current = false;
    }, 100);

    // Reset form data, but preserve dynamic defaults
    const resetData = Object.entries(emptyRecord).reduce((acc, [k, v]) => {
      acc[k] = v;
      return acc;
    }, {} as FormData);

    // Apply dynamic defaults to reset data
    Object.entries(dynamicFieldConfig).forEach(([fieldName, config]) => {
      if (config.default) {
        resetData[fieldName] = config.default;
      }
    });

    setFormData(resetData);
    setSelectedTags([]);
    setLoading(false);
    onClose();
  };

  useEffect(() => {
    return () => {
      setSelectedTags([]);
    };
  }, []);

  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    config: TableRow[]
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkModal({ open: true, loading: true, passed: 0, failed: 0 });
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawData = event.target?.result;
      if (!rawData) {
        console.error("No file content read");
        return;
      }

      let rows: Record<string, string | number | boolean>[] = [];

      if (file.name.endsWith(".csv")) {
        Papa.parse(rawData as string, {
          header: true,
          skipEmptyLines: true,
          complete: async (result) => {
            rows = result.data as Record<string, string | number | boolean>[];
            const { recordsToSubmit, failed } = transformData(rows, config);
            await submitData(recordsToSubmit, failed);
          },
        });
      } else {
        const workbook = XLSX.read(rawData, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet);
        const { recordsToSubmit, failed } = transformData(rows, config);
        await submitData(recordsToSubmit, failed);
      }
    };

    if (file.name.endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const transformData = (
    excelRows: ExcelRow[],
    config: TableRow[]
  ): {
    recordsToSubmit: FormattedRecord[];
    failed: { row: ExcelRow; errors: string[] }[];
  } => {
    const recordsToSubmit: FormattedRecord[] = [];
    const failed: { row: ExcelRow; errors: string[] }[] = [];

    excelRows.forEach((row) => {
      const record_data: RecordEntry[] = [];
      const more_data: MoreData = { wild_search: "" };
      const default_main: Record<string, string> = {};
      const errors: string[] = [];

      config.forEach((rowConfig) => {
        rowConfig.fields.forEach((field) => {
          const { label, record_label, record_path, type, validations } = field;
          const rawValue = row[label];
          const value = rawValue !== undefined ? String(rawValue).trim() : "";

          // Required validation
          if (validations?.required === "true" && !value) {
            errors.push(`${label} is required`);
            return;
          }

          // Pattern validation
          if (validations?.pattern) {
            const regex = new RegExp(
              validations.pattern.replace(/^\/|\/$/g, "")
            );
            if (!regex.test(value)) {
              errors.push(`${label} is not in correct format`);
              return;
            }
          }

          // Type-specific validations
          if (type === "number") {
            const numValue = Number(value);
            if (isNaN(numValue)) {
              errors.push(`${label} must be a number`);
              return;
            }
            if (validations?.min && numValue < Number(validations.min)) {
              errors.push(`${label} should be at least ${validations.min}`);
              return;
            }
            if (validations?.max && numValue > Number(validations.max)) {
              errors.push(`${label} should not exceed ${validations.max}`);
              return;
            }
          } else {
            if (
              validations?.minLength &&
              value.length < Number(validations.minLength)
            ) {
              errors.push(
                `${label} must be at least ${validations.minLength} characters`
              );
            }
            if (
              validations?.maxLength &&
              value.length > Number(validations.maxLength)
            ) {
              errors.push(
                `${label} must be less than ${validations.maxLength} characters`
              );
            }
          }

          let entry: RecordEntry;
          let backendValue = value;

          if (type === "select") {
            const hasDynamicOptions =
              field.dynamic_options && field.dynamic_options.length > 0;
            const hasStaticOptions = field.options && field.options.length > 0;
            const dynamicOptionsData = dynamicOptions[field.record_label] || [];

            let isValid = false;
            let validOptions = "";

            if (hasDynamicOptions && dynamicOptionsData.length > 0) {
              // Check dynamic options
              isValid = dynamicOptionsData.some(
                (option) => option.value === value
              );
              validOptions = dynamicOptionsData
                .map((opt) => opt.label || opt.value)
                .join(", ");
            } else if (hasStaticOptions) {
              // Check static options
              const selectedOption = field.options?.find(
                (option) => option.value === value
              );
              isValid = !!selectedOption;
              if (selectedOption) {
                backendValue = selectedOption.value;
              }
              validOptions =
                field.options
                  ?.map((opt) => opt.label || opt.value)
                  .join(", ") || "";
            }

            if (!isValid) {
              errors.push(
                `${label} is not valid. Accepts only: ${validOptions}`
              );
              return;
            }
          }

          // Record Entry Building
          if (type === "textarea") {
            entry = {
              record_label,
              record_value_text: value,
              record_type: "type_text",
            };
          } else if (type === "number" && !isNaN(Number(value))) {
            entry = {
              record_label,
              record_value_number: Number(value),
              record_type: "type_number",
            };
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            entry = {
              record_label,
              record_value_date: value,
              record_type: "type_date",
            };
          } else {
            entry = {
              record_label,
              record_value: backendValue,
              record_type: "type_text",
            };
          }

          // Assign to correct path
          if (record_path.startsWith("feature_data.record_data")) {
            record_data.push(entry);
          } else if (record_path.startsWith("more_data")) {
            more_data[record_label] = backendValue;
          } else if (record_path.startsWith("default_main")) {
            default_main[record_label] = backendValue.toLowerCase();
          }
        });
      });

      if (errors.length > 0) {
        failed.push({ row, errors });
      } else {
        const wild_search = record_data
          .map(
            (f) =>
              f.record_value ||
              f.record_value_date ||
              f.record_value_number ||
              f.record_value_text
          )
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        more_data["wild_search"] = wild_search;

        recordsToSubmit.push({
          record_id: getSnowflakeId(),
          feature_name: featureName,
          added_by: currentUser?.record_id || "",
          record_status: default_main["record_status"] || "active",
          created_on_date: new Date().toISOString().split("T")[0],
          feature_data: { record_data },
          more_data,
        });
      }
    });

    return { recordsToSubmit, failed };
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      (async () => {
        const $ = (await import("jquery")).default;
        await import("bootstrap-datepicker");

        $("#datepicker").datepicker({
          format: "yyyy-mm-dd",
          autoclose: true,
          todayHighlight: true,
        });
      })();
    }
  }, []);

  const submitData = async (
    formattedData: FormattedRecord[],
    failed: { row: ExcelRow; errors: string[] }[]
  ) => {
    setfailedRecords(failed);

    if (formattedData.length === 0) {
      setBulkModal({
        loading: false,
        open: true,
        passed: 0,
        failed: failed.length,
      });
    } else {
      try {
        const response = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-TYPE": "create",
          },
          body: JSON.stringify({
            data: formattedData,
            dataset: "feature_data",
          }),
        });

        if (!response.ok) {
          toast.error("Failed to upload data");
          setBulkModal({
            loading: false,
            open: false,
            passed: formattedData.length,
            failed: failed.length,
          });
        } else {
          setBulkModal({
            loading: false,
            open: true,
            passed: formattedData.length,
            failed: failed.length,
          });
          // Log bulk add action
          const recordIds = formattedData.map((rec) => rec.record_id);
          console.log("Attempting to send bulk log", {
            recordIds,
            currentUser,
          });
          await sendLog({
            data: {
              record_id: `activity_log_${Date.now()}`,
              feature_name: "activity_logs",
              added_by: currentUser?.record_id || "",
              record_status: "active",
              created_on_date: new Date().toISOString().split("T")[0],
              feature_data: {
                record_data: [
                  {
                    record_label: "category",
                    record_value_text: "form_data",
                    record_type: "type_text",
                  },
                  {
                    record_label: "user_id",
                    record_value_text: currentUser?.record_id || "",
                    record_type: "type_text",
                  },
                  {
                    record_label: "user_role",
                    record_value_text: currentUser?.role_id || "",
                    record_type: "type_text",
                  },
                  {
                    record_label: "action",
                    record_value_text: "bulk_add",
                    record_type: "type_text",
                  },
                  {
                    record_label: "records",
                    record_value: recordIds,
                    record_type: "type_array",
                  },
                ],
              },
              more_data: {},
            },
            dataset: "feature_data",
          });
          console.log("Bulk log sent");
        }
      } catch (err) {
        console.error("Upload failed", err);
        alert("Upload failed. Check console for details.");
      }
    }
  };

  const handleDownload = (download_type: string) => {
    if ("xlsx" === download_type) {
      generateSampleDownloadFromConfig(config);
    } else if ("csv" === download_type) {
      generateSampleCSVDownloadFromConfig(config);
    }
  };

  const modalSize = widgetData?.config?.form_size || "modal-lg";

  console.log("");

  return (
    <>
      {open && (
        <div
          className={`modal fade ${
            open ? "show d-block" : "d-none"
          } position-fixed top-0 start-0 end-0 bottom-0 z-index-max`}
          tabIndex={-1}
          style={{
            backgroundColor: open ? "rgba(0,0,0,0.5)" : "transparent",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            overflow: "auto",
          }}
        >
          <div
            className={`modal-dialog ${modalSize} modal-dialog-centered z-index-modal`}
          >
            <div
              className="modal-content"
              style={{
                display: "flex",
                flexDirection: "column",
                maxHeight: "90vh",
                overflow: "hidden",
              }}
            >
              <div
                className="modal-header-add d-flex justify-content-between p-2 pe-3 ps-3"
                style={{
                  borderBottom: "1px solid #dee2e6",
                }}
              >
                <div className="modal-title d-flex align-items-center gap-2">
                  <h6 className="modal-title">
                    {mode === "add"
                      ? widgetData?.config?.table_settings?.actions?.add?.name
                      : widgetData?.config?.table_settings?.actions?.edit?.name}
                  </h6>
                </div>

                <div className="d-flex gap-2">
                  <label className="btn btn-outline-primary">
                    Bulk Upload
                    <input
                      type="file"
                      hidden
                      accept=".csv,.xlsx,.xls"
                      ref={fileInputRef}
                      onChange={(e) => handleFileUpload(e, config)}
                    />
                  </label>
                  <div className="sample-file ">
                    Sample File
                    <div className="d-flex justify-content-center gap-2">
                      <i
                        className={
                          widgetData?.config?.table_settings?.export?.excel
                            ?.icon
                        }
                        onClick={() => handleDownload("xlsx")}
                        style={{ cursor: "pointer" }}
                      />
                      <i
                        className={
                          widgetData?.config?.table_settings?.export?.csv?.icon
                        }
                        onClick={() => handleDownload("csv")}
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                // style={{ flex: 1, display: "flex", flexDirection: "column" }}
                // className="d-flex flex-column"
              >
                <div
                  className="modal-body-add"
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "1rem",
                  }}
                >
                  {loading ? (
                    <div
                      className="d-flex justify-content-center align-items-center"
                      style={{ minHeight: "200px" }}
                    >
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    config?.map((row: TableRow, index) => (
                      <div key={index} className="row g-3 mb-3">
                        {row.fields.map((field: TableWidgetField) => {
                          if (field.type === "select") {
                            const hasDynamicOptions =
                              field.dynamic_options &&
                              field.dynamic_options.length > 0;
                            const hasStaticOptions =
                              field.options && field.options.length > 0;
                            const dynamicOptionsData =
                              dynamicOptions[field.record_label] || [];
                            const fieldConfig =
                              dynamicFieldConfig[field.record_label];

                            // Debug logs
                            // console.log("Select field:", field.record_label);
                            // console.log("Dynamic options:", dynamicOptionsData);
                            // console.log("Static options:", field.options);

                            // Determine which options to use
                            const optionsToUse =
                              hasDynamicOptions && dynamicOptionsData.length > 0
                                ? dynamicOptionsData
                                : hasStaticOptions
                                ? field.options || []
                                : [];

                            // Determine if field should be disabled (locked)
                            const isFieldLocked = fieldConfig?.lock || false;

                            // Get the current value
                            const currentValue = String(
                              formData[field.record_label] ||
                                fieldConfig?.default ||
                                field.default_value ||
                                ""
                            );

                            return (
                              <div key={field.record_label} className="col">
                                <label className="form-label">
                                  {field.label}
                                  {field?.validations?.required === "true" && (
                                    <span className="text-danger"> *</span>
                                  )}
                                  {isFieldLocked && (
                                    <span className="text-muted ms-2">
                                      <i
                                        className="fas fa-lock"
                                        title="Field is locked"
                                      ></i>
                                    </span>
                                  )}
                                </label>
                                <select
                                  className={`form-select ${
                                    isFieldLocked ? "bg-light" : ""
                                  }`}
                                  name={field.record_label}
                                  value={currentValue}
                                  onChange={handleChange}
                                >
                                  <option value="" disabled>
                                    {field.placeholder || "Select an option"}
                                  </option>
                                  {optionsToUse.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          }

                          if (field.type === "date_picker") {
                            return (
                              <div key={field.record_label} className="col">
                                <label
                                  className="form-label"
                                  htmlFor={field.record_label}
                                >
                                  {field.label}
                                  {field?.validations?.required === "true" && (
                                    <span className="text-danger"> *</span>
                                  )}
                                </label>
                                <input
                                  type="date"
                                  className="form-control"
                                  id={field.record_label}
                                  name={field.record_label}
                                  placeholder={
                                    field.placeholder || "YYYY-MM-DD"
                                  }
                                  value={
                                    formData[field.record_label] ||
                                    field.default_value ||
                                    ""
                                  }
                                  onChange={handleChange}
                                />
                              </div>
                            );
                          }

                          if (field.type === "time") {
                            return (
                              <div key={field.record_label} className="col">
                                <label
                                  className="form-label"
                                  htmlFor={field.record_label}
                                >
                                  {field.label}
                                  {field?.validations?.required === "true" && (
                                    <span className="text-danger"> *</span>
                                  )}
                                </label>
                                <input
                                  type="time"
                                  className="form-control"
                                  id={field.record_label}
                                  name={field.record_label}
                                  placeholder={field.placeholder || "HH:MM"}
                                  value={
                                    formData[field.record_label] ||
                                    field.default_value ||
                                    ""
                                  }
                                  onChange={handleChange}
                                  // required={!!field.validations?.required}
                                />
                              </div>
                            );
                          }

                          if (field.type === "date_range_picker") {
                            return (
                              <div key={field.record_label} className="col">
                                <label className="form-label">
                                  {field.label}
                                  {field?.validations?.required === "true" && (
                                    <span className="text-danger"> *</span>
                                  )}
                                </label>
                                <div className="d-flex gap-2">
                                  <input
                                    type="date"
                                    className="form-control"
                                    name={`${field.record_label}_start`}
                                    placeholder={
                                      field.placeholder || "Start date"
                                    }
                                    value={
                                      formData[`${field.record_label}_start`] ||
                                      (typeof field.default_value ===
                                        "object" && field.default_value !== null
                                        ? (
                                            field.default_value as {
                                              start?: string;
                                            }
                                          ).start
                                        : "") ||
                                      ""
                                    }
                                    onChange={handleChange}
                                    // required={!!field.validations?.required}
                                  />

                                  <span className="mt-2">to</span>
                                  <input
                                    type="date"
                                    className="form-control"
                                    name={`${field.record_label}_end`}
                                    placeholder={
                                      field.placeholder || "End date"
                                    }
                                    value={
                                      formData[`${field.record_label}_end`] ||
                                      (typeof field.default_value ===
                                        "object" && field.default_value !== null
                                        ? (
                                            field.default_value as {
                                              end?: string;
                                            }
                                          ).end
                                        : "") ||
                                      ""
                                    }
                                    onChange={handleChange}
                                    // required={!!field.validations?.required}
                                  />
                                </div>
                              </div>
                            );
                          }

                          if (field.type === "textarea") {
                            return (
                              <div key={field.record_label} className="col">
                                <label className="form-label">
                                  {field.label}
                                  {field?.validations?.required === "true" && (
                                    <span className="text-danger"> *</span>
                                  )}
                                </label>
                                <textarea
                                  className="form-control"
                                  name={field.record_label}
                                  rows={3}
                                  style={{ resize: "vertical" }}
                                  placeholder={field.placeholder}
                                  value={
                                    formData[field.record_label] ||
                                    field.default_value ||
                                    ""
                                  }
                                  onChange={handleChange}
                                  // required={!!field.validations?.required}
                                />
                              </div>
                            );
                          }

                          if (field.type === "rich_text") {
                            return (
                              <div key={field.record_label} className="col">
                                <label className="form-label">
                                  {field.label}
                                  {field?.validations?.required === "true" && (
                                    <span className="text-danger"> *</span>
                                  )}
                                </label>
                                <QuillEditor
                                  value={String(
                                    formData[field.record_label] ||
                                      field.default_value ||
                                      ""
                                  )}
                                  onChange={(value) => {
                                    const syntheticEvent = {
                                      target: {
                                        name: field.record_label,
                                        value,
                                      },
                                    } as React.ChangeEvent<HTMLTextAreaElement>;
                                    handleChange(syntheticEvent);
                                  }}
                                />
                              </div>
                            );
                          }

                          // Handle all other field types (text, email, tel, etc.)
                          return (
                            <div key={field.record_label} className="col">
                              <label className="form-label">
                                {field.label}
                                {field?.validations?.required === "true" && (
                                  <span className="text-danger"> *</span>
                                )}
                              </label>
                              <input
                                className="form-control"
                                name={field.record_label}
                                value={String(
                                  formData[field.record_label] ||
                                    field.default_value ||
                                    ""
                                )}
                                onChange={handleChange}
                                placeholder={field.placeholder}
                                type={
                                  field.type === "date"
                                    ? "date"
                                    : field.type === "number"
                                    ? "number"
                                    : field.type === "email"
                                    ? "email"
                                    : field.type === "tel"
                                    ? "tel"
                                    : "text"
                                }
                                // required={!!field.validations?.required}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}

                  {widgetData?.config?.tags?.default === "true" && (
                    <CustomMultiSelect
                      key={`multiselect-${mode}-${open}`}
                      tags={tags}
                      selectedTags={selectedTags}
                      onAddTag={(tag) => {
                        if (!selectedTags.some((t) => t.value === tag.value)) {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      onRemoveTag={(tagValue) => {
                        setSelectedTags(
                          selectedTags.filter((t) => t.value !== tagValue)
                        );
                      }}
                    />
                  )}
                </div>

                <div
                  className="modal-footer-add"
                  style={{
                    flexShrink: 0,
                    position: "sticky",
                    bottom: 0,
                    zIndex: 100,
                    backgroundColor: "#fff",
                    borderTop: "1px solid #dee2e6",
                    padding: "1rem",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={buttonLoading}
                  >
                    {buttonLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        {mode === "add" ? "Submitting..." : "Updating..."}
                      </>
                    ) : mode === "add" ? (
                      "Submit"
                    ) : (
                      "Update"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          {bulkModal.open && (
            <BulkUploadResultModal
              open={bulkModal.open}
              loading={bulkModal.loading}
              passed={bulkModal.passed}
              failed={bulkModal.failed}
              failedRecords={failedRecords || []}
              onClose={() => setBulkModal((prev) => ({ ...prev, open: false }))}
            />
          )}
        </div>
      )}
    </>
  );
};

export default AddUserDialog;
