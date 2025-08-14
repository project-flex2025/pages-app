"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useSession } from "next-auth/react";
import { Task } from "@/types/task";
import { User } from "@/types/user";
import { TooltipEllipsisCell } from "./ListView";

type StatusOption = {
  id: string;
  name: string;
  color: string;
};

interface BoardViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  statusOptions: StatusOption[];
  setStatusOptions: React.Dispatch<React.SetStateAction<StatusOption[]>>;
  onDragEnd: (result: DropResult) => void;
  onStatusDragEnd: (result: DropResult) => void;
  setModalTask: (task: Task | null) => void;
  selectedSprintId: string;
  updateSprintStatusAPI: (
    sprintId: string,
    newStatusList: StatusOption[]
  ) => Promise<unknown>;
  deleteTaskAPI: (taskId: string | string[]) => Promise<unknown>;
  userOptions: Array<{
    name: string;
    initials: string;
    color: string;
    id: string;
  }>;
  // userDetailsById: Record<string, import("@/types/user").User>;
  userDetailsById: Record<string, User>;
  fetchTasks: () => Promise<void>;
  fetchSingleTask: (taskRecordId: string) => Promise<Task | null>;
  fetchUserDetails: (userIds: string[]) => void;
}

function getInitialsFromUser(user: {
  profile_information?: { full_name?: string };
  username?: string;
  name?: string;
  record_id?: string;
}): string {
  const fullName = user.profile_information?.full_name || "";
  const base = fullName || user.username || user.name || user.record_id || "";
  const words = base.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  } else if (words.length > 1) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return "?";
}

