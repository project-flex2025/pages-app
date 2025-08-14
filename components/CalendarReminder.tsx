import { RootState } from "@/redux/store";
import { ApiRecord, CalendarProps } from "@/types/table";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import QuillEditor from "./QuillEditor";
import { decodeBase64, encodeBase64 } from "@/utils/base64Utils";
// import dynamic from "next/dynamic";

// const QuillEditor = dynamic(() => import("./QuillEditor"), { ssr: false });

type Reminder = {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  description: string;
  createdAt: string;
};

// 🧠 Convert reminder object to API-ready payload
interface ReminderPayloadInput {
  category: string;
  title: string;
  date: string;
  time: string;
  description: string;
}

interface ReminderPayloadField {
  record_value?: string;
  record_value_text?: string;
  record_label: string;
  record_type: string;
}

interface FieldMapping {
  [key: string]: {
    label: string;
    useTextKey?: boolean;
  };
}

function convertToReminderPayload(
  input: ReminderPayloadInput
): ReminderPayloadField[] {
  const fieldMapping: FieldMapping = {
    category: { label: "category" },
    title: { label: "title" },
    date: { label: "date" },
    time: { label: "time" },
    description: { label: "description" },
  };

  const result = Object.entries(input).map(([key, value]) => {
    const { label } = fieldMapping[key] || {};
    if (!label) return null;

    return {
      record_value: value,
      record_label: label,
      record_type: "type_text",
    };
  });

  return result.filter(Boolean) as ReminderPayloadField[];
}

type CalendarConfig = {
  Calendar?: {
    data_source: string;
  };
  calendar?: {
    data_source: string;
  };
};

type WidgetTabItem = Record<string, unknown> & CalendarConfig;

type ReminderCategory = {
  label: string;
  value: string;
};

type RemindersConfig = {
  Reminders: {
    categories: ReminderCategory[];
  };
};
interface MyReminder {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  createdAt: string;
}

type NoteReminder = {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  description: string;
  notesid: string;
  createdAt: string;
};

