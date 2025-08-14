"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { v4 as uuidv4 } from "uuid";
import ListView from "./ListView";
import BoardView from "./BoardView";
import { useSession } from "next-auth/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { User } from "../types/user";
import type { Task, ChecklistItem } from "../types/task";
import { toast } from "react-toastify";
import { formatReminderDateTime } from "./DynamicNotes";
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

type UserOptions = {
  name: string;
  initials: string;
  color: string;
  id: string;
};

// Add SprintStatus and Sprint types for sprint dropdown
interface SprintStatus {
  id: string;
  name: string;
  color: string;
}

interface Sprint {
  record_id: string;
  sprint_name: string;
  task_status: SprintStatus[];
  [key: string]: unknown;
}

// Add this helper at the top-level (outside any component)
function getInitialsFromUser(user: {
  profile_information?: { full_name?: string };
  username?: string;
  name?: string;
  id?: string;
}): string {
  const fullName = user.profile_information?.full_name || "";
  const base = fullName || user.username || user.name || user.id || "";
  const words = base.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  } else if (words.length > 1) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return "?";
}

const TaskBoard = () => {
  const { data: session } = useSession();
  const user = useSelector((state: RootState) => state.user.user);
  const [activeView, setActiveView] = useState<"list" | "board">("list");
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<EditingTask | null>(null);
  const [originalValue, setOriginalValue] = useState<string>("");
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [statusEdit, setStatusEdit] = useState<{ id: string | null } | null>(
    null
  );
  const statusDropdownRef = useRef<HTMLDivElement | null>(null);
  const [showAddStatusTable, setShowAddStatusTable] = useState<string | null>(
    null
  );
  const [newStatusNameTable, setNewStatusNameTable] = useState("");
  const [newStatusColorTable, setNewStatusColorTable] = useState("#888888");
  const addStatusFormRef = useRef<HTMLFormElement | null>(null);
  const boardAddStatusFormRef = useRef<HTMLDivElement | null>(null);
  const [editingStatusIdx, setEditingStatusIdx] = useState<number | null>(null);
  const [editStatusName, setEditStatusName] = useState("");
  const [editStatusColor, setEditStatusColor] = useState("#888888");
  const editStatusFormRef = useRef<HTMLFormElement | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCreateRow, setShowCreateRow] = useState(false);
  const [newTaskSummary, setNewTaskSummary] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState<string>("");
  const [newTaskCreated, setNewTaskCreated] = useState("");
  const [newTaskUpdated, setNewTaskUpdated] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<User>(() => ({
    record_id: "",
    username: "",
    name: "",
    role_id: "",
    initials: "",
    color: "#888888",
  }));
  const [showAssignedToDropdown, setShowAssignedToDropdown] = useState(false);
  const assignedToDropdownRef = useRef<HTMLDivElement | null>(null);

  // Add new status states
  const [showAddStatusForm, setShowAddStatusForm] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#888888");

  const [loadingTasks, setLoadingTasks] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [taskMembers, setTaskMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [userDetailsById, setUserDetailsById] = useState<Record<string, User>>(
    {}
  );

  const [sprintsLoading, setSprintsLoading] = useState(false);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");

  // Combined loading state that considers both sprints and tasks
  const isLoading = sprintsLoading || loadingTasks;

  console.log(loadingMembers);
  console.log("status options i tsak board", statusOptions);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setStatusEdit(null);
      }
    }
    if (statusEdit) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [statusEdit]);

  useEffect(() => {
    if (!showAddStatusTable) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const dropdownContainer = document.querySelector(
        ".custom-status-dropdown"
      );
      if (
        addStatusFormRef.current &&
        !addStatusFormRef.current.contains(target) &&
        !(dropdownContainer && dropdownContainer.contains(target))
      ) {
        setShowAddStatusTable(null);
        setNewStatusNameTable("");
        setNewStatusColorTable("#888888");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAddStatusTable]);

  useEffect(() => {
    if (editingStatusIdx === null) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        editStatusFormRef.current &&
        !editStatusFormRef.current.contains(event.target as Node)
      ) {
        setEditingStatusIdx(null);
        setEditStatusName("");
        setEditStatusColor("#888888");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingStatusIdx]);

  // Add this useEffect for modal status dropdown
  useEffect(() => {
    if (!showStatusDropdown) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const dropdownContainer = document.querySelector(
        ".custom-status-dropdown"
      );
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(target) &&
        !(dropdownContainer && dropdownContainer.contains(target))
      ) {
        setShowStatusDropdown(false);
        setEditingStatusIdx(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showStatusDropdown]);

  // Dropdown close for add row
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showAssignedToDropdown &&
        assignedToDropdownRef.current &&
        !assignedToDropdownRef.current.contains(event.target as Node)
      ) {
        setShowAssignedToDropdown(false);
      }
    }
    if (showAssignedToDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAssignedToDropdown]);

  // Add status form click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // Check if the click is on a color input or its related elements
      const isColorPickerClick =
        target instanceof HTMLInputElement && target.type === "color";

      // Check if the click is inside any color picker dropdown (browser's native color picker)
      const isInsideColorPicker =
        target instanceof HTMLElement &&
        (target.closest('input[type="color"]') ||
          target.closest(".color-picker-dropdown") ||
          target.closest('[role="dialog"]')); // Many color pickers use dialog role

      if (
        showAddStatusForm &&
        !isColorPickerClick &&
        !isInsideColorPicker &&
        ((addStatusFormRef.current &&
          !addStatusFormRef.current.contains(target)) ||
          (boardAddStatusFormRef.current &&
            !boardAddStatusFormRef.current.contains(target)))
      ) {
        setShowAddStatusForm(false);
        setNewStatusName("");
        setNewStatusColor("#888888");
      }
    }
    if (showAddStatusForm) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAddStatusForm]);

  useEffect(() => {
    if (
      statusOptions.length > 0 &&
      (!newTaskStatus || !statusOptions.some((opt) => opt.id === newTaskStatus))
    ) {
      setNewTaskStatus(statusOptions[0].id);
    }
  }, [statusOptions, newTaskStatus]);

  // Create a separate drag handler for BoardView that handles column-based drag and drop
  const handleBoardViewDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    if (result.type === "COLUMN") {
      // Reorder statusOptions
      const newStatusOptions = Array.from(statusOptions);
      const [removed] = newStatusOptions.splice(result.source.index, 1);
      newStatusOptions.splice(result.destination.index, 0, removed);
      setStatusOptions(newStatusOptions);
      try {
        await updateSprintStatusAPI(selectedSprintId, newStatusOptions);
      } catch (err) {
        alert("Failed to update status order: " + (err as Error).message);
      }
      return;
    }

    // Handle task drag within a column (type: TASK)
    if (result.type === "TASK") {
      const sourceStatus = result.source.droppableId;
      const destStatus = result.destination.droppableId;

      // If same column, reorder within the column
      if (sourceStatus === destStatus) {
        const statusTasks = tasks.filter(
          (task) => task.more_data?.task_status === sourceStatus
        );
        const [reorderedItem] = statusTasks.splice(result.source.index, 1);
        statusTasks.splice(result.destination.index, 0, reorderedItem);

        // Update the state immediately for better UX
        setTasks((prev) => {
          const otherTasks = prev.filter(
            (task) => task.more_data?.task_status !== sourceStatus
          );
          return [...otherTasks, ...statusTasks];
        });

        // Update all task orders in this status column to ensure consistency
        try {
          await updateAllTaskOrders(statusTasks);
        } catch (err) {
          console.error("Failed to update task order within column:", err);
        }
      } else {
        // Moving between different columns
        const sourceTasks = tasks.filter(
          (task) => task.more_data?.task_status === sourceStatus
        );
        const destTasks = tasks.filter(
          (task) => task.more_data?.task_status === destStatus
        );
        const [movedTask] = sourceTasks.splice(result.source.index, 1);
        const updatedTask = movedTask
          ? {
              ...movedTask,
              more_data: { ...movedTask.more_data, task_status: destStatus },
            }
          : movedTask;
        destTasks.splice(result.destination.index, 0, updatedTask);

        // Update the state immediately for better UX
        setTasks((prev) => {
          const otherTasks = prev.filter(
            (task) =>
              task.more_data?.task_status !== sourceStatus &&
              task.more_data?.task_status !== destStatus
          );
          return [...otherTasks, ...sourceTasks, ...destTasks];
        });

        // Update task orders for both source and destination columns
        try {
          // Update source column task orders
          if (sourceTasks.length > 0) {
            await updateAllTaskOrders(sourceTasks);
          }
          // Update destination column task orders
          if (destTasks.length > 0) {
            await updateAllTaskOrders(destTasks);
          }

          // Call updateTaskAPI for the moved task with new status
          if (updatedTask) {
            await updateTaskAPI(updatedTask);
          }
        } catch (err) {
          console.error("Failed to update task order between columns:", err);
        }
      }
      return;
    }
  };

  // Create a separate drag handler for ListView that handles the mapped tasks
  const handleListViewDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    console.log("ListView drag end:", {
      sourceIndex: result.source.index,
      destinationIndex: result.destination.index,
      totalTasks: tasks.length,
    });

    // Handle list-based drag and drop (for ListView)
    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the state immediately for better UX
    setTasks(items);

    // Save the new order to the backend
    try {
      // Update all task orders to ensure consistency
      await updateAllTaskOrders(items);
      console.log("Task order updated successfully:", {
        taskId: reorderedItem?.id,
        fromIndex: result.source.index,
        toIndex: result.destination.index,
        totalTasks: items.length,
      });
    } catch (err) {
      console.error("Failed to update task order:", err);
      // Optionally revert the order if the API call fails
      // setTasks(tasks);
    }
  };

  const handleSaveChanges = () => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((task) =>
          task.record_id === editingTask.id
            ? { ...task, [editingTask.field]: editingTask.value }
            : task
        )
      );
      setEditingTask(null);
      setOriginalValue("");
    }
  };

  const handleCancelChanges = () => {
    setEditingTask(null);
    setOriginalValue("");
  };

  const getStatusOption = (statusId: string) =>
    statusOptions.find((opt) => opt.id === statusId);

  const handleStatusDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    // Only handle COLUMN drag
    if (result.type !== "COLUMN") return;
    const items = Array.from(statusOptions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setStatusOptions(items);
    // Persist the new order to the backend
    try {
      await updateSprintStatusAPI(selectedSprintId, items);
    } catch (err) {
      alert("Failed to update status order: " + (err as Error).message);
      // Optionally revert local state if needed
    }
  };

  // Add new function to fetch a single task by record_id
  const fetchSingleTask = async (
    taskRecordId: string
  ): Promise<Task | null> => {
    if (!session?.user?.id || !selectedSprintId || !taskRecordId) return null;

    try {
      const payload = {
        conditions: [
          {
            field: "feature_name",
            value: "task_status_management",
            search_type: "exact",
          },
          {
            field: "more_data.assigned_by",
            value: session.user.id,
            search_type: "exact",
          },
          {
            field: "more_data.sprint_id",
            value: selectedSprintId,
            search_type: "exact",
          },
          {
            field: "record_id",
            value: taskRecordId,
            search_type: "exact",
          },
        ],
        combination_type: "and",
        page: 1,
        limit: 1,
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
      if (response.ok && Array.isArray(result.data) && result.data.length > 0) {
        return result.data[0];
      }
      return null;
    } catch (err) {
      console.error("Failed to fetch single task:", err);
      return null;
    }
  };

  const handleAddTask = async () => {
    if (!newTaskSummary.trim()) return;
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);
    const userId = session?.user?.id || "";
    const statusId = newTaskStatus || (statusOptions[0]?.id ?? "");
    const assignedToId =
      newTaskAssignedTo &&
      newTaskAssignedTo.record_id &&
      newTaskAssignedTo.record_id.trim() !== ""
        ? newTaskAssignedTo.record_id
        : "";
    // Only set due_date if user selected, otherwise empty
    const dueDateValue =
      newTaskDueDate && newTaskDueDate.trim() !== "" ? newTaskDueDate : "";
    const newTaskObj: Task = {
      id: `task_${Date.now()}`,
      record_id: `task_${Date.now()}`,
      type: "task_status_management",
      key: `task_${Date.now()}`,
      summary: newTaskSummary,
      description: newTaskDescription,
      comments: [],
      status: statusId,
      created: dateStr,
      updated: dateStr,
      assigner: {
        name: user?.profile_information?.full_name || userId,
        initials: getInitialsFromUser(user || {}),
        color: "orange",
        id: userId,
      },
      assigned_to: {
        name: newTaskAssignedTo.name || "",
        initials: newTaskAssignedTo.initials || "",
        color: newTaskAssignedTo.color || "",
        id: assignedToId,
      },
      dueDate: dueDateValue,
      checklist: [],
      more_data: {
        task_status: statusId,
        due_date: dueDateValue,
        sprint_id: selectedSprintId,
        title: newTaskSummary,
        description: newTaskDescription,
        checklist: [],
        assigned_by: userId,
        assigned_to: assignedToId,
        assigned_date: dateStr,
        assigned_time: timeStr,
        status_updated_by: userId,
        status_updated_date: dateStr,
        status_updated_time: timeStr,
      },
    };
    try {
      await createTaskAPI(newTaskObj);
      // Log task creation
      try {
        await sendLog({
          data: {
            record_id: `activity_log_${Date.now()}`,
            feature_name: "activity_logs",
            added_by: session?.user?.id || "system",
            record_status: "active",
            created_on_date: new Date().toISOString().split("T")[0],
            feature_data: {
              record_data: [
                {
                  record_label: "category",
                  record_value_text: "task",
                  record_type: "type_text",
                },
                {
                  record_label: "user_id",
                  record_value_text: session?.user?.id || "",
                  record_type: "type_text",
                },
                {
                  record_label: "user_role",
                  record_value_text: user?.role_id || "",
                  record_type: "type_text",
                },
                {
                  record_label: "action",
                  record_value_text: "create",
                  record_type: "type_text",
                },
                {
                  record_label: "task_id",
                  record_value_text: newTaskObj.record_id,
                  record_type: "type_text",
                },
              ],
            },
            more_data: {},
          },
          dataset: "feature_data",
        });
      } catch (logErr) {
        console.error("Failed to log task creation", logErr);
      }
      const fetchedTask = await fetchSingleTask(newTaskObj.record_id);
      if (fetchedTask) {
        setTasks((prev) => [...prev, fetchedTask]);
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
        setTasks((prev) => [...prev, newTaskObj]);
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
      setNewTaskSummary("");
      setNewTaskDescription("");
      setNewTaskStatus(statusOptions[0]?.id ?? "");
      setNewTaskCreated("");
      setNewTaskUpdated("");
      setNewTaskDueDate("");
      setNewTaskAssignedTo(emptyUser);
    } catch (err) {
      alert("Failed to create task: " + (err as Error).message);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateRow(false);
    setNewTaskSummary("");
    setNewTaskDescription("");
    setNewTaskStatus("");
    setNewTaskCreated("");
    setNewTaskUpdated("");
    setNewTaskDueDate("");
    setNewTaskAssignedTo(emptyUser);
  };

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
        record_id: task.record_id,
        feature_name: "task_status_management",
        created_on_date: dateStr,
        feature_data: { record_data: [] },
        more_data: {
          sprint_id: task.more_data?.sprint_id,
          title: task.more_data?.title,
          description: task.more_data?.description,
          checklist: task.more_data?.checklist,
          assigned_by: userId,
          assigned_to: task.more_data?.assigned_to || "",
          assigned_date: task.more_data?.assigned_date,
          assigned_time: task.more_data?.assigned_time,
          task_status: task.more_data?.task_status,
          status_updated_by: userId,
          status_updated_date: dateStr,
          status_updated_time: timeStr,
          due_date: dueDateStr,
        },
        setReminder: {
          date: "",
          time: "",
          title: "",
          description: "",
        },
      },
      dataset: "feature_data",
    };

    // Force assigned_to to be id
    payload.data.more_data.assigned_to =
      task.assigned_to?.id || task.more_data?.assigned_to || "";

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

  const updateTaskAPI = async (task: Task) => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);
    const payload = {
      data: {
        record_id: task.record_id,
        feature_name: "task_status_management",
        fields_to_update: {
          more_data: {
            ...task.more_data,
            assigned_to:
              task.assigned_to?.id || task.more_data?.assigned_to || "",
            status_updated_date: dateStr,
            status_updated_time: timeStr,
          },
        },
      },
      dataset: "feature_data",
    };

    console.log("update api payload", payload);
    const response = await fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-TYPE": "update" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Task update failed");
    }
    return response.json();
  };

  // Add this helper function to update sprint status
  const updateSprintStatusAPI = async (
    sprintId: string,
    newStatusList: StatusOption[]
  ) => {
    const payload = {
      data: {
        record_id: sprintId,
        feature_name: "sprint_management",
        fields_to_update: {
          task_status: newStatusList,
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
      throw new Error(result.error || "Sprint status update failed");
    }
    // Log status update
    try {
      await sendLog({
        data: {
          record_id: `activity_log_${Date.now()}`,
          feature_name: "activity_logs",
          added_by: session?.user?.id || "system",
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
                record_value_text: session?.user?.id || "",
                record_type: "type_text",
              },
              {
                record_label: "user_role",
                record_value_text: user?.role_id || "",
                record_type: "type_text",
              },
              {
                record_label: "action",
                record_value_text: "update_status",
                record_type: "type_text",
              },
              {
                record_label: "sprint_id",
                record_value_text: sprintId,
                record_type: "type_text",
              },
            ],
          },
          more_data: {},
        },
        dataset: "feature_data",
      });
    } catch (logErr) {
      console.error("Failed to log status update", logErr);
    }
    return response.json();
  };

  // Delete task API function
  const deleteTaskAPI = async (taskId: string | string[]) => {
    const payload = {
      data: {
        record_id: taskId,
        feature_name: "task_status_management",
        delete_entire_document: true,
      },
      dataset: "feature_data",
    };
    const response = await fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-TYPE": "delete" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Failed to delete task");
    }
    return response.json();
  };

  // Update task order API function
  const updateTaskOrderAPI = async (taskId: string, newOrder: number) => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);
    const payload = {
      data: {
        record_id: taskId,
        feature_name: "task_status_management",
        fields_to_update: {
          more_data: {
            task_order: newOrder,
            order_updated_date: dateStr,
            order_updated_time: timeStr,
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
      throw new Error(result.error || "Task order update failed");
    }
    return response.json();
  };

  // Update all task orders after reordering
  const updateAllTaskOrders = async (reorderedTasks: Task[]) => {
    const updatePromises = reorderedTasks.map((task, index) =>
      updateTaskOrderAPI(task.record_id, index)
    );

    try {
      await Promise.all(updatePromises);
      console.log("All task orders updated successfully");
    } catch (err) {
      console.error("Failed to update all task orders:", err);
      throw err;
    }
  };

  // Add new status functions
  const handleAddNewStatus = async () => {
    if (!selectedSprintId || !newStatusName.trim()) return;
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
    setShowAddStatusForm(false);
    setNewStatusName("");
    setNewStatusColor("#888888");

    // Call API to update sprint's status list
    try {
      await updateSprintStatusAPI(selectedSprintId, updatedStatusList);
      // Log status add
      try {
        await sendLog({
          data: {
            record_id: `activity_log_${Date.now()}`,
            feature_name: "activity_logs",
            added_by: session?.user?.id || "system",
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
                  record_value_text: session?.user?.id || "",
                  record_type: "type_text",
                },
                {
                  record_label: "user_role",
                  record_value_text: user?.role_id || "",
                  record_type: "type_text",
                },
                {
                  record_label: "action",
                  record_value_text: "add_status",
                  record_type: "type_text",
                },
                {
                  record_label: "sprint_id",
                  record_value_text: selectedSprintId,
                  record_type: "type_text",
                },
              ],
            },
            more_data: {},
          },
          dataset: "feature_data",
        });
      } catch (logErr) {
        console.error("Failed to log status add", logErr);
      }
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

  // Move TaskDetailModal here
  function TaskDetailModal({
    task,
    onClose,
    onUpdateTask,
    statusOptions,
    setStatusOptions,
    userOptions,
    userDetailsById,
  }: {
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
    userDetailsById?: Record<string, User>;
  }) {
    // Add status dropdown state for modal
    const [showModalStatusDropdown, setShowModalStatusDropdown] =
      useState(false);
    const currentUser = useSelector((state: RootState) => state.user.user);
    const [reminder, setReminder] = useState(false);
    const [editingModalStatusIdx, setEditingModalStatusIdx] = useState<
      number | null
    >(null);
    const [editModalStatusName, setEditModalStatusName] = useState("");
    const [editModalStatusColor, setEditModalStatusColor] = useState("#888888");
    const [showModalAddStatus, setShowModalAddStatus] = useState(false);
    const [newModalStatusName, setNewModalStatusName] = useState("");
    const [newModalStatusColor, setNewModalStatusColor] = useState("#888888");
    const modalStatusDropdownRef = useRef<HTMLDivElement | null>(null);
    const editModalStatusFormRef = useRef<HTMLFormElement | null>(null);
    const addModalStatusFormRef = useRef<HTMLFormElement | null>(null);

    const generateInitials = (name: string | undefined | null): string => {
      if (typeof name !== "string" || !name.trim()) {
        return "?";
      }
      return name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase();
    };

    // Helper to get checklist from either shape
    function getChecklist(task: Task | undefined | null): ChecklistItem[] {
      if (Array.isArray(task?.more_data?.checklist))
        return task.more_data!.checklist!;
      if (Array.isArray(task?.checklist)) return task.checklist!;
      return [];
    }

    const [title, setTitle] = useState(task.more_data?.title || "");
    const [description, setDescription] = useState(
      task.more_data?.description || ""
    );
    const [reminderData, setReminderData] = useState({
      title: task.setReminder?.title || task.more_data?.title || "",
      description:
        task.setReminder?.description ||
        (task.more_data?.description || "").slice(0, 76) +
          ((task.more_data?.description?.length || 0) > 76 ? "..." : "") ||
        "",
      date: task.setReminder?.date || "",
      time: task.setReminder?.time || "",
    });
    const [buttonLoading, setbuttonLoading] = useState(false);
    const [checklist, setChecklist] = useState<ChecklistItem[]>(
      getChecklist(task)
    );
    const [newChecklistText, setNewChecklistText] = useState("");
    const [showChecklistInput, setShowChecklistInput] = useState(false);
    const checklistInputRef = useRef<HTMLDivElement | null>(null);
    const [editAssignedTo, setEditAssignedTo] = useState(false);
    const [editDueDate, setEditDueDate] = useState(false);
    const [assignedTo, setAssignedTo] = useState<{
      name: string;
      initials: string;
      color: string;
      id: string;
    }>(getAssignedToUser(task, userOptions));
    const [dueDate, setDueDate] = useState(task.more_data?.due_date || "");
    const assignedToDropdownRef = useRef<HTMLDivElement | null>(null);
    const [status, setStatus] = useState(task.more_data?.task_status || "");
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [showAddStatus, setShowAddStatus] = useState(false);
    const [originalDueDate, setOriginalDueDate] = useState(
      task.more_data?.due_date || ""
    );

    // Helper function to format dates
    const formatDate = (dateString: string | undefined): string => {
      if (!dateString) return "n/a";
      try {
        return new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        return "n/a";
      }
    };

    // Helper to get date fields from either shape
    function getCreatedDate(task: Task | undefined | null): string {
      return task?.more_data?.assigned_date || task?.created || "";
    }
    function getUpdatedDate(task: Task | undefined | null): string {
      return task?.more_data?.status_updated_date || task?.updated || "";
    }

    // Add useEffect to update status when task changes
    useEffect(() => {
      const taskStatus = task.more_data?.task_status || "";
      setStatus(taskStatus);
    }, [task.more_data?.task_status]);

    useEffect(() => {
      if (!showChecklistInput) return;
      function handleClickOutside(event: MouseEvent) {
        if (
          checklistInputRef.current &&
          !checklistInputRef.current.contains(event.target as Node)
        ) {
          setShowChecklistInput(false);
          setNewChecklistText("");
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showChecklistInput]);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          editAssignedTo &&
          assignedToDropdownRef.current &&
          !assignedToDropdownRef.current.contains(event.target as Node)
        ) {
          setEditAssignedTo(false);
        }
      }
      if (editAssignedTo) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [editAssignedTo]);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        const target = event.target as Node;

        const isInsideStatusDropdown =
          modalStatusDropdownRef.current &&
          modalStatusDropdownRef.current.contains(target);

        const isStatusBadge =
          target instanceof HTMLElement &&
          (target.classList.contains("status-badge") ||
            target.closest(".status-badge"));

        const isColorPicker =
          target instanceof HTMLInputElement && target.type === "color";
        const isInsideColorPicker =
          target instanceof HTMLElement &&
          (target.closest('input[type="color"]') ||
            target.closest('[role="dialog"]'));

        const isInsideReminderModal =
          modalStatusDropdownRef.current &&
          modalStatusDropdownRef.current.contains(target);

        const isReminderTrigger =
          target instanceof HTMLElement &&
          (target.classList.contains("fa-clock") ||
            target.closest(".reminder-trigger"));

        // ❌ Reminder Modal Close
        if (reminder && !isInsideReminderModal && !isReminderTrigger) {
          setReminder(false);
        }

        // ✅ Close status dropdowns only if not clicking inside
        if (
          !isInsideStatusDropdown &&
          !isStatusBadge &&
          !isColorPicker &&
          !isInsideColorPicker
        ) {
          if (showModalStatusDropdown) {
            setShowModalStatusDropdown(false);
          }

          if (showModalAddStatus) {
            setShowModalAddStatus(false);
            setNewModalStatusName("");
            setNewModalStatusColor("#888888");
          }

          if (editingModalStatusIdx !== null) {
            setEditingModalStatusIdx(null);
            setEditModalStatusName("");
            setEditModalStatusColor("#888888");
          }
        }
      }

      const shouldListen =
        showModalStatusDropdown ||
        showModalAddStatus ||
        editingModalStatusIdx !== null ||
        reminder;

      if (shouldListen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [
      showModalStatusDropdown,
      showModalAddStatus,
      editingModalStatusIdx,
      reminder,
    ]);

    // Add useEffect for modal add status functionality
    useEffect(() => {
      if (!showAddStatus) return;
      function handleClickOutside(event: MouseEvent) {
        const target = event.target as Node;
        const dropdownContainer = document.querySelector(
          ".custom-status-dropdown"
        );
        if (!(dropdownContainer && dropdownContainer.contains(target))) {
          setShowAddStatus(false);
          setNewStatusName("");
          setNewStatusColor("#888888");
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showAddStatus]);

    useEffect(() => {
      setOriginalDueDate(task.more_data?.due_date || "");
      setDueDate(task.more_data?.due_date || "");
    }, [task]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
      setTitle(e.target.value);
    const handleDescriptionChange = (
      e: React.ChangeEvent<HTMLTextAreaElement>
    ) => setDescription(e.target.value);

    const handleChecklistToggle = (id: string) => {
      setChecklist(
        (prev: { id: string; text: string; checked: boolean }[] = []) =>
          prev.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item
          )
      );
    };

    const handleChecklistDelete = (id: string) => {
      setChecklist(
        (prev: { id: string; text: string; checked: boolean }[] = []) =>
          prev.filter((item) => item.id !== id)
      );
    };

    const handleChecklistAdd = () => {
      if (!newChecklistText.trim()) return;
      setChecklist(
        (prev: { id: string; text: string; checked: boolean }[] = []) => [
          ...prev,
          { id: uuidv4(), text: newChecklistText, checked: false },
        ]
      );
      setNewChecklistText(""); // Just clear input, do NOT close it
      // setShowChecklistInput(false); // REMOVE or comment out this line
    };

    const handleChecklistInputKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleChecklistAdd();
      } else if (e.key === "Escape") {
        setShowChecklistInput(false);
        setNewChecklistText("");
      }
    };
    const handleSave = async () => {
      const currentDate = new Date().toISOString().split("T")[0];
      const updatedTask = {
        ...task,
        record_id: task.record_id,
        more_data: {
          ...task.more_data,
          task_status: status,
          title,
          description,
          checklist,
          assigned_to: assignedTo.id,
          assigned_by: task.more_data?.assigned_by || "",
          due_date: dueDate,
          status_updated_date: currentDate,
        },
      };
      try {
        await updateTaskAPI(updatedTask);
        // Log task update
        try {
          await sendLog({
            data: {
              record_id: `activity_log_${Date.now()}`,
              feature_name: "activity_logs",
              added_by: session?.user?.id || "system",
              record_status: "active",
              created_on_date: new Date().toISOString().split("T")[0],
              feature_data: {
                record_data: [
                  {
                    record_label: "category",
                    record_value_text: "task",
                    record_type: "type_text",
                  },
                  {
                    record_label: "user_id",
                    record_value_text: session?.user?.id || "",
                    record_type: "type_text",
                  },
                  {
                    record_label: "user_role",
                    record_value_text: user?.role_id || "",
                    record_type: "type_text",
                  },
                  {
                    record_label: "action",
                    record_value_text: "update",
                    record_type: "type_text",
                  },
                  {
                    record_label: "task_id",
                    record_value_text: updatedTask.record_id,
                    record_type: "type_text",
                  },
                ],
              },
              more_data: {},
            },
            dataset: "feature_data",
          });
        } catch (logErr) {
          console.error("Failed to log task update", logErr);
        }
        onUpdateTask(updatedTask);
        onClose();
      } catch (err) {
        alert("Failed to update task: " + (err as Error).message);
      }
    };

    const handleSaveReminder = async () => {
      if (
        reminderData?.title === "" ||
        reminderData?.date === "" ||
        reminderData?.time === ""
      ) {
        toast.error("title,date and time fields are required");
        return;
      }
      setbuttonLoading(true);

      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-TYPE": "update",
        },
        body: JSON.stringify({
          data: {
            record_id: task.record_id,
            feature_name: "task_status_management",
            fields_to_update: {
              setReminder: {
                title: reminderData?.title,
                date: reminderData?.date,
                time: reminderData?.time,
                description: reminderData?.description,
              },
            },
          },
          dataset: "feature_data",
        }),
      });

      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (task?.setReminder?.date) {
        const response = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-API-TYPE": "update",
          },
          body: JSON.stringify({
            data: {
              record_id: task.record_id,
              feature_name: "calendar",
              fields_to_update: {
                "feature_data.record_data": [
                  {
                    record_value: reminderData?.date,
                    record_label: "date",
                    record_type: "type_date",
                  },
                  {
                    record_value: reminderData?.time,
                    record_label: "time",
                    record_type: "type_time",
                  },
                  {
                    record_value: reminderData?.description,
                    record_label: "description",
                    record_type: "type_text",
                  },
                  {
                    record_value: "task-reminders",
                    record_label: "category",
                    record_type: "type_text",
                  },
                  {
                    record_value: reminderData?.title,
                    record_label: "title",
                    record_type: "type_text",
                  },
                ],
              },
            },
            dataset: "feature_data",
          }),
        });

        const data = await response.json();

        if (data.error) {
          toast.error(data.error);
          return;
        }

        toast.success("Reminder updated successfully");
      } else {
        const response = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-API-TYPE": "create",
          },
          body: JSON.stringify({
            data: {
              record_id: task.record_id,
              feature_name: "calendar",
              record_status: "active",
              created_on_date: new Date().toISOString().split("T")[0],
              created_by: currentUser?.record_id,
              feature_data: {
                record_data: [
                  {
                    record_value: reminderData?.date,
                    record_label: "date",
                    record_type: "type_date",
                  },
                  {
                    record_value: reminderData?.time,
                    record_label: "time",
                    record_type: "type_time",
                  },
                  {
                    record_value: reminderData?.title,
                    record_label: "title",
                    record_type: "type_text",
                  },
                  {
                    record_value: reminderData?.description,
                    record_label: "description",
                    record_type: "type_text",
                  },
                  {
                    record_value: "task-reminders",
                    record_label: "category",
                    record_type: "type_text",
                  },
                ],
              },
              dataset: "feature_data",
            },
          }),
        });

        if (response.ok) {
          toast.success("Reminder created successfully");
        }
      }

      setReminder(false);
      setbuttonLoading(false);
      await fetchTasks();
      setReminderData({
        title: "",
        date: "",
        time: "",
        description: "",
      });
    };

    const percentComplete =
      (checklist ?? []).length === 0
        ? 0
        : Math.round(
            ((checklist ?? []).filter((i) => i.checked).length /
              (checklist ?? []).length) *
              100
          );

    const getStatusOption = (statusId: string) =>
      statusOptions.find((opt) => opt.id === statusId);

    // Sync assignedTo with task prop when task or userOptions changes
    useEffect(() => {
      setAssignedTo(getAssignedToUser(task, userOptions));
    }, [task, userOptions]);

    return (
      <div className="task-modal-overlay">
        <div className="task-modal-content container-fluid">
          <style jsx>{`
            .status-row .status-edit-icon {
              opacity: 0;
              transition: opacity 0.2s;
            }
            .status-row:hover .status-edit-icon {
              opacity: 1;
            }
            .modal-close-btn:hover {
              background: #e0e0e0 !important;
              color: #222 !important;
            }
          `}</style>
          {/* Modal Top Bar */}
          <div
            className="d-flex justify-content-between align-items-center mb-1"
            style={{ minHeight: 40 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div style={{ position: "relative", width: "fit-content" }}>
                <span
                  className="status-badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    border: "1px solid #dedede",
                    borderRadius: 8,
                    padding: "2px 8px 2px 8px",
                    background: getStatusOption(status)?.color || "#888888",
                    color: "#fff",
                    fontSize: 14,
                    cursor: "pointer",
                    gap: 8,
                    minWidth: 90,
                    userSelect: "none",
                  }}
                  onClick={() => setShowModalStatusDropdown((v) => !v)}
                >
                  {getStatusOption(status)?.name || "Unknown"}
                  <i
                    className="bi bi-chevron-down"
                    style={{ fontSize: 16, marginLeft: 6 }}
                  ></i>
                </span>
                {showModalStatusDropdown && (
                  <div
                    ref={modalStatusDropdownRef}
                    className="custom-status-dropdown"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "100%",
                      zIndex: 9999,
                      minWidth: 230,
                      background: "#fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      border: "1px solid #e0e0e0",
                      borderRadius: 8,
                      padding: 0,
                      margin: 0,
                      overflow: "hidden",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DragDropContext onDragEnd={handleStatusDragEnd}>
                      <Droppable droppableId="modalStatusOptions">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            style={{ width: "100%" }}
                          >
                            {statusOptions.map((opt, idx) => (
                              <Draggable
                                key={opt.id}
                                draggableId={opt.id}
                                index={idx}
                              >
                                {(provided) => {
                                  let content;
                                  if (editingModalStatusIdx === idx) {
                                    content = (
                                      <form
                                        ref={editModalStatusFormRef}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 8,
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        onSubmit={async (e) => {
                                          e.preventDefault();
                                          if (!editModalStatusName.trim())
                                            return;
                                          const updatedStatusList =
                                            statusOptions.map((s, i) =>
                                              i === idx
                                                ? {
                                                    ...s,
                                                    name: editModalStatusName,
                                                    color: editModalStatusColor,
                                                  }
                                                : s
                                            );
                                          setStatusOptions(updatedStatusList);
                                          setEditingModalStatusIdx(null);
                                          setEditModalStatusName("");
                                          setEditModalStatusColor("#888888");
                                          try {
                                            await updateSprintStatusAPI(
                                              selectedSprintId,
                                              updatedStatusList
                                            );
                                            // Log status edit
                                            try {
                                              await sendLog({
                                                data: {
                                                  record_id: `activity_log_${Date.now()}`,
                                                  feature_name: "activity_logs",
                                                  added_by:
                                                    session?.user?.id ||
                                                    "system",
                                                  record_status: "active",
                                                  created_on_date: new Date()
                                                    .toISOString()
                                                    .split("T")[0],
                                                  feature_data: {
                                                    record_data: [
                                                      {
                                                        record_label:
                                                          "category",
                                                        record_value_text:
                                                          "sprint",
                                                        record_type:
                                                          "type_text",
                                                      },
                                                      {
                                                        record_label: "id",
                                                        record_value_text:
                                                          session?.user?.id ||
                                                          "",
                                                        record_type:
                                                          "type_text",
                                                      },
                                                      {
                                                        record_label:
                                                          "user_role",
                                                        record_value_text:
                                                          user?.role_id || "",
                                                        record_type:
                                                          "type_text",
                                                      },
                                                      {
                                                        record_label: "action",
                                                        record_value_text:
                                                          "edit_status",
                                                        record_type:
                                                          "type_text",
                                                      },
                                                      {
                                                        record_label:
                                                          "sprint_id",
                                                        record_value_text:
                                                          selectedSprintId,
                                                        record_type:
                                                          "type_text",
                                                      },
                                                    ],
                                                  },
                                                  more_data: {},
                                                },
                                                dataset: "feature_data",
                                              });
                                            } catch (logErr) {
                                              console.error(
                                                "Failed to log status edit",
                                                logErr
                                              );
                                            }
                                          } catch (err) {
                                            alert(
                                              "Failed to update sprint status: " +
                                                (err as Error).message
                                            );
                                            setStatusOptions(statusOptions); // revert
                                          }
                                        }}
                                      >
                                        <input
                                          type="text"
                                          value={editModalStatusName}
                                          onChange={(e) =>
                                            setEditModalStatusName(
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
                                          value={editModalStatusColor}
                                          onChange={(e) =>
                                            setEditModalStatusColor(
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
                                          setStatus(opt.id);
                                          setShowModalStatusDropdown(false);
                                        }}
                                      >
                                        {opt.name}
                                      </span>
                                    );
                                  }
                                  return (
                                    <div
                                      className="status-row"
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={{
                                        background: "none",
                                        color: "#222",
                                        cursor: "pointer",
                                        padding: "8px 16px",
                                        fontWeight:
                                          opt.id === status ? 700 : 400,
                                        fontSize: 12,
                                        textAlign: "left",
                                        border: "none",
                                        outline: "none",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0,
                                        ...provided.draggableProps.style,
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
                                                typeof opt.color === "string"
                                                  ? opt.color
                                                  : "#888888",
                                              fontSize: 13,
                                              marginRight: 10,
                                            }}
                                          ></i>
                                          {content}
                                        </div>
                                        {editingModalStatusIdx !== idx && (
                                          <i
                                            className="bi bi-pencil ms-2 status-edit-icon"
                                            style={{
                                              fontSize: 14,
                                              color: "#888",
                                              cursor: "pointer",
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingModalStatusIdx(idx);
                                              setEditModalStatusName(opt.name);
                                              setEditModalStatusColor(
                                                opt.color
                                              );
                                            }}
                                            title="Edit status"
                                          ></i>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                    <div
                      style={{
                        padding: "8px 16px",
                      }}
                    >
                      {!showModalAddStatus ? (
                        <button
                          className="btn btn-link p-0"
                          style={{ color: "#007bff", fontSize: 14 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowModalAddStatus(true);
                          }}
                        >
                          + Add
                        </button>
                      ) : (
                        <form
                          ref={addModalStatusFormRef}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!newModalStatusName.trim()) return;
                            // Find the highest numeric id in statusOptions
                            const maxId = statusOptions
                              .map((opt) => parseInt(opt.id, 10))
                              .filter((n) => !isNaN(n))
                              .reduce((max, n) => Math.max(max, n), 0);
                            const newId = (maxId + 1)
                              .toString()
                              .padStart(3, "0");
                            const newStatus = {
                              id: newId,
                              name: newModalStatusName,
                              color: newModalStatusColor,
                            };
                            const updatedStatusList = [
                              ...statusOptions,
                              newStatus,
                            ];
                            setStatusOptions(updatedStatusList);
                            setShowModalAddStatus(false);
                            setNewModalStatusName("");
                            setNewModalStatusColor("#888888");
                            setShowModalStatusDropdown(false);
                            try {
                              await updateSprintStatusAPI(
                                selectedSprintId,
                                updatedStatusList
                              );
                              // Log status add (modal)
                              try {
                                await sendLog({
                                  data: {
                                    record_id: `log_${Date.now()}`,
                                    feature_name: "activity_logs",
                                    added_by: session?.user?.id || "system",
                                    record_status: "active",
                                    created_on_date: new Date()
                                      .toISOString()
                                      .split("T")[0],
                                    feature_data: {
                                      record_data: [
                                        {
                                          record_label: "category",
                                          record_value_text: "sprints",
                                          record_type: "type_text",
                                        },
                                        {
                                          record_label: "user_id",
                                          record_value_text:
                                            session?.user?.id || "",
                                          record_type: "type_text",
                                        },
                                        {
                                          record_label: "user_role",
                                          record_value_text:
                                            user?.role_id || "",
                                          record_type: "type_text",
                                        },
                                        {
                                          record_label: "action",
                                          record_value_text: "add_status",
                                          record_type: "type_text",
                                        },
                                        {
                                          record_label: "sprint_id",
                                          record_value_text: selectedSprintId,
                                          record_type: "type_text",
                                        },
                                      ],
                                    },
                                    more_data: {},
                                  },
                                  dataset: "feature_data",
                                });
                              } catch (logErr) {
                                console.error(
                                  "Failed to log status add (modal)",
                                  logErr
                                );
                              }
                            } catch (err) {
                              alert(
                                "Failed to update sprint status: " +
                                  (err as Error).message
                              );
                              setStatusOptions(statusOptions); // revert
                            }
                          }}
                        >
                          <input
                            type="text"
                            value={newModalStatusName}
                            onChange={(e) =>
                              setNewModalStatusName(e.target.value)
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
                            value={newModalStatusColor}
                            onChange={(e) =>
                              setNewModalStatusColor(e.target.value)
                            }
                            onMouseDown={(e) => e.stopPropagation()}
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
                            style={{ fontSize: 13, padding: "2px 8px" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Add
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ position: "relative", width: "fit-content" }}>
              {task?.setReminder?.date ? (
                <div
                  className="d-inline-flex align-items-center px-2 py-1 reminder-pill"
                  style={{
                    borderRadius: "20px",
                    width: "fit-content",
                    cursor: "pointer",
                  }}
                  onClick={() => setReminder(true)}
                >
                  <div
                    className="d-flex align-items-center"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Edit Reminder"
                  >
                    <i className="fa-regular fa-clock fs-6"></i>
                    <span
                      className="reminder-pill "
                      style={{
                        fontSize: "14px",
                        marginLeft: "4px",
                      }}
                    >
                      {formatReminderDateTime(
                        reminderData?.date,
                        reminderData?.time
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className="d-flex align-items-center p-2 rounded-circle hover-wrapper"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title="Set Reminder"
                  onClick={() => setReminder(true)}
                >
                  <i className="fa-regular fa-clock fs-6 reminder-trigger"></i>
                </div>
              )}

              {reminder && (
                <div
                  ref={modalStatusDropdownRef}
                  className="custom-status-dropdown"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    zIndex: 9999,
                    minWidth: 230,
                    background: "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                    border: "1px solid #e0e0e0",
                    borderRadius: 8,
                    padding: 8,
                    margin: 0,
                    overflow: "hidden",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input
                      className="form-control"
                      value={reminderData?.title || ""}
                      onChange={(e) =>
                        setReminderData({
                          ...reminderData,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={reminderData?.description || ""}
                      onChange={(e) =>
                        setReminderData({
                          ...reminderData,
                          description: e.target.value,
                        })
                      }
                    />
                    {/* <QuillEditor /> */}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={reminderData?.date || ""}
                      onChange={(e) =>
                        setReminderData({
                          ...reminderData,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={reminderData?.time}
                      onChange={(e) =>
                        setReminderData({
                          ...reminderData,
                          time: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="d-flex align-items-center justify-content-center">
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        handleSaveReminder();
                      }}
                    >
                      {buttonLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          {"Submitting..."}
                        </>
                      ) : (
                        "Save Reminder"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <hr />
          <div className="task-modal-scroll-area">
            <div className="row w-100">
              <div className="col-12 col-md-7 task-modal-left">
                {!isEditingTitle ? (
                  <div
                    className="task-modal-title"
                    style={{
                      fontWeight: 600,
                      fontSize: 22,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 400,
                    }}
                    title={title.length > 50 ? title : undefined}
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {title.length > 50 ? title.slice(0, 50) + "..." : title}
                  </div>
                ) : (
                  <input
                    className="task-modal-title form-control"
                    value={title}
                    onChange={handleTitleChange}
                    onBlur={() => setIsEditingTitle(false)}
                    autoFocus
                    style={{ fontWeight: 600, fontSize: 22, maxWidth: 400 }}
                  />
                )}
                <div className="task-modal-section">
                  <div className="task-modal-section-title">Description</div>
                  <textarea
                    className="task-modal-description"
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="Add a more detailed description..."
                  />
                </div>
                <div className="task-modal-section">
                  <div className="task-modal-section-title d-flex align-items-center justify-content-between">
                    <span>
                      <i className="bi bi-check2-square me-2"></i>
                      Checklist
                    </span>
                    {(checklist ?? []).length > 0 && (
                      <button
                        className="btn btn-link p-0 ms-2"
                        style={{ color: "#ff6b6b" }}
                        aria-label="Delete all checklist items"
                        onClick={() => setChecklist([])}
                        tabIndex={0}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                  <div className="task-modal-checklist-progress">
                    <span>{percentComplete}%</span>
                    <div className="task-modal-progress-bar">
                      <div
                        className="task-modal-progress-bar-inner"
                        style={{ width: `${percentComplete}%` }}
                      ></div>
                    </div>
                  </div>
                  <ul className="task-modal-checklist-list">
                    {(checklist ?? []).map((item) => (
                      <li
                        key={item.id}
                        className="task-modal-checklist-item d-flex align-items-center"
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => handleChecklistToggle(item.id)}
                          className={
                            item.checked
                              ? "checklist-checkbox checked"
                              : "checklist-checkbox"
                          }
                        />
                        <span
                          className={item.checked ? "checked ms-2" : "ms-2"}
                        >
                          {item.text}
                        </span>
                        <span className="ms-auto d-flex align-items-center">
                          <button
                            className="btn btn-link p-0"
                            style={{ color: "#ff6b6b" }}
                            aria-label="Delete"
                            onClick={() => handleChecklistDelete(item.id)}
                            tabIndex={0}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                  {!showChecklistInput ? (
                    <div className="task-modal-checklist-add d-flex align-items-center mt-2">
                      <span
                        className="add-item-link"
                        onClick={() => setShowChecklistInput(true)}
                        tabIndex={0}
                        aria-label="Add item"
                        role="button"
                      >
                        + Add an item
                      </span>
                    </div>
                  ) : (
                    <div
                      className="task-modal-checklist-add d-flex align-items-center mt-2"
                      ref={checklistInputRef}
                    >
                      <input
                        value={newChecklistText}
                        onChange={(e) => setNewChecklistText(e.target.value)}
                        onKeyDown={handleChecklistInputKeyDown}
                        placeholder="Add an item"
                        className="form-control me-2"
                        autoFocus
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleChecklistAdd}
                        tabIndex={0}
                        aria-label="Add item"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-12 col-md-5 task-modal-right">
                <div className="row">
                  {/* Assigned To and Assigner */}

                  <div className="col-6 mb-3">
                    <div className="small text-muted">Assignor</div>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <div
                        className="rounded-circle d-flex justify-content-center align-items-center"
                        style={{
                          backgroundColor: "orange",
                          width: 30,
                          height: 30,
                          color: "white",
                        }}
                      >
                        {generateInitials(
                          userDetailsById?.[
                            String(task.more_data?.assigned_by || "")
                          ]?.profile_information?.full_name ||
                            userDetailsById?.[
                              String(task.more_data?.assigned_by || "")
                            ]?.username ||
                            task.more_data?.assigned_by
                        )}
                      </div>
                      <div>
                        {userDetailsById?.[
                          String(task.more_data?.assigned_by || "")
                        ]?.profile_information?.full_name ||
                          userDetailsById?.[
                            String(task.more_data?.assigned_by || "")
                          ]?.username ||
                          task.more_data?.assigned_by ||
                          "-"}
                      </div>
                    </div>
                  </div>
                </div>
                <hr />
                {/* Dates as table/list */}
                <div className="row">
                  <div className="col-12">
                    <table className="table table-borderless mb-0 task-modal-dates-table">
                      <tbody>
                        <tr>
                          <td
                            className="small date-color"
                            style={{ width: "90px" }}
                          >
                            Created
                          </td>
                          <td className="date-value-cell">
                            <span>
                              {/* <i className="bi bi-calendar-event me-1"></i> */}
                              {formatDate(getCreatedDate(task))}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="small date-color">Updated</td>
                          <td className="date-value-cell">
                            <span>
                              {/* <i className="bi bi-calendar-event me-1"></i> */}
                              {formatDate(getUpdatedDate(task))}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="small date-color">Due Date</td>
                          <td className="date-value-cell">
                            {!editDueDate ? (
                              <span
                                style={{ cursor: "pointer" }}
                                onClick={() => setEditDueDate(true)}
                              >
                                <i className="bi bi-calendar-event me-1"></i>
                                {dueDate}
                              </span>
                            ) : (
                              <input
                                type="date"
                                className="form-control form-control-sm d-inline w-auto"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                onBlur={() => setEditDueDate(false)}
                                autoFocus
                              />
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <hr />
                <div className="row mt-2">
                  {/* Assigned To and Assigner */}
                  <div className="col-6 mb-3 position-relative">
                    <div className="small text-muted">Assignee</div>
                    <div
                      className="d-flex align-items-center gap-2 mt-1"
                      style={{ cursor: "pointer", position: "relative" }}
                      onClick={() => setEditAssignedTo(true)}
                    >
                      <div
                        className="rounded-circle d-flex justify-content-center align-items-center"
                        style={{
                          backgroundColor: assignedTo.color || "#888888",
                          width: 30,
                          height: 30,
                          color: "white",
                        }}
                      >
                        {assignedTo.id && assignedTo.id.trim() !== "" ? (
                          assignedTo.initials || "?"
                        ) : (
                          <i className="fa-regular fa-user"></i>
                        )}
                      </div>
                      <div>
                        {assignedTo.name ? assignedTo.name : "Unassigned"}
                      </div>
                    </div>
                    {editAssignedTo && (
                      <div
                        className="custom-user-dropdown"
                        ref={assignedToDropdownRef}
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "100%",
                          zIndex: 20,
                        }}
                      >
                        {userOptions.map((u) => (
                          <div
                            key={u.id}
                            className="dropdown-user-row d-flex align-items-center gap-2"
                            style={{
                              cursor: "pointer",
                              padding: "4px 8px",
                              borderRadius: 6,
                              background:
                                u.id === assignedTo.id
                                  ? "#f0f0f0"
                                  : "transparent",
                            }}
                            onClick={() => {
                              setAssignedTo(u);
                              setEditAssignedTo(false);
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
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="task-modal-footer d-flex justify-content-center gap-3 mt-3">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setDueDate(originalDueDate);
                onClose();
              }}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Move fetchSprints to top-level in TaskBoard:
  const fetchSprints = async () => {
    setSprintsLoading(true);
    try {
      const payload = {
        conditions: [
          {
            field: "feature_name",
            value: "sprint_management",
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
        if (result.data.length > 0)
          setSelectedSprintId(result.data[0].record_id);
      } else {
        setSprints([]);
      }
    } catch {
      setSprints([]);
    } finally {
      setSprintsLoading(false);
    }
  };

  // In useEffect, just call fetchSprints():
  useEffect(() => {
    fetchSprints();
  }, []);

  // Update statusOptions when selectedSprintId changes
  useEffect(() => {
    const selectedSprint = sprints.find(
      (s) => s.record_id === selectedSprintId
    );
    if (selectedSprint && Array.isArray(selectedSprint.task_status)) {
      setStatusOptions(
        selectedSprint.task_status.map((st) => ({
          id: st.id,
          name: st.name,
          color: st.color || "#888888",
        }))
      );
    } else {
      setStatusOptions([]);
    }
  }, [selectedSprintId, sprints]);

  // Fetch tasks for the logged-in user and selected sprint
  const fetchTasks = async () => {
    if (!session?.user?.id) {
      setLoadingTasks(false);
      return;
    }

    if (!selectedSprintId) {
      setLoadingTasks(false);
      setTasks([]);
      return;
    }

    setLoadingTasks(true);
    setFetchError(null);
    try {
      const payload = {
        conditions: [
          {
            field: "feature_name",
            value: "task_status_management",
            search_type: "exact",
          },
          {
            field: "more_data.assigned_by",
            value: session.user.id,
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
        const sortedTasks = (result.data as Task[]).sort((a, b) => {
          const orderA = a.more_data?.task_order ?? 0;
          const orderB = b.more_data?.task_order ?? 0;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          // Fallback to creation date if task_order is the same
          const dateA = new Date(a.more_data?.assigned_date || a.created || 0);
          const dateB = new Date(b.more_data?.assigned_date || b.created || 0);
          return dateA.getTime() - dateB.getTime();
        });
        setTasks(sortedTasks);
        console.log("task information", sortedTasks);
      } else {
        setTasks([]);
        setFetchError("No tasks found or error in response.");
      }
    } catch (err) {
      setTasks([]);
      setFetchError("Failed to fetch tasks.");
      console.log(err);
    } finally {
      setLoadingTasks(false);
    }
  };
  useEffect(() => {
    fetchTasks();
  }, [session?.user?.id, selectedSprintId]);

  // Add mapping function for BoardView/ListView task shape
  function mapTaskBoardTaskToListViewTask(taskFromBoard: Partial<Task>): Task {
    // Helper to get legacy or more_data fields safely
    const getString = (primary: unknown, fallback: unknown): string => {
      if (typeof primary === "string" && primary.trim()) return primary;
      if (typeof fallback === "string" && fallback.trim()) return fallback;
      return "";
    };

    const assignedBy = getString(
      taskFromBoard.more_data?.assigned_by,
      (taskFromBoard as { assigned_by?: string }).assigned_by
    );
    const assignedTo = getString(
      taskFromBoard.more_data?.assigned_to,
      (taskFromBoard as { assigned_to?: string }).assigned_to
    );

    // Helper function to safely generate initials
    const generateInitials = (name: string | undefined | null): string => {
      if (typeof name !== "string" || !name.trim()) {
        return "?";
      }
      return name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase();
    };

    // Checklist mapping with only known fields
    const checklist: ChecklistItem[] =
      taskFromBoard.checklist && Array.isArray(taskFromBoard.checklist)
        ? taskFromBoard.checklist.map((item) => ({
            id: item.id,
            text: item.text,
            checked: !!item.checked,
          }))
        : Array.isArray(taskFromBoard.more_data?.checklist)
        ? taskFromBoard.more_data.checklist.map((item) => ({
            id: item.id,
            text: item.text,
            checked: !!item.checked,
          }))
        : [];

    return {
      id: getString(
        taskFromBoard.id,
        (taskFromBoard as { record_id?: string }).record_id
      ),
      record_id:
        getString(
          (taskFromBoard as { record_id?: string }).record_id,
          taskFromBoard.id
        ) || "",
      type: getString(taskFromBoard.type, ""),
      key: getString(
        taskFromBoard.key,
        (taskFromBoard as { record_id?: string }).record_id
      ),
      summary: getString(taskFromBoard.summary, taskFromBoard.more_data?.title),
      description: getString(
        taskFromBoard.description,
        taskFromBoard.more_data?.description
      ),
      comments: Array.isArray(taskFromBoard.comments)
        ? taskFromBoard.comments
        : [],
      status: getString(
        taskFromBoard.status,
        taskFromBoard.more_data?.task_status
      ),
      created: getString(
        taskFromBoard.created,
        taskFromBoard.more_data?.assigned_date
      ),
      updated: getString(
        taskFromBoard.updated,
        taskFromBoard.more_data?.status_updated_date
      ),
      assigner: {
        name: assignedBy,
        initials: generateInitials(assignedBy),
        color: "orange",
        id: assignedBy || "assigner",
      },
      assigned_to: {
        name: assignedTo,
        initials: generateInitials(assignedTo),
        color: "green",
        id: assignedTo || "assigned_to",
      },
      dueDate: getString(
        taskFromBoard.dueDate,
        taskFromBoard.more_data?.due_date
      ),
      checklist,
      more_data: taskFromBoard.more_data,
    };
  }

  // Use mapped tasks for ListView and BoardView
  const mappedTasks = tasks.map(mapTaskBoardTaskToListViewTask);
  const mappedModalTask = modalTask
    ? mapTaskBoardTaskToListViewTask(modalTask)
    : null;

  // Function to fetch task-assigned members with user hierarchy (from Members component logic)
  const fetchTaskAssignedMembers = async () => {
    setLoadingMembers(true);
    try {
      // First, fetch assigned users for the current user
      const assignedUsersResponse = await fetch("/api/proxy", {
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
              value: user?.record_id || session?.user?.id || "client_0045",
              search_type: "exact",
            },
          ],
          combination_type: "and",
          page: 1,
          limit: 10,
          dataset: "features",
        }),
      });

      const assignedUsersResult = await assignedUsersResponse.json();
      const assignedMembers = assignedUsersResult.data?.[0]?.members || [];

      if (assignedMembers.length > 0) {
        // Fetch task members based on assigned member IDs
        const memberConditions = assignedMembers.map((id: string) => ({
          field: "record_id",
          value: id,
          search_type: "exact",
        }));

        const taskMembersResponse = await fetch("/api/proxy", {
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
              {
                combination_type: "or",
                conditions: memberConditions,
              },
            ],
            combination_type: "and",
            page: 1,
            limit: 100,
            dataset: "users",
          }),
        });

        const taskMembersResult = await taskMembersResponse.json();
        const members = taskMembersResult.data || [];

        // Filter based on user hierarchy (only show users with higher role)
        const userRoleId = user?.role_id || 0;
        const filteredMembers = members.filter((member: User) =>
          String(userRoleId) === "0"
            ? true
            : Number(member.role_id) > Number(userRoleId)
        );

        setTaskMembers(filteredMembers);
      } else {
        setTaskMembers([]);
      }
    } catch (error) {
      console.error("Error fetching task members:", error);
      setTaskMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch task members on mount
  useEffect(() => {
    if (user?.record_id || session?.user?.id) {
      fetchTaskAssignedMembers();
    }
  }, [user?.record_id, session?.user?.id]);

  // Map task members to the expected userOptions format
  const mappedUserOptions = taskMembers.map((member) => {
    const fullName = member.profile_information?.full_name || "";
    const baseName =
      fullName || member.username || member.name || member.record_id || "";
    return {
      name: baseName,
      initials: getInitialsFromUser({
        profile_information: member.profile_information,
        username: member.username,
        name: member.name,
        id: member.record_id,
      }),
      color: "#888888",
      id: member.record_id || "",
    };
  });

  // Use mappedUserOptions as filteredUserOptions for the dropdown
  // const filteredUserOptions: UserOptions[] = mappedUserOptions;

  // Update getAssignedToUser to accept userOptions as a parameter
  function getAssignedToUser(
    task: Task,
    userOptions: Array<{
      name: string;
      initials: string;
      color: string;
      id: string;
    }>
  ) {
    const assignedToId =
      task.more_data?.assigned_to || task.assigned_to?.id || "";
    return (
      userOptions.find((u: UserOptions) => u.id === assignedToId) || {
        name: "",
        initials: "",
        color: "#888888",
        id: "",
      }
    );
  }

  // Helper to fetch user details by ids
  const fetchUserDetails = useCallback(async (userIds: string[]) => {
    const userIdsSet = Array.from(new Set(userIds.filter(Boolean)));
    if (userIdsSet.length === 0) return;
    // Split ids by prefix
    const userIdsUser = userIdsSet.filter((id) => id.startsWith("user_"));
    const userIdsClient = userIdsSet.filter((id) => !id.startsWith("user_"));
    let userResults: User[] = [];
    // Fetch user_management users
    if (userIdsUser.length > 0) {
      const orConditions = userIdsUser.map((id) => ({
        field: "record_id",
        value: id,
        search_type: "exact",
      }));
      const payload = {
        conditions: [
          { combination_type: "or", conditions: orConditions },
          {
            field: "feature_name",
            value: "user_management",
            search_type: "exact",
          },
        ],
        combination_type: "and",
        page: 1,
        limit: 100,
        dataset: "users",
      };
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-TYPE": "search" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (Array.isArray(result.data)) {
        userResults = userResults.concat(result.data);
      }
    }
    // Fetch client_management users
    for (const id of userIdsClient) {
      const payload = {
        conditions: [
          {
            field: "feature_name",
            value: "client_management",
            search_type: "exact",
          },
          { field: "record_id", value: id, search_type: "exact" },
        ],
        combination_type: "and",
        page: 1,
        limit: 1,
        dataset: "users",
      };
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-TYPE": "search" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (Array.isArray(result.data) && result.data.length > 0) {
        userResults.push(result.data[0]);
      }
    }
    // Map by id
    const userMap: Record<string, User> = {};
    for (const u of userResults) {
      const fullName = u.profile_information?.full_name || "";
      const baseName = fullName || u.username || u.name || u.record_id || "";
      userMap[u.record_id] = {
        record_id: u.record_id,
        username:
          u.username ||
          u.user_credentials?.username ||
          fullName ||
          u.name ||
          u.record_id,
        name: baseName,
        role_id: u.role_id || "",
        control_access: u.control_access,
        record_status: u.record_status,
        user_credentials: u.user_credentials,
        profile_information: u.profile_information,
        more_data: u.more_data,
        initials: getInitialsFromUser(u),
        color: "#888888",
      };
    }
    setUserDetailsById((prev) => ({ ...prev, ...userMap }));
  }, []);

  // Effect: fetch user details whenever tasks change
  useEffect(() => {
    const ids: string[] = [];
    for (const t of tasks) {
      if (t.more_data?.assigned_by) ids.push(t.more_data.assigned_by);
      if (t.more_data?.assigned_to) ids.push(t.more_data.assigned_to);
    }
    fetchUserDetails(ids);
  }, [tasks, fetchUserDetails]);

  console.log("tasks from main component for testing", tasks);

  const emptyUser: User = {
    record_id: "",
    username: "",
    name: "",
    role_id: "",
    initials: "",
    color: "#888888",
  };

  if (!isMounted) {
    // Return a loading placeholder or null during SSR
    return null;
  }

  return (
    <div className="card custom-card rounded-card">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="text-xl text-primary font-bold">Task Management</h4>
          <div className="d-flex align-items-center gap-2">
            <div>
              <select
                className="form-select"
                style={{ minWidth: 180 }}
                value={selectedSprintId}
                onChange={(e) => setSelectedSprintId(e.target.value)}
                disabled={sprintsLoading}
              >
                {sprintsLoading ? (
                  <option value="">Loading sprints...</option>
                ) : sprints.length === 0 ? (
                  <option value="">No sprints available</option>
                ) : (
                  sprints.map((s) => (
                    <option key={s.record_id} value={s.record_id}>
                      {s.sprint_name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn ${
                  activeView === "list" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setActiveView("list")}
              >
                <i className="bi bi-list-ul me-1"></i>
                List View
              </button>
              <button
                type="button"
                className={`btn ${
                  activeView === "board" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setActiveView("board")}
              >
                <i className="bi bi-kanban me-1"></i>
                Board View
              </button>
            </div>
          </div>
        </div>
        {fetchError ? (
          <div className="text-danger my-4">{fetchError}</div>
        ) : !selectedSprintId && !sprintsLoading ? (
          <div className="text-center my-4 text-muted">
            Please select a sprint to view tasks.
          </div>
        ) : activeView === "list" ? (
          <ListView
            tasks={mappedTasks}
            setTasks={setTasks as React.Dispatch<React.SetStateAction<Task[]>>}
            statusOptions={statusOptions}
            setStatusOptions={setStatusOptions}
            modalTask={mappedModalTask}
            setModalTask={setModalTask}
            editingTask={editingTask}
            setEditingTask={setEditingTask}
            originalValue={originalValue}
            setOriginalValue={setOriginalValue}
            statusEdit={statusEdit}
            setStatusEdit={setStatusEdit}
            showAddStatusTable={showAddStatusTable}
            setShowAddStatusTable={setShowAddStatusTable}
            newStatusNameTable={newStatusNameTable}
            setNewStatusNameTable={setNewStatusNameTable}
            newStatusColorTable={newStatusColorTable}
            setNewStatusColorTable={setNewStatusColorTable}
            addStatusFormRef={addStatusFormRef}
            editingStatusIdx={editingStatusIdx}
            setEditingStatusIdx={setEditingStatusIdx}
            editStatusName={editStatusName}
            setEditStatusName={setEditStatusName}
            editStatusColor={editStatusColor}
            setEditStatusColor={setEditStatusColor}
            editStatusFormRef={editStatusFormRef}
            showStatusDropdown={showStatusDropdown}
            setShowStatusDropdown={setShowStatusDropdown}
            showCreateRow={showCreateRow}
            setShowCreateRow={setShowCreateRow}
            newTaskSummary={newTaskSummary}
            setNewTaskSummary={setNewTaskSummary}
            newTaskDescription={newTaskDescription}
            setNewTaskDescription={setNewTaskDescription}
            newTaskStatus={newTaskStatus}
            setNewTaskStatus={setNewTaskStatus}
            newTaskCreated={newTaskCreated}
            setNewTaskCreated={setNewTaskCreated}
            newTaskUpdated={newTaskUpdated}
            setNewTaskUpdated={setNewTaskUpdated}
            newTaskDueDate={newTaskDueDate}
            setNewTaskDueDate={setNewTaskDueDate}
            newTaskAssignedTo={newTaskAssignedTo}
            setNewTaskAssignedTo={setNewTaskAssignedTo}
            showAssignedToDropdown={showAssignedToDropdown}
            setShowAssignedToDropdown={setShowAssignedToDropdown}
            assignedToDropdownRef={assignedToDropdownRef}
            handleDragEnd={handleListViewDragEnd}
            handleAddTask={handleAddTask}
            handleCancelCreate={handleCancelCreate}
            handleSaveChanges={handleSaveChanges}
            handleCancelChanges={handleCancelChanges}
            getStatusOption={getStatusOption}
            handleAddNewStatus={handleAddNewStatus}
            handleCancelAddStatus={handleCancelAddStatus}
            deleteTaskAPI={deleteTaskAPI}
            TaskDetailModal={TaskDetailModal}
            selectedSprintId={selectedSprintId}
            updateSprintStatusAPI={updateSprintStatusAPI}
            userOptions={mappedUserOptions}
            userDetailsById={userDetailsById}
            loading={isLoading}
          />
        ) : (
          <BoardView
            tasks={mappedTasks}
            setTasks={setTasks as React.Dispatch<React.SetStateAction<Task[]>>}
            statusOptions={statusOptions}
            setStatusOptions={setStatusOptions}
            onDragEnd={handleBoardViewDragEnd}
            onStatusDragEnd={handleStatusDragEnd}
            setModalTask={setModalTask}
            selectedSprintId={selectedSprintId}
            updateSprintStatusAPI={updateSprintStatusAPI}
            deleteTaskAPI={deleteTaskAPI}
            userOptions={mappedUserOptions}
            userDetailsById={userDetailsById}
            fetchTasks={fetchTasks}
            fetchSingleTask={fetchSingleTask}
            fetchUserDetails={fetchUserDetails}
          />
        )}

        {/* Task Detail Modal - Rendered for both views */}
        {modalTask !== null && (
          <TaskDetailModal
            task={
              tasks.find((t) => t.record_id === modalTask.record_id) ||
              modalTask
            }
            onClose={() => setModalTask(null)}
            onUpdateTask={(updatedTask: Task) =>
              setTasks((prev) =>
                prev.map((task) =>
                  task.record_id === updatedTask.record_id ? updatedTask : task
                )
              )
            }
            statusOptions={statusOptions}
            setStatusOptions={setStatusOptions}
            userOptions={mappedUserOptions}
            userDetailsById={userDetailsById}
          />
        )}
      </div>
    </div>
  );
};

export default TaskBoard;
