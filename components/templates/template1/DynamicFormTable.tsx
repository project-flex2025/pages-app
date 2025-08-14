import React from "react";
import { getValueByPath } from "@/utils/table";
import ExportXLSX from "../../DownloadCSV";
import { TemplateFormTableProps } from "..";
import { RowConfig } from "@/types/table";

export type DisplaySettings = {
  table_view: string;
  detailed_view: string;
  sortable: string;
  filterable: string;
  searchable: string;
};

export type Field = {
  label: string;
  type: string;
  record_label: string;
  placeholder: string;
  note: string;
  default_value: string;
  record_path: string;
  validations: Record<string, string>;
  display_settings: DisplaySettings;
};

// export type FormSection = {
//   fields: Field[];
// };

export function flattenFormFields(sections: RowConfig[]) {
  const flattenedFields: Field[] = [];

  sections.forEach((section) => {
    section.fields.forEach((field) => {
      // Map validations to ensure all values are strings
      const stringValidations: Record<string, string> = {};
      if (field.validations) {
        Object.entries(field.validations).forEach(([key, value]) => {
          stringValidations[key] = value !== undefined ? String(value) : "";
        });
        flattenedFields.push({
          ...field,
          validations: stringValidations,
          display_settings: {
            ...field.display_settings,
            searchable: field.display_settings?.searchable ?? "false", // Ensure searchable is present
          },
        });
      }
    });
  });

  return flattenedFields;
}

