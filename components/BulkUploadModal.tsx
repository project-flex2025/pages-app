import React from "react";
import { Spinner } from "react-bootstrap";
import * as XLSX from "xlsx";

type ExcelRow = Record<string, string | number | boolean>;

interface BulkUploadResultModalProps {
  open: boolean;
  loading: boolean;
  passed: number;
  failed: number;
  failedRecords: { row: ExcelRow; errors: string[] }[];
  onClose: () => void;
}

const BulkUploadResultModal: React.FC<BulkUploadResultModalProps> = ({
  open,
  passed,
  failed,
  loading,
  failedRecords,
  onClose,
}) => {
  console.log("failed records in model", failedRecords);

  const downloadFailedExcel = () => {
    const recordsWithErrors = failedRecords.map((record) => ({
      ...record.row,
      Errors: record.errors.join("; "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(recordsWithErrors);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Failed Records");

    XLSX.writeFile(workbook, "failed_records.xlsx");
  };

  return (
    <div
      className={`modal fade ${open ? "show d-block" : ""}`}
      tabIndex={-1}
      style={{ backgroundColor: open ? "rgba(0,0,0,0.5)" : "transparent" }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5
              className="modal-title"
              style={{
                textAlign: "center",
                width: "100%",
              }}
            >
              Bulk Upload Summary
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          {loading ? (
            <div className="modal-body" style={{ textAlign: "center" }}>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Uploading records...
            </div>
          ) : (
            <div
              className="modal-body elevated m-4"
              style={{ textAlign: "center" }}
            >
              <p>
                ✅ <strong>{passed}</strong> records uploaded successfully.
              </p>
              <p>
                ❌ <strong>{failed}</strong> records failed to upload.
              </p>
              <br />
              {failed > 0 && (
                <>
                  <p className="text-danger mt-2">
                    Please check the failed records and try again.
                  </p>
                  <button
                    className="btn btn-outline-danger"
                    onClick={downloadFailedExcel}
                  >
                    Download Failed Records
                  </button>
                </>
              )}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              OK
            </button>
          </div>
        </div>
        {/* )} */}
      </div>
    </div>
  );
};

export default BulkUploadResultModal;