// 1. Modal component for editing status
function EditStatusModal({
  open,
  status,
  name,
  color,
  setName,
  setColor,
  onSave,
  onCancel,
}: {
  open: boolean;
  status: StatusOption | null;
  name: string;
  color: string;
  setName: (v: string) => void;
  setColor: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (!open || !status) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.18)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 32,
          minWidth: 320,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <h5 style={{ margin: 0 }}>Edit Status</h5>
        </div>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="mb-3 d-flex align-items-center gap-2">
          <label className="form-label mb-0">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{
              width: 32,
              height: 32,
              border: "none",
              background: "none",
              borderRadius: 8,
            }}
          />
          <span style={{ color: "#000", fontSize: 13 }}>{color}</span>
        </div>
        <div className="d-flex gap-2 justify-content-end mt-4">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onSave}
            disabled={!name.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

const BoardView: React.FC<BoardViewProps> = ({
  tasks,
  setTasks,
  statusOptions,
  setStatusOptions,
  onDragEnd,
  setModalTask,
  selectedSprintId,
  updateSprintStatusAPI,
  deleteTaskAPI,
  userDetailsById,
  fetchSingleTask,
  fetchUserDetails,
}) => {
  const { data: session } = useSession();
  const [showAddStatusForm, setShowAddStatusForm] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#888888");
  const [showAddTaskForms, setShowAddTaskForms] = useState<
    Record<string, boolean>
  >({});
  const [newTaskTitles, setNewTaskTitles] = useState<Record<string, string>>(
    {}
  );
  const boardAddStatusFormRef = useRef<HTMLDivElement | null>(null);
  const addTaskFormRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);
  const [editStatusId, setEditStatusId] = useState<string | null>(null);
  const [editStatusName, setEditStatusName] = useState("");
  const [editStatusColor, setEditStatusColor] = useState("#888888");
  const [deleteStatusId, setDeleteStatusId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTaskIds, setDeleteTaskIds] = useState<string[]>([]);
  const [showDeleteTaskConfirm, setShowDeleteTaskConfirm] = useState(false);
  const statusMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const boardColumnsRef = useRef<HTMLDivElement | null>(null);
  const prevStatusCount = useRef(statusOptions.length);

  // Helper function to format dates
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "n/a";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "n/a";
    }
  };

  // Helper function to create a task in the backend
  const createTaskAPI = async (task: Task) => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);
    const userId = session?.user?.id || "";

    // Calculate due date (3 days from created date)
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    const payload = {
      data: {
        record_id: task.id,
        feature_name: "task_status_management",
        created_on_date: dateStr,
        feature_data: { record_data: [] },
        more_data: {
          sprint_id: selectedSprintId,
          title: task.summary,
          description: task.description || "",
          checklist: task.checklist || [],
          assigned_by: userId,
          assigned_to: task.assigned_to?.id || "",
          assigned_date: dateStr,
          assigned_time: timeStr,
          task_status: task.status,
          status_updated_by: userId,
          status_updated_date: dateStr,
          status_updated_time: timeStr,
          due_date: dueDateStr,
        },
      },
      dataset: "feature_data",
    };
    const response = await fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-TYPE": "create" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Task creation failed");
    }
    return response.json();
  };

  // Handle add new status
  const handleAddNewStatus = async () => {
    if (!newStatusName.trim()) return;
    // Find the highest numeric id in statusOptions
    const maxId = statusOptions
      .map((opt) => parseInt(opt.id, 10))
      .filter((n) => !isNaN(n))
      .reduce((max, n) => Math.max(max, n), 0);
    const newId = (maxId + 1).toString().padStart(3, "0");
    const newStatus = {
      id: newId,
      name: newStatusName, // use as entered
      color: newStatusColor,
    };
    const updatedStatusList = [...statusOptions, newStatus];
    setStatusOptions(updatedStatusList);
    // Instead of closing the form, just clear the input fields
    setNewStatusName("");
    setNewStatusColor("#888888");
    // Do NOT close the add status form here
    // Call API to update sprint's status list
    try {
      await updateSprintStatusAPI(selectedSprintId, updatedStatusList);
      // Optionally, show a success message or refresh sprints
    } catch (err) {
      alert("Failed to update sprint status: " + (err as Error).message);
      // Optionally, revert local state if needed
    }
  };

  const handleCancelAddStatus = () => {
    setShowAddStatusForm(false);
    setNewStatusName("");
    setNewStatusColor("#888888");
  };

  // Update handleAddNewTask to call backend
  const handleAddNewTask = async (statusId: string) => {
    const taskTitle = newTaskTitles[statusId]?.trim();
    if (!taskTitle) return;
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const userId = session?.user?.id || "";

    // You may want to select the assignee from userOptions or another state, for now use empty string
    const assignedToId = ""; // TODO: Replace with selected user id if available
    const newTaskObj: Task = {
      id: `task_${Date.now()}`,
      record_id: `task_${Date.now()}`,
      type: "task_status_management",
      key: `task_${Date.now()}`,
      summary: taskTitle,
      description: "",
      comments: [],
      status: statusId,
      created: dateStr,
      updated: dateStr,
      assigner: {
        name: userId,
        initials: userId ? userId[0].toUpperCase() : "?",
        color: "orange",
        id: userId,
      },
      assigned_to: {
        name: "",
        initials: "?",
        color: "green",
        id: assignedToId,
      },
      dueDate: "",
      checklist: [],
      more_data: {
        task_status: statusId,
        due_date: "",
        assigned_to: assignedToId,
        assigned_by: userId,
      },
    };

    try {
      await createTaskAPI(newTaskObj);

      // Fetch the newly created task from the server to get the complete data
      const fetchedTask = await fetchSingleTask(newTaskObj.record_id);

      if (fetchedTask) {
        // Add the fetched task to the existing tasks array
        setTasks((prev: Task[]) => [...prev, fetchedTask]);

        // Fetch user details for the new task's assigner and assignee
        const userIdsToFetch: string[] = [];
        if (fetchedTask.more_data?.assigned_by) {
          userIdsToFetch.push(fetchedTask.more_data.assigned_by);
        }
        if (fetchedTask.more_data?.assigned_to) {
          userIdsToFetch.push(fetchedTask.more_data.assigned_to);
        }
        if (userIdsToFetch.length > 0) {
          fetchUserDetails(userIdsToFetch);
        }
      } else {
        // Fallback: add the local task object if fetch fails
        setTasks((prev: Task[]) => [...prev, newTaskObj]);

        // Still fetch user details for the local task
        const userIdsToFetch: string[] = [];
        if (newTaskObj.more_data?.assigned_by) {
          userIdsToFetch.push(newTaskObj.more_data.assigned_by);
        }
        if (newTaskObj.more_data?.assigned_to) {
          userIdsToFetch.push(newTaskObj.more_data.assigned_to);
        }
        if (userIdsToFetch.length > 0) {
          fetchUserDetails(userIdsToFetch);
        }
      }

      // Instead of closing the form, just clear the input for this status
      setNewTaskTitles((prev) => ({ ...prev, [statusId]: "" }));
      // Do NOT close the add form here
    } catch (err) {
      alert("Failed to create task: " + (err as Error).message);
    }
  };

  const handleCancelAddTask = (statusId: string) => {
    setShowAddTaskForms((prev) => ({ ...prev, [statusId]: false }));
    setNewTaskTitles((prev) => ({ ...prev, [statusId]: "" }));
  };

  const handleShowAddTaskForm = (statusId: string) => {
    setShowAddTaskForms((prev) => ({ ...prev, [statusId]: true }));
  };

  // Custom click outside handler for board view only
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // Don't close if clicking inside the status form
      if (
        boardAddStatusFormRef.current &&
        boardAddStatusFormRef.current.contains(target)
      ) {
        return;
      }

      // Don't close if clicking on color picker or its dropdown
      if (target instanceof HTMLInputElement && target.type === "color") {
        return;
      }

      // Check if clicking inside any color picker dropdown
      if (target instanceof HTMLElement) {
        const colorPickerParent = target.closest('input[type="color"]');
        const dialogParent = target.closest('[role="dialog"]');
        if (colorPickerParent || dialogParent) {
          return;
        }
      }

      // Close the status form if clicking outside
      if (showAddStatusForm) {
        setShowAddStatusForm(false);
        setNewStatusName("");
        setNewStatusColor("#888888");
      }
    }

    if (showAddStatusForm) {
      // Use a small delay to prevent immediate closing
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showAddStatusForm]);

  // Custom click outside handler for add task forms
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // Check if clicking inside any add task form
      const isInsideAddTaskForm = Object.values(addTaskFormRefs.current).some(
        (ref) => ref && ref.contains(target)
      );

      if (isInsideAddTaskForm) {
        return;
      }

      // Close all add task forms if clicking outside
      const openForms = Object.keys(showAddTaskForms).filter(
        (key) => showAddTaskForms[key]
      );
      if (openForms.length > 0) {
        const updatedForms = { ...showAddTaskForms };
        openForms.forEach((formKey) => {
          updatedForms[formKey] = false;
        });
        setShowAddTaskForms(updatedForms);

        // Clear the input values
        const updatedTitles = { ...newTaskTitles };
        openForms.forEach((formKey) => {
          updatedTitles[formKey] = "";
        });
        setNewTaskTitles(updatedTitles);
      }
    }

    const hasOpenForms = Object.values(showAddTaskForms).some(Boolean);
    if (hasOpenForms) {
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showAddTaskForms, newTaskTitles]);

  // Handle click outside for status menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        statusMenuOpen &&
        statusMenuRefs.current[statusMenuOpen] &&
        statusMenuRefs.current[statusMenuOpen]!.contains(target)
      ) {
        return;
      }
      setStatusMenuOpen(null);
    }
    if (statusMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [statusMenuOpen]);

  // Edit status handlers
  const handleEditStatus = (status: StatusOption) => {
    setEditStatusId(status.id);
    setEditStatusName(status.name);
    setEditStatusColor(status.color);
    setStatusMenuOpen(null);
  };
  const handleEditStatusSave = async () => {
    if (!editStatusId) return;
    const updatedStatusList = statusOptions.map((s) =>
      s.id === editStatusId
        ? { ...s, name: editStatusName, color: editStatusColor }
        : s
    );
    setStatusOptions(updatedStatusList);
    setEditStatusId(null);
    setEditStatusName("");
    setEditStatusColor("#888888");
    try {
      await updateSprintStatusAPI(selectedSprintId, updatedStatusList);
    } catch (err) {
      alert("Failed to update status: " + (err as Error).message);
    }
  };
  const handleEditStatusCancel = () => {
    setEditStatusId(null);
    setEditStatusName("");
    setEditStatusColor("#888888");
  };

  // Delete status handlers
  const handleDeleteStatus = (statusId: string) => {
    setDeleteStatusId(statusId);
    setShowDeleteConfirm(true);
    setStatusMenuOpen(null);
  };
  const confirmDeleteStatus = async () => {
    if (!deleteStatusId) return;
    const updatedStatusList = statusOptions.filter(
      (s) => s.id !== deleteStatusId
    );
    setStatusOptions(updatedStatusList);
    setDeleteStatusId(null);
    setShowDeleteConfirm(false);
    try {
      await updateSprintStatusAPI(selectedSprintId, updatedStatusList);
    } catch (err) {
      alert("Failed to delete status: " + (err as Error).message);
    }
  };
  const cancelDeleteStatus = () => {
    setDeleteStatusId(null);
    setShowDeleteConfirm(false);
  };

  // Delete task handlers
  const handleDeleteTask = (taskId: string) => {
    setDeleteTaskIds([taskId]);
    setShowDeleteTaskConfirm(true);
  };

  const confirmDeleteTask = async () => {
    if (!deleteTaskIds.length) return;
    const updatedTasks = tasks.filter(
      (task) => !deleteTaskIds.includes(task.id)
    );
    setTasks(updatedTasks);
    setDeleteTaskIds([]);
    setShowDeleteTaskConfirm(false);
    try {
      await deleteTaskAPI(deleteTaskIds);
    } catch (err) {
      alert("Failed to delete task: " + (err as Error).message);
    }
  };

  const cancelDeleteTask = () => {
    setDeleteTaskIds([]);
    setShowDeleteTaskConfirm(false);
  };

  // Scroll to the end of the board when add status form is opened or a new status is added
  // Remove the automatic scroll when statusOptions change (sprint change)
  // Only scroll when explicitly adding a new status
  useEffect(() => {
    prevStatusCount.current = statusOptions.length;
  }, [statusOptions.length]);

  useEffect(() => {
    function scrollToEnd() {
      if (showAddStatusForm && boardColumnsRef.current) {
        boardColumnsRef.current.scrollTo({
          left: boardColumnsRef.current.scrollWidth,
          behavior: "smooth",
        });
      }
    }

    if (showAddStatusForm) {
      // Scroll immediately when form opens
      scrollToEnd();

      // Scroll on resize
      window.addEventListener("resize", scrollToEnd);

      // Set up an interval to keep it at the end while form is open
      const interval = setInterval(scrollToEnd, 500);

      return () => {
        window.removeEventListener("resize", scrollToEnd);
        clearInterval(interval);
      };
    }
  }, [showAddStatusForm]);

  return (
    <div className="board-view">
      {/* Edit Status Modal */}
      <EditStatusModal
        open={!!editStatusId}
        status={statusOptions.find((s) => s.id === editStatusId) || null}
        name={editStatusName}
        color={editStatusColor}
        setName={setEditStatusName}
        setColor={setEditStatusColor}
        onSave={handleEditStatusSave}
        onCancel={handleEditStatusCancel}
      />
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable
          droppableId="all-columns"
          direction="horizontal"
          type="COLUMN"
        >
          {(provided) => (
            <div
              className="board-columns"
              ref={(node) => {
                boardColumnsRef.current = node;
                provided.innerRef(node);
              }}
              {...provided.droppableProps}
            >
              {statusOptions.map((status, statusIdx) => {
                const statusTasks = tasks.filter(
                  (task) =>
                    task &&
                    (task.status === status.id ||
                      task.more_data?.task_status === status.id)
                );
                const isAddTaskFormOpen = showAddTaskForms[status.id] || false;
                const isEditingThisStatus = editStatusId === status.id;
                return (
                  <Draggable
                    draggableId={status.id}
                    index={statusIdx}
                    key={status.id}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="board-column"
                      >
                        <div
                          className="d-flex align-items-center justify-content-between mb-3"
                          style={{ position: "relative" }}
                        >
                          <div
                            className="d-flex align-items-center gap-2"
                            {...provided.dragHandleProps}
                          >
                            <div
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                backgroundColor: status.color,
                              }}
                            />
                            <h6
                              className="mb-0"
                              style={{ fontWeight: 600, fontSize: 14 }}
                            >
                              {status.name}
                            </h6>
                            <span
                              className="badge bg-secondary"
                              style={{ fontSize: 11 }}
                            >
                              {statusTasks.length}
                            </span>
                          </div>
                          {/* Ellipsis Icon */}
                          <div
                            style={{ position: "absolute", right: 0, top: 0 }}
                          >
                            <button
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 4,
                              }}
                              onClick={() =>
                                setStatusMenuOpen(
                                  statusMenuOpen === status.id
                                    ? null
                                    : status.id
                                )
                              }
                              aria-label="Open status menu"
                            >
                              <i
                                className="fa-solid fa-ellipsis"
                                style={{ fontSize: 18, color: "#888" }}
                              ></i>
                            </button>
                            {statusMenuOpen === status.id && (
                              <div
                                ref={(el) => {
                                  statusMenuRefs.current[status.id] = el;
                                }}
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: 28,
                                  background: "#fff",
                                  border: "1px solid #e9ecef",
                                  borderRadius: 8,
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                                  zIndex: 10,
                                  minWidth: 120,
                                  minHeight: 0,
                                  padding: 0,
                                }}
                              >
                                {isEditingThisStatus ? (
                                  <form
                                    style={{
                                      padding: 8,
                                      minWidth: 120,
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 8,
                                    }}
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      handleEditStatusSave();
                                    }}
                                  >
                                    <input
                                      type="text"
                                      value={editStatusName}
                                      onChange={(e) =>
                                        setEditStatusName(e.target.value)
                                      }
                                      style={{
                                        fontSize: 14,
                                        borderRadius: 4,
                                        border: "1px solid #ccc",
                                        padding: "2px 6px",
                                        width: "100%",
                                      }}
                                      autoFocus
                                    />
                                    <div className="d-flex align-items-center gap-2">
                                      <input
                                        type="color"
                                        value={editStatusColor}
                                        onChange={(e) =>
                                          setEditStatusColor(e.target.value)
                                        }
                                        style={{
                                          width: 24,
                                          height: 24,
                                          border: "none",
                                          background: "none",
                                        }}
                                      />
                                      <span
                                        style={{ color: "#000", fontSize: 13 }}
                                      >
                                        {editStatusColor}
                                      </span>
                                    </div>
                                    <div className="d-flex gap-2 justify-content-end">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        style={{
                                          fontSize: 13,
                                          padding: "2px 8px",
                                        }}
                                        onClick={handleEditStatusCancel}
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        className="btn btn-sm btn-primary"
                                        style={{
                                          fontSize: 13,
                                          padding: "2px 8px",
                                        }}
                                        disabled={!editStatusName.trim()}
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 2,
                                    }}
                                  >
                                    <button
                                      style={{
                                        width: "100%",
                                        background: "none",
                                        border: "none",
                                        padding: "8px 12px",
                                        textAlign: "left",
                                        cursor: "pointer",
                                        fontSize: 14,
                                      }}
                                      onClick={() => {
                                        handleEditStatus(status);
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      style={{
                                        width: "100%",
                                        background: "none",
                                        border: "none",
                                        padding: "8px 12px",
                                        textAlign: "left",
                                        cursor: "pointer",
                                        color: "#d9534f",
                                        fontSize: 14,
                                      }}
                                      onClick={() =>
                                        handleDeleteStatus(status.id)
                                      }
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Remove inline color picker and Save/Cancel UI */}
                        <Droppable droppableId={status.id} type="TASK">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`droppable-area ${
                                snapshot.isDraggingOver ? "dragging-over" : ""
                              }`}
                            >
                              {statusTasks.map((task, index) => (
                                <Draggable
                                  key={task.id}
                                  draggableId={task.id}
                                  index={index}
                                  isDragDisabled={false}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="board-card"
                                      style={provided.draggableProps.style}
                                      onClick={() => setModalTask(task)}
                                      onMouseEnter={(e) => {
                                        const deleteBtn =
                                          e.currentTarget.querySelector(
                                            ".delete-btn"
                                          ) as HTMLElement;
                                        if (deleteBtn)
                                          deleteBtn.style.opacity = "1";
                                      }}
                                      onMouseLeave={(e) => {
                                        const deleteBtn =
                                          e.currentTarget.querySelector(
                                            ".delete-btn"
                                          ) as HTMLElement;
                                        if (deleteBtn)
                                          deleteBtn.style.opacity = "0";
                                      }}
                                    >
                                      {/* Delete Icon */}
                                      <button
                                        className="delete-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteTask(task.id);
                                        }}
                                        aria-label="Delete task"
                                      >
                                        <i
                                          className="fa-regular fa-trash-can"
                                          style={{
                                            fontSize: 14,
                                            color: "#ea0a0a",
                                          }}
                                        ></i>
                                      </button>
                                      <div className="card-header p-0 mb-2">
                                        <div className="d-flex align-items-start justify-content-between">
                                          <h6
                                            className="mb-1 flex-grow-1"
                                            style={{
                                              fontSize: 14,
                                              fontWeight: 500,
                                              lineHeight: 1.3,
                                              color: "#333",
                                              marginRight: "8px",
                                              maxWidth: 200,
                                              minWidth: 100,
                                              width: "100%",
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                            }}
                                          >
                                            {(() => {
                                              console.log(
                                                "[BoardView TooltipEllipsisCell]",
                                                { summary: task.summary }
                                              );
                                              return null;
                                            })()}
                                            <TooltipEllipsisCell
                                              text={task.summary || "-"}
                                              maxWidth={
                                                task.checklist &&
                                                task.checklist.length > 0
                                                  ? "100%"
                                                  : "100%"
                                              }
                                            />
                                          </h6>
                                        </div>
                                      </div>
                                      {/* Card Footer: Add assigner, assignee, and due date display */}
                                      <div className="card-footer p-0 border-0">
                                        <div className="d-flex align-items-center justify-content-between">
                                          <div className="d-flex align-items-center gap-1">
                                            <i
                                              className="bi bi-calendar-event"
                                              style={{
                                                fontSize: 10,
                                                color: "#6c757d",
                                              }}
                                            />
                                            <span
                                              style={{
                                                fontSize: 10,
                                                color: "#6c757d",
                                              }}
                                            >
                                              {formatDate(
                                                task.more_data?.due_date
                                              )}
                                            </span>
                                          </div>
                                          {/* Checklist count center */}
                                          <div className="flex-grow-1 d-flex justify-content-center">
                                            {Array.isArray(task.checklist) &&
                                            task.checklist.length > 0 ? (
                                              <span
                                                style={{
                                                  fontSize: 11,
                                                  color: "#6c757d",
                                                  fontWeight: 500,
                                                }}
                                              >
                                                <i
                                                  className="bi bi-check2-square me-1"
                                                  style={{
                                                    color:
                                                      task.checklist.length >
                                                        0 &&
                                                      task.checklist.every(
                                                        (item) => item.checked
                                                      )
                                                        ? "#43aa8b"
                                                        : "#6c757d",
                                                  }}
                                                />
                                                {
                                                  task.checklist.filter(
                                                    (i) => i.checked
                                                  ).length
                                                }
                                                /{task.checklist.length}
                                              </span>
                                            ) : null}
                                          </div>
                                          <div className="d-flex align-items-center gap-1">
                                            <div
                                              className="rounded-circle d-flex justify-content-center align-items-center"
                                              style={{
                                                backgroundColor:
                                                  (task.assigned_to &&
                                                    task.assigned_to.color) ||
                                                  "#888",
                                                width: 24,
                                                height: 24,
                                                color: "white",
                                                fontSize: 10,
                                                fontWeight: 500,
                                              }}
                                              title={
                                                (task.assigned_to &&
                                                  task.assigned_to.name) ||
                                                "Unassigned"
                                              }
                                            >
                                              {(() => {
                                                const assigneeId =
                                                  task.assigned_to?.id ||
                                                  task.more_data?.assigned_to;
                                                // Check if assigneeId is empty, null, or just whitespace
                                                if (
                                                  !assigneeId ||
                                                  assigneeId.trim() === "" ||
                                                  assigneeId === "assigned_to"
                                                ) {
                                                  return (
                                                    <i
                                                      className="fa-regular fa-user"
                                                      style={{ fontSize: 10 }}
                                                    ></i>
                                                  );
                                                }
                                                const userObj =
                                                  userDetailsById[
                                                    assigneeId || ""
                                                  ];
                                                if (
                                                  userObj &&
                                                  typeof userObj === "object" &&
                                                  "profile_information" in
                                                    userObj &&
                                                  userObj.profile_information &&
                                                  typeof userObj.profile_information ===
                                                    "object" &&
                                                  "full_name" in
                                                    userObj.profile_information
                                                ) {
                                                  return getInitialsFromUser(
                                                    userObj
                                                  );
                                                }
                                                // If we have an assigneeId but no user details, still show user icon instead of initials
                                                if (
                                                  assigneeId &&
                                                  assigneeId.trim() !== ""
                                                ) {
                                                  return (
                                                    <i
                                                      className="fa-regular fa-user"
                                                      style={{ fontSize: 10 }}
                                                    ></i>
                                                  );
                                                }
                                                return (
                                                  <i
                                                    className="fa-regular fa-user"
                                                    style={{ fontSize: 10 }}
                                                  ></i>
                                                );
                                              })()}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                              {/* Add Task Section */}
                              <div className="mt-3">
                                {!isAddTaskFormOpen ? (
                                  <button
                                    className="trello-add-card-btn"
                                    style={{
                                      border: "none",
                                      borderRadius: 8,
                                      background: "transparent",
                                      color: "#5e6c84",
                                      fontSize: 14,
                                      padding: "8px 12px",
                                      width: "100%",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      cursor: "pointer",
                                      transition: "background-color 0.2s",
                                      textAlign: "left",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        "#f1f2f4";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        "transparent";
                                    }}
                                    onClick={() =>
                                      handleShowAddTaskForm(status.id)
                                    }
                                  >
                                    <span
                                      style={{ fontSize: 18, fontWeight: 400 }}
                                    >
                                      +
                                    </span>
                                    <span>Add a task</span>
                                  </button>
                                ) : (
                                  <div
                                    ref={(el) => {
                                      addTaskFormRefs.current[status.id] = el;
                                    }}
                                    style={{
                                      background: "#fff",
                                      borderRadius: 8,
                                      padding: "12px",
                                      border: "1px solid #e9ecef",
                                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                    }}
                                  >
                                    <textarea
                                      className="form-control"
                                      placeholder="Enter a title for this task..."
                                      value={newTaskTitles[status.id] || ""}
                                      onChange={(e) =>
                                        setNewTaskTitles((prev) => ({
                                          ...prev,
                                          [status.id]: e.target.value,
                                        }))
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                          e.preventDefault();
                                          handleAddNewTask(status.id);
                                          // Keep the form open and clear the input for next task
                                        }
                                        if (e.key === "Escape") {
                                          handleCancelAddTask(status.id);
                                        }
                                      }}
                                      style={{
                                        border: "none",
                                        outline: "none",
                                        fontSize: 14,
                                        resize: "none",
                                        minHeight: 60,
                                        fontFamily: "inherit",
                                      }}
                                      autoFocus
                                    />
                                    <div className="d-flex align-items-center gap-2 mt-2">
                                      <button
                                        className="btn btn-primary btn-sm"
                                        style={{
                                          background: "#0079bf",
                                          border: "none",
                                          borderRadius: 6,
                                          fontSize: 12,
                                          fontWeight: 500,
                                          padding: "6px 12px",
                                        }}
                                        onClick={() =>
                                          handleAddNewTask(status.id)
                                        }
                                        disabled={
                                          !newTaskTitles[status.id]?.trim()
                                        }
                                      >
                                        Add task
                                      </button>
                                      <button
                                        className="btn btn-outline-secondary btn-sm"
                                        style={{
                                          border: "none",
                                          background: "transparent",
                                          color: "#6c757d",
                                          fontSize: 18,
                                          padding: "0",
                                          width: 24,
                                          height: 24,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                        onClick={() =>
                                          handleCancelAddTask(status.id)
                                        }
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
              {/* Add New Status Column */}
              <div
                className="board-column"
                style={{
                  minWidth: 300,
                  maxWidth: 300,
                  background: "transparent",
                  borderRadius: 12,
                  padding: "0",
                  border: "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  minHeight: 200,
                }}
              >
                {!showAddStatusForm ? (
                  <button
                    className="trello-add-list-btn"
                    style={{
                      border: "none",
                      borderRadius: 12,
                      background: "#efd8e1",
                      color: "#000",
                      fontSize: 14,
                      padding: "4px 10px",
                      minWidth: 260,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      boxShadow: "none",
                      cursor: "pointer",
                      margin: 0,
                    }}
                    onClick={() => setShowAddStatusForm(true)}
                  >
                    <span style={{ fontSize: 22, fontWeight: 400 }}>+</span>
                    <span style={{ fontSize: 16 }}>Add another card</span>
                  </button>
                ) : (
                  <div
                    ref={boardAddStatusFormRef}
                    style={{
                      background: "#efd8e1",
                      borderRadius: 12,
                      padding: "16px 16px 12px 16px",
                      minWidth: 260,
                      color: "#000",
                      marginBottom: 8,
                    }}
                  >
                    <input
                      type="text"
                      className="form-control form-control-sm mb-2"
                      placeholder="Enter list title..."
                      value={newStatusName}
                      onChange={(e) => setNewStatusName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddNewStatus();
                          // Keep the form open and clear the input for next status
                        }
                        if (e.key === "Escape") {
                          handleCancelAddStatus();
                        }
                      }}
                      style={{
                        borderRadius: 8,
                        border: "none",
                        outline: "none",
                        fontSize: 16,
                        marginBottom: 10,
                      }}
                      autoFocus
                    />
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <input
                        type="color"
                        value={newStatusColor}
                        onChange={(e) => setNewStatusColor(e.target.value)}
                        style={{
                          width: 30,
                          height: 30,
                          border: "none",
                          background: "none",
                          borderRadius: 8,
                        }}
                      />
                      <span style={{ color: "#000", fontSize: 13 }}>
                        {newStatusColor}
                      </span>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-light btn-sm"
                        style={{
                          color: "#000",
                          fontWeight: 500,
                          borderRadius: 8,
                        }}
                        onClick={handleAddNewStatus}
                        disabled={!newStatusName.trim()}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-outline-light btn-sm"
                        style={{ color: "#fff", borderRadius: 8 }}
                        onClick={handleCancelAddStatus}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {/* Floating Delete Confirmation Bar */}
      {showDeleteConfirm && (
        <div className="d-flex justify-conetnt-center align-items-center">
          <div
            className="position-fixed"
            style={{
              left: "40%",
              top: "auto",
              bottom: "8px",
              transform: "none",
              zIndex: 1050,
              minWidth: "34%",
              right: "40%",
              background: "#343a40",
              color: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              userSelect: "none",
              backdropFilter: "blur(4px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button
                className="btn btn-link text-white p-0 close-create-task-btn"
                style={{
                  fontSize: 16,
                  textDecoration: "none",
                  border: "none",
                  background: "none",
                  padding: "4px 8px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  transition: "background 0.2s",
                }}
                onClick={cancelDeleteStatus}
                onMouseDown={(e) => e.stopPropagation()}
                title="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
              <span style={{ fontWeight: 500, fontSize: 16, marginRight: 24 }}>
                Are you sure you want to delete this status?
              </span>
            </div>

            <button
              className="btn btn-outline-light text-white btn-sm"
              onClick={confirmDeleteStatus}
            >
              Yes
            </button>
          </div>
        </div>
      )}

      {/* Floating Delete Action Bar */}
      {showDeleteTaskConfirm && (
        <div className="d-flex justify-conetnt-center align-items-center">
          <div
            className="position-fixed"
            style={{
              left: "40%",
              top: "auto",
              bottom: "8px",
              transform: "none",
              zIndex: 1050,
              minWidth: "34%",
              right: "40%",
              background: "#343a40",
              color: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              userSelect: "none",
              backdropFilter: "blur(4px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button
                className="btn btn-link text-white p-0 close-create-task-btn"
                style={{
                  fontSize: 16,
                  textDecoration: "none",
                  border: "none",
                  background: "none",
                  padding: "4px 8px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  transition: "background 0.2s",
                }}
                onClick={cancelDeleteTask}
                onMouseDown={(e) => e.stopPropagation()}
                title="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
              <span style={{ fontWeight: 500, fontSize: 16, marginRight: 24 }}>
                {deleteTaskIds.length === 1
                  ? "Are you sure you want to delete this task?"
                  : `Are you sure you want to delete ${deleteTaskIds.length} tasks?`}
              </span>
            </div>

            <button
              className="btn btn-outline-light text-white btn-sm"
              onClick={confirmDeleteTask}
            >
              Yes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardView;
