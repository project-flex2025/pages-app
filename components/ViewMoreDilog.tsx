import { ApiRecord, TableRow, TableWidgetData } from "@/types/table";
import React, { useCallback, useEffect, useState } from "react";
import { convertQuillToPlainText } from "./templates/template1/DynamicFormTable";

interface ViewMoreDialogProps {
  open: boolean;
  onClose: () => void;
  recordId: string | null;
  tableConfig?: TableRow[];
  featureName: string;
  widgetData: TableWidgetData;
}

const ViewMoreDialog: React.FC<ViewMoreDialogProps> = ({
  open,
  onClose,
  recordId,
  tableConfig,
  featureName,
  widgetData,
}) => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<Record<string, string>>({});

  const fetchUserData = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);

    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "search",
        },
        body: JSON.stringify({
          conditions: [
            { field: "feature_name", value: featureName, search_type: "exact" },
            { field: "record_id", value: recordId, search_type: "exact" },
          ],
          dataset: "feature_data",
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const jsonData = await response.json();
      const record: ApiRecord = jsonData?.data?.[0] ?? {};
      const recordDataArray = record.feature_data?.record_data ?? [];

      const recordDataMap: Record<string, string> = {};
      recordDataArray.forEach((item) => {
        recordDataMap[item.record_label] =
          item.record_value ??
          item.record_value_date ??
          item.record_value_number?.toString() ??
          "";
      });

      const parsedData: Record<string, string> = {};
      tableConfig?.forEach((row) => {
        row.fields.forEach((field) => {
          const { record_label, label, record_path } = field;

          if (record_path.includes("feature_data.record_data")) {
            parsedData[label] = recordDataMap[record_label] ?? "N/A";
          } else if (record_path.startsWith("more_data")) {
            parsedData[label] = record.more_data?.[record_label] ?? "N/A";
          } else {
            parsedData[label] =
              (record as Record<string, string>)[record_label] ?? "N/A";
          }
        });
      });

      setUserData(parsedData);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }

    setLoading(false);
  }, [recordId, tableConfig]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const modalSize = widgetData?.config?.form_size || "modal-lg";

  return (
    <div
      className={`modal fade ${open ? "show d-block" : ""}`}
      style={{
        backgroundColor: open ? "rgba(0,0,0,0.5)" : "transparent",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        overflow: "auto",
      }}
      tabIndex={-1}
    >
      <div
        className={`modal-dialog ${modalSize} modal-dialog-centered z-index-modal`}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {widgetData?.config?.table_settings?.actions?.view?.name ?? ""}
            </h5>
            <i
              className={`${widgetData?.config?.table_settings?.actions?.view?.icon} fs-4 ms-2`}
              aria-hidden="true"
            ></i>

            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="d-flex justify-content-center my-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="border rounded p-3 shadow-sm">
                <div className="row">
                  {(tableConfig ?? [])
                    .flatMap((row) => row.fields)
                    .map((field) => (
                      <div className="col-md-6 mb-3" key={field.label}>
                        <small className="text-muted d-block">
                          {field.label}
                        </small>
                        <div className="fw-bold text-primary">
                          {field.type == "rich_text"
                            ? convertQuillToPlainText(userData[field.label])
                            :( userData[field.label] || "N/A")}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewMoreDialog;
