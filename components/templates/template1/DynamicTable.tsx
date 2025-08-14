import React from "react";
import { TemplateTableProps } from "../index";
import { getValueByPath } from "@/utils/table";
import ExportXLSX from "../../DownloadCSV";
import { TableWidgetData } from "@/types/table";

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

const CardStyleTable: React.FC<TemplateTableProps> = ({
  widgetData,
  data,
  visibleColumns,
  totalCount,
  page,
  rowsPerPage,
  totalPages,
  // startItem,
  // endItem,
  search,
  onSearchChange,
  onPageChange,
  onRowsPerPageChange,
  onViewMore,
  loading,
  onSort,
  sortConfig,
  selectedFilter,
  onFilterChange,
  selectedField,
  onFilterValueChange,
  userId,
}) => {

  const generateFilterSelect = () => {
    const filterOptions: { label: string; value: string }[] = [];
    widgetData?.config?.columns?.forEach((column) => {
      if (column?.display_settings?.filterable === "true") {
        filterOptions.push({
          label: column.label,
          value: column.label,
        });
      }
    });

    return (
      <select
        className="form-select "
        id="filterSelect"
        value={selectedFilter}
        onChange={onFilterChange}
      >
        <option value="">Filter</option>
        {filterOptions.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };

  const generateFilterValueSelect = () => {
    if (
      !selectedField ||
      !selectedField.options ||
      selectedField.options.length === 0
    ) {
      return <></>;
    }

    return (
      <div className="flex-grow-1 " style={{ minWidth: "120px" }}>
        <select
          id="filterValueSelect"
          className="form-select"
          style={{ minWidth: "10px", maxWidth: "150px" }}
          onChange={onFilterValueChange}
        >
          <option value="">All</option>
          {selectedField.options.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // const isSearchOnly =
  //   widgetData?.config?.table_settings?.search?.default &&
  //   widgetData?.config?.table_settings?.filters?.default !== "true" &&
  //   widgetData?.config?.tags?.default !== "true";

  const hasFilters =
    widgetData?.config?.table_settings?.filters?.default === "true";
  const hasTags = widgetData?.config?.tags?.default === "true";
  const hasSearch =
    widgetData?.config?.table_settings?.search?.default === "true";

  const isSearchOnly = hasSearch && !hasFilters && !hasTags;

  const hasActions =
    widgetData?.config?.table_settings?.actions?.view?.default === "true" ||
    widgetData?.config?.table_settings?.actions?.delete?.default === "true" ||
    widgetData?.config?.table_settings?.actions?.edit?.default === "true";

console.log("widget data table", widgetData);

  function hexToRgba(hex: string, alpha: number) {
    const match = hex.replace("#", "").match(/.{1,2}/g);
    if (!match) return hex;
    const [r, g, b] = match.map((x) => parseInt(x, 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return (
    <div className="card custom-card rounded-card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">{widgetData.config.title}</h5>
          {isSearchOnly && (
            // <div
            //   className="input-group input-group-sm"
            //   style={{ width: "200px" }}
            // >
            //   <span className="input-group-text bg-light border-end-0">
            //     <i className="bi bi-search"></i>
            //   </span>
            //   <input
            //     type="text"
            //     className="form-control border-start-0"
            //     placeholder="Search..."
            //     value={search}
            //     onChange={onSearchChange}
            //   />
            // </div>
            <div
              className="flex-grow-1 position-relative"
              style={{ minWidth: "220px", maxWidth: "220px" }}
            >
              <i
                className="bi bi-search position-absolute"
                style={{
                  top: "50%",
                  left: "10px",
                  transform: "translateY(-50%)",
                  color: "#aaa",
                  zIndex: 2,
                }}
              ></i>
              <input
                type="text"
                className="form-control form-search form-control-sm "
                placeholder="Search..."
                value={search}
                onChange={onSearchChange}
              />
            </div>
          )}
        </div>
        {/* {!isSearchOnly && (
          <div
            className="d-flex flex-column flex-md-row flex-wrap gap-3 mb-3 align-items-stretch"
            style={{ justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", gap: "10px" }}>
              {widgetData?.config?.table_settings?.search?.default && (
                <div className="">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search..."
                      value={search}
                      onChange={onSearchChange}
                    />
                  </div>
                </div>
              )}
              {widgetData?.config?.table_settings?.filters?.default ===
                "true" && (
                <div className="d-flex gap-3 flex-wrap">
                  <div className="flex-grow-1 ">{generateFilterSelect()}</div>
                  {selectedFilter && generateFilterValueSelect()}
                </div>
              )}
            </div>
            {(widgetData?.config?.table_settings?.export?.csv?.default ===
              "true" ||
              widgetData?.config?.table_settings?.export?.excel?.default ===
                "true" ||
              widgetData?.config?.table_settings?.export?.pdf?.default ===
                "true") && (
              <ExportXLSX
                tableData={data || []}
                tableConfig={widgetData?.config?.columns as TableWidgetField[]}
                total_records={totalCount}
                data_source={widgetData?.config?.data_source || ""}
                userId={userId || ""}
                widgetData={widgetData as TableWidgetData}
                file_name={widgetData?.config?.title}
              />
            )}
          </div>
        )} */}
        {!isSearchOnly && (
          <div
            className="d-flex flex-column flex-md-row flex-wrap gap-3 mt-3 align-items-stretch"
            style={{ justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", gap: "10px" }}>
              {hasSearch && (
                <div className="">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search..."
                      value={search}
                      onChange={onSearchChange}
                    />
                  </div>
                </div>
              )}
              {hasFilters && (
                <div className="d-flex gap-3 flex-wrap">
                  <div className="flex-grow-1 ">{generateFilterSelect()}</div>
                  {selectedFilter && generateFilterValueSelect()}
                </div>
              )}
            </div>

            {(widgetData?.config?.table_settings?.export?.csv?.default ===
              "true" ||
              widgetData?.config?.table_settings?.export?.excel?.default ===
                "true" ||
              widgetData?.config?.table_settings?.export?.pdf?.default ===
                "true") && (
              <ExportXLSX
                tableData={data || []}
                tableConfig={widgetData?.config?.columns as TableWidgetField[]}
                total_records={totalCount}
                data_source={widgetData?.config?.data_source || ""}
                userId={userId || ""}
                widgetData={widgetData as TableWidgetData}
                file_name={widgetData?.config?.title}
              />
            )}
          </div>
        )}
      </div>
      <div className="card-body pt-0">
        <div className="table-responsive">
          <table className="table table-hover temp1-table text-center mb-0">
            <thead className="table-head">
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    key={column.record_label}
                    onClick={() => onSort(column.label)}
                    className="small"
                  >
                    {column.label}
                    <i
                      className={`fa-solid fs-12 ms-1 ${
                        sortConfig?.key === column.label
                          ? sortConfig.direction === "asc"
                            ? "fa-angle-up"
                            : "fa-angle-down"
                          : "fa-angle-down"
                      }`}
                    />
                  </th>
                ))}
                {hasActions && <th className="small">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={
                      visibleColumns.length +
                      (widgetData?.config?.table_settings?.actions?.view
                        ?.default
                        ? 1
                        : 0)
                    }
                  >
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
                    colSpan={
                      visibleColumns.length +
                      (widgetData?.config?.table_settings?.actions?.view
                        ?.default
                        ? 1
                        : 0)
                    }
                    className="text-center py-5"
                  >
                    <div className="d-flex flex-column align-items-center text-muted">
                      <i
                        className="fa fa-box-open fa-2x mb-3"
                        style={{ opacity: 0.6 }}
                      ></i>
                      <h6 className="fw-semibold mb-1">No records available</h6>
                      <small className="text-secondary">
                        Try adjusting your search or filters
                      </small>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.map((row, index) => (
                  <tr key={index}>
                    {visibleColumns.map((column) => {
                      const value = getValueByPath(
                        row,
                        column.record_path,
                        column.record_label
                      );

                      const matchedOption = column.options?.find(
                        (opt) => opt.value === value
                      );
                      const color = matchedOption?.color;
                      const displayValue = matchedOption?.label || value;

                      if (color) {
                        return (
                          <td key={`${index}-${column.record_label}`}>
                            <span
                              className="badge template4-badge"
                              style={{
                                backgroundColor: hexToRgba(color, 0.1),
                                color: color,
                              }}
                            >
                              {displayValue}
                            </span>
                          </td>
                        );
                      } else {
                        return (
                          <td key={`${index}-${column.record_label}`}>
                            {(column.options?.length ?? 0) > 0 ? (
                              <div className="text-truncate">
                                {column.options?.find(
                                  (opt) =>
                                    opt.value ===
                                    getValueByPath(
                                      row,
                                      column.record_path,
                                      column.record_label
                                    )
                                )?.label || "N/A"}
                              </div>
                            ) : (
                              <div className="text-truncate">
                                {getValueByPath(
                                  row,
                                  column.record_path,
                                  column.record_label
                                )}
                              </div>
                            )}
                          </td>
                        );
                      }
                    })}

                    {hasActions &&
                      widgetData?.config?.table_settings?.actions?.view
                        ?.default === "true" && (
                        <td>
                          <button
                            className="btn"
                            onClick={() =>
                              onViewMore(String(row?.record_id || ""))
                            }
                          >
                            <i className="fa-solid fa-eye text-primary"></i>
                          </button>
                        </td>
                      )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* <div className="card-footer bg-white d-flex justify-content-between align-items-center mt-3 border-0 pt-0">
          <div className="d-flex align-items-center">
            <span className="text-muted small me-2">Rows per page:</span>
            <select
              className="form-select form-select-sm w-auto"
              value={rowsPerPage}
              onChange={onRowsPerPageChange}
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="text-muted small">
            Showing {startItem} to {endItem} of {totalCount}
          </div>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => onPageChange(0)}>
                  <i className="bi bi-chevron-double-left"></i>
                </button>
              </li>
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => onPageChange(page - 2)}
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
                      onClick={() => onPageChange(pageNum - 1)}
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
                  onClick={() => onPageChange(page)}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
              <li
                className={`page-item ${page === totalPages ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => onPageChange(totalPages - 1)}
                >
                  <i className="bi bi-chevron-double-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div> */}

        <div className="card-footer bg-white d-flex justify-content-between align-items-center mt-3 border-0 pt-0">
          <div className="d-flex align-items-center navigation-pages">
            <span className=" me-2">Rows per page:</span>
            <select
              className="form-select form-select-sm w-auto"
              value={rowsPerPage}
              onChange={onRowsPerPageChange}
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="navigation-pages">
            Page {page} of {totalPages}
          </div>

          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => onPageChange(page - 2)}
                >
                  <i className="fa fa-chevron-left"></i>
                </button>
              </li>

              {/* Always show first page */}
              <li className={`page-item ${page === 1 ? "active" : ""}`}>
                <button className="page-link" onClick={() => onPageChange(0)}>
                  1
                </button>
              </li>

              {/* Show left ellipsis */}
              {page > 3 && (
                <li className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )}

              {/* Show middle page numbers */}
              {Array.from({ length: 3 }, (_, i) => {
                const pageNum = page - 1 + i;
                if (pageNum > 1 && pageNum < totalPages) {
                  return (
                    <li
                      key={pageNum}
                      className={`page-item ${
                        page === pageNum ? "active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => onPageChange(pageNum - 1)}
                      >
                        {pageNum}
                      </button>
                    </li>
                  );
                }
                return null;
              })}

              {/* Show right ellipsis */}
              {page < totalPages - 2 && (
                <li className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )}

              {/* Always show last page if not already shown */}
              {totalPages > 1 && (
                <li
                  className={`page-item ${page === totalPages ? "active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => onPageChange(totalPages - 1)}
                  >
                    {totalPages}
                  </button>
                </li>
              )}

              <li
                className={`page-item ${page === totalPages ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => onPageChange(page)}
                >
                  <i className="fa fa-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default CardStyleTable;
