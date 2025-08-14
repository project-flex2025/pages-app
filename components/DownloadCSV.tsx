"use client";
import { RowData, TableWidgetData } from "@/types/table";
import { getValueByPath } from "@/utils/table";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

// Update your interface definitions

interface TableWidgetField {
  label: string;
  type: string;
  record_label: string;
  placeholder?: string;
  note?: string;
  default_value?: string;
  record_path: string;
  validations?: Record<string, string>;
  display_settings: {
    table_view: string;
    detailed_view?: string;
    sortable?: string;
    filterable?: string;
  };
}

// Update the component props interface
interface ExportXLSXProps {
  tableData: RowData[];
  tableConfig: TableWidgetField[];
  total_records: number | string;
  data_source: string;
  userId: string;
  widgetData?: TableWidgetData;
  file_name?: string;
}

const ExportXLSX: React.FC<ExportXLSXProps> = ({
  widgetData,
  tableData,
  tableConfig,
  total_records,
  data_source,
  userId,
  file_name,
}) => {
  const [downloadFormat, setDownloadFormat] = useState("xlsx");
  // const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const limit = 50;

  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       dropdownRef.current &&
  //       !dropdownRef.current.contains(event.target as Node)
  //     ) {
  //       setShowDropdown(false);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const exportToExcel = () => {
    const displayColumns = tableConfig.filter(
      (field) => field.display_settings.table_view === "true"
    );

    const headers = displayColumns.map((field) => field.label);

    const formattedData = tableData.map((row) => {
      return displayColumns.map((field: TableWidgetField) => {
        return getValueByPath(row, field.record_path, field.record_label) || "";
      });
    });
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...formattedData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${file_name}.xlsx`);
    XLSX.writeFile(workbook, `${file_name}.xlsx`);
  };

  const exportToCSV = () => {
    const displayColumns = tableConfig.filter(
      (field) => field.display_settings.table_view === "true"
    );

    const headers = displayColumns
      .map((field) => `"${field.label.replace(/"/g, '""')}"`)
      .join(",");

    const csvRows = tableData.map((row) => {
      return displayColumns.map((field: TableWidgetField) => {
        return getValueByPath(row, field.record_path, field.record_label) || "";
      });
    });

    const csvContent = [headers, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${file_name}.csv`);
  };

  const exportToPDF = () => {
    const displayColumns = tableConfig.filter(
      (field) => field.display_settings.table_view === "true"
    );

    const headers = displayColumns.map((field) => field.label);

    const data = tableData.map((row) => {
      return displayColumns.map((field: TableWidgetField) => {
        return getValueByPath(row, field.record_path, field.record_label) || "";
      });
    });

    const doc = new jsPDF();
    autoTable(doc, {
      head: [headers],
      body: data,
    });
    doc.save(`${file_name}.pdf`);
  };

  // 1. Convert widgetData to JSON string
  const widgetDataString = JSON.stringify(widgetData);

  // 2. Convert to Base64
  const widgetDataBase64 =
    typeof window !== "undefined"
      ? window.btoa(unescape(encodeURIComponent(widgetDataString))) // Browser
      : Buffer.from(widgetDataString).toString("base64"); // Node.js

  async function fetchAllData(downloadFormat: string) {
    const formData = new FormData();

    const postJson = {
      conditions: [
        {
          field: "feature_name",
          value: data_source,
          search_type: "exact",
        },
      ],
      combination_type: "and",
      page: 1,
      limit: total_records,
      dataset: "feature_data",
    };

    formData.append("user_id", userId);
    formData.append("post_json", JSON.stringify(postJson));
    formData.append("config", widgetDataBase64);
    formData.append("download_type", downloadFormat);
    formData.append("file_name", file_name || "tabledata");
    try {
      toast.success("Download will begin shortly, please wait.");
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "X-API-TYPE": "aws_s3",
        },
        body: formData,
      });

      const data = await response.json();
      const { download_url } = data;

      if (download_url) {
        window.location.href = download_url; // Automatically start download
      } else {
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  const handleDownload = async (format: string) => {
    if (format === "current") {
      switch (downloadFormat) {
        case "xlsx":
          exportToExcel();
          break;
        case "csv":
          exportToCSV();
          break;
        case "pdf":
          exportToPDF();
          break;
        default:
          exportToExcel();
      }
    } else if (format === "all") {
      try {
        if (Number(total_records) > limit) {
          fetchAllData(downloadFormat);
          return;
        } else {
          // toast.success("Download will begin shortly, please wait.");
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
                  value: data_source,
                  search_type: "exact",
                },
              ],
              combination_type: "and",
              page: 1,
              limit: limit,
              dataset: "feature_data",
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to fetch all records");
          }

          const result = await response.json();
          const allData = result.data || [];

          if (downloadFormat === "xlsx") await exportToExcelForAll(allData);
          else if (downloadFormat === "csv") await exportToCSVForAll(allData);
          else if (downloadFormat === "pdf") await exportToPDFForAll(allData);
        }
      } catch (error) {
        console.error("Error downloading all records:", error);
        alert("Failed to download all records. Please try again.");
      }
    }
    setShowDropdown(false);
  };

  const exportToPDFForAll = (data: RowData[]) => {
    const displayColumns = tableConfig.filter(
      (field) => field.display_settings.table_view === "true"
    );

    const headers = displayColumns.map((field) => field.label);

    const formattedData = data.map((row) => {
      return displayColumns.map((field: TableWidgetField) => {
        return getValueByPath(row, field.record_path, field.record_label) || "";
      });
    });

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("All Employee Data", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [headers],
      body: formattedData,
      styles: { fontSize: 8 },
    });

    doc.save(`${file_name}.pdf` || "tabledata.pdf");
  };

  const exportToCSVForAll = (data: RowData[]) => {
    const displayColumns = tableConfig.filter(
      (field) => field.display_settings.table_view === "true"
    );

    const headers = displayColumns.map((field) => field.label);

    const formattedData = data.map((row) => {
      return displayColumns.map((field: TableWidgetField) => {
        return getValueByPath(row, field.record_path, field.record_label) || "";
      });
    });

    // Convert to CSV string
    const csvContent = [headers, ...formattedData]
      .map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",")
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          )
          .join(",")
      )
      .join("\n");

    // Trigger file download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${file_name}.csv` || "tabledata.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcelForAll = (data: RowData[]) => {
    const displayColumns = tableConfig.filter(
      (field) => field.display_settings.table_view === "true"
    );

    const headers = displayColumns.map((field) => field.label);

    const formattedData = data.map((row) => {
      return displayColumns.map((field: TableWidgetField) => {
        return getValueByPath(row, field.record_path, field.record_label) || "";
      });
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...formattedData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All Employee Data");
    XLSX.writeFile(workbook, `${file_name}.xlsx` || "tabledata.xlsx");
  };

  const handleFormatClick = (format: string) => {
    setDownloadFormat(format);
    setShowDropdown(true);
  };

  return (
    <div className="download-section position-relative">
      <div>
        Download
        <div
          className="d-flex align-items-center justify-content-around"
          // style={{ border: "1px solid red" }}
        >
          {widgetData?.config?.table_settings?.export?.excel?.default ===
            "true" && (
            <i
              className={
                widgetData?.config?.table_settings?.export?.excel?.icon
              }
              onClick={() => handleFormatClick("xlsx")}
              style={{ cursor: "pointer" }}
            />
          )}

          {widgetData?.config?.table_settings?.export?.csv?.default ===
            "true" && (
            <i
              className={widgetData?.config?.table_settings?.export?.csv?.icon}
              onClick={() => handleFormatClick("csv")}
              style={{ cursor: "pointer" }}
            />
          )}

          {widgetData?.config?.table_settings?.export?.pdf?.default ===
            "true" && (
            <i
              className={widgetData?.config?.table_settings?.export?.pdf?.icon}
              onClick={() => handleFormatClick("pdf")}
              style={{ cursor: "pointer" }}
            />
          )}
        </div>
      </div>

      {/* {showDropdown && (
        <div
          className="dropdown-menu show"
          style={{
            display: "block",
            position: "absolute",
            top: "100%",
            left: 0,
          }}
        >
          <button
            className="dropdown-item"
            onClick={() => handleDownload("current")}
          >
            Current Page
          </button>
          <button
            className="dropdown-item"
            onClick={() => handleDownload("all")}
          >
            All Pages
          </button>
        </div>
      )} */}

      {showDropdown && (
        <div
          ref={dropdownRef} // ✅ Attach the ref here
          className="dropdown-menu show"
          style={{
            display: "block",
            position: "absolute",
            top: "100%",
            left: 0,
          }}
        >
          <button
            className="dropdown-item"
            onClick={() => handleDownload("current")}
          >
            Current Page
          </button>
          <button
            className="dropdown-item"
            onClick={() => handleDownload("all")}
          >
            All Pages
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportXLSX;
