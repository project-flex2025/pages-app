import React from "react";
import { TemplateTableProps } from "../index";
import { getValueByPath } from "@/utils/table";

const CardStyleTable: React.FC<TemplateTableProps> = ({
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
  loading,
}) => {
  return (
    <div className="card custom-card rounded-card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">{widgetData.config.title}</h5>
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
        </div>
      </div>
      {/* <hr className="mb-2"/> */}
      <div className="card-body pt-0">
        <div className="table-responsive">
          <table className="table table-hover text-center mb-0">
            <thead className="table-head">
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    key={column.record_label}
                    className="small"
                  >
                    {column.label}
                  </th>
                ))}
                {widgetData?.config?.table_settings?.actions?.view?.default && (
                  <th className="small">Actions</th>
                )}
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
                data.map((row, index) => (
                  <tr key={index}>
                    {visibleColumns.map((column) => (
                      <td key={`${index}-${column.record_label}`}>
                        <div className="text-truncate">
                          {getValueByPath(
                            row,
                            column.record_path,
                            column.record_label
                          )}
                        </div>
                      </td>
                    ))}
                    {widgetData?.config?.table_settings?.actions?.view
                      ?.default && (
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

        <div className="card-footer bg-white d-flex justify-content-between align-items-center mt-3 border-0 pt-0">
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
        </div>
      </div>
    </div>
  );
};

export default CardStyleTable;
