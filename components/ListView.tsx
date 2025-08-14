"use client";

import React, { useEffect, useState } from "react";

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Task } from "@/types/task";
import { User } from "@/types/user";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { sendLog } from "@/utils/sendLog";

type EditingTask = {
  id: string;
  field: string;
  value: string;
};

type StatusOption = {
  id: string;
  name: string;
  color: string;
};

type ListViewProps = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  statusOptions: StatusOption[];
  setStatusOptions: React.Dispatch<React.SetStateAction<StatusOption[]>>;
  modalTask: Task | null;
  setModalTask: (task: Task | null) => void;
  editingTask: EditingTask | null;
  setEditingTask: React.Dispatch<React.SetStateAction<EditingTask | null>>;
  originalValue: string;
  setOriginalValue: React.Dispatch<React.SetStateAction<string>>;
  statusEdit: { id: string | null } | null;
  setStatusEdit: React.Dispatch<
    React.SetStateAction<{ id: string | null } | null>
  >;
  showAddStatusTable: string | null;
  setShowAddStatusTable: React.Dispatch<React.SetStateAction<string | null>>;
  newStatusNameTable: string;
  setNewStatusNameTable: React.Dispatch<React.SetStateAction<string>>;
  newStatusColorTable: string;
  setNewStatusColorTable: React.Dispatch<React.SetStateAction<string>>;
  addStatusFormRef: React.RefObject<HTMLFormElement | null>;
  editingStatusIdx: number | null;
  setEditingStatusIdx: React.Dispatch<React.SetStateAction<number | null>>;
  editStatusName: string;
  setEditStatusName: React.Dispatch<React.SetStateAction<string>>;
  editStatusColor: string;
  setEditStatusColor: React.Dispatch<React.SetStateAction<string>>;
  editStatusFormRef: React.RefObject<HTMLFormElement | null>;
  showStatusDropdown: boolean;
  setShowStatusDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  showCreateRow: boolean;
  setShowCreateRow: React.Dispatch<React.SetStateAction<boolean>>;
  newTaskSummary: string;
  setNewTaskSummary: React.Dispatch<React.SetStateAction<string>>;
  newTaskDescription: string;
  setNewTaskDescription: React.Dispatch<React.SetStateAction<string>>;
  newTaskStatus: string;
  setNewTaskStatus: React.Dispatch<React.SetStateAction<string>>;
  newTaskCreated: string;
  setNewTaskCreated: React.Dispatch<React.SetStateAction<string>>;
  newTaskUpdated: string;
  setNewTaskUpdated: React.Dispatch<React.SetStateAction<string>>;
  newTaskDueDate: string;
  setNewTaskDueDate: React.Dispatch<React.SetStateAction<string>>;
  newTaskAssignedTo: User;
  setNewTaskAssignedTo: React.Dispatch<React.SetStateAction<User>>;
  showAssignedToDropdown: boolean;
  setShowAssignedToDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  assignedToDropdownRef: React.RefObject<HTMLDivElement | null>;
  handleDragEnd: (result: DropResult) => void | Promise<void>;
  handleAddTask: () => void;
  handleCancelCreate: () => void;
  handleSaveChanges: () => void;
  handleCancelChanges: () => void;
  getStatusOption: (status: string) => StatusOption | undefined;
  handleAddNewStatus: () => void;
  handleCancelAddStatus: () => void;
  deleteTaskAPI: (taskId: string | string[]) => Promise<unknown>;
  TaskDetailModal: React.ComponentType<{
    task: Task;
    onClose: () => void;
    onUpdateTask: (updated: Task) => void;
    statusOptions: StatusOption[];
    setStatusOptions: React.Dispatch<React.SetStateAction<StatusOption[]>>;
    userOptions: Array<{
      name: string;
      initials: string;
      color: string;
      id: string;
    }>;
    updateSprintStatusAPI: (
      sprintId: string,
      newStatusList: StatusOption[]
    ) => Promise<unknown>;
    selectedSprintId: string;
  }>;
  selectedSprintId: string;
  updateSprintStatusAPI: (
    sprintId: string,
    newStatusList: StatusOption[]
  ) => Promise<unknown>;
  userOptions: Array<{
    name: string;
    initials: string;
    color: string;
    id: string;
  }>;
  userDetailsById: Record<string, User>;
  onStatusOrderChanged?: () => void;
  loading?: boolean; // add this
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
};

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

// Add a type predicate for User
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "record_id" in obj &&
    "username" in obj &&
    "role_id" in obj
  );
}

// Helper component for ellipsis with tooltip only if truncated
function TooltipEllipsisCell({
  text,
  maxWidth = "100%",
  ...props
}: {
  text: string;
  maxWidth?: string | number;
  [key: string]: unknown;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (el) {
      const isTruncated = el.scrollWidth > el.clientWidth;
      setShowTooltip(isTruncated);
      // Debug log for troubleshooting
      console.log("[TooltipEllipsisCell]", {
        text,
        isTruncated,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      });
    }
  }, [text]);
  return (
    <span
      ref={ref}
      style={{
        display: "inline-block",
        maxWidth,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        verticalAlign: "middle",
      }}
      title={showTooltip ? text : undefined}
      {...props}
    >
      {text || "-"}
    </span>
  );
}

