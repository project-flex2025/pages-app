import { useState, useEffect, FormEvent } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { User } from "../types/user";

// Types
interface SprintStatus {
  id: string;
  name: string;
}
interface Sprint {
  record_id: string;
  sprint_name: string;
  task_status: SprintStatus[];
  [key: string]: unknown;
}
interface SubTask {
  sub_task_id?: string;
  sub_task_title: string;
  description: string;
  status_updated_date?: string;
  status_updated_time?: string;
}
interface Task {
  record_id: string;
  feature_name: string;
  created_on_date: string;
  feature_data: { record_data: unknown[] };
  more_data: {
    sprint_id: string;
    title: string;
    description: string;
    sub_tasks: SubTask[];
    assigned_by: string;
    assigned_to: string;
    assigned_date: string;
    assigned_time: string;
    task_status: string;
    status_updated_by: string;
    status_updated_date: string;
    status_updated_time: string;
    due_date: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const TaskComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true); // unified loader
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    sub_tasks: [{ sub_task_title: "", description: "" }],
    assigned_to: "",
    assigned_date: "",
    assigned_time: "",
    due_date: "",
    task_status: "",
  });
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskSuccess, setTaskSuccess] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [taskMembers, setTaskMembers] = useState<User[]>([]);
  const [loadingTaskMembers, setLoadingTaskMembers] = useState(false);

  // Fetch sprints and then tasks
  useEffect(() => {
    const fetchSprintsAndTasks = async () => {
      setLoading(true);
      if (!user?.record_id) {
        setSprints([]);
        setTasks([]);
        setLoading(false);
        return;
      }
      try {
        // Fetch sprints
        const payload = {
          conditions: [
            {
              field: "feature_name",
              value: "sprint_management",
              search_type: "exact",
            },
            { field: "added_by", value: user.record_id, search_type: "exact" },
          ],
          combination_type: "and",
          page: 1,
          limit: 100,
          dataset: "feature_data",
          app_secret: "2e85a01a5a6e21a6741a2312440140ed",
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
          if (result.data.length > 0) {
            setSelectedSprintId(result.data[0].record_id);
            // Fetch tasks for the first sprint
            const taskPayload = {
              conditions: [
                {
                  field: "feature_name",
                  value: "task_status_management",
                  search_type: "exact",
                },
                {
                  field: "more_data.sprint_id",
                  value: result.data[0].record_id,
                  search_type: "exact",
                },
              ],
              combination_type: "and",
              page: 1,
              limit: 100,
              dataset: "feature_data",
            };
            const taskRes = await fetch("/api/proxy", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-TYPE": "search",
              },
              body: JSON.stringify(taskPayload),
            });
            const taskResult = await taskRes.json();
            if (taskRes.ok && Array.isArray(taskResult.data)) {
              setTasks(taskResult.data);
            } else {
              setTasks([]);
            }
          } else {
            setTasks([]);
          }
        } else {
          setSprints([]);
          setTasks([]);
        }
      } catch {
        setSprints([]);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSprintsAndTasks();
  }, [user]);

  // Fetch tasks when sprint changes
  useEffect(() => {
    if (!selectedSprintId) return;
    setLoading(true);
    const fetchTasks = async () => {
      try {
        const payload = {
          conditions: [
            {
              field: "feature_name",
              value: "task_status_management",
              search_type: "exact",
            },
            {
              field: "more_data.sprint_id",
              value: selectedSprintId,
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
          setTasks(result.data);
        } else {
          setTasks([]);
        }
      } catch {
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [selectedSprintId]);

  // Fetch task members (assigned users)
  useEffect(() => {
    const fetchAssignedUsers = async () => {
      setLoadingTaskMembers(true);
      try {
        const response = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-TYPE": "search",
          },
          body: JSON.stringify({
            conditions: [
              {
                field: "feature_name",
                value: "task_management",
                search_type: "exact",
              },
              {
                field: "record_id",
                value: "client_0045",
                search_type: "exact",
              },
            ],
            combination_type: "and",
            page: 1,
            limit: 10,
            dataset: "features",
          }),
        });
        const result = await response.json();
        if (result.data && result.data.length > 0) {
          const assignedMembers: string[] = result.data[0]?.members || [];
          if (assignedMembers.length > 0) {
            // Fetch user details for assigned members
            const memberConditions = assignedMembers.map((id) => ({
              field: "record_id",
              value: id,
              search_type: "exact",
            }));
            const userRes = await fetch("/api/proxy", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-TYPE": "search",
              },
              body: JSON.stringify({
                conditions: [
                  {
                    field: "feature_name",
                    value: "user_management",
                    search_type: "exact",
                  },
                  { combination_type: "or", conditions: memberConditions },
                ],
                combination_type: "and",
                page: 1,
                limit: 100,
                dataset: "users",
              }),
            });
            const userResult = await userRes.json();
            setTaskMembers(userResult.data || []);
          } else {
            setTaskMembers([]);
          }
        } else {
          setTaskMembers([]);
        }
      } catch {
        setTaskMembers([]);
      } finally {
        setLoadingTaskMembers(false);
      }
    };
    fetchAssignedUsers();
  }, [user]);

  // Handle task form changes
  const handleTaskFormChange = (field: string, value: string | string[]) => {
    setTaskForm((prev) => ({ ...prev, [field]: value }));
  };
  // Handle sub-task changes
  const handleSubTaskChange = (idx: number, field: string, value: string) => {
    setTaskForm((prev) => ({
      ...prev,
      sub_tasks: prev.sub_tasks.map((st, i) =>
        i === idx ? { ...st, [field]: value } : st
      ),
    }));
  };
  const handleAddSubTask = () => {
    setTaskForm((prev) => ({
      ...prev,
      sub_tasks: [...prev.sub_tasks, { sub_task_title: "", description: "" }],
    }));
  };
  const handleRemoveSubTask = (idx: number) => {
    setTaskForm((prev) => ({
      ...prev,
      sub_tasks: prev.sub_tasks.filter((_, i) => i !== idx),
    }));
  };
  // Open modal for create
  const openCreateTaskModal = () => {
    setEditTaskId(null);
    // Get first status id for the selected sprint
    const firstStatusId =
      sprints.find((s) => s.record_id === selectedSprintId)?.task_status?.[0]
        ?.id || "";
    // Set current date and time
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5);
    setTaskForm({
      title: "",
      description: "",
      sub_tasks: [{ sub_task_title: "", description: "" }],
      assigned_to: "",
      assigned_date: currentDate,
      assigned_time: currentTime,
      due_date: "",
      task_status: firstStatusId,
    });
    setTaskError(null);
    setTaskSuccess(false);
    setShowTaskModal(true);
  };
  // Open modal for update
  const openEditTaskModal = (task: Task) => {
    setEditTaskId(task.record_id);
    setTaskForm({
      title: task.more_data.title,
      description: task.more_data.description,
      sub_tasks: Array.isArray(task.more_data.sub_tasks)
        ? task.more_data.sub_tasks
        : [{ sub_task_title: "", description: "" }],
      assigned_to: task.more_data.assigned_to,
      assigned_date: task.more_data.assigned_date,
      assigned_time: task.more_data.assigned_time,
      due_date: task.more_data.due_date,
      task_status: task.more_data.task_status,
    });
    setTaskError(null);
    setTaskSuccess(false);
    setShowTaskModal(true);
  };
  // Close modal
  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditTaskId(null);
    setTaskError(null);
    setTaskSuccess(false);
  };
  // Handle task create or update
  const handleTaskSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTaskLoading(true);
    setTaskError(null);
    setTaskSuccess(false);
    try {
      if (!user?.record_id || !selectedSprintId)
        throw new Error("User or sprint not found");
      let payload;
      let apiType;
      if (editTaskId) {
        // Update existing task
        payload = {
          data: {
            record_id: editTaskId,
            feature_name: "task_status_management",
            fields_to_update: {
              more_data: {
                sprint_id: selectedSprintId,
                title: taskForm.title,
                description: taskForm.description,
                sub_tasks: taskForm.sub_tasks,
                assigned_by: user.record_id,
                assigned_to: taskForm.assigned_to,
                assigned_date: taskForm.assigned_date,
                assigned_time: taskForm.assigned_time,
                task_status: taskForm.task_status,
                status_updated_by: user.record_id,
                status_updated_date: new Date().toISOString().split("T")[0],
                status_updated_time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                due_date: taskForm.due_date,
              },
            },
          },
          dataset: "feature_data",
        };
        apiType = "update";
      } else {
        // Create new task
        payload = {
          data: {
            record_id: `task_${Date.now()}`,
            feature_name: "task_status_management",
            created_on_date: new Date().toISOString().split("T")[0],
            feature_data: { record_data: [] },
            more_data: {
              sprint_id: selectedSprintId,
              title: taskForm.title,
              description: taskForm.description,
              sub_tasks: taskForm.sub_tasks,
              assigned_by: user.record_id,
              assigned_to: taskForm.assigned_to,
              assigned_date: taskForm.assigned_date,
              assigned_time: taskForm.assigned_time,
              task_status: taskForm.task_status,
              status_updated_by: user.record_id,
              status_updated_date: new Date().toISOString().split("T")[0],
              status_updated_time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              due_date: taskForm.due_date,
            },
          },
          dataset: "feature_data",
        };
        apiType = "create";
      }
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-TYPE": apiType },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error ||
            (editTaskId ? "Task update failed" : "Task creation failed")
        );
      setTaskSuccess(true);
      setTaskForm({
        title: "",
        description: "",
        sub_tasks: [{ sub_task_title: "", description: "" }],
        assigned_to: "",
        assigned_date: "",
        assigned_time: "",
        due_date: "",
        task_status: "",
      });
      setTimeout(() => setTaskSuccess(false), 1200);
      setTimeout(() => {
        if (selectedSprintId) {
          setSelectedSprintId((id) => id);
        }
      }, 500);
      closeTaskModal();
    } catch (err) {
      setTaskError("Something went wrong");
      console.log(err);
    } finally {
      setTaskLoading(false);
    }
  };

  // Task status options from selected sprint
  const sprintStatusOptions =
    sprints.find((s) => s.record_id === selectedSprintId)?.task_status || [];

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!sprints.length) {
    return <div className="alert alert-info">No sprints found.</div>;
  }

  return (
    <div className="card custom-card rounded-card">
      <div className="card-body">
        <div className="d-flex align-items-center mb-3">
          <div className="me-auto">
            <label className="form-label me-2">Sprint:</label>
            <select
              className="form-select d-inline-block w-auto"
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
              disabled={loading}
            >
              {sprints.map((s) => (
                <option key={s.record_id} value={s.record_id}>
                  {s.sprint_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button>List</button>
            <button>Board</button>
          </div>
          <div className="ms-auto">
            <button className="btn btn-success" onClick={openCreateTaskModal}>
              + Create Task
            </button>
          </div>
        </div>
        {/* Task Modal */}
        {showTaskModal && (
          <div
            className="modal"
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <form className="modal-content" onSubmit={handleTaskSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editTaskId ? "Update Task" : "Create Task"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeTaskModal}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Title"
                      value={taskForm.title}
                      onChange={(e) =>
                        handleTaskFormChange("title", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Description"
                      value={taskForm.description}
                      onChange={(e) =>
                        handleTaskFormChange("description", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Assigned To</label>
                    <select
                      className="form-select"
                      value={taskForm.assigned_to}
                      onChange={(e) =>
                        handleTaskFormChange("assigned_to", e.target.value)
                      }
                      required
                      disabled={loadingTaskMembers}
                    >
                      <option value="">Select User</option>
                      {taskMembers.map((u: User) => (
                        <option key={u.record_id} value={u.record_id}>
                          {u.profile_information?.full_name ||
                            u.user_credentials?.username ||
                            u.user_credentials?.email ||
                            u.username}
                        </option>
                      ))}
                    </select>
                    {loadingTaskMembers && (
                      <span
                        className="ms-2 spinner-border spinner-border-sm"
                        role="status"
                      />
                    )}
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Assigned Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={taskForm.assigned_date}
                        onChange={(e) =>
                          handleTaskFormChange("assigned_date", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Assigned Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={taskForm.assigned_time}
                        onChange={(e) =>
                          handleTaskFormChange("assigned_time", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={taskForm.due_date}
                      onChange={(e) =>
                        handleTaskFormChange("due_date", e.target.value)
                      }
                      required
                    />
                  </div>
                  {/* Sub Tasks */}
                  <label className="form-label">Sub Tasks</label>
                  {taskForm.sub_tasks.map((sub, idx) => (
                    <div className="input-group mb-2" key={idx}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Sub-task Title"
                        value={sub.sub_task_title}
                        onChange={(e) =>
                          handleSubTaskChange(
                            idx,
                            "sub_task_title",
                            e.target.value
                          )
                        }
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Description"
                        value={sub.description}
                        onChange={(e) =>
                          handleSubTaskChange(
                            idx,
                            "description",
                            e.target.value
                          )
                        }
                      />
                      {taskForm.sub_tasks.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => handleRemoveSubTask(idx)}
                          tabIndex={-1}
                        >
                          &minus;
                        </button>
                      )}
                      {idx === taskForm.sub_tasks.length - 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={handleAddSubTask}
                          tabIndex={-1}
                        >
                          +
                        </button>
                      )}
                    </div>
                  ))}
                  {taskError && (
                    <div className="text-danger mt-2">{taskError}</div>
                  )}
                  {taskSuccess && (
                    <div className="text-success mt-2">
                      Task {editTaskId ? "updated" : "created"} successfully!
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={taskLoading}
                  >
                    {taskLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </span>
                        Processing...
                      </>
                    ) : editTaskId ? (
                      "Update Task"
                    ) : (
                      "Create Task"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeTaskModal}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Tasks Table */}
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Description</th>
                <th>Assignee</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Sub Tasks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center">
                    No tasks found
                  </td>
                </tr>
              ) : (
                tasks.map((task, idx) => (
                  <tr key={task.record_id}>
                    <td>{idx + 1}</td>
                    <td>{task.more_data.title}</td>
                    <td>{task.more_data.description}</td>
                    <td>{task.more_data.assigned_to}</td>
                    <td>
                      {sprintStatusOptions.find(
                        (s) => s.id === task.more_data.task_status
                      )?.name || task.more_data.task_status}
                    </td>
                    <td>{task.more_data.due_date}</td>
                    <td>
                      {Array.isArray(task.more_data.sub_tasks)
                        ? task.more_data.sub_tasks.map((sub, i) => (
                            <div key={i}>
                              <strong>{sub.sub_task_title}</strong>:{" "}
                              {sub.description}
                            </div>
                          ))
                        : "-"}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => openEditTaskModal(task)}
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaskComponent;
