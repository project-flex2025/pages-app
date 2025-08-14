"use client";
import { RowData } from "@/types/table";
import { getValueByPath } from "@/utils/table";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

const displayColumns = [
  {
    label: "ID",
    type: "text",
    record_label: "record_id",
    placeholder: "Enter ID",
    note: "",
    default_value: "",
    record_path: "default_main",
    validations: {
      required: "true",
    },
    display_settings: {
      table_view: "true",
      detailed_view: "true",
      sortable: "false",
      filterable: "false",
    },
  },
  {
    label: "Title",
    type: "text",
    record_label: "title",
    placeholder: "Enter Title",
    note: "",
    default_value: "",
    record_path: "feature_data.record_data.name",
    validations: {
      required: "true",
    },
    display_settings: {
      table_view: "true",
      detailed_view: "true",
      sortable: "false",
      filterable: "false",
    },
  },
  {
    label: "Date",
    type: "text",
    record_label: "date",
    placeholder: "Enter Title",
    note: "",
    default_value: "",
    record_path: "feature_data.record_data.date",
    validations: {
      required: "true",
    },
    display_settings: {
      table_view: "true",
      detailed_view: "true",
      sortable: "false",
      filterable: "false",
    },
  },
];

type EventCategory = {
  label: string;
  value: string;
};

interface CalendarBlock {
  Calendar: {
    data_source: string;
    options: {
      default: string;
      view_modes: string[];
    };
  };
}

interface RemindersBlock {
  Reminders: {
    categories: EventCategory[];
  };
}

interface EventsBlock {
  Events: {
    categories: EventCategory[];
  };
}

type ConfigItem = CalendarBlock | RemindersBlock | EventsBlock;

interface DefaultCalendarEventProps {
  config: ConfigItem[];
}

interface ReminderRow {
  title?: string;
  date?: string | number;
}

interface ValidRecord {
  record_id: string;
  feature_name: string;
  added_by: string;
  record_status: string;
  created_on_date: string;
  feature_data: {
    record_data: {
      record_label: string;
      record_value: string;
      record_type: string;
    }[];
  };
}