const ListView: React.FC<ListViewProps> = (props) => {
  const loggedUser = useSelector((state: RootState) => state.user.user);

  // Destructure all props for easier use
  const {
    tasks,
    setTasks,
    statusOptions,
    setStatusOptions,
    setModalTask,
    statusEdit,
    setStatusEdit,
    showAddStatusTable,
    setShowAddStatusTable,
    newStatusNameTable,
    setNewStatusNameTable,
    newStatusColorTable,
    setNewStatusColorTable,
    addStatusFormRef,
    editingStatusIdx,
    setEditingStatusIdx,
    editStatusName,
    setEditStatusName,
    editStatusColor,
    setEditStatusColor,
    editStatusFormRef,
    showCreateRow,
    setShowCreateRow,
    newTaskSummary,
    setNewTaskSummary,
    newTaskDescription,
    setNewTaskDescription,
    newTaskStatus,
    setNewTaskStatus,
    newTaskCreated,
    setNewTaskCreated,
    newTaskDueDate,
    setNewTaskDueDate,
    newTaskAssignedTo,
    setNewTaskAssignedTo,
    showAssignedToDropdown,
    setShowAssignedToDropdown,
    assignedToDropdownRef,
    handleDragEnd,
    handleCancelCreate,
    getStatusOption,
    selectedSprintId,
    updateSprintStatusAPI,
    userOptions,
    deleteTaskAPI,
    userDetailsById,
    loading = false,
  } = props;

  // Add state for editing status and original value at the top of ListView
  const [editingStatusTaskId, setEditingStatusTaskId] = useState<string | null>(
    null
  );
  const [originalStatus, setOriginalStatus] = useState<string>("");
  const [showSaveBar, setShowSaveBar] = useState(false);
  // const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  // const [isDragging, setIsDragging] = useState(false);
  // const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pendingStatusOptions, setPendingStatusOptions] = useState<
    StatusOption[] | null
  >(null);
  const [pendingStatusTaskId, setPendingStatusTaskId] = useState<string | null>(
    null
  );
  const [originalStatusOptions, setOriginalStatusOptions] = useState<
    StatusOption[] | null
  >(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Add state to track if a new task is being saved
  const [isSavingNewTask, setIsSavingNewTask] = useState(false);

  // Ref for summary input to auto-focus when create row opens
  const summaryInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (showCreateRow) {
      setTimeout(() => {
        summaryInputRef.current?.focus();
      }, 0);
    }
  }, [showCreateRow]);

  // Checkbox selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(tasks.map((task) => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks((prev) => [...prev, taskId]);
    } else {
      setSelectedTasks((prev) => prev.filter((id) => id !== taskId));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTasks.length === 0) return;
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteSelected = async () => {
    if (selectedTasks.length === 0) return;
    const updatedTasks = tasks.filter(
      (task) => !selectedTasks.includes(task.id)
    );
    setTasks(updatedTasks);
    setSelectedTasks([]);
    setShowDeleteConfirmation(false);
    try {
      await deleteTaskAPI(selectedTasks);
    } catch (err) {
      alert("Failed to delete tasks: " + (err as Error).message);
    }
  };

  const cancelDeleteSelected = () => {
    setShowDeleteConfirmation(false);
    setSelectedTasks([]); // Clear selected tasks so the bar does not show
  };

  // Map all tasks to ListView format for compatibility
  // const mappedTasks = tasks.map(mapTaskBoardTaskToListViewTask);
  const mappedTasks = tasks;

  // Handle drag start
  // const handleDragStart = (e: React.MouseEvent) => {
  //   setIsDragging(true);
  //   const rect = e.currentTarget.getBoundingClientRect();
  //   setDragOffset({
  //     x: e.clientX - rect.left,
  //     y: e.clientY - rect.top,
  //   });
  // };

  // Handle drag end
  // const handleBarDragEnd = () => {
  //   setIsDragging(false);
  // };


  // Add drag event listeners
  // useEffect(() => {
  //   // Handle drag move - moved inside useEffect to fix dependency issue
  //   const handleDragMove = (e: MouseEvent) => {
  //     if (!isDragging) return;

  //     const newX = e.clientX - dragOffset.x;
  //     const newY = e.clientY - dragOffset.y;

  //     // Constrain to viewport bounds
  //     const maxX = window.innerWidth - 400; // minWidth of the bar
  //     const maxY = window.innerHeight - 80; // height of the bar

  //     setDragPosition({
  //       x: Math.max(0, Math.min(newX, maxX)),
  //       y: Math.max(0, Math.min(newY, maxY)),
  //     });
  //   };

  //   if (isDragging) {
  //     document.addEventListener("mousemove", handleDragMove);
  //     document.addEventListener("mouseup", handleBarDragEnd);
  //     document.body.style.cursor = "grabbing";
  //     document.body.style.userSelect = "none";
  //   } else {
  //     document.removeEventListener("mousemove", handleDragMove);
  //     document.removeEventListener("mouseup", handleBarDragEnd);
  //     document.body.style.cursor = "";
  //     document.body.style.userSelect = "";
  //   }

  //   return () => {
  //     document.removeEventListener("mousemove", handleDragMove);
  //     document.removeEventListener("mouseup", handleBarDragEnd);
  //     document.body.style.cursor = "";
  //     document.body.style.userSelect = "";
  //   };
  // }, [isDragging, dragOffset]);

  // Set current date when create row is shown
  useEffect(() => {
    if (showCreateRow && !newTaskCreated) {
      const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
      setNewTaskCreated(currentDate);
    }
  }, [showCreateRow, newTaskCreated, setNewTaskCreated]);

  // Add click outside handler for status dropdown in table
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // Check if clicking inside any status dropdown
      const statusDropdowns = document.querySelectorAll(
        ".custom-status-dropdown"
      );
      const isInsideStatusDropdown = Array.from(statusDropdowns).some(
        (dropdown) => dropdown.contains(target)
      );

      // Check if clicking on status badge (to prevent closing when opening)
      const isStatusBadge =
        target instanceof HTMLElement &&
        (target.classList.contains("status-badge") ||
          target.closest(".status-badge"));

      // Check if clicking on color picker
      const isColorPicker =
        target instanceof HTMLInputElement && target.type === "color";
      const isInsideColorPicker =
        target instanceof HTMLElement &&
        (target.closest('input[type="color"]') ||
          target.closest('[role="dialog"]'));

      if (
        !isInsideStatusDropdown &&
        !isStatusBadge &&
        !isColorPicker &&
        !isInsideColorPicker
      ) {
        // Close status dropdown if clicking outside
        if (statusEdit) {
          setStatusEdit(null);
        }

        // Close add status form if clicking outside
        if (showAddStatusTable) {
          setShowAddStatusTable(null);
          setNewStatusNameTable("");
          setNewStatusColorTable("#888888");
        }

        // Close editing status if clicking outside
        if (editingStatusIdx !== null) {
          setEditingStatusIdx(null);
          setEditStatusName("");
          setEditStatusColor("#888888");
        }
      }
    }

    // Only add listener if any dropdown is open
    if (statusEdit || showAddStatusTable || editingStatusIdx !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    statusEdit,
    showAddStatusTable,
    editingStatusIdx,
    setStatusEdit,
    setShowAddStatusTable,
    setNewStatusNameTable,
    setNewStatusColorTable,
    setEditingStatusIdx,
    setEditStatusName,
    setEditStatusColor,
  ]);

  // 1. Add updateTaskAPI function (copy from TaskBoard.tsx, adjust as needed)
  async function updateTaskAPI(task: Task) {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);
    const payload = {
      data: {
        record_id: task.id,
        feature_name: "task_status_management",
        fields_to_update: {
          more_data: {
            ...task.more_data,
            assigned_to: isUser(task.assigned_to)
              ? task.assigned_to.record_id
              : "id" in (task.assigned_to as { id: string })
              ? (task.assigned_to as { id: string }).id
              : task.more_data?.assigned_to || "",
            task_status: task.status,
            status_updated_date: dateStr,
            status_updated_time: timeStr,
          },
        },
      },
      dataset: "feature_data",
    };
    const response = await fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-TYPE": "update" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Task update failed");
    }
    // Log task update
    try {
      await sendLog({
        data: {
          record_id: `activity_log_${Date.now()}`,
          feature_name: "activity_logs",
          added_by: loggedUser?.record_id || "system",
          record_status: "active",
          created_on_date: dateStr,
          feature_data: {
            record_data: [
              { record_label: "category", record_value_text: "task", record_type: "type_text" },
              { record_label: "user_id", record_value_text: loggedUser?.record_id || "", record_type: "type_text" },
              { record_label: "user_role", record_value_text: loggedUser?.role_id || "", record_type: "type_text" },
              { record_label: "action", record_value_text: "update", record_type: "type_text" },
              { record_label: "record_id", record_value_text: task.id, record_type: "type_text" },
            ],
          },
          more_data: {},
        },
        dataset: "feature_data",
      });
    } catch (logErr) {
      console.error("Failed to log task update", logErr);
    }
    return response.json();
  }

  // Handle drag start for save bar
  // const handleSaveBarDragStart = (e: React.MouseEvent) => {
  //   setIsDragging(true);
  //   const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  //   setDragOffset({
  //     x: e.clientX - rect.left,
  //     y: e.clientY - rect.top,
  //   });
  // };
  // const handleSaveBarDragEnd = () => setIsDragging(false);
  // useEffect(() => {
  //   const handleDragMove = (e: MouseEvent) => {
  //     if (!isDragging) return;
  //     const newX = e.clientX - dragOffset.x;
  //     const newY = e.clientY - dragOffset.y;
  //     const maxX = window.innerWidth - 400;
  //     const maxY = window.innerHeight - 80;
  //     setDragPosition({
  //       x: Math.max(0, Math.min(newX, maxX)),
  //       y: Math.max(0, Math.min(newY, maxY)),
  //     });
  //   };
  //   if (isDragging) {
  //     document.addEventListener("mousemove", handleDragMove);
  //     document.addEventListener("mouseup", handleSaveBarDragEnd);
  //     document.body.style.cursor = "grabbing";
  //     document.body.style.userSelect = "none";
  //   } else {
  //     document.removeEventListener("mousemove", handleDragMove);
  //     document.removeEventListener("mouseup", handleSaveBarDragEnd);
  //     document.body.style.cursor = "";
  //     document.body.style.userSelect = "";
  //   }
  //   return () => {
  //     document.removeEventListener("mousemove", handleDragMove);
  //     document.removeEventListener("mouseup", handleSaveBarDragEnd);
  //     document.body.style.cursor = "";
  //     document.body.style.userSelect = "";
  //   };
  // }, [isDragging, dragOffset]);

  console.log("tasks from list component for testing", tasks);

  // Before the return statement, add this effect to set default assignee to first member
  const currentUserFullName = loggedUser?.profile_information?.full_name;
  const filteredUserOptions = userOptions.filter(
    (u) => u.name !== currentUserFullName
  );

  console.log("current user name", currentUserFullName);

  const user = useSelector((state: RootState) => state.user.user);

  // Add or update this function in ListView
  const handleStatusDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    if (result.type !== "COLUMN") return;
    const items = Array.from(statusOptions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setStatusOptions(items); // Optimistically update UI immediately
    try {
      await updateSprintStatusAPI(selectedSprintId, items);
      if (typeof props.onStatusOrderChanged === "function") {
        props.onStatusOrderChanged(); // Ask parent to fetch latest sprint data
      }
    } catch (err) {
      alert("Failed to update status order: " + (err as Error).message);
    }
    if (statusEdit?.id) {
      setStatusEdit(null);
      setTimeout(() => setStatusEdit({ id: statusEdit.id }), 0);
    }
  };

  console.log("mapped tasks", mappedTasks);

  // Wrap the original handleAddTask to prevent double submission
  const handleAddTaskWrapper = async () => {
    if (isSavingNewTask) return; // Prevent double submission
    setIsSavingNewTask(true);
    try {
      await props.handleAddTask();
      // After saving and if still in create mode, re-focus summary input
      if (showCreateRow) {
        setTimeout(() => {
          summaryInputRef.current?.focus();
        }, 0);
      }
    } finally {
      setIsSavingNewTask(false);
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
        .status-row .status-edit-icon {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .status-row:hover .status-edit-icon {
          opacity: 1;
        }
        .close-create-task-btn:hover {
          background: #e0e0e0 !important;
          color: #222 !important;
        }
      `}</style>
      <div className="table-responsive">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable
            droppableId="tasks"
            renderClone={(provided, snapshot, rubric) => {
              const task = mappedTasks[rubric.source.index];
              const statusId = task.status;
              const statusOption = getStatusOption(statusId);
              const badgeColor =
                statusOption && typeof statusOption.color === "string"
                  ? statusOption.color
                  : "#888888";
              return (
                <table
                  className="sharath3"
                  style={{ tableLayout: "fixed", width: "100%" }}
                >
                  <tbody>
                    <tr
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                        borderBottom: "1px solid #dee2e6",
                        backgroundColor: "#f8f9fa",
                        opacity: 0.5,
                      }}
                    >
                      <td
                        {...provided.dragHandleProps}
                        className=""
                        style={{
                          cursor: "grab",
                          borderRight: "1px solid #dee2e6",
                          padding: "12px 8px",
                          minWidth: "50px",
                          width: "50px",
                        }}
                      >
                        <div className="d-flex justify-content-center align-items-center">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="text-muted"
                          >
                            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                          </svg>
                        </div>
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid #dee2e6",
                          padding: "12px 8px",
                          width: "300px",
                          maxWidth: 220,
                          minWidth: 120,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          cursor: "pointer",
                          position: "relative",
                          textAlign: "left",
                          verticalAlign: "middle",
                        }}
                        onClick={() => setModalTask(task)}
                      >
                        <TooltipEllipsisCell
                          text={task.summary || "-"}
                          maxWidth={
                            task.checklist && task.checklist.length > 0
                              ? "85%"
                              : "100%"
                          }
                        />
                        {task.checklist && task.checklist.length > 0 && (
                          <span
                            style={{
                              position: "absolute",
                              right: 8,
                              top: "50%",
                              transform: "translateY(-50%)",
                              display: "flex",
                              alignItems: "center",
                              fontSize: 13,
                              color: "#6c757d",
                            }}
                          >
                            <i
                              className="bi bi-check2-square me-1"
                              style={{
                                color:
                                  task.checklist.length > 0 &&
                                  task.checklist.every((item) => item.checked)
                                    ? "#43aa8b"
                                    : "#6c757d",
                              }}
                            ></i>
                            {`${
                              task.checklist.filter((item) => item.checked)
                                .length
                            }/${task.checklist.length}`}
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid #dee2e6",
                          padding: "12px 8px",
                          width: "300px",
                          maxWidth: 220,
                          minWidth: 120,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          cursor: "pointer",
                          textAlign: "left",
                          verticalAlign: "middle",
                        }}
                        onClick={() => setModalTask(task)}
                      >
                        <TooltipEllipsisCell
                          text={task.description || "-"}
                          maxWidth="100%"
                        />
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid #dee2e6",
                          padding: "12px 8px",
                          width: "140px",
                          position: "relative",
                        }}
                      >
                        <div style={{ display: "inline-block", width: "100%" }}>
                          <span
                            className="badge status-badge"
                            style={{
                              background: badgeColor,
                              color: "#fff",
                              cursor: "pointer",
                              fontWeight: 500,
                              fontSize: 13,
                              borderRadius: 8,
                              padding: "5px 8px",
                              display: "inline-block",
                              textAlign: "center",
                            }}
                            onClick={() => {
                              console.log(
                                "Status badge clicked for task",
                                task.id
                              );
                              setStatusEdit({ id: task.id });
                            }}
                          >
                            {statusOption ? statusOption.name : "Unknown"}
                            <i
                              className="bi bi-caret-down-fill"
                              style={{
                                marginLeft: 6,
                                fontSize: 12,
                                verticalAlign: "middle",
                                color: "#fff",
                                opacity: 0.7,
                              }}
                            ></i>
                          </span>
                        </div>
                        {statusEdit?.id === task.id && (
                          <div
                            className="custom-status-dropdown"
                            style={{
                              position: "absolute",
                              left: 0,
                              top: "100%",
                              background: "#fff",
                              zIndex: 100000,
                              minWidth: 185,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                              border: "2px solid red",
                              borderRadius: 8,
                              padding: 0,
                              margin: 0,
                              overflow: "hidden",
                            }}
                          >
                            {/* Only render DragDropContext for status options when dropdown is open */}
                            <DragDropContext onDragEnd={handleStatusDragEnd}>
                              <Droppable
                                droppableId="statusOptions"
                                type="COLUMN"
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    style={{
                                      width: "100%",
                                      maxHeight: 220,
                                      overflowY: "auto",
                                    }}
                                  >
                                    {statusOptions.map((opt, idx) => {
                                      if (!opt) return null;
                                      let content;
                                      if (editingStatusIdx === idx) {
                                        content = (
                                          <form
                                            ref={editStatusFormRef}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 8,
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            onSubmit={async (e) => {
                                              e.preventDefault();
                                              if (!editStatusName.trim())
                                                return;
                                              const updatedStatusList =
                                                statusOptions.map((s) =>
                                                  s.id === opt.id
                                                    ? {
                                                        ...s,
                                                        name: editStatusName,
                                                        color: editStatusColor,
                                                      }
                                                    : s
                                                );
                                              setStatusOptions(
                                                updatedStatusList
                                              );
                                              setEditingStatusIdx(null);
                                              setEditStatusName("");
                                              setEditStatusColor("#888888");
                                              try {
                                                await updateSprintStatusAPI(
                                                  selectedSprintId,
                                                  updatedStatusList
                                                );
                                              } catch (err) {
                                                // Optionally show error
                                                console.log(err);
                                              }
                                            }}
                                          >
                                            <input
                                              type="text"
                                              value={editStatusName}
                                              onChange={(e) =>
                                                setEditStatusName(
                                                  e.target.value
                                                )
                                              }
                                              style={{
                                                fontSize: 13,
                                                padding: "2px 6px",
                                                borderRadius: 4,
                                                border: "1px solid #ccc",
                                                width: 80,
                                              }}
                                              required
                                              autoFocus
                                            />
                                            <input
                                              type="color"
                                              value={editStatusColor}
                                              onChange={(e) =>
                                                setEditStatusColor(
                                                  e.target.value
                                                )
                                              }
                                              onMouseDown={(e) =>
                                                e.stopPropagation()
                                              }
                                              style={{
                                                width: 24,
                                                height: 24,
                                                border: "none",
                                                background: "none",
                                              }}
                                            />
                                            <button
                                              type="submit"
                                              className="btn btn-sm btn-primary"
                                              style={{
                                                fontSize: 13,
                                                padding: "2px 8px",
                                              }}
                                            >
                                              Save
                                            </button>
                                          </form>
                                        );
                                      } else {
                                        content = (
                                          <span
                                            style={{
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                            }}
                                            onClick={() => {
                                              if (task.status !== opt.id) {
                                                setOriginalStatus(task.status);
                                                setPendingStatusTaskId(task.id);
                                                setTasks((prev) =>
                                                  prev.map((t) =>
                                                    t.id === task.id ||
                                                    (typeof t.record_id !==
                                                      "undefined" &&
                                                      t.record_id === task.id)
                                                      ? {
                                                          ...t,
                                                          status: opt.id,
                                                          more_data: {
                                                            ...t.more_data,
                                                            task_status: opt.id,
                                                          },
                                                        }
                                                      : t
                                                  )
                                                );
                                                setEditingStatusTaskId(task.id);
                                                setShowSaveBar(true);
                                              }
                                              setStatusEdit(null);
                                            }}
                                          >
                                            {opt.name}
                                          </span>
                                        );
                                      }
                                      return (
                                        <Draggable
                                          key={opt.id}
                                          draggableId={opt.id}
                                          index={idx}
                                        >
                                          {(provided) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className="status-row"
                                              style={{
                                                background: "none",
                                                color: "#222",
                                                cursor: "pointer",
                                                padding: "8px 16px",
                                                fontWeight:
                                                  opt.id === task.status
                                                    ? 700
                                                    : 400,
                                                fontSize: 12,
                                                textAlign: "left",
                                                border: "none",
                                                outline: "none",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0,
                                                ...provided.draggableProps
                                                  .style,
                                              }}
                                              onMouseOver={(e) =>
                                                (e.currentTarget.style.background =
                                                  "#f5f5f5")
                                              }
                                              onMouseOut={(e) =>
                                                (e.currentTarget.style.background =
                                                  "none")
                                              }
                                            >
                                              <div
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  width: "100%",
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    flex: 1,
                                                    minWidth: 0,
                                                  }}
                                                >
                                                  <i
                                                    className="bi bi-circle-fill"
                                                    style={{
                                                      color:
                                                        opt &&
                                                        typeof opt.color ===
                                                          "string"
                                                          ? opt.color
                                                          : "#888888",
                                                      fontSize: 13,
                                                      marginRight: 10,
                                                    }}
                                                  ></i>
                                                  {content}
                                                </div>
                                                {/* Always show the pencil icon, not just on hover */}
                                                {editingStatusIdx !== idx && (
                                                  <i
                                                    className="bi bi-pencil ms-2 status-edit-icon"
                                                    style={{
                                                      fontSize: 14,
                                                      color: "#888",
                                                      cursor: "pointer",
                                                      display: "inline-block",
                                                    }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOriginalStatusOptions(
                                                        statusOptions
                                                      );
                                                      setEditingStatusIdx(idx);
                                                      setEditStatusName(
                                                        opt.name
                                                      );
                                                      setEditStatusColor(
                                                        opt.color
                                                      );
                                                    }}
                                                    title="Edit status"
                                                  ></i>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </Draggable>
                                      );
                                    })}
                                    {/* Add new status */}
                                    <div style={{ padding: "8px 16px" }}>
                                      {!showAddStatusTable ||
                                      statusEdit?.id !== task.id ? (
                                        <button
                                          className="btn btn-link p-0"
                                          style={{
                                            color: "#007bff",
                                            fontSize: 14,
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowAddStatusTable(task.id);
                                          }}
                                        >
                                          + Add
                                        </button>
                                      ) : (
                                        <form
                                          ref={addStatusFormRef}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          onSubmit={async (e) => {
                                            e.preventDefault();
                                            if (!newStatusNameTable.trim())
                                              return;
                                            // Find the highest numeric id in statusOptions
                                            const maxId = statusOptions
                                              .map((opt) =>
                                                parseInt(opt.id, 10)
                                              )
                                              .filter((n) => !isNaN(n))
                                              .reduce(
                                                (max, n) => Math.max(max, n),
                                                0
                                              );
                                            const newId = (maxId + 1)
                                              .toString()
                                              .padStart(3, "0");
                                            const newStatus = {
                                              id: newId,
                                              name: newStatusNameTable,
                                              color: newStatusColorTable,
                                            };
                                            const updatedStatusList = [
                                              ...statusOptions,
                                              newStatus,
                                            ];
                                            setOriginalStatusOptions(
                                              statusOptions
                                            );
                                            setPendingStatusOptions(
                                              updatedStatusList
                                            );
                                            setStatusOptions(updatedStatusList);
                                            setShowAddStatusTable(null);
                                            setNewStatusNameTable("");
                                            setNewStatusColorTable("#888888");
                                            setStatusEdit(null);
                                            setShowSaveBar(true);
                                            try {
                                              await updateSprintStatusAPI(
                                                selectedSprintId,
                                                updatedStatusList
                                              );
                                              if (
                                                typeof props.onStatusOrderChanged ===
                                                "function"
                                              ) {
                                                props.onStatusOrderChanged();
                                              }
                                            } catch (err) {
                                              alert(
                                                "Failed to add new status: " +
                                                  (err as Error).message
                                              );
                                              // Optionally, revert state here if needed
                                            }
                                          }}
                                        >
                                          <input
                                            type="text"
                                            value={newStatusNameTable}
                                            onChange={(e) =>
                                              setNewStatusNameTable(
                                                e.target.value
                                              )
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                            placeholder="Status name"
                                            style={{
                                              fontSize: 13,
                                              padding: "2px 6px",
                                              borderRadius: 4,
                                              border: "1px solid #ccc",
                                              width: 80,
                                            }}
                                            required
                                          />
                                          <input
                                            type="color"
                                            value={newStatusColorTable}
                                            onChange={(e) =>
                                              setNewStatusColorTable(
                                                e.target.value
                                              )
                                            }
                                            onMouseDown={(e) =>
                                              e.stopPropagation()
                                            }
                                            style={{
                                              width: 24,
                                              height: 24,
                                              border: "none",
                                              background: "none",
                                            }}
                                          />
                                          <button
                                            type="submit"
                                            className="btn btn-sm btn-primary"
                                            style={{
                                              fontSize: 13,
                                              padding: "2px 8px",
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            Add
                                          </button>
                                        </form>
                                      )}
                                    </div>
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </DragDropContext>
                          </div>
                        )}
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid #dee2e6",
                          padding: "12px 8px",
                        }}
                      >
                        <span className="date-span">
                          <i className="bi bi-calendar-event"></i>{" "}
                          {task.more_data?.due_date
                            ? new Date(
                                task.more_data.due_date
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "-"}
                        </span>
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid #dee2e6",
                          padding: "12px 8px",
                        }}
                      >
                        <span className="date-span2">
                          <i className="bi bi-calendar-event"></i>{" "}
                          {new Date(task.updated).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid #dee2e6",
                          padding: "12px 8px",
                        }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex justify-content-center align-items-center"
                            style={{
                              backgroundColor:
                                (task.assigner && task.assigner.color) ||
                                "#888",
                              width: 30,
                              height: 30,
                              color: "white",
                            }}
                          >
                            {getInitialsFromUser(
                              userDetailsById[
                                String(
                                  (task.more_data &&
                                    task.more_data.assigned_by) ??
                                    ""
                                )
                              ] || {
                                record_id: task.more_data?.assigned_by || "",
                                username: "",
                                role_id: "",
                                name: "",
                                initials: "",
                                color: "",
                              }
                            )}
                          </div>
                          <div>
                            {(() => {
                              const userObj: User | undefined =
                                userDetailsById[
                                  String(
                                    (task.more_data &&
                                      task.more_data.assigned_by) ??
                                      ""
                                  )
                                ];
                              if (
                                userObj &&
                                userObj.profile_information &&
                                userObj.profile_information.full_name
                              ) {
                                return userObj.profile_information.full_name;
                              }
                              return (
                                userObj?.name ||
                                task.more_data?.assigned_by ||
                                "-"
                              );
                            })()}
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px 8px",
                          width: "180px",
                          cursor: "pointer",
                        }}
                        onClick={() => setModalTask(task)}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex justify-content-center align-items-center"
                            style={{
                              backgroundColor:
                                (task.assigned_to && task.assigned_to.color) ||
                                "#888",
                              width: 30,
                              height: 30,
                              color: "white",
                            }}
                          >
                            {getInitialsFromUser(
                              userDetailsById[
                                String(
                                  (task.more_data &&
                                    task.more_data.assigned_to) ??
                                    ""
                                )
                              ] || {
                                record_id:
                                  (task.more_data?.assigned_to === "assigned_to"
                                    ? ""
                                    : task.more_data?.assigned_to) || "",
                                username: "",
                                role_id: "",
                                name: "",
                                initials: "",
                                color: "",
                              }
                            )}
                          </div>
                          <div>
                            {(() => {
                              const assignedTo = task.more_data?.assigned_to;
                              const cleanAssignedTo =
                                assignedTo === "assigned_to" ||
                                !assignedTo ||
                                assignedTo.trim() === ""
                                  ? ""
                                  : assignedTo;
                              const userObj: User | undefined =
                                userDetailsById[String(cleanAssignedTo ?? "")];
                              if (
                                userObj &&
                                userObj.profile_information &&
                                userObj.profile_information.full_name
                              ) {
                                return userObj.profile_information.full_name;
                              }
                              if (
                                !cleanAssignedTo ||
                                cleanAssignedTo.trim() === ""
                              ) {
                                return "Unassigned";
                              }
                              return (
                                userObj?.name || cleanAssignedTo || "Unassigned"
                              );
                            })()}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              );
            }}
          >
            {(provided) => (
              <table
                className="table table-bordered task-table sharath4"
                style={{
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                  width: "100%",
                }}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                <thead className="table-head sticky-top sharath1">
                  <tr>
                    <th
                      style={{
                        width: "50px",
                        textAlign: "center",
                        verticalAlign: "middle",
                      }}
                    >
                      <div className="d-flex justify-content-end align-items-center gap-2">
                        <input
                          type="checkbox"
                          checked={
                            selectedTasks.length === tasks.length &&
                            tasks.length > 0
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    </th>
                    <th style={{ width: "300px", textAlign: "left" }}>
                      Summary
                    </th>
                    <th style={{ width: "300px", textAlign: "left" }}>
                      Description
                    </th>
                    <th style={{ width: "140px", textAlign: "left" }}>
                      Status
                    </th>
                    <th style={{ width: "140px", textAlign: "left" }}>
                      Created
                    </th>
                    <th style={{ width: "140px", textAlign: "left" }}>
                      Updated
                    </th>
                    <th style={{ width: "140px", textAlign: "left" }}>
                      Due Date
                    </th>
                    <th style={{ width: "180px", textAlign: "left" }}>
                      Assignor
                    </th>
                    <th style={{ width: "180px", textAlign: "left" }}>
                      Assignee
                    </th>
                  </tr>
                </thead>
                <tbody className="sharath2">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          textAlign: "start",
                          color: "#888",
                          fontSize: 18,
                          padding: "50px 0",
                        }}
                      >
                        <span>Loading tasks...</span>
                      </td>
                    </tr>
                  ) : !loading &&
                    Array.isArray(mappedTasks) &&
                    mappedTasks.filter(Boolean).length === 0 &&
                    !showCreateRow ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          textAlign: "start",
                          color: "#888",
                          fontSize: 18,
                          padding: "50px 0",
                        }}
                      >
                        No tasks found. Click + to add your first task.
                      </td>
                    </tr>
                  ) : null}
                  {mappedTasks.filter(Boolean).map((task, index) => {
                    if (!task) return null;
                    const statusId = task.status;
                    const statusOption = getStatusOption(statusId);
                    const badgeColor =
                      statusOption && typeof statusOption.color === "string"
                        ? statusOption.color
                        : "#888888";
                    const assignerId =
                      task.more_data &&
                      typeof task.more_data.assigned_by === "string"
                        ? task.more_data.assigned_by
                        : "";
                    const assigneeId =
                      task.more_data &&
                      typeof task.more_data.assigned_to === "string"
                        ? task.more_data.assigned_to
                        : "";
                    // Check if assigneeId is the literal string "assigned_to" and treat it as empty
                    const cleanAssigneeId =
                      assigneeId === "assigned_to" ||
                      !assigneeId ||
                      assigneeId.trim() === ""
                        ? ""
                        : assigneeId;
                    // REMOVE: const summaryTooltip = useEllipsisTooltip(task.summary || "");
                    // REMOVE: const descriptionTooltip = useEllipsisTooltip(task.description || "");
                    return (
                      <Draggable
                        key={task.id || `draggable-${index}`}
                        draggableId={task.id || `draggable-${index}`}
                        index={index}
                        isDragDisabled={!!statusEdit} // Disable drag if status dropdown is open
                      >
                        {(provided) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                              borderBottom: "1px solid #dee2e6",
                              backgroundColor: provided.draggableProps.style
                                ?.transform
                                ? "#f0f8ff"
                                : "transparent",
                              boxShadow: provided.draggableProps.style
                                ?.transform
                                ? "0 4px 8px rgba(0,0,0,0.1)"
                                : "none",
                              transform:
                                provided.draggableProps.style?.transform,
                              zIndex: provided.draggableProps.style?.transform
                                ? 1000
                                : "auto",
                              transition:
                                "background-color 0.2s ease, box-shadow 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!provided.draggableProps.style?.transform) {
                                e.currentTarget.style.backgroundColor =
                                  "#f8f9fa";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!provided.draggableProps.style?.transform) {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }
                            }}
                          >
                            <td
                              {...provided.dragHandleProps}
                              style={{
                                cursor: provided.draggableProps.style?.transform
                                  ? "grabbing"
                                  : "grab",
                                borderRight: "1px solid #dee2e6",
                                padding: "12px 8px",
                                minWidth: "50px",
                                width: "50px",
                                textAlign: "center",
                                verticalAlign: "middle",
                                backgroundColor: provided.draggableProps.style
                                  ?.transform
                                  ? "#f0f0f0"
                                  : "transparent",
                                transition: "background-color 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                if (!provided.draggableProps.style?.transform) {
                                  e.currentTarget.style.backgroundColor =
                                    "#f8f9fa";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!provided.draggableProps.style?.transform) {
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                }
                              }}
                            >
                              <div className="d-flex justify-content-center align-items-center gap-2">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="text-muted"
                                  style={{
                                    opacity: provided.draggableProps.style
                                      ?.transform
                                      ? 1
                                      : 0.6,
                                    transform: provided.draggableProps.style
                                      ?.transform
                                      ? "scale(1.1)"
                                      : "scale(1)",
                                    transition:
                                      "opacity 0.2s ease, transform 0.2s ease",
                                    animation: provided.draggableProps.style
                                      ?.transform
                                      ? "pulse 1s infinite"
                                      : "none",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (
                                      !provided.draggableProps.style?.transform
                                    ) {
                                      e.currentTarget.style.opacity = "1";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (
                                      !provided.draggableProps.style?.transform
                                    ) {
                                      e.currentTarget.style.opacity = "0.6";
                                    }
                                  }}
                                >
                                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                                </svg>
                                <input
                                  type="checkbox"
                                  checked={selectedTasks.includes(task.id)}
                                  onChange={(e) =>
                                    handleSelectTask(task.id, e.target.checked)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ cursor: "pointer" }}
                                />
                              </div>
                            </td>
                            <td
                              style={{
                                borderRight: "1px solid #dee2e6",
                                padding: "12px 8px",
                                cursor: "pointer",
                                position: "relative",
                                textAlign: "left",
                                verticalAlign: "middle",
                                maxWidth: 220,
                                minWidth: 120,
                                width: 220,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              onClick={() => setModalTask(task)}
                            >
                              <TooltipEllipsisCell
                                text={task.summary || "-"}
                                maxWidth={
                                  task.checklist && task.checklist.length > 0
                                    ? "85%"
                                    : "100%"
                                }
                              />
                              {task.checklist && task.checklist.length > 0 && (
                                <span
                                  style={{
                                    position: "absolute",
                                    right: 8,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    display: "flex",
                                    alignItems: "center",
                                    fontSize: 13,
                                    color: "#6c757d",
                                  }}
                                >
                                  <i
                                    className="bi bi-check2-square me-1"
                                    style={{
                                      color:
                                        task.checklist.length > 0 &&
                                        task.checklist.every(
                                          (item) => item.checked
                                        )
                                          ? "#43aa8b"
                                          : "#6c757d",
                                    }}
                                  ></i>
                                  {`${
                                    task.checklist.filter(
                                      (item) => item.checked
                                    ).length
                                  }/${task.checklist.length}`}
                                </span>
                              )}
                            </td>
                            <td
                              style={{
                                borderRight: "1px solid #dee2e6",
                                padding: "12px 8px",
                                textAlign: "left",
                                verticalAlign: "middle",
                                cursor: "pointer",
                                maxWidth: 220,
                                minWidth: 120,
                                width: 220,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              onClick={() => setModalTask(task)}
                            >
                              <TooltipEllipsisCell
                                text={task.description || "-"}
                                maxWidth="100%"
                              />
                            </td>
                            <td
                              style={{
                                borderRight: "1px solid #dee2e6",
                                padding: "12px 8px",
                                position: "relative",
                                textAlign: "left",
                                verticalAlign: "middle",
                              }}
                            >
                              <div
                                style={{
                                  display: "inline-block",
                                  width: "100%",
                                }}
                              >
                                <span
                                  className="badge status-badge"
                                  style={{
                                    background: badgeColor,
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontWeight: 500,
                                    fontSize: 13,
                                    borderRadius: 8,
                                    padding: "5px 8px",
                                    display: "inline-block",
                                    textAlign: "center",
                                  }}
                                  onClick={() => {
                                    console.log(
                                      "Status badge clicked for task",
                                      task.id
                                    );
                                    setStatusEdit({ id: task.id });
                                  }}
                                >
                                  {statusOption ? statusOption.name : "Unknown"}
                                  <i
                                    className="bi bi-caret-down-fill"
                                    style={{
                                      marginLeft: 6,
                                      fontSize: 12,
                                      verticalAlign: "middle",
                                      color: "#fff",
                                      opacity: 0.7,
                                    }}
                                  ></i>
                                </span>
                              </div>
                              {statusEdit?.id === task.id && (
                                <div
                                  className="custom-status-dropdown"
                                  style={{
                                    position: "absolute",
                                    left: 0,
                                    top: "100%",
                                    zIndex: 100000,
                                    background: "#fff",
                                    minWidth: 185,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                                    border: "2px solid red",
                                    borderRadius: 8,
                                    padding: 0,
                                    margin: 0,
                                    overflow: "hidden",
                                  }}
                                >
                                  {/* Only render DragDropContext for status options when dropdown is open */}
                                  <DragDropContext
                                    onDragEnd={handleStatusDragEnd}
                                  >
                                    <Droppable
                                      droppableId="statusOptions"
                                      type="COLUMN"
                                    >
                                      {(provided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.droppableProps}
                                          style={{
                                            width: "100%",
                                            maxHeight: 220,
                                            overflowY: "auto",
                                          }}
                                        >
                                          {statusOptions.map((opt, idx) => {
                                            if (!opt) return null;
                                            let content;
                                            if (editingStatusIdx === idx) {
                                              content = (
                                                <form
                                                  ref={editStatusFormRef}
                                                  style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                  }}
                                                  onClick={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                  onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    if (!editStatusName.trim())
                                                      return;
                                                    const updatedStatusList =
                                                      statusOptions.map((s) =>
                                                        s.id === opt.id
                                                          ? {
                                                              ...s,
                                                              name: editStatusName,
                                                              color:
                                                                editStatusColor,
                                                            }
                                                          : s
                                                      );
                                                    setStatusOptions(
                                                      updatedStatusList
                                                    );
                                                    setEditingStatusIdx(null);
                                                    setEditStatusName("");
                                                    setEditStatusColor(
                                                      "#888888"
                                                    );
                                                    try {
                                                      await updateSprintStatusAPI(
                                                        selectedSprintId,
                                                        updatedStatusList
                                                      );
                                                    } catch (err) {
                                                      // Optionally show error
                                                      console.log(err);
                                                    }
                                                  }}
                                                >
                                                  <input
                                                    type="text"
                                                    value={editStatusName}
                                                    onChange={(e) =>
                                                      setEditStatusName(
                                                        e.target.value
                                                      )
                                                    }
                                                    style={{
                                                      fontSize: 13,
                                                      padding: "2px 6px",
                                                      borderRadius: 4,
                                                      border: "1px solid #ccc",
                                                      width: 80,
                                                    }}
                                                    required
                                                    autoFocus
                                                  />
                                                  <input
                                                    type="color"
                                                    value={editStatusColor}
                                                    onChange={(e) =>
                                                      setEditStatusColor(
                                                        e.target.value
                                                      )
                                                    }
                                                    onMouseDown={(e) =>
                                                      e.stopPropagation()
                                                    }
                                                    style={{
                                                      width: 24,
                                                      height: 24,
                                                      border: "none",
                                                      background: "none",
                                                    }}
                                                  />
                                                  <button
                                                    type="submit"
                                                    className="btn btn-sm btn-primary"
                                                    style={{
                                                      fontSize: 13,
                                                      padding: "2px 8px",
                                                    }}
                                                  >
                                                    Save
                                                  </button>
                                                </form>
                                              );
                                            } else {
                                              content = (
                                                <span
                                                  style={{
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                  }}
                                                  onClick={() => {
                                                    if (
                                                      task.status !== opt.id
                                                    ) {
                                                      setOriginalStatus(
                                                        task.status
                                                      );
                                                      setPendingStatusTaskId(
                                                        task.id
                                                      );
                                                      setTasks((prev) =>
                                                        prev.map((t) =>
                                                          t.id === task.id ||
                                                          (typeof t.record_id !==
                                                            "undefined" &&
                                                            t.record_id ===
                                                              task.id)
                                                            ? {
                                                                ...t,
                                                                status: opt.id,
                                                                more_data: {
                                                                  ...t.more_data,
                                                                  task_status:
                                                                    opt.id,
                                                                },
                                                              }
                                                            : t
                                                        )
                                                      );
                                                      setEditingStatusTaskId(
                                                        task.id
                                                      );
                                                      setShowSaveBar(true);
                                                    }
                                                    setStatusEdit(null);
                                                  }}
                                                >
                                                  {opt.name}
                                                </span>
                                              );
                                            }
                                            return (
                                              <Draggable
                                                key={opt.id}
                                                draggableId={opt.id}
                                                index={idx}
                                              >
                                                {(provided) => (
                                                  <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="status-row"
                                                    style={{
                                                      background: "none",
                                                      color: "#222",
                                                      cursor: "pointer",
                                                      padding: "8px 16px",
                                                      fontWeight:
                                                        opt.id === task.status
                                                          ? 700
                                                          : 400,
                                                      fontSize: 12,
                                                      textAlign: "left",
                                                      border: "none",
                                                      outline: "none",
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: 0,
                                                      ...provided.draggableProps
                                                        .style,
                                                    }}
                                                    onMouseOver={(e) =>
                                                      (e.currentTarget.style.background =
                                                        "#f5f5f5")
                                                    }
                                                    onMouseOut={(e) =>
                                                      (e.currentTarget.style.background =
                                                        "none")
                                                    }
                                                  >
                                                    <div
                                                      style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        width: "100%",
                                                      }}
                                                    >
                                                      <div
                                                        style={{
                                                          display: "flex",
                                                          alignItems: "center",
                                                          flex: 1,
                                                          minWidth: 0,
                                                        }}
                                                      >
                                                        <i
                                                          className="bi bi-circle-fill"
                                                          style={{
                                                            color:
                                                              opt &&
                                                              typeof opt.color ===
                                                                "string"
                                                                ? opt.color
                                                                : "#888888",
                                                            fontSize: 13,
                                                            marginRight: 10,
                                                          }}
                                                        ></i>
                                                        {content}
                                                      </div>
                                                      {/* Always show the pencil icon, not just on hover */}
                                                      {editingStatusIdx !==
                                                        idx && (
                                                        <i
                                                          className="bi bi-pencil ms-2 status-edit-icon"
                                                          style={{
                                                            fontSize: 14,
                                                            color: "#888",
                                                            cursor: "pointer",
                                                            display:
                                                              "inline-block",
                                                          }}
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOriginalStatusOptions(
                                                              statusOptions
                                                            );
                                                            setEditingStatusIdx(
                                                              idx
                                                            );
                                                            setEditStatusName(
                                                              opt.name
                                                            );
                                                            setEditStatusColor(
                                                              opt.color
                                                            );
                                                          }}
                                                          title="Edit status"
                                                        ></i>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                              </Draggable>
                                            );
                                          })}
                                          {/* Add new status */}
                                          <div style={{ padding: "8px 16px" }}>
                                            {!showAddStatusTable ||
                                            statusEdit?.id !== task.id ? (
                                              <button
                                                className="btn btn-link p-0"
                                                style={{
                                                  color: "#007bff",
                                                  fontSize: 14,
                                                }}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setShowAddStatusTable(
                                                    task.id
                                                  );
                                                }}
                                              >
                                                + Add
                                              </button>
                                            ) : (
                                              <form
                                                ref={addStatusFormRef}
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 8,
                                                }}
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                                onSubmit={async (e) => {
                                                  e.preventDefault();
                                                  if (
                                                    !newStatusNameTable.trim()
                                                  )
                                                    return;
                                                  // Find the highest numeric id in statusOptions
                                                  const maxId = statusOptions
                                                    .map((opt) =>
                                                      parseInt(opt.id, 10)
                                                    )
                                                    .filter((n) => !isNaN(n))
                                                    .reduce(
                                                      (max, n) =>
                                                        Math.max(max, n),
                                                      0
                                                    );
                                                  const newId = (maxId + 1)
                                                    .toString()
                                                    .padStart(3, "0");
                                                  const newStatus = {
                                                    id: newId,
                                                    name: newStatusNameTable,
                                                    color: newStatusColorTable,
                                                  };
                                                  const updatedStatusList = [
                                                    ...statusOptions,
                                                    newStatus,
                                                  ];
                                                  setOriginalStatusOptions(
                                                    statusOptions
                                                  );
                                                  setPendingStatusOptions(
                                                    updatedStatusList
                                                  );
                                                  setStatusOptions(
                                                    updatedStatusList
                                                  );
                                                  setShowAddStatusTable(null);
                                                  setNewStatusNameTable("");
                                                  setNewStatusColorTable(
                                                    "#888888"
                                                  );
                                                  setStatusEdit(null);
                                                  setShowSaveBar(true);
                                                  try {
                                                    await updateSprintStatusAPI(
                                                      selectedSprintId,
                                                      updatedStatusList
                                                    );
                                                    if (
                                                      typeof props.onStatusOrderChanged ===
                                                      "function"
                                                    ) {
                                                      props.onStatusOrderChanged();
                                                    }
                                                  } catch (err) {
                                                    alert(
                                                      "Failed to add new status: " +
                                                        (err as Error).message
                                                    );
                                                    // Optionally, revert state here if needed
                                                  }
                                                }}
                                              >
                                                <input
                                                  type="text"
                                                  value={newStatusNameTable}
                                                  onChange={(e) =>
                                                    setNewStatusNameTable(
                                                      e.target.value
                                                    )
                                                  }
                                                  onClick={(e) => e.stopPropagation()}
                                                  placeholder="Status name"
                                                  style={{
                                                    fontSize: 13,
                                                    padding: "2px 6px",
                                                    borderRadius: 4,
                                                    border: "1px solid #ccc",
                                                    width: 80,
                                                  }}
                                                  required
                                                />
                                                <input
                                                  type="color"
                                                  value={newStatusColorTable}
                                                  onChange={(e) =>
                                                    setNewStatusColorTable(
                                                      e.target.value
                                                    )
                                                  }
                                                  onMouseDown={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                  style={{
                                                    width: 24,
                                                    height: 24,
                                                    border: "none",
                                                    background: "none",
                                                  }}
                                                />
                                                <button
                                                  type="submit"
                                                  className="btn btn-sm btn-primary"
                                                  style={{
                                                    fontSize: 13,
                                                    padding: "2px 8px",
                                                  }}
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  Add
                                                </button>
                                              </form>
                                            )}
                                          </div>
                                          {provided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                  </DragDropContext>
                                </div>
                              )}
                            </td>
                            <td
                              style={{
                                borderRight: "1px solid #dee2e6",
                                padding: "12px 8px",
                              }}
                            >
                              <span className="date-span2">
                                {/* <i className="bi bi-calendar-event"></i>{" "} */}
                                {task.created
                                  ? new Date(
                                      task.created || ""
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "-"}
                              </span>
                            </td>
                            <td
                              style={{
                                borderRight: "1px solid #dee2e6",
                                padding: "12px 8px",
                              }}
                            >
                              <span className="date-span2">
                                {/* <i className="bi bi-calendar-event"></i>{" "} */}
                                {task.updated
                                  ? new Date(
                                      task.updated || ""
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "-"}
                              </span>
                            </td>
                            <td
                              onClick={() => setModalTask(task)}
                              style={{
                                borderRight: "1px solid #dee2e6",
                                padding: "12px 8px",
                                cursor: "pointer",
                              }}
                            >
                              <span className="date-span">
                                <i className="bi bi-calendar-event"></i>{" "}
                                {task.more_data?.due_date || task.dueDate
                                  ? new Date(
                                      task.more_data?.due_date ||
                                        task.dueDate ||
                                        ""
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "-"}
                              </span>
                            </td>
                            <td
                              style={{
                                borderRight: "1px solid #dee2e6",
                                padding: "12px 8px",
                              }}
                            >
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded-circle d-flex justify-content-center align-items-center"
                                  style={{
                                    backgroundColor:
                                      (task.assigner && task.assigner.color) ||
                                      "#888",
                                    width: 30,
                                    height: 30,
                                    color: "white",
                                  }}
                                >
                                  {(() => {
                                    const userObj =
                                      userDetailsById[assignerId || ""];
                                    if (
                                      userObj &&
                                      typeof userObj === "object" &&
                                      "profile_information" in userObj &&
                                      userObj.profile_information &&
                                      typeof userObj.profile_information ===
                                        "object" &&
                                      "full_name" in userObj.profile_information
                                    ) {
                                      return getInitialsFromUser(userObj);
                                    }
                                    return getInitialsFromUser({
                                      record_id: assignerId || "",
                                    });
                                  })()}
                                </div>
                                <div>
                                  {(() => {
                                    const userObj: User | undefined =
                                      userDetailsById[assignerId || ""];
                                    if (
                                      userObj &&
                                      userObj.profile_information &&
                                      userObj.profile_information.full_name
                                    ) {
                                      return userObj.profile_information
                                        .full_name;
                                    }
                                    return userObj?.name || assignerId || "-";
                                  })()}
                                </div>
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "12px 8px",
                                width: "180px",
                                cursor: "pointer",
                              }}
                              onClick={() => setModalTask(task)}
                            >
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded-circle d-flex justify-content-center align-items-center"
                                  style={{
                                    backgroundColor:
                                      (task.assigned_to &&
                                        task.assigned_to.color) ||
                                      "#888",
                                    width: 30,
                                    height: 30,
                                    color: "white",
                                  }}
                                >
                                  {(() => {
                                    const userObj =
                                      userDetailsById[cleanAssigneeId || ""];
                                    if (
                                      userObj &&
                                      typeof userObj === "object" &&
                                      "profile_information" in userObj &&
                                      userObj.profile_information &&
                                      typeof userObj.profile_information ===
                                        "object" &&
                                      "full_name" in userObj.profile_information
                                    ) {
                                      return getInitialsFromUser(userObj);
                                    }
                                    if (
                                      !cleanAssigneeId ||
                                      cleanAssigneeId.trim() === ""
                                    ) {
                                      return (
                                        <i className="fa-regular fa-user"></i>
                                      );
                                    }
                                    return getInitialsFromUser({
                                      record_id: cleanAssigneeId || "",
                                    });
                                  })()}
                                </div>
                                <div>
                                  {(() => {
                                    const userObj: User | undefined =
                                      userDetailsById[cleanAssigneeId || ""];
                                    if (
                                      userObj &&
                                      userObj.profile_information &&
                                      userObj.profile_information.full_name
                                    ) {
                                      return userObj.profile_information
                                        .full_name;
                                    }
                                    if (
                                      !cleanAssigneeId ||
                                      cleanAssigneeId.trim() === ""
                                    ) {
                                      return "Unassigned";
                                    }
                                    return (
                                      userObj?.name ||
                                      cleanAssigneeId ||
                                      "Unassigned"
                                    );
                                  })()}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    );
                  })}

                  {showCreateRow && (
                    <tr
                      style={{
                        borderBottom: "1px solid #dee2e6",
                        background: "#f8f9fa",
                      }}
                    >
                      <td></td>
                      <td>
                        <input
                          ref={summaryInputRef}
                          className="form-control form-control-sm"
                          placeholder="Summary"
                          value={newTaskSummary}
                          onChange={(e) => setNewTaskSummary(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !isSavingNewTask) {
                              e.preventDefault();
                              handleAddTaskWrapper();
                            }
                          }}
                          disabled={isSavingNewTask}
                        />
                      </td>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          placeholder="Description"
                          value={newTaskDescription}
                          onChange={(e) =>
                            setNewTaskDescription(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !isSavingNewTask) {
                              e.preventDefault();
                              handleAddTaskWrapper();
                            }
                          }}
                          disabled={isSavingNewTask}
                        />
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={newTaskStatus}
                          onChange={(e) => setNewTaskStatus(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !isSavingNewTask) {
                              e.preventDefault();
                              handleAddTaskWrapper();
                            }
                          }}
                          disabled={isSavingNewTask}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>-</td>
                      <td>-</td>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          type="date"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !isSavingNewTask) {
                              e.preventDefault();
                              handleAddTaskWrapper();
                            }
                          }}
                          disabled={isSavingNewTask}
                        />
                      </td>
                      <td style={{ position: "relative" }}>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex justify-content-center align-items-center"
                            style={{
                              backgroundColor: "#888888",
                              width: 26,
                              height: 26,
                              color: "white",
                            }}
                          >
                            {(() => {
                              if (
                                user &&
                                typeof user === "object" &&
                                "profile_information" in user &&
                                user.profile_information &&
                                typeof user.profile_information === "object" &&
                                "full_name" in user.profile_information
                              ) {
                                const fullName =
                                  user.profile_information.full_name || "";
                                if (!fullName) return "?";
                                const words = fullName.trim().split(/\s+/);
                                if (words.length === 1)
                                  return words[0].slice(0, 2).toUpperCase();
                                if (words.length > 1)
                                  return (
                                    words[0][0] + words[words.length - 1][0]
                                  ).toUpperCase();
                              }
                              return "?";
                            })()}
                          </div>
                          <div>
                            {(() => {
                              if (
                                user &&
                                typeof user === "object" &&
                                "profile_information" in user &&
                                user.profile_information &&
                                typeof user.profile_information === "object" &&
                                "full_name" in user.profile_information
                              ) {
                                return user.profile_information.full_name;
                              }
                              return "No user";
                            })()}
                          </div>
                        </div>
                      </td>
                      <td style={{ position: "relative" }}>
                        <div
                          className="d-flex align-items-center gap-2"
                          style={{ cursor: isSavingNewTask ? "not-allowed" : "pointer" }}
                          onClick={() => {
                            if (!isSavingNewTask) setShowAssignedToDropdown((v) => !v);
                          }}
                        >
                          <div
                            className="rounded-circle d-flex justify-content-center align-items-center"
                            style={{
                              backgroundColor:
                                newTaskAssignedTo.color || "#888888",
                              width: 26,
                              height: 26,
                              color: "white",
                            }}
                          >
                            {newTaskAssignedTo.record_id &&
                            newTaskAssignedTo.record_id.trim() !== "" ? (
                              newTaskAssignedTo.initials || "?"
                            ) : (
                              <i className="fa-regular fa-user"></i>
                            )}
                          </div>
                          <div>
                            {newTaskAssignedTo.name
                              ? newTaskAssignedTo.name
                              : "Select Assignee"}
                          </div>
                        </div>
                        {showAssignedToDropdown && !isSavingNewTask && (
                          <div
                            className="custom-user-dropdown mt-0"
                            ref={assignedToDropdownRef}
                            style={{
                              position: "absolute",
                              left: 0,
                              top: "100%",
                              zIndex: 20,
                            }}
                          >
                            {filteredUserOptions.map((u) => (
                              <div
                                key={u.id}
                                className="dropdown-user-row d-flex align-items-center gap-2"
                                style={{
                                  cursor: "pointer",
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  background:
                                    u.id === newTaskAssignedTo.record_id
                                      ? "#f0f0f0"
                                      : "transparent",
                                }}
                                onClick={() => {
                                  setNewTaskAssignedTo({
                                    record_id: u.id || "",
                                    username: "",
                                    role_id: "",
                                    name: u.name || "",
                                    initials: u.initials || "",
                                    color: u.color || "#888888",
                                    control_access: undefined,
                                    record_status: undefined,
                                    user_credentials: undefined,
                                    profile_information: undefined,
                                    more_data: undefined,
                                  });
                                  setShowAssignedToDropdown(false);
                                }}
                              >
                                <div
                                  className="rounded-circle d-flex justify-content-center align-items-center"
                                  style={{
                                    backgroundColor: u.color,
                                    width: 26,
                                    height: 26,
                                    color: "white",
                                  }}
                                >
                                  {u.initials}
                                </div>
                                <div className="text-dark">{u.name}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 8px", minWidth: 120 }}></td>
                    </tr>
                  )}
                  {provided.placeholder && (
                    <tr style={{ height: "4px", backgroundColor: "#e3f2fd" }}>
                      <td
                        colSpan={9}
                        style={{ padding: 0, border: "none" }}
                      ></td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* + Create Button */}
      {!showCreateRow && (
        <div className="mt-3">
          <button
            className="btn btn-link"
            style={{
              fontSize: 18,
              color: "#222",
              textDecoration: "none",
            }}
            onClick={() => setShowCreateRow(true)}
          >
            + Create
          </button>
        </div>
      )}

      {/* Save/Cancel Bar for Create */}
      {showCreateRow && (
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
                onClick={handleCancelCreate}
                onMouseDown={(e) => e.stopPropagation()}
                title="Close"
                disabled={isSavingNewTask}
              >
                <i className="bi bi-x-lg"></i>
              </button>
              <span style={{ fontWeight: 500, fontSize: 16 }}>Create Task</span>
            </div>

            <button
              className="btn btn-outline-light text-white btn-sm"
              onClick={handleAddTaskWrapper}
              disabled={isSavingNewTask}
            >
              {isSavingNewTask ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : null}
              Add
            </button>
          </div>
        </div>
      )}

      {/* Save/Cancel Bar */}
      {showSaveBar && editingStatusTaskId && (
        // <div
        //   className="position-fixed"
        //   style={{
        //     left: dragPosition.x || "50%",
        //     top: dragPosition.y || "auto",
        //     bottom: dragPosition.y === 0 ? 32 : "auto",
        //     transform: dragPosition.x === 0 ? "translate(-50%, 0)" : "none",
        //     zIndex: 1050,
        //     minWidth: 350,
        //     background: "#444",
        //     color: "#fff",
        //     borderRadius: 12,
        //     boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
        //     padding: "12px 20px",
        //     display: "flex",
        //     alignItems: "center",
        //     justifyContent: "center",
        //     gap: 32,
        //     cursor: isDragging ? "grabbing" : "grab",
        //     userSelect: "none",
        //   }}
        //   onMouseDown={handleSaveBarDragStart}
        // >
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
                onClick={(e) => {
                  e.stopPropagation();
                  if (pendingStatusOptions && originalStatusOptions) {
                    setStatusOptions(originalStatusOptions);
                    setPendingStatusOptions(null);
                    setOriginalStatusOptions(null);
                  }
                  if (pendingStatusTaskId) {
                    setTasks((prev) =>
                      prev.map((t) =>
                        t.id === pendingStatusTaskId ||
                        (typeof t.record_id !== "undefined" &&
                          t.record_id === pendingStatusTaskId)
                          ? {
                              ...t,
                              status: originalStatus,
                              more_data: {
                                ...t.more_data,
                                task_status: originalStatus,
                              },
                            }
                          : t
                      )
                    );
                    setPendingStatusTaskId(null);
                  }
                  setShowSaveBar(false);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                title="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
              <span style={{ fontWeight: 500, fontSize: 16 }}>
                {pendingStatusOptions
                  ? "Updating status options"
                  : "Status changed"}
              </span>
            </div>
            <button
              className="btn btn-outline-light text-white btn-sm"
              onClick={async (e) => {
                e.stopPropagation();
                if (pendingStatusTaskId) {
                  const taskToUpdate = tasks.find(
                    (t) => t.id === pendingStatusTaskId
                  );
                  if (taskToUpdate) {
                    await updateTaskAPI(taskToUpdate);
                  }
                  setPendingStatusTaskId(null);
                }
                setShowSaveBar(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Floating Delete Action Bar */}
      {selectedTasks.length > 0 && !showDeleteConfirmation && (
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
                onClick={() => setSelectedTasks([])}
                onMouseDown={(e) => e.stopPropagation()}
                title="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
              <span style={{ fontWeight: 500, fontSize: 16, marginRight: 24 }}>
                {selectedTasks.length} task
                {selectedTasks.length !== 1 ? "s" : ""} selected
              </span>
            </div>
            <button
              className="btn btn-outline-light text-white btn-sm"
              onClick={handleDeleteSelected}
              style={{
                borderRadius: 50,
                fontWeight: 500,
                fontSize: 14,
                width: "35px",
                height: "35px",
                // padding: "6px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                gap: 6,
              }}
            >
              <i
                className="fa-regular fa-trash-can"
                style={{ fontSize: 14 }}
              ></i>
            </button>
          </div>
        </div>
      )}

      {/* Floating Delete Confirmation Bar */}
      {showDeleteConfirmation && (
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
                onClick={cancelDeleteSelected}
                onMouseDown={(e) => e.stopPropagation()}
                title="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
              <span style={{ fontWeight: 500, fontSize: 16, marginRight: 24 }}>
                {selectedTasks.length === 1
                  ? "Are you sure you want to delete this task?"
                  : `Are you sure you want to delete ${selectedTasks.length} tasks?`}
              </span>
            </div>

            {/* <button
              className="btn btn-outline-light text-white btn-sm"
              onClick={confirmDeleteSelected}
              style={{
                borderRadius: 50,
                fontWeight: 500,
                fontSize: 14,
                width: "35px",
                height: "35px",
                // padding: "6px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                gap: 6,
              }}
            >
              <i
                className="fa-regular fa-trash-can"
                style={{ fontSize: 14 }}
              ></i>
            </button> */}
             <button
              className="btn btn-outline-light text-white btn-sm"
             onClick={confirmDeleteSelected}
            >
              Yes
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export { TooltipEllipsisCell };
export default ListView;
