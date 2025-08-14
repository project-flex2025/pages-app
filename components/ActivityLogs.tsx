"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

// Types
interface RecordDataItem {
  record_label: string;
  record_value_text?: string;
  record_value?: string[] | Record<string, unknown>[] | Record<string, unknown>;
  record_type: string;
}

interface LogRecord {
  record_id: string;
  created_on_date: string;
  created_on: string;
  feature_data: {
    record_data: RecordDataItem[];
  };
  more_data?: Record<string, unknown>;
}

type LogCategory = string;

const LOG_CATEGORIES: LogCategory[] = [
  "task",
  "sprints",
  "reminders",
  "tags",
  "form_data",
  "members",
  "departments",
  "login_user_details",
];

const COMMON_LABELS = ["action", "user_id", "user_role", "category"];

const getCommonField = (log: LogRecord, label: string): string => {
  const item = log.feature_data.record_data.find(
    (i) => i.record_label === label
  );
  if (!item) return "-";
  if (item.record_value_text) return item.record_value_text;
  return "-";
};

const formatDate = (iso: string) => {
  if (!iso) return { date: "-", time: "-" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: iso, time: "-" };
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return { date, time };
};

// Fetch logs from API
const fetchLogs = async (
  userId: string,
  page: number,
  limit: number,
  category: string
): Promise<{ logs: LogRecord[]; total: number }> => {
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-TYPE": "search",
    },
    body: JSON.stringify({
      conditions: [
        { field: "feature_name", value: "activity_logs", search_type: "exact" },
        {
          field: "feature_data.record_data.record_value_text",
          value: userId,
          search_type: "exact",
        },
        {
          field: "feature_data.record_data.record_value_text",
          value: category,
          search_type: "exact",
        },
      ],
      combination_type: "and",
      dataset: "feature_data",
      page,
      limit,
    }),
  });

  const data = await response.json();
  return { logs: data.data ?? [], total: data.total_results ?? 0 };
};

const LogViewer: React.FC = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const userId = user?.record_id || "";

  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [activeCategory, setActiveCategory] = useState<LogCategory>(
    LOG_CATEGORIES[0]
  );
  const [modalLog, setModalLog] = useState<LogRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!userId || !activeCategory) return;
    setLoading(true);
    fetchLogs(userId, page, rowsPerPage, activeCategory).then(
      ({ logs, total }) => {
        setLogs(logs);
        setTotalCount(total);
        setLoading(false);
      }
    );
  }, [userId, page, rowsPerPage, activeCategory]);

  const handlePageChange = (newPage: number) => setPage(newPage);
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(1);
  };

  const formatLabel = (label: string): string => {
    return label
      .replace(/_/g, " ") // Replace underscores with spaces
      .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize each word
  };

  const totalPages = Math.ceil(totalCount / rowsPerPage);

  return (
    <div className="card custom-card rounded-card p-3">
      <h4 className="mb-3">User Activity Logs</h4>

      <div className="mb-3 d-flex gap-2 flex-wrap">
        {LOG_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`btn btn-sm ${
              activeCategory === cat ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => {
              setActiveCategory(cat);
              setPage(1);
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
            {activeCategory === cat ? ` (${totalCount})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  {COMMON_LABELS.map((label) => (
                    <th key={label}>
                      {label
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </th>
                  ))}
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={COMMON_LABELS.length + 3}
                      className="text-center"
                    >
                      No logs found for this category.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const { date, time } = formatDate(log.created_on);
                    return (
                      <tr key={log.record_id}>
                        <td>{date}</td>
                        <td>{time}</td>
                        {COMMON_LABELS.map((label) => (
                          <td key={label}>{getCommonField(log, label)}</td>
                        ))}
                        <td>
                          <button
                            className="btn btn-link btn-sm"
                            onClick={() => setModalLog(log)}
                            title="View Details"
                          >
                            <i className="fa fa-eye" aria-hidden="true"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="card-footer bg-white d-flex justify-content-between align-items-center mt-3 border-0 pt-0">
            <div className="d-flex align-items-center navigation-pages">
              <span className="me-2">Rows per page:</span>
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
            <div className="navigation-pages">
              Showing {Math.min((page - 1) * rowsPerPage + 1, totalCount)} to{" "}
              {Math.min(page * rowsPerPage, totalCount)} of {totalCount}
            </div>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(1)}
                  >
                    <i className="fa fa-angle-double-left"></i>
                  </button>
                </li>
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(page - 1)}
                  >
                    <i className="fa fa-angle-left"></i>
                  </button>
                </li>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2)
                      pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                  }
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  return (
                    <li
                      key={pageNum}
                      className={`page-item ${
                        page === pageNum ? "active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    </li>
                  );
                })}
                <li
                  className={`page-item ${
                    page === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(page + 1)}
                  >
                    <i className="fa fa-angle-right"></i>
                  </button>
                </li>
                <li
                  className={`page-item ${
                    page === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(totalPages)}
                  >
                    <i className="fa fa-angle-double-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}

      {/* Modal */}
      {modalLog && (
        <div
          className={`modal fade show d-block`}
          tabIndex={-1}
          role="dialog"
          style={{ background: "rgba(0,0,0,0.5)" }}
          aria-modal="true"
        >
          <div
            className="modal-dialog modal-md modal-dialog-centered"
            role="document"
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-primary">
                  Activity Log Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setModalLog(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="card bg-light">
                  <div className="card-body">
                    <ul className="list-group list-group-flush">
                      {(() => {
                        const { date, time } = formatDate(modalLog.created_on);
                        return (
                          <>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                              <span className="fw-bold">Date:</span>
                              <span>{date}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                              <span className="fw-bold">Time:</span>
                              <span>{time}</span>
                            </li>
                          </>
                        );
                      })()}
                      {COMMON_LABELS.map((label) => (
                        <li
                          className="list-group-item d-flex justify-content-between align-items-center"
                          key={label}
                        >
                          <span className="fw-bold">
                            {label
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                            :
                          </span>
                          <span>{getCommonField(modalLog, label)}</span>
                        </li>
                      ))}
                      {modalLog.feature_data.record_data
                        .filter(
                          (item) => !COMMON_LABELS.includes(item.record_label)
                        )
                        .map((item, idx) => (
                          <li
                            className="list-group-item d-flex justify-content-between align-items-center"
                            key={idx}
                          >
                            <span className="fw-bold">
                              {formatLabel(item.record_label)} :
                            </span>
                            <span>
                              {item.record_value_text ||
                                (Array.isArray(item.record_value)
                                  ? item.record_value.join(", ")
                                  : JSON.stringify(item.record_value))}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setModalLog(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogViewer;
