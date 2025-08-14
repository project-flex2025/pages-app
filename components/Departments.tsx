"use client";

import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchTags } from "@/redux/slices/tagsSlice";
import {  AppDispatch } from "@/redux/store";
import { decompressJson, compressJson } from "@/utils/decompress";
import { RootState } from "@/redux/store";
import { sendLog } from "@/utils/sendLog";

interface Department {
  id: number;
  name: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [featureName, setFeatureName] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.user.user);

  // const { tags } = useSelector((state: RootState) => state.tags);
  // console.log("tags from departments", tags);

  useEffect(() => {
    dispatch(fetchTags());
    fetchDepartments();
  }, [dispatch]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sub_proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "search",
        },
        body: JSON.stringify({
          conditions: [
            {
              field: "feature_name",
              search_type: "exact",
            },
            {
              field: "record_id",
              value: "control_panel",
              search_type: "exact",
            },
          ],
          combination_type: "and",
          dataset: "features",
        }),
      });

      const result = await response.json();

      if (result.total_results > 0 && result.data.length > 0) {
        const { record_id, feature_name, more_data } = result.data[0];
        setRecordId(record_id);
        setFeatureName(feature_name);

        if (more_data?.configuration?.departments) {
          const decompressedDepts = decompressJson(
            more_data.configuration.departments
          );
          if (decompressedDepts) {
            setDepartments(decompressedDepts);
          } else if (more_data.depts) {
            setDepartments(more_data.depts);
          }
        } else if (more_data?.depts) {
          setDepartments(more_data.depts);
        }
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDept = (index: number, newName: string) => {
    const updatedDepartments = [...departments];
    updatedDepartments[index].name = newName;
    setDepartments(updatedDepartments);
  };

  const addNewDepartment = async () => {
    if (!newDeptName.trim()) return;

    const newId =
      departments.length > 0
        ? Math.max(...departments.map((d) => d.id)) + 1
        : 1;
    setDepartments([...departments, { id: newId, name: newDeptName }]);
    setNewDeptName("");
    setShowModal(false);
    // Log department add
    await sendLog({
      data: {
        record_id: `activity_log_${Date.now()}`,
        feature_name: "activity_logs",
        added_by: "editor_user",
        record_status: "active",
        created_on_date: new Date().toISOString().split("T")[0],
        feature_data: {
          record_data: [
            {
              record_label: "category",
              record_value_text: "departments",
              record_type: "type_text",
            },
            {
              record_label: "user_id",
              record_value_text: currentUser?.record_id || "",
              record_type: "type_text",
            },
            {
              record_label: "user_role",
              record_value_text: currentUser?.role_id || "",
              record_type: "type_text",
            },
            {
              record_label: "action",
              record_value_text: "add",
              record_type: "type_text",
            },
            {
              record_label: "departments",
              record_value: [String(newId)],
              record_type: "type_array",
            },
          ],
        },
        more_data: {},
      },
      dataset: "feature_data",
    });
  };

  const updateDepartments = async () => {
    setUpdating(true);
    try {
      const departmentsString = JSON.stringify(departments);
      const encodedDepartments = compressJson(departmentsString);
      // console.log("encoded  dept in dept",encodedDepartments);

      const updatePayload = {
        data: {
          record_id: recordId,
          feature_name: featureName,
          fields_to_update: {
            more_data: {
              configuration: {
                departments: encodedDepartments,
                last_updated: new Date().toISOString().split("T")[0],
              },
            },
            record_status: "active",
          },
        },
        dataset: "features",
      };

      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "update",
        },
        body: JSON.stringify(updatePayload),
      });

      const result = await response.json();

      if (result.status) {
        alert("Departments updated successfully!");
        // console.log("encoded  dept in dept 22",encodedDepartments);
        fetchDepartments();
        // Log department update
        await sendLog({
          data: {
            record_id: `activity_log_${Date.now()}`,
            feature_name: "activity_logs",
            added_by: "editor_user",
            record_status: "active",
            created_on_date: new Date().toISOString().split("T")[0],
            feature_data: {
              record_data: [
                {
                  record_label: "category",
                  record_value_text: "departments",
                  record_type: "type_text",
                },
                {
                  record_label: "user_id",
                  record_value_text: currentUser?.record_id || "",
                  record_type: "type_text",
                },
                {
                  record_label: "user_role",
                  record_value_text: currentUser?.role_id || "",
                  record_type: "type_text",
                },
                {
                  record_label: "action",
                  record_value_text: "update",
                  record_type: "type_text",
                },
                {
                  record_label: "departments",
                  record_value: departments.map((d) => String(d.id)),
                  record_type: "type_array",
                },
              ],
            },
            more_data: {},
          },
          dataset: "feature_data",
        });
      } else {
        alert("Failed to update departments.");
      }
    } catch (error) {
      console.error("Error updating departments:", error);
      alert("An error occurred while updating departments.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-6">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Departments Management</h5>
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
              disabled={loading}
            >
              <i className="fa-solid fa-users"></i>
            </button>
          </div>

          {loading ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading departments...</p>
            </div>
          ) : (
            <>
              <table className="table  table-bordered">
                <thead>
                  <tr>
                    <th className="text-center">ID</th>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.length > 0 ? (
                    departments.map((dept, index) => (
                      <tr key={dept.id}>
                        <td className="text-center">{dept.id}</td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={dept.name}
                            onChange={(e) =>
                              handleEditDept(index, e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="text-center">
                        No departments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="mt-3">
                <button
                  className="btn btn-primary"
                  onClick={updateDepartments}
                  disabled={updating || loading || departments.length === 0}
                >
                  {updating ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Department Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: "99999" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Department</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Department Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={addNewDepartment}
                  disabled={loading}
                >
                  {loading ? (
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  ) : null}
                  Add Department
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
