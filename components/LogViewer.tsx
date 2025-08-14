"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

// Types for log records
interface RecordDataItem {
  record_label: string;
  record_value_text?: string;
  record_value?: string[] | Record<string, unknown>[] | Record<string, unknown>;
  record_type: string;
}

interface LogRecord {
  record_id: string;
  created_on_date: string;
  feature_data: {
    record_data: RecordDataItem[];
  };
  more_data?: Record<string, unknown>;
}

type LogCategory = string;

const LOG_CATEGORIES: LogCategory[] = [
  "task",
  "sprint",
  "reminders",
  "tags",
  "form_data",
  "members",
  "departments",
  "login_user_details",
  "sprints",
];

const fetchLogs = async (userId: string): Promise<LogRecord[]> => {
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
      ],
      combination_type: "and",
      dataset: "feature_data",
    }),
  });
  const data = await response.json();
  return data.data ?? [];
};

const LogViewer: React.FC = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const userId = user?.record_id || "";
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [activeCategory, setActiveCategory] = useState<LogCategory>(
    LOG_CATEGORIES[0]
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchLogs(userId).then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, [userId]);

  const logsByCategory = LOG_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = logs.filter((log) =>
      log.feature_data.record_data.some(
        (item) =>
          item.record_label === "category" && item.record_value_text === cat
      )
    );
    return acc;
  }, {} as Record<LogCategory, LogRecord[]>);

  return (
    <div className="card custom-card rounded-card p-3">
      <h3 className="mb-3">User Activity Logs</h3>
      <div className="mb-3 d-flex gap-2 flex-wrap">
        {LOG_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`btn btn-sm ${
              activeCategory === cat ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)} (
            {logsByCategory[cat]?.length || 0})
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
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {(logsByCategory[activeCategory] || []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center">
                    No logs found for this category.
                  </td>
                </tr>
              ) : (
                logsByCategory[activeCategory].map((log) => (
                  <tr key={log.record_id}>
                    <td>{log.created_on_date}</td>
                    <td>
                      {log.feature_data.record_data.find(
                        (item) => item.record_label === "action"
                      )?.record_value_text || "-"}
                    </td>
                    <td>
                      <button
                        className="btn btn-link btn-sm"
                        onClick={() => alert(JSON.stringify(log, null, 2))}
                      >
                        View More
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LogViewer;
