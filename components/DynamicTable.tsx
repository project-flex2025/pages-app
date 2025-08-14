"use client";

import {
  Column,
  RowData,
  WidgetData,
  WidgetConfig,
  TableWidgetField,
  FieldOption,
  FeatureData,
  RecordItem,
} from "@/types/table";
import { useCallback, useEffect, useState } from "react";
import ViewMoreTableDialog from "./ViewMoretableDilog";
import { TemplateType, templates } from "./templates";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { getValueByPath } from "@/utils/table";

interface DynamicTableProps {
  widgetData: WidgetData;
  template?: TemplateType;
  hideTemplateSelector?: boolean;
}

function DynamicTable({ widgetData }: DynamicTableProps) {
  const [selectedFilter, setSelectedFilter] = useState("");
  const [data, setData] = useState<RowData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMoreOpen, setViewMoreOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedFilterValue, setSelectedFilterValue] = useState<string>("");
  const [selectedRecordPath, setSelectedRecordPath] = useState("");
  const [defaultmainlabel, setDefaultMainLabel] = useState<string>("");

  const [page, setPage] = useState(() =>
    parseInt(
      String(
        widgetData?.config?.table_settings?.pagination?.current_page ?? "1"
      ),
      10
    )
  );
  const [rowsPerPage, setRowsPerPage] = useState<number>(
    Number(widgetData?.config?.table_settings?.pagination?.page_size) || 10
  );
  const selectedTemplate = useSelector(
    (state: RootState) => state.templateRef.selectedTemplate
  ) as TemplateType;
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  // const [selectedField, setSelectedField] = useState<any>(null);

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // console.log("selectedFilterValue.......333333", selectedFilterValue);

  const fetchData = useCallback(async () => {
    const conditions = [
      {
        field: "feature_name",
        value: widgetData?.config?.data_source,
        search_type: "exact",
      },
      {
        field: "more_data.wild_search",
        value: `*${debouncedSearch.toLowerCase().trim()}*`,
        search_type: "wildcard",
      },
    ];

    if (selectedFilterValue.trim() !== "") {
      conditions.push({
        field: selectedRecordPath.startsWith("default_main")
          ? defaultmainlabel
          : selectedRecordPath.replace("record_label", "record_value"),
        value: `${selectedFilterValue}`,
        search_type: "exact",
      });
    }

    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-TYPE": "search",
        },
        body: JSON.stringify({
          conditions,
          combination_type: "and",
          page: page,
          limit: rowsPerPage,
          sort: [{ record_id: "asc" }],
          dataset: "feature_data",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch data");
      }

      const jsonData = await response.json();
      return {
        data: jsonData.data ?? [],
        total_results: jsonData.total_results ?? 0,
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      return { data: [], total_results: 0 };
    }
  }, [
    page,
    rowsPerPage,
    debouncedSearch,
    widgetData?.config?.data_source,
    selectedFilterValue,
  ]);

  useEffect(() => {
    const fetchTableData = async () => {
      setLoading(true);
      try {
        const res = await fetchData();
        setData(res.data);
        setTotalCount(res.total_results);
      } catch (err) {
        console.error("Error in fetchTableData:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTableData();
  }, [fetchData]);

  const handleEditClick = (recordId: string) => {
    setViewMoreOpen(true);
    setSelectedRecordId(recordId);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage + 1);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const TableComponent = templates[selectedTemplate].DynamicTable;

  // if (loading) {
  //   return (
  //     <div className="d-flex justify-content-center p-4">
  //       <div className="spinner-border" role="status">
  //         <span className="visually-hidden">Loading...</span>
  //       </div>
  //     </div>
  //   );
  // }

  // if (error) {
  //   return <div className="p-4">Error: {error}</div>;
  // }

  // if (!data || data.length === 0) {
  //   return <div className="p-4">No data available</div>;
  // }

  // Type-safe access to columns
  const widgetConfig = widgetData.config as WidgetConfig & {
    columns?: Column[];
  };
  const visibleColumns =
    widgetConfig?.columns?.filter(
      (col: Column) => col.display_settings.table_view
    ) || [];

  // Calculate pagination values
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const startItem = (page - 1) * rowsPerPage + 1;
  const endItem = Math.min(page * rowsPerPage, totalCount);

  // console.log("widgetData", widgetData);

  // const selectedField = (() => {
  //   if (!selectedFilter) return null;

  //   for (const field of widgetData?.config?.columns || []) {
  //     if (
  //       field.label === selectedFilter &&
  //       field.display_settings?.filterable === "true"
  //     ) {
  //       return field;
  //     }
  //   }

  //   return null;
  // })();
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // const getSortedData = () => {
  //   if (!sortConfig) return data;

  //   const { key, direction } = sortConfig;
  //   const getValue = (item: RowData, path: string, label: string) => {
  //     if (label.toLowerCase() === "empid") return item.record_id;
  //     return getValueByPath(item, path, label);
  //   };

  //   return [...data].sort((a, b) => {
  //     const field = visibleColumns.find(
  //       (field) => field.label.toLowerCase() === key.toLowerCase()
  //     );
  //     if (!field) return 0;

  //     const valueA = getValue(a, field.record_path, field.record_label);
  //     const valueB = getValue(b, field.record_path, field.record_label);

  //     if (valueA == null) return 1;
  //     if (valueB == null) return -1;

  //     if (typeof valueA === "string" && typeof valueB === "string") {
  //       return direction === "asc"
  //         ? valueA.localeCompare(valueB)
  //         : valueB.localeCompare(valueA);
  //     }

  //     if (typeof valueA === "number" && typeof valueB === "number") {
  //       return direction === "asc" ? valueA - valueB : valueB - valueA;
  //     }

  //     return 0;
  //   });
  // };

  const getSortedData = () => {
    if (!sortConfig) return data;

    const { key, direction } = sortConfig;

    const getValue = (item: RowData, path: string, label: string) => {
      const labelLower = label.toLowerCase();

      if (labelLower === "empid" || labelLower === "id") {
        // 1. Try to get from record_data
        const idEntry =
          typeof item.feature_data === "object" &&
          item.feature_data !== null &&
          "record_data" in item.feature_data &&
          Array.isArray((item.feature_data as FeatureData)?.record_data)
            ? Array.isArray((item.feature_data as FeatureData)?.record_data)
              ? (item.feature_data as FeatureData)?.record_data
                ? (item.feature_data as FeatureData)?.record_data?.find(
                    (rd: RecordItem) => rd.record_label?.toLowerCase() === "id"
                  )
                : undefined
              : undefined
            : undefined;

        const rawId = idEntry?.record_value || item.record_id;

        // Extract number from the string (e.g., Emp_05 → 5)
        const match = typeof rawId === "string" ? rawId.match(/\d+/) : null;
        return match ? parseInt(match[0], 10) : rawId || "";
      }

      return getValueByPath(item, path, label);
    };

    return [...data].sort((a, b) => {
      const field = visibleColumns.find(
        (field) => field.label.toLowerCase() === key.toLowerCase()
      );
      if (!field) return 0;

      const valueA = getValue(a, field.record_path, field.record_label);
      const valueB = getValue(b, field.record_path, field.record_label);

      if (valueA == null) return 1;
      if (valueB == null) return -1;

      // Numeric sort if both are numbers
      if (typeof valueA === "number" && typeof valueB === "number") {
        return direction === "asc" ? valueA - valueB : valueB - valueA;
      }

      // Otherwise, string sort
      return direction === "asc"
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });
  };

  const sortedData = getSortedData();

  interface MapColumnFieldInput {
    type?: string;
    label: string;
    record_path: string;
    placeholder?: string;
    note?: string;
    default_value?: string;
    record_label?: string;
    display_settings?: {
      table_view?: string;
      detailed_view?: string;
      sortable?: string;
      filterable?: string;
      searchable?: string;
    };
    validations?: {
      required: boolean | string;
      min?: number | string | undefined;
      max?: number | string | undefined;
      minLength?: number | string | undefined;
      maxLength?: number | string | undefined;
      pattern?: string;
    };
    options?: Array<{
      disabled: boolean;
      label: string;
      value: string;
      record_label: string;
      color?: string;
    }>;
    multiple?: boolean;
    value_path?: string;
  }

  const mapColumnToTableWidgetField = (
    field: MapColumnFieldInput
  ): TableWidgetField => ({
    type: field.type || "text",
    label: field.label,
    record_path: field.record_path,
    placeholder: field.placeholder || "",
    note: field.note || "",
    default_value: field.default_value || "",
    record_label: field.record_label || field.label,
    display_settings: {
      table_view: field.display_settings?.table_view ?? "true",
      detailed_view: field.display_settings?.detailed_view ?? "true",
      sortable: field.display_settings?.sortable ?? "false",
      filterable: field.display_settings?.filterable ?? "false",
      searchable: field.display_settings?.searchable ?? "false",
    },
    validations: {
      ...field.validations,
      required:
        field.validations?.required !== undefined
          ? field.validations.required
          : false,
    },
    options: field.options || [],
    multiple: field.multiple,
    value_path: field.value_path,
  });

  const selectedField: TableWidgetField | null = (() => {
    if (!selectedFilter) return null;

    for (const field of widgetData?.config?.columns || []) {
      if (
        field.label === selectedFilter &&
        String(field.display_settings?.filterable) === "true"
      ) {
        // Convert boolean display_settings to string as required by MapColumnFieldInput
        const display_settings = field.display_settings
          ? {
              ...field.display_settings,
              table_view: String(field.display_settings.table_view),
              detailed_view: String(field.display_settings.detailed_view),
              sortable: String(field.display_settings.sortable),
              filterable: String(field.display_settings.filterable),
              searchable: String(field.display_settings.searchable),
            }
          : undefined;
        return mapColumnToTableWidgetField({
          ...field,
          display_settings,
          options: field.options
            ? field.options.map((opt: FieldOption) => ({
                disabled: false,
                label: opt.label,
                value: opt.value,
                record_label: opt.record_label ?? opt.label,
                color: opt.color,
              }))
            : [],
        });
      }
    }

    return null;
  })();

  return (
    <>
      <TableComponent
        widgetData={widgetData}
        data={sortedData}
        onSort={requestSort}
        sortConfig={sortConfig}
        visibleColumns={visibleColumns}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        totalPages={totalPages}
        startItem={startItem}
        endItem={endItem}
        search={search}
        selectedFilter={selectedFilter}
        onSearchChange={(e) => setSearch(e.target.value)}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onViewMore={handleEditClick}
        loading={loading}
        onFilterChange={(e) => {
          setSelectedFilter(e.target.value);
        }}
        selectedField={selectedField}
        onFilterValueChange={(e) => {
          setSelectedFilterValue(e.target.value);
          if (selectedField) {
            setSelectedRecordPath(selectedField.record_path);
            setDefaultMainLabel(selectedField.record_label);
          }
        }}
      />

      <ViewMoreTableDialog
        open={viewMoreOpen}
        onClose={() => setViewMoreOpen(false)}
        recordId={selectedRecordId !== null ? String(selectedRecordId) : null}
        tableConfig={
          widgetConfig?.columns?.map((col: Column) => ({
            ...col,
            display_settings: {
              table_view: String(col.display_settings.table_view),
              detailed_view: String(col.display_settings.detailed_view),
              sortable: String(col.display_settings.sortable),
              filterable: String(col.display_settings.filterable),
            },
          })) || []
        }
        dataSource={widgetData?.config?.data_source}
        actions_view={widgetData?.config?.table_settings?.actions?.view}
      />
    </>
  );
}

export default DynamicTable;
