import React from "react";
import { TemplateTableProps } from "../index";
import { getValueByPath } from "@/utils/table";

const ColorfulTable: React.FC<TemplateTableProps> = ({
  widgetData,
  data,
  visibleColumns,
  totalCount,
  page,
  rowsPerPage,
  totalPages,
  startItem,
  endItem,
  search,
  onSearchChange,
  onPageChange,
  onRowsPerPageChange,
  onViewMore,
}) => {
  return (
    <div className="card custom-card p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="m-0 text-primary">{widgetData.config.title}</h5>
        {widgetData?.config?.table_settings?.search?.default && (
          <div className="position-relative">
            <input
              type="text"
              className="form-control form-control-lg ps-4 border-primary"
              placeholder="Search..."
              value={search}
              onChange={onSearchChange}
              style={{ width: "300px" }}
            />
            <i className="bi bi-search position-absolute start-0 top-50 translate-middle-y ms-2 text-primary"></i>
          </div>
        )}
      </div>

      <div className="table-responsive">
        <table className="table text-nowrap text-center">
          <thead className="table-head">
            <tr className="">
              {visibleColumns.map((column) => (
                <th key={column.record_label} className="border-0">
                  {column.label}
                </th>
              ))}
              {widgetData?.config?.table_settings?.actions?.view?.default && (
                <th className="border-0">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-light" : ""}>
                {visibleColumns.map((column) => (
                  <td key={`${index}-${column.record_label}`}>
                    {getValueByPath(
                      row,
                      column.record_path,
                      column.record_label
                    )}
                  </td>
                ))}
                {widgetData?.config?.table_settings?.actions?.view?.default && (
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onViewMore(String(row?.record_id || ""))}
                    >
                      <i className="fa-solid fa-eye"></i>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-4">
        <div className="text-muted">
          Showing {startItem} to {endItem} of {totalCount} entries
        </div>
        <div className="d-flex align-items-center gap-3">
          <select
            className="form-select form-select-sm border-primary"
            style={{ width: "80px" }}
            value={rowsPerPage}
            onChange={onRowsPerPageChange}
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => onPageChange(0)}>
                  First
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
                    className={`page-item ${
                      page === pageNum ? "active bg-primary" : ""
                    }`}
                  >
                    <button
                      className={`page-link ${
                        page === pageNum ? "text-white" : "text-primary"
                      }`}
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
                  onClick={() => onPageChange(totalPages - 1)}
                >
                  Last
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default ColorfulTable;