export default function DefaultCalendarEvent({
  config,
}: DefaultCalendarEventProps) {
  console.log("DefaultCalendarEvent config:", config);

  const [data, setData] = useState<RowData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState(1);

  const eventsItem = config.find(
    (item): item is EventsBlock => "Events" in item
  );
  const calendarItem = config.find(
    (item): item is CalendarBlock => "Calendar" in item
  );

  const eventCategories: EventCategory[] = eventsItem?.Events.categories || [];

  const feature_name: string = calendarItem?.Calendar.data_source || "calendar";

  const [switchTab, setSwitchTab] = useState<string>(
    eventCategories?.[0]?.value || "holidays"
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  const fetchReminders = useCallback(async () => {
    type Condition = {
      field: string;
      value: string;
      search_type: string;
    };
    let conditions: Condition[] = [];
    conditions = [
      {
        field: "feature_name",
        value: feature_name || "calendar",
        search_type: "exact",
      },
      {
        field: "feature_data.record_data.record_value",
        value: switchTab,
        search_type: "exact",
      },
    ];

    const requestBody = {
      conditions,
      combination_type: "and",
      page,
      limit: rowsPerPage,
      sort: [{ record_id: "desc" }],
      dataset: "feature_data",
    };

    try {
      const refreshedResponse = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-TYPE": "search",
        },
        body: JSON.stringify(requestBody),
      });

      const refreshedData = await refreshedResponse.json();
      setData(refreshedData.data ?? []);
      return {
        data: refreshedData.data ?? [],
        total_results: refreshedData.total_results ?? 0,
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      return { data: [], total_results: 0 };
    }
  }, [page, rowsPerPage, switchTab]);

  useEffect(() => {
    const fetchTableData = async () => {
      setLoading(true);
      const res = await fetchReminders();
      setData(res.data);
      setTotalCount(res.total_results);
      setLoading(false);
    };
    fetchTableData();
  }, [fetchReminders]);

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage + 1);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    switchTab: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: ReminderRow[] = XLSX.utils.sheet_to_json<ReminderRow>(
        sheet,
        {
          raw: true,
        }
      );

      const validRecords: ValidRecord[] = [];

      jsonData.forEach((item, index) => {
        const title = item.title?.toString().trim() || "";
        const rawDate = item.date;
        let formattedDate = "";

        if (typeof rawDate === "number") {
          const parsed = XLSX.SSF.parse_date_code(rawDate);
          if (parsed) {
            formattedDate = `${parsed.y}-${String(parsed.m).padStart(
              2,
              "0"
            )}-${String(parsed.d).padStart(2, "0")}`;
          }
        } else if (typeof rawDate === "string") {
          const parts = rawDate.split(/[-/]/);
          if (parts.length === 3 && parts[0].length <= 2) {
            const [dd, mm, yyyy] = parts;
            formattedDate = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(
              2,
              "0"
            )}`;
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
            formattedDate = rawDate;
          }
        }

        if (!title || !formattedDate) return;

        validRecords.push({
          record_id: `${Date.now()}-${index}`,
          feature_name: feature_name || "calendar",
          added_by: "user",
          record_status: "active",
          created_on_date: new Date().toISOString().split("T")[0],
          feature_data: {
            record_data: [
              {
                record_label: "title",
                record_value: title,
                record_type: "type_text",
              },
              {
                record_label: "date",
                record_value: formattedDate,
                record_type: "type_text",
              },
              {
                record_label: "category",
                record_value: switchTab || "holidays",
                record_type: "type_text",
              },
            ],
          },
        });
      });

      if (validRecords.length > 0) {
        await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-TYPE": "create",
          },
          body: JSON.stringify({ data: validRecords, dataset: "feature_data" }),
        });

        alert(`✅ Uploaded ${validRecords.length} reminders`);
      } else {
        alert("⚠️ No valid records found");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  function downloadSampleExcel() {
    const data = [
      { title: "Sankranti", date: "2025-08-03" },
      { title: "Dasahara", date: "2025-09-15" },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sample");

    // Create and trigger download
    XLSX.writeFile(workbook, "reminder-sample.xlsx");
  }

  return (
    <>
      <div className="d-flex justify-content-between">
        <div>
          <input
            ref={fileInputRef}
            style={{ display: "none" }}
            type="file"
            accept=".xlsx"
            onChange={(e) => handleFileUpload(e, switchTab)}
          />
          <button
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
            style={{ height: "36px", marginRight: "10px" }}
          >
            Bulk Upload
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={downloadSampleExcel}
          >
            <i className="fa-solid fa-file-excel me-2"></i>Sample Excel
          </button>
        </div>

        <div
          className="btn-group gap-1 mb-4"
          role="group"
          aria-label="Tab switcher"
        >
          {config
            .find((item): item is EventsBlock => "Events" in item)
            ?.Events?.categories.map(
              (category: { label: string; value: string }) => {
                const isActive = switchTab === category.value;
                const label = category.label;

                return (
                  <button
                    key={category.value}
                    type="button"
                    className={`btn ${
                      isActive
                        ? "btn-primary text-white"
                        : "btn-light text-black"
                    }`}
                    onClick={() => {
                      setSwitchTab(category.value);
                      setPage(1);
                    }}
                  >
                    {label}
                  </button>
                );
              }
            )}
        </div>
      </div>

      <div className="card-body pt-0">
        <div className="table-responsive">
          <table className="table table-hover text-center">
            <thead className="table-head">
              <tr>
                {displayColumns?.map((field) => (
                  <th key={field.label}>
                    <div className="d-flex align-items-center justify-content-center gap-1">
                      {field.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={displayColumns.length + 1}>
                    <div className="d-flex justify-content-center p-4">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayColumns.length + 1}
                    className="text-center py-5"
                  >
                    <div className="d-flex flex-column align-items-center text-muted">
                      <i
                        className="fa fa-box-open fa-2x mb-3"
                        style={{ opacity: 0.6 }}
                      ></i>
                      <h6 className="fw-semibold mb-1">No records available</h6>
                      <small className="text-secondary">
                        Try adjusting filters or adding new records
                      </small>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={index}>
                    {displayColumns?.map((field) => (
                      <td
                        key={field.label}
                        style={{
                          minWidth: "120px",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                        }}
                      >
                        {getValueByPath(
                          row,
                          field.record_path,
                          field.record_label
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer bg-white d-flex justify-content-between align-items-center border-0  my-2 px-4">
          <div className="d-flex align-items-center">
            <span className="text-muted small me-2">Rows per page:</span>
            <select
              className="form-select form-select-sm w-auto"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(0)}
                >
                  <i className="bi bi-chevron-double-left"></i>
                </button>
              </li>
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(page - 2)}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <li
                    key={pageNum}
                    className={`page-item ${page === pageNum ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pageNum - 1)}
                    >
                      {pageNum}
                    </button>
                  </li>
                );
              })}
              <li
                className={`page-item ${page === totalPages ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(page)}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
              <li
                className={`page-item ${page === totalPages ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(totalPages - 1)}
                >
                  <i className="bi bi-chevron-double-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
