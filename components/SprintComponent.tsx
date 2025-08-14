import { useState, FormEvent, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { sendLog } from "../utils/sendLog";

// Type definitions
interface SprintStatus {
  id: string;
  name: string;
  color: string;
}

interface Sprint {
  record_id: string;
  sprint_name: string;
  task_status: SprintStatus[];
  [key: string]: unknown; // For any extra fields
}

const SprintComponent = () => {
  const [sprintModal, setSprintModal] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [sprintStatus, setSprintStatus] = useState<SprintStatus[]>([
    {
      id: "001",
      name: "TO DO",
      color: "#a259f7",
    },
    {
      id: "002",
      name: "IN PROGRESS",
      color: "#f7b32b",
    },
    {
      id: "003",
      name: "DONE",
      color: "#43aa8b",
    },
  ]);
  // const [sprintLoading, setSprintLoading] = useState(false);
  // const [sprintError, setSprintError] = useState<string | null>(null);
  // const [sprintSuccess, setSprintSuccess] = useState(false);
  // const [sprints, setSprints] = useState<Sprint[]>([]);
  // const [editSprintId, setEditSprintId] = useState<string | null>(null);
  // const [sprintsLoading, setSprintsLoading] = useState(false);

  const [sprintLoading, setSprintLoading] = useState(false);
  const [sprintError, setSprintError] = useState<string | null>(null);
  const [sprintSuccess, setSprintSuccess] = useState(false);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprints, setActiveSprints] = useState<Sprint[]>([]);
  const [completedSprints, setCompletedSprints] = useState<Sprint[]>([]);
  const [editSprintId, setEditSprintId] = useState<string | null>(null);
  const [sprintsLoading, setSprintsLoading] = useState(false);

  const user = useSelector((state: RootState) => state.user.user);

  const openSprintModal = () => {
    setSprintModal(true);
    setSprintName("");
    setSprintStatus([
      {
        id: "001",
        name: "TO DO",
        color: "#a259f7",
      },
      {
        id: "002",
        name: "IN PROGRESS",
        color: "#f7b32b",
      },
      {
        id: "003",
        name: "DONE",
        color: "#43aa8b",
      },
    ]);
    setSprintError(null);
    setSprintSuccess(false);
  };

  const closeSprintModal = () => {
    setSprintModal(false);
    setSprintName("");
    setSprintStatus([
      {
        id: "001",
        name: "TO DO",
        color: "#a259f7",
      },
      {
        id: "002",
        name: "IN PROGRESS",
        color: "#f7b32b",
      },
      {
        id: "003",
        name: "DONE",
        color: "#43aa8b",
      },
    ]);
    setSprintError(null);
    setSprintSuccess(false);
    setEditSprintId(null);
  };

  // Fetch sprints for the current user
  useEffect(() => {
    const fetchSprints = async () => {
      if (!user?.record_id) return;

      try {
        setSprintsLoading(true);

        const payload = {
          conditions: [
            {
              field: "feature_name",
              value: "sprint_management",
              search_type: "exact",
            },
            {
              field: "added_by",
              value: user.record_id,
              search_type: "exact",
            },
          ],
          combination_type: "and",
          page: 1,
          limit: 100,
          dataset: "feature_data",
        };

        const response = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-TYPE": "search",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok && Array.isArray(result.data)) {
          setSprints(result.data);

          const completed = result.data.filter(
            (s: Sprint) => s.sprint_completed === true
          );
          const active = result.data.filter(
            (s: Sprint) => s.sprint_completed !== true
          );

          setCompletedSprints(completed);
          setActiveSprints(active);
        } else {
          setSprints([]);
          setCompletedSprints([]);
          setActiveSprints([]);
        }
      } catch (err) {
        console.error(err);
        setSprints([]);
        setCompletedSprints([]);
        setActiveSprints([]);
      } finally {
        setSprintsLoading(false);
      }
    };

    fetchSprints();
  }, [user, sprintSuccess]);

  // Open modal for edit
  const handleEditSprint = (sprint: Sprint) => {
    setEditSprintId(sprint.record_id);
    setSprintModal(true);
    setSprintName(sprint.sprint_name || "");
    setSprintStatus(
      Array.isArray(sprint.task_status)
        ? sprint.task_status
        : [
            {
              id: "001",
              name: "TO DO",
              color: "#a259f7",
            },
            {
              id: "002",
              name: "IN PROGRESS",
              color: "#f7b32b",
            },
            {
              id: "003",
              name: "DONE",
              color: "#43aa8b",
            },
          ]
    );
    setSprintError(null);
    setSprintSuccess(false);
  };

  // Helper to update task_management with current sprint IDs
  const updateTaskManagementSprints = async (updatedSprintIds: string[]) => {
    if (!user?.record_id) return;
    try {
      const payload = {
        data: {
          record_id: "client_0045", // or the appropriate record_id for your use case
          feature_name: "task_management",
          fields_to_update: {
            sprints: updatedSprintIds,
          },
        },
        dataset: "features",
      };
      await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "update",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Failed to update task_management sprints", err);
    }
  };

  // Update handleSprintSubmit to handle both create and edit
  const handleSprintSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSprintLoading(true);
    setSprintError(null);
    setSprintSuccess(false);
    try {
      if (!user?.record_id) throw new Error("User not found");
      let newSprintId = editSprintId;
      if (editSprintId) {
        // Update existing sprint
        const payload = {
          data: {
            record_id: editSprintId,
            feature_name: "sprint_management",
            fields_to_update: {
              sprint_name: sprintName,
              task_status: sprintStatus,
            },
          },
          dataset: "feature_data",
        };
        const response = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-TYPE": "update",
          },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Sprint update failed");
        setSprintSuccess(true);
        // Log sprint update
        try {
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
                    record_value_text: "sprints",
                    record_type: "type_text",
                  },
                  {
                    record_label: "user_id",
                    record_value_text: user.record_id,
                    record_type: "type_text",
                  },
                  {
                    record_label: "user_role",
                    record_value_text: user.role_id,
                    record_type: "type_text",
                  },
                  {
                    record_label: "sprint_id",
                    record_value_text: editSprintId,
                    record_type: "type_text",
                  },
                  {
                    record_label: "action",
                    record_value_text: "update",
                    record_type: "type_text",
                  },
                ],
              },
              more_data: {},
            },
            dataset: "feature_data",
          });
        } catch (logErr) {
          console.error("Failed to log sprint update", logErr);
        }
        // After update, update task_management sprints
        const updatedSprintIds = sprints.map((s) => s.record_id);
        await updateTaskManagementSprints(updatedSprintIds);
        setTimeout(() => {
          closeSprintModal();
        }, 1000);
      } else {
        // Create new sprint (existing code)
        newSprintId = `sprint_${Date.now()}`;
        const payload = {
          data: {
            record_id: newSprintId,
            feature_name: "sprint_management",
            sprint_completed: false,
            sprint_name: sprintName,
            created_on_date: new Date().toISOString().split("T")[0],
            feature_data: { record_data: [] },
            tasks: [],
            task_status: sprintStatus,
            more_data: {},
            added_by: user.record_id,
          },
          dataset: "feature_data",
        };
        const response = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-TYPE": "create",
          },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Sprint creation failed");
        setSprintSuccess(true);
        // Log sprint creation
        try {
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
                    record_value_text: "sprints",
                    record_type: "type_text",
                  },
                  {
                    record_label: "user_id",
                    record_value_text: user.record_id,
                    record_type: "type_text",
                  },
                  {
                    record_label: "user_role",
                    record_value_text: user.role_id,
                    record_type: "type_text",
                  },
                  {
                    record_label: "sprint_id",
                    record_value_text: newSprintId,
                    record_type: "type_text",
                  },
                  {
                    record_label: "action",
                    record_value_text: "add",
                    record_type: "type_text",
                  },
                ],
              },
              more_data: {},
            },
            dataset: "feature_data",
          });
        } catch (logErr) {
          console.error("Failed to log sprint creation", logErr);
        }
        // After create, update task_management sprints
        const updatedSprintIds = [
          ...sprints.map((s) => s.record_id),
          newSprintId,
        ];
        await updateTaskManagementSprints(updatedSprintIds);
        setTimeout(() => {
          closeSprintModal();
        }, 1000);
      }
    } catch (err) {
      setSprintError("Something went wrong");
      console.log(err);
    } finally {
      setSprintLoading(false);
    }
  };

  const handleCompleteSprint = async (sprintId: string) => {
    try {
      const payload = {
        data: {
          record_id: sprintId,
          feature_name: "sprint_management",
          fields_to_update: {
            sprint_completed: true,
          },
        },
        dataset: "feature_data",
      };

      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "update",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to complete sprint");

      // Log completion
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
                record_value_text: "sprints",
                record_type: "type_text",
              },
              {
                record_label: "user_id",
                record_value_text: user?.record_id ?? "",
                record_type: "type_text",
              },
              {
                record_label: "user_role",
                record_value_text: user?.role_id ?? "",
                record_type: "type_text",
              },
              {
                record_label: "sprint_id",
                record_value_text: sprintId,
                record_type: "type_text",
              },
              {
                record_label: "action",
                record_value_text: "mark_complete",
                record_type: "type_text",
              },
            ],
          },
          more_data: {},
        },
        dataset: "feature_data",
      });

      alert("Sprint marked as completed!");
    } catch (err) {
      console.error("Failed to complete sprint", err);
    }
  };

  // const handleDeleteSprint = async (sprintId: string) => {
  //   if (!user?.record_id) return;
  //   setSprintLoading(true);
  //   setSprintError(null);
  //   try {
  //     // 1. Delete the sprint from feature_data (sprint_management)
  //     const sprintDeletePayload = {
  //       data: {
  //         record_id: sprintId,
  //         feature_name: "sprint_management",
  //         delete_entire_document: true,
  //       },
  //       dataset: "feature_data",
  //     };
  //     const sprintDeleteResponse = await fetch("/api/proxy", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         "X-API-TYPE": "delete",
  //       },
  //       body: JSON.stringify(sprintDeletePayload),
  //     });
  //     const sprintDeleteResult = await sprintDeleteResponse.json();
  //     if (!sprintDeleteResponse.ok)
  //       throw new Error(sprintDeleteResult.error || "Sprint delete failed");

  //     // 2. Update task_management feature (update sprints field)
  //     const updatedSprintIds = sprints
  //       .filter((s) => s.record_id !== sprintId)
  //       .map((s) => s.record_id);
  //     await updateTaskManagementSprints(updatedSprintIds);

  //     setSprintSuccess(true);
  //     setSprints((prev) => prev.filter((s) => s.record_id !== sprintId));
  //   } catch (err) {
  //     setSprintError("Failed to delete sprint");
  //     console.error(err);
  //   } finally {
  //     setSprintLoading(false);
  //   }
  // };

  console.log("sprints", sprints);

  return (
    <div className="card custom-card rounded-card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="text-xl text-primary font-bold">Sprint Management</h4>
        </div>

        {/* Sprint Modal */}
        {sprintModal && (
          <div
            className="modal"
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <form className="modal-content" onSubmit={handleSprintSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">Create</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeSprintModal}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Sprint Name"
                      value={sprintName}
                      onChange={(e) => setSprintName(e.target.value)}
                      required
                    />
                  </div>

                  {sprintError && (
                    <div className="text-danger mt-2">{sprintError}</div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={sprintLoading}
                  >
                    {sprintLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </span>
                        Processing...
                      </>
                    ) : editSprintId ? (
                      "Update Sprint"
                    ) : (
                      "Create Sprint"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeSprintModal}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <div className="row justify-content-between mt-4">
          <div className="col-md-6">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="">Active Sprints</h6>
              <div>
                <button
                  className="btn btn-add btn-primary ms-auto me-0"
                  onClick={openSprintModal}
                >
                  + Add
                </button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover text-center mt-3">
                <thead className="table-head">
                  <tr>
                    <th>#</th>
                    <th>Sprint Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sprintsLoading ? (
                    <tr>
                      <td colSpan={4} className="text-center">
                        <div
                          className="d-flex justify-content-center align-items-center"
                          style={{ minHeight: 80 }}
                        >
                          <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : activeSprints.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center">
                        No sprints found
                      </td>
                    </tr>
                  ) : (
                    activeSprints.map((sprint, idx) => (
                      <tr key={sprint.record_id}>
                        <td>{idx + 1}</td>
                        <td>{sprint.sprint_name}</td>

                        <td>
                          <div className="d-flex justify-content-center align-items-center">
                            <button
                              className="btn btn-sm d-flex justify-content-center align-items-center btn-primary me-2"
                              onClick={() => handleEditSprint(sprint)}
                            >
                              <i
                                className="fa-solid fa-pen-to-square"
                                style={{ fontSize: "15px" }}
                              ></i>
                            </button>
                            <button
                              className="btn btn-sm btn-success d-flex justify-content-center align-items-center"
                              title="Mark as completed"
                              onClick={() =>
                                handleCompleteSprint(sprint.record_id)
                              }
                              disabled={sprintLoading}
                            >
                              <i className="fa-regular fs-6 fa-square-check"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="col-md-5">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="">Completed Sprints</h6>
            </div>
            <div className="table-responsive">
              <table className="table table-hover text-center mt-3">
                <thead className="table-head">
                  <tr>
                    <th>#</th>
                    <th>Sprint Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sprintsLoading ? (
                    <tr>
                      <td colSpan={4} className="text-center">
                        <div
                          className="d-flex justify-content-center align-items-center"
                          style={{ minHeight: 80 }}
                        >
                          <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : completedSprints.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center">
                        No sprints found
                      </td>
                    </tr>
                  ) : (
                    completedSprints.map((sprint, idx) => (
                      <tr key={sprint.record_id}>
                        <td>{idx + 1}</td>
                        <td>{sprint.sprint_name}</td>
                        <td>
                          <button className="btn btn-success p-2 pt-0 pb-0">
                            Completed
                          </button>
                        </td>

                        {/* <td>
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleEditSprint(sprint)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-success"
                            title="Mark as completed"
                            onClick={() =>
                              handleCompleteSprint(sprint.record_id)
                            }
                            disabled={sprintLoading}
                          >
                            <i className="fa-regular fs-6 fa-square-check"></i>
                          </button>
                        </td> */}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintComponent;