const CardStyleTable: React.FC<TemplateFormTableProps> = ({
  widgetData,
  data,
  displayColumns,
  totalCount,
  page,
  rowsPerPage,
  totalPages,
  startItem,
  endItem,
  search,
  selectedFilter,
  selectedFilterValue,
  selectedField,
  loading,
  sortConfig,
  onSearchChange,
  onPageChange,
  onRowsPerPageChange,
  onEditClick,
  onViewClick,
  onNewUser,
  onFilterChange,
  onFilterTags,
  onFilterValueChange,
  onSort,
  tags,
  userId,
}) => {
  const { config } = widgetData;
  const DepartmentDropdown = () => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
      onFilterTags(e);
    };

    return (
      <select
        id="departmentDropdown"
        className="form-select custom-input ml-8"
        onChange={handleChange}
      >
        <option value="">Tags</option>
        {tags.map((tag) => (
          <option key={tag.value} value={tag.value}>
            {tag.label}
          </option>
        ))}
      </select>
    );
  };

  const generateFilterSelect = () => {
    const filterOptions: { label: string; value: string }[] = [];

    config?.rows?.forEach((row) => {
      row.fields?.forEach((field) => {
        if (field?.display_settings?.filterable === "true") {
          filterOptions.push({
            label: field.label,
            value: field.label,
          });
        }
      });
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
          value={selectedFilterValue}
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

  const getTagsUI = (apitags: string[]) => {
    const selectedTagObjects = tags.filter((tag) =>
      apitags.includes(tag.value)
    );

    return (
      <div className="d-flex flex-wrap gap-1 justify-content-center">
        {selectedTagObjects?.map(
          (
            tag: { value: string; label: string; color: string },
            index: number
          ) => {
            return (
              <span
                key={index}
                className={`badge rounded-pill me-1`}
                style={{
                  backgroundColor: tag.color,
                  color: "white",
                  cursor: "pointer",
                  fontSize: "0.6rem",
                }}
              >
                {tag.label}
              </span>
            );
          }
        )}
      </div>
    );
  };

  console.log("table config 23233", widgetData);

  const flattenedFields = flattenFormFields(config?.rows);

  return (
    <div className="card custom-card rounded-card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">{config?.title ?? "Table"}</h5>
        </div>

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div className="d-flex flex-column flex-md-row flex-wrap gap-3 mb-3 align-items-stretch">
            {/* {config?.table_settings?.search?.default == "true" && (
              <div
                className="flex-grow-1"
                style={{ minWidth: "220px", maxWidth: "320px" }}
              >
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
            )} */}

            {config?.table_settings?.search?.default === "true" && (
              <div
                className="flex-grow-1 position-relative"
                style={{ minWidth: "220px", maxWidth: "320px" }}
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

            {config?.table_settings?.filters?.default === "true" && (
              <div className="d-flex gap-3 flex-wrap">
                <div className="flex-grow-1 ">{generateFilterSelect()}</div>
                {selectedFilter && generateFilterValueSelect()}
              </div>
            )}

            {/* Tags / Department Dropdown */}
            {widgetData?.config?.tags?.default === "true" && (
              <div className="flex-grow-1" style={{ minWidth: "120px" }}>
                {DepartmentDropdown()}
              </div>
            )}
          </div>
          <div className="d-flex align-items-center gap-2 ms-md-auto">
            {(config?.table_settings?.export?.csv?.default === "true" ||
              config?.table_settings?.export?.excel?.default === "true" ||
              config?.table_settings?.export?.pdf?.default === "true") && (
              <ExportXLSX
                tableData={data || []}
                tableConfig={flattenedFields}
                total_records={totalCount}
                data_source={config?.data_source || ""}
                userId={userId || ""}
                widgetData={widgetData}
                file_name={config?.title}
              />
            )}

            {config?.table_settings?.actions?.add?.default && (
              <button
                className="btn btn-primary"
                onClick={onNewUser}
                style={{ whiteSpace: "nowrap" }}
              >
                {config?.table_settings?.actions?.add?.name || "Add New"}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="card-body pt-0">
        <div className="table-responsive">
          <table className="table table-hover text-center">
            <thead className="table-head">
              <tr>
                {/* {displayColumns?.map((field) => (
                  <th
                    key={field.label}
                    onClick={() => onSort(field.label)}
                    style={{
                      cursor: "pointer",
                      minWidth: "120px", // adjust as needed
                      whiteSpace: "normal", // allow wrapping
                      wordBreak: "break-word",
                    }}
                  >
                    {field.label}
                    {sortConfig?.key === field.label && (
                      <span className="ms-1" style={{ fontSize: "1.3rem" }}>
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                ))} */}

                {displayColumns?.map((field) => (
                  <th key={field.label} onClick={() => onSort(field.label)}>
                    <div className="d-flex align-items-center justify-content-center gap-1">
                      {field.label}
                      <i
                        className={`fa-solid fs-12 ${
                          sortConfig?.key === field.label
                            ? sortConfig.direction === "asc"
                              ? "fa-angle-up "
                              : "fa-angle-down "
                            : "fa-angle-down "
                        }`}
                      />
                    </div>
                  </th>
                ))}
                {widgetData?.config?.tags?.default === "true" && <th>Tags</th>}
                <th>Actions</th>
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
                          // minWidth: "120px",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                        }}
                      >
                        {field.type === "select" ? (
                          <div className="text-wrap text-break">
                            {field.options?.find(
                              (opt) =>
                                opt.value ===
                                getValueByPath(
                                  row,
                                  field.record_path,
                                  field.record_label
                                )
                            )?.label || "N/A"}
                          </div>
                        ) : field.type === "rich_text" ? (
                          convertQuillToPlainText(
                            String(
                              getValueByPath(
                                row,
                                field.record_path,
                                field.record_label
                              )
                            )
                          )
                        ) : (
                          getValueByPath(
                            row,
                            field.record_path,
                            field.record_label
                          )
                        )}
                      </td>
                    ))}
                    {widgetData?.config?.tags?.default === "true" && (
                      <td
                        style={{
                          minWidth: "100px",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                        }}
                      >
                        <div className="d-flex flex-wrap justify-content-center gap-1">
                          {getTagsUI((row?.more_data?.tags as string[]) ?? [])}
                        </div>
                      </td>
                    )}

                    <td>
                      <div className="d-flex justify-content-center">
                        {config?.table_settings?.actions?.edit?.default && (
                          <button
                            className="btn text-primary"
                            onClick={() => onEditClick(row)}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                        )}
                        {config?.table_settings?.actions?.view?.default && (
                          <button
                            className="btn text-secondary"
                            onClick={() => onViewClick(row)}
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer bg-white d-flex justify-content-between align-items-center border-0 mt-3 pt-0">
          <div className="d-flex align-items-center">
            <span className="text-muted small me-2">Rows per page:</span>
            <select
              className="form-select form-select-sm w-auto"
              value={rowsPerPage}
              onChange={onRowsPerPageChange}
            >
              {config?.table_settings?.pagination?.page_size_options
                ?.split(",")
                .map((size) => (
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
        </div>
      </div>
    </div>
  );
};

export default CardStyleTable;

export function convertQuillToPlainText(html: string): string {
  if (!html) return "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || "";
}
