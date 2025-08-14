"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RowData,
  TableWidgetData,
  ColumnConfig,
  FeatureData,
  RecordItem,
} from "@/types/table";
import {
  generateEmptyRecord,
  getAllDisplayColumns,
  getValueByPath,
} from "@/utils/table";
import AddUserDilog from "./AddUserDilog";
import ViewMoreDilog from "./ViewMoreDilog";
import { TemplateType, templates } from "./templates";
import { useDispatch, useSelector } from "react-redux";
import { fetchTags } from "@/redux/slices/tagsSlice";
import { RootState, AppDispatch } from "@/redux/store";
import { User } from "@/types/user";

interface DynamicFormTableProps {
  widgetData: TableWidgetData;
  template?: TemplateType;
  hideTemplateSelector?: boolean;
}

const DynamicFormTable = ({ widgetData }: DynamicFormTableProps) => {
  const selectedTemplate = useSelector(
    (state: RootState) => state.templateRef.selectedTemplate
  ) as TemplateType;
  const dispatch = useDispatch<AppDispatch>();
  const loginUser = useSelector(
    (state: RootState) => state.user.user
  ) as User | null;

  const { tags } = useSelector((state: RootState) => state.tags);
  const { config } = widgetData;
  const [data, setData] = useState<RowData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editRow, setEditRow] = useState<RowData>();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [mode, setMode] = useState<"edit" | "add">("edit");
  const [viewMoreOpen, setViewMoreOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [page, setPage] = useState(() =>
    parseInt(
      String(config?.table_settings?.pagination?.current_page ?? "1"),
      10
    )
  );
  const [rowsPerPage, setRowsPerPage] = useState<number>(
    Number(config?.table_settings?.pagination?.page_size) || 10
  );
  const [selectedRecordPath, setSelectedRecordPath] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [selectedFilterValue, setSelectedFilterValue] = useState<string>("");
  const [defaultmainlabel, setDefaultMainLabel] = useState<string>("");
  const [featureName] = useState(config?.data_source || "");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const tableConfigRows1 = config?.rows || [];
  const emptyRecord = generateEmptyRecord(tableConfigRows1);
  const displayColumns = getAllDisplayColumns(config);
  const TableComponent = templates[selectedTemplate].DynamicFormTable;

  useEffect(() => {
    dispatch(fetchTags());
  }, [dispatch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchData = useCallback(async () => {
    const conditions = [
      {
        field: "feature_name",
        value: config?.data_source,
        search_type: "exact",
      },
    ];

    if (filterTag.trim() !== "") {
      conditions.push({
        field: "more_data.wild_search",
        value: `*${debouncedSearch.toLowerCase().trim()}*${filterTag
          .toLowerCase()
          .trim()}*`,
        search_type: "wildcard",
      });
    } else if (debouncedSearch.trim() !== "") {
      conditions.push({
        field: "more_data.wild_search",
        value: `*${debouncedSearch.toLowerCase().trim()}*`,
        search_type: "wildcard",
      });
    }

    if (selectedFilterValue.trim() !== "") {
      conditions.push({
        field: selectedRecordPath.startsWith("default_main")
          ? defaultmainlabel
          : selectedRecordPath.replace("record_label", "record_value"),
        value: `${selectedFilterValue}`,
        search_type: "exact",
      });
    }

    const requestBody = {
      conditions,
      combination_type: "and",
      page,
      limit: rowsPerPage,
      sort: [{ record_id: "desc" }],
      dataset: "feature_data",
    };

    try {
      // Re-fetch data for table
      const refreshedResponse = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-TYPE": "search", // same type used when initially loading the table
        },
        body: JSON.stringify(requestBody), // your original table fetch body
      });

      const refreshedData = await refreshedResponse.json();
      setData(refreshedData.data); // update your table's state

      return {
        data: refreshedData.data ?? [],
        total_results: refreshedData.total_results ?? 0,
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      return { data: [], total_results: 0 };
    }
  }, [
    debouncedSearch,
    selectedFilterValue,
    filterTag,
    page,
    rowsPerPage,
    config?.data_source,
    selectedRecordPath,
    defaultmainlabel,
  ]);

  useEffect(() => {
    const fetchTableData = async () => {
      setLoading(true);
      const res = await fetchData();
      setData(res.data || []);
      setTotalCount(res.total_results || 0);
      setLoading(false);
    };
    fetchTableData();
  }, [fetchData]);

  const getSortedData = () => {
    if (!sortConfig) return data;

    const { key, direction } = sortConfig;

    const extractValue = (
      item: RowData,
      field: ColumnConfig
    ): string | number | null => {
      const label = field.record_label?.toLowerCase();

      if (label === "id") {
        // Safely check for record_data
        const featureData = item.feature_data;
        if (
          featureData &&
          typeof featureData === "object" &&
          "record_data" in featureData &&
          Array.isArray((featureData as FeatureData).record_data)
        ) {
          const recordData = (featureData as FeatureData).record_data;
          const idEntry = recordData?.find(
            (rd: RecordItem) => rd.record_label?.toLowerCase() === "id"
          );

          if (!idEntry) return null;

          if (typeof idEntry?.record_value === "string") {
            const match = idEntry.record_value.match(/\d+/);
            return match ? parseInt(match[0], 10) : null;
          }
          return null;
        }
        return null;
      }

      // fallback for other fields
      const value = getValueByPath(item, field.record_path, field.record_label);
      return typeof value === "string" || typeof value === "number"
        ? value
        : null;
    };

    return [...data].sort((a, b) => {
      const field = displayColumns.find(
        (f) => f.label.toLowerCase() === key.toLowerCase()
      );
      if (!field) return 0;

      const valA = extractValue(a, field);
      const valB = extractValue(b, field);

      // Handle nulls
      if (valA == null) return 1;
      if (valB == null) return -1;

      // Numeric comparison
      if (typeof valA === "number" && typeof valB === "number") {
        return direction === "asc" ? valA - valB : valB - valA;
      }

      // Fallback string comparison
      return direction === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  };

  const requestSort = (key: string) => {
    // console.log("Requesting sort for key:", key);

    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleUpdateSuccess = (newData?: RowData[]) => {
    if (newData && newData.length > 0) {
      setData((prev) => [newData[0], ...prev]);
      setTotalCount((prev) => prev + 1);
    } else {
      fetchData().then((res) => {
        setData(res.data || []);
        setTotalCount(res.total_results || 0);
      });
    }
  };

  const handleEditClick = (row: RowData) => {
    setMode("edit");
    setEditRow(row);
    setIsEditOpen(true);
  };

  const handleView = (row: RowData) => {
    setSelectedRecordId(row?.record_id ? String(row.record_id) : null);
    setViewMoreOpen(true);
  };

  const handleClose = () => {
    setIsEditOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage + 1);
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(1);
  };

  const selectedField = (() => {
    if (!selectedFilter) return null;

    for (const row of config?.rows || []) {
      for (const field of row.fields || []) {
        if (
          field.label === selectedFilter &&
          field.display_settings?.filterable === "true"
        ) {
          return field;
        }
      }
    }
    return null;
  })();

  const sortedData = getSortedData();
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const startItem = (page - 1) * rowsPerPage + 1;
  const endItem = Math.min(page * rowsPerPage, totalCount);

  const handleNewUser = () => {
    if (widgetData?.config?.form_type === "modal_form") {
      setIsEditOpen(true);
      setMode("add");
    } else {
      if (
        widgetData?.config?.form_type === "inline" &&
        widgetData?.config?.window_type === "new-tab"
      ) {
        localStorage.setItem("widgetData", JSON.stringify(widgetData));
        window.open("/newuser", "_blank");
      } else if (
        widgetData?.config?.form_type == "inline" &&
        widgetData?.config?.window_type == "new-window"
      ) {
        if (!widgetData) return;
        const sessionKey = `widgetData_${Date.now()}`;
        // Store the data in sessionStorage (clears when tab closes)
        sessionStorage.setItem(sessionKey, JSON.stringify(widgetData));
        // Open new window with the session key as a URL parameter
        window.open(
          `/newuser?configKey=${sessionKey}`,
          "_blank",
          "width=800,height=600"
        );
      }
    }
  };

  return (
    <>
      <TableComponent
        widgetData={widgetData}
        data={sortedData}
        onSort={requestSort}
        sortConfig={sortConfig}
        displayColumns={displayColumns}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        totalPages={totalPages}
        startItem={startItem}
        endItem={endItem}
        search={search}
        selectedFilter={selectedFilter}
        selectedFilterValue={selectedFilterValue}
        selectedField={selectedField}
        onSearchChange={(e) => setSearch(e.target.value)}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onEditClick={handleEditClick}
        onViewClick={handleView}
        onNewUser={handleNewUser}
        onFilterChange={(e) => setSelectedFilter(e.target.value)}
        onFilterTags={(e) => setFilterTag(e.target.value)}
        loading={loading}
        onFilterValueChange={(e) => {
          setSelectedFilterValue(e.target.value);
          if (selectedField) {
            setSelectedRecordPath(selectedField.record_path);
            setDefaultMainLabel(selectedField.record_label);
          }
        }}
        tags={tags}
        userId={loginUser?.record_id}
      />

      <ViewMoreDilog
        open={viewMoreOpen}
        onClose={() => setViewMoreOpen(false)}
        recordId={selectedRecordId}
        tableConfig={config?.rows}
        featureName={featureName}
        widgetData={widgetData}
      />

      <AddUserDilog
        open={isEditOpen}
        onClose={handleClose}
        widgetData={widgetData}
        mode={mode}
        recordId={
          editRow?.record_id !== null && editRow?.record_id !== undefined
            ? String(editRow.record_id)
            : null
        }
        config={config?.rows}
        emptyRecord={emptyRecord}
        featureName={featureName}
        onSuccess={handleUpdateSuccess}
        tags={tags}
      />
    </>
  );
};

export default DynamicFormTable;