function CalendarReminder({ config }: CalendarProps) {
  const currentUser = useSelector((state: RootState) => state.user.user);
  const [myreminders, setMyReminders] = useState<Reminder[]>([]);
  const [notereminders, setNoteReminders] = useState<NoteReminder[]>([]);
  const [taskreminders, settaskReminders] = useState<NoteReminder[]>([]);

  const isRemindersConfig = (c: unknown): c is RemindersConfig => {
    if (typeof c !== "object" || c === null || !("Reminders" in c)) {
      return false;
    }
    const obj = c as { Reminders?: unknown };
    if (
      typeof obj.Reminders !== "object" ||
      obj.Reminders === null ||
      !("categories" in obj.Reminders)
    ) {
      return false;
    }

    const reminders = obj.Reminders as { categories?: unknown };
    return Array.isArray(reminders.categories);
  };

  const reminderConfig = config.find(isRemindersConfig);

  const reminderCategories: string[] = reminderConfig
    ? reminderConfig.Reminders.categories.map((cat) => cat.value)
    : [];

  const defaultTab = reminderCategories[0] ?? "";
  const [switchTab, setSwitchTab] =
    useState<(typeof reminderCategories)[number]>(defaultTab);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentReminder, setCurrentReminder] =
    useState<HandleCardClickReminder | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reminders, setReminders] = useState<MyReminder[]>([]);
  const feature_name =
    (config.find(
      (c): c is WidgetTabItem =>
        ("Calendar" in c &&
          typeof (c as WidgetTabItem).Calendar === "object" &&
          (c as WidgetTabItem).Calendar !== null &&
          "data_source" in (c as WidgetTabItem).Calendar!) ||
        ("calendar" in c &&
          typeof (c as WidgetTabItem).calendar === "object" &&
          (c as WidgetTabItem).calendar !== null &&
          "data_source" in (c as WidgetTabItem).calendar!)
    )?.Calendar?.data_source ||
      config.find(
        (c): c is WidgetTabItem =>
          "calendar" in c &&
          typeof (c as WidgetTabItem).calendar === "object" &&
          (c as WidgetTabItem).calendar !== null &&
          "data_source" in (c as WidgetTabItem).calendar!
      )?.calendar?.data_source) ??
    "";

  const wrapperRef = useRef<HTMLDivElement>(null);
  const getDefaultDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  console.log("currentReminder", currentReminder);

  useEffect(() => {
    if (isExpanded) {
      setDate((prev) => prev || getDefaultDate());
      setTime((prev) => prev || "10:00");
    }
  }, [isExpanded]);

  const saveReminder = async () => {
    if (!title.trim()) return false;

    const newReminder: Reminder = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      createdAt: new Date().toISOString(),
      category: switchTab,
    };

    const updated = [newReminder, ...myreminders];
    setMyReminders(updated);

    const apiPayload = convertToReminderPayload({
      title: newReminder.title,
      date: newReminder.date,
      time: newReminder.time,
      description: newReminder.description,
      category: switchTab,
    });

    const Payload = {
      record_id: newReminder.id,
      feature_name: feature_name,
      added_by: currentUser?.record_id,
      record_status: "active",
      created_on_date: new Date().toISOString().split("T")[0],
      feature_data: {
        record_data: apiPayload,
      },
    };

    await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-TYPE": "create",
      },
      body: JSON.stringify({ data: Payload, dataset: "feature_data" }),
    });

    setTitle("");
    setDescription("");
    setDate("");
    setTime("");

    return true;
  };

  useEffect(() => {
    fetchReminders();
  }, [config]);

  const fetchReminders = async () => {
    const res = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-TYPE": "search",
      },
      body: JSON.stringify({
        conditions: [
          {
            field: "feature_name",
            search_type: "exact",
            value: feature_name,
          },
        ],
        combination_type: "and",
        limit: "100",
        dataset: "feature_data",
      }),
    });

    const data = await res.json();

    if (res.ok) {
      const reminders: Reminder[] = [];
      const myreminders: Reminder[] = [];
      const notereminders: NoteReminder[] = [];
      const taskreminders: NoteReminder[] = [];

      (data?.data as ApiRecord[])?.forEach((record, idx) => {
        const recordData = record.feature_data?.record_data ?? [];

        const getFieldValue = (label: string): string => {
          const entry = recordData.find((d) => d.record_label === label);
          return (
            (entry?.record_value as string) ??
            (entry?.record_value_date as string) ??
            (entry?.record_value_text as string) ??
            entry?.record_value_number?.toString() ??
            ""
          );
        };

        const category = getFieldValue("category").toLowerCase();
        const title = getFieldValue("title");
        const date = getFieldValue("date");
        const time = getFieldValue("time");
        const description = getFieldValue("description");
        const notesid = getFieldValue("notesid");
        const createdAt =
          typeof record.created_on_date === "string"
            ? record.created_on_date
            : typeof record.createdAt === "string"
            ? record.createdAt
            : new Date().toISOString();

        const reminderBase = {
          id: record.record_id ?? `${title}-${date}-${idx}`,
          title,
          date,
          time: time || "",
          category,
          description: decodeBase64(description),
          createdAt,
        };

        if (category === "my-reminders") {
          myreminders.push({ ...reminderBase });
        } else if (category === "note-reminders") {
          notereminders.push({
            ...reminderBase,
            notesid,
            createdAt: reminderBase.createdAt,
          });
        } else if (category === "task-reminders") {
          taskreminders.push({
            ...reminderBase,
            notesid,
            createdAt: reminderBase.createdAt,
          });
        }
      });

      setReminders(reminders);
      setMyReminders(myreminders);
      setNoteReminders(notereminders);
      settaskReminders(taskreminders);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isExpanded &&
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        if (title.trim() && date && time) {
          saveReminder(); // save if valid
        }
        // always close and reset
        setIsExpanded(false);
        setTitle("");
        setDescription("");
        setDate("");
        setTime("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded, title, description, date, time, reminders]);

  function stripHtml(html: string): string {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  }

  interface HandleCardClickReminder {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    category?: string;
    createdAt?: string;
    notesid?: string;
  }

  const handleCardClick = (reminder: HandleCardClickReminder): void => {
    console.log("reminder...........", reminder);

    setCurrentReminder({ ...reminder });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (switchTab === "note-reminders") {
      setNoteReminders(
        notereminders.filter((reminder) => reminder.id !== currentReminder?.id)
      );
    }
    if (switchTab === "task-reminders") {
      settaskReminders(
        taskreminders.filter((reminder) => reminder.id !== currentReminder?.id)
      );
    }

    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-TYPE": "delete",
        },
        body: JSON.stringify({
          data: {
            record_id: currentReminder?.id || "",
            feature_name: config[0]?.calendar?.data_source || "calendar",
            delete_entire_document: true,
          },
        }),
      });

      if (res.ok) {
        if (currentReminder?.category === "note reminders") {
          await fetch("/api/proxy", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "X-API-TYPE": "update",
            },
            body: JSON.stringify({
              data: {
                record_id: currentReminder?.notesid,
                feature_name: "notes",
                fields_to_update: {
                  setReminder: {
                    date: "",
                    time: "",
                    title: "",
                    description: "",
                    noteid: "",
                  },
                },
              },
            }),
          });
        }

        setIsModalOpen(false);
        // await fetchReminders();
      }
    } catch (error) {
      console.error("Error during delete:", error);
    }
  };

  const handleSave = async () => {
    if (!currentReminder) return;
    const apiPayload = convertToReminderPayload({
      title: currentReminder.title || "",
      date: currentReminder.date,
      time: currentReminder.time,
      description: encodeBase64(currentReminder.description) || "",
      category: currentReminder.category || "",
    });

    const payload = {
      record_id: currentReminder.id,
      feature_name: config[0]?.calendar?.data_source || "calendar",
      fields_to_update: {
        // created_on_date: new Date().toISOString().split("T")[0],
        "feature_data.record_data": apiPayload,
      },
    };

    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-TYPE": "update",
        },
        body: JSON.stringify({
          data: payload,
          dataset: "feature_data",
        }),
      });

      if (!response.ok) throw new Error("API failed");

      toast.success("Reminder updated successfully");

      if (currentReminder.category === "note-reminders") {
        await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-API-TYPE": "update",
          },
          body: JSON.stringify({
            data: {
              record_id: currentReminder.id,
              feature_name: "notes",
              fields_to_update: {
                setReminder: {
                  date: currentReminder.date,
                  time: currentReminder.time,
                  title: currentReminder.title,
                  description: currentReminder.description,
                },
              },
            },
          }),
        });
      }

      if (currentReminder.category === "task-reminders") {
        await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-API-TYPE": "update",
          },
          body: JSON.stringify({
            data: {
              record_id: currentReminder.id,
              feature_name: "task_status_management",
              fields_to_update: {
                setReminder: {
                  date: currentReminder.date,
                  time: currentReminder.time,
                  title: currentReminder.title,
                  description: currentReminder.description,
                },
              },
            },
          }),
        });
      }

      setIsModalOpen(false);
      await fetchReminders();
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save reminder");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isExpanded &&
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        if (title.trim()) {
          saveReminder();
          setIsExpanded(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded, title, description, date, time, reminders]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div className="d-flex justify-content-center align-items-center mt-2">
          <div style={{ minWidth: "220px" }}>
            <select
              className="form-select"
              value={switchTab}
              onChange={(e) => setSwitchTab(e.target.value)}
            >
              {config.map((item) => {
                const key = Object.keys(item)[0];
                const section = item[key];

                if (
                  key === "Reminders" &&
                  typeof section === "object" &&
                  section !== null &&
                  "categories" in section &&
                  Array.isArray(
                    (section as { categories?: unknown }).categories
                  )
                ) {
                  return (
                    section as {
                      categories: { label: string; value: string }[];
                    }
                  ).categories.map((cat) => {
                    const capitalized = cat.label.replace(/\b\w/g, (l) =>
                      l.toUpperCase()
                    );
                    return (
                      <option key={cat.value} value={cat.value}>
                        {capitalized}
                      </option>
                    );
                  });
                }

                return null;
              })}
            </select>
          </div>
        </div>
      </div>
      <div className="container py-4">
        {switchTab === "my-reminders" && (
          <div>
            <div
              ref={wrapperRef}
              className="mb-4"
              style={{ maxWidth: "800px", margin: "0 auto" }}
            >
              {!isExpanded ? (
                <div
                  className="d-flex align-items-center justify-content-between px-2 py-1"
                  onClick={() => setIsExpanded(true)}
                  style={{
                    cursor: "text",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
                    fontSize: "16px",
                    color: "#5f6368",
                    minHeight: "48px",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-around",
                      width: "100%",
                    }}
                  >
                    <span className="flex-grow-1 text-muted">
                      Take a Reminder...
                    </span>
                    <div className="d-flex gap-3 align-items-center">
                      <i
                        className="bi bi-check2-square"
                        style={{ fontSize: "16px" }}
                      ></i>
                      <i
                        className="bi bi-pencil"
                        style={{ fontSize: "16px" }}
                      ></i>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="card"
                  style={{
                    backgroundColor: "#fff",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                    borderRadius: "8px",
                    color: "#5f6368",
                  }}
                >
                  <div className="card-body">
                    <input
                      type="text"
                      className="form-control border-0 mb-2"
                      placeholder="Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      style={{ fontSize: "20px", fontWeight: "400" }}
                    />

                    <textarea
                      className="form-control border-0 mb-2"
                      placeholder="Take a reminder..."
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      style={{ fontSize: "16px", resize: "none" }}
                    />

                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="fa-regular fa-bell fa-lg  "></i>
                      <div className="col">
                        <input
                          type="date"
                          className="form-control"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </div>
                      <div className="col">
                        <input
                          type="time"
                          className="form-control"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="d-flex justify-content-end">
                      <button
                        className="btn btn-sm btn-outline-dark"
                        onClick={async () => {
                          if (title) {
                            saveReminder();
                            setIsExpanded(false);
                          } else {
                            setIsExpanded(false);
                          }
                        }}
                      >
                        Save & Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="row g-4">
              {myreminders.map((reminder) => (
                <div key={reminder.id} className="col-md-4 col-sm-6">
                  <div
                    className="card h-100 shadow-sm"
                    onClick={() => handleCardClick(reminder)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="card-body d-flex flex-column justify-content-between">
                      <h5
                        className="card-title"
                        style={{ fontSize: "20px", fontWeight: "600" }}
                      >
                        {reminder.title}
                      </h5>

                      {reminder.description && (
                        <p className="card-text my-3">{reminder.description}</p>
                      )}

                      <div className="text-muted" style={{ fontSize: "13px" }}>
                        {reminder.date} at {reminder.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {switchTab == "note-reminders" && (
          <div className="row g-4">
            {notereminders.map((reminder) => (
              <div key={reminder.id} className="col-md-4 col-sm-6">
                <div
                  className="card h-100 shadow-sm reminder-card"
                  onClick={() => handleCardClick(reminder)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="top-line"></div>
                  <div className="card-body d-flex flex-column justify-content-between">
                    <h5
                      className="card-title"
                      style={{ fontSize: "20px", fontWeight: "600" }}
                    >
                      {reminder.title}
                    </h5>

                    {reminder.description && (
                      <p className="card-text my-3">
                        {stripHtml(reminder.description)}
                      </p>
                    )}

                    <div className="text-muted" style={{ fontSize: "13px" }}>
                      {reminder.date} at {reminder.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {switchTab == "task-reminders" && (
          <div className="row g-4">
            {taskreminders.map((reminder) => (
              <div key={reminder.id} className="col-md-4 col-sm-6">
                <div
                  className="card h-100 shadow-sm"
                  onClick={() => handleCardClick(reminder)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-body d-flex flex-column justify-content-between">
                    <h5
                      className="card-title"
                      style={{ fontSize: "20px", fontWeight: "600" }}
                    >
                      {reminder.title}
                    </h5>

                    {reminder.description && (
                      <p className="card-text my-3">{reminder.description}</p>
                    )}

                    <div className="text-muted" style={{ fontSize: "13px" }}>
                      {reminder.date} at {reminder.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isModalOpen && currentReminder && (
          <div
            className="modal show d-block"
            tabIndex={-1}
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              position: "fixed",
              top: 0,
              left: 0,
              height: "100vh",
              width: "100vw",
              zIndex: 1050,
            }}
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Reminder</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setIsModalOpen(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentReminder.title}
                      onChange={(e) =>
                        setCurrentReminder({
                          ...currentReminder,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    {/* <QuillEditor
                      quilleditor={quilleditor}
                      setQuillEditor={setQuillEditor}
                    /> */}
                    {/* <QuillEditor
                      value={currentReminder.description} 
                      onChange={(value) =>
                        setCurrentReminder((prev) => ({
                          ...prev,
                          description: value,
                        }))
                      }
                    /> */}

                    <QuillEditor
                      value={currentReminder.description ?? ""} // ensure not undefined
                      onChange={(val) =>
                        setCurrentReminder((prev) =>
                          prev ? { ...prev, description: val } : prev
                        )
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={currentReminder.date}
                      onChange={(e) =>
                        setCurrentReminder({
                          ...currentReminder,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="mb-1">
                    <label className="form-label">Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={currentReminder.time}
                      onChange={(e) =>
                        setCurrentReminder({
                          ...currentReminder,
                          time: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px",
                  }}
                >
                  <button className="btn btn-primary" onClick={handleSave}>
                    Save
                  </button>

                  {/* <i
                    className="bi bi-check fs-5 text-success"
                    onClick={handleSave}
                  ></i> */}

                  <i
                    className="bi bi-trash fs-5 text-danger"
                    onClick={handleDelete}
                  ></i>
                  {/* </button> */}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarReminder;
