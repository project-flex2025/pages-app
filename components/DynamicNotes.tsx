"use client";
import * as React from "react";
import { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { encodeBase64 } from "@/utils/base64Utils";
import { decodeBase64 } from "@/utils/base64Utils";
import { toast } from "react-toastify";
import TaskTracker from "./TestTraker";
import { Tooltip } from "bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { sendLog } from "@/utils/sendLog";
import QuillEditor from "./QuillEditor";
import QuillViewer from "./QuillViewer";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isChecked?: boolean;
  checkedItems?: ItemType[];
  isreminder?: boolean;
  date?: string;
  time?: string;
  reminderDescription?: string;
  reminderTitle?: string;
  modifiedOn?: string;
  pinned?: boolean;
  type?: string;
}

type NoteType = {
  id: string;
  title: string;
  content: string;
  isChecked: boolean;
  date?: string;
  time?: string;
  modifiedOn: string;
  pinned?: boolean;
  type?: string;
  checkedItems?: {
    id: string;
    label: string;
    completed?: boolean;
    placeholder?: boolean;
    level: number;
    parentId?: string;
  }[];
  isreminder?: boolean;
  reminderDescription?: string;
  reminderTitle?: string;
};
type ItemType = {
  id: string;
  label: string;
  level: number;
  completed?: boolean;
  parentId?: string;
  placeholder?: boolean;
};
type NotesWidgetData = {
  row: number;
  widgetID: string;
  componentName: string;
  type: string;
  widget: string;
  width: number;
  height: number;
  config: {
    widgetID: string;
    dataset: string;
    config: {
      label_name: string;
      data_source: string;
    };
  };
  layoutConfig: {
    row: number;
  };
};

type NotesPageProps = {
  widgetData: NotesWidgetData;
};

const htmlToPlainText = (html: string): string => {
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;

  const lines: string[] = [];
  div.childNodes.forEach((node) => {
    if (node.nodeName === "P") {
      const line = (node as HTMLElement).innerText.trim();
      lines.push(line);
    }
  });

  return lines.join("\n");
};

// const convertTextToChecklist = (text: string): ItemType[] => {
//   return text
//     .split("\n")
//     .filter((line) => line.trim() !== "")
//     .map((line, index) => ({
//       id: `${Date.now()}-${index}`,
//       label: line,
//       completed: false,
//       level: 0,
//     }));
// };

const convertTextToChecklist = (text: string): ItemType[] =>
  text
    .split("\n")
    .filter(Boolean)
    .map((line, index) => ({
      id: `${Date.now()}-${index}`,
      label: line,
      completed: false,
      level: 0,
    }));

// export const convertChecklistToHtml = (items: ItemType[]): string => {
//   return items.map((item) => `<p>${item.label}</p>`).join("");
// };

// export const convertHtmlToChecklist = (html: string): ItemType[] => {
//   const div = document.createElement("div");
//   div.innerHTML = html;
//   const paragraphs = div.querySelectorAll("p");
//   return Array.from(paragraphs).map((p, i) => ({
//     id: `${Date.now()}-${i}`,
//     label: p.textContent || "",
//     level: 0,
//     completed: false,
//   }));
// };

export const convertChecklistToHtml = (items: ItemType[]): string =>
  items.map((item) => `<p>${item.label}</p>`).join("");

export const convertHtmlToChecklist = (html: string): ItemType[] => {
  if (typeof document === "undefined") return [];
  const div = document.createElement("div");
  div.innerHTML = html;
  return Array.from(div.querySelectorAll("p")).map((p, i) => ({
    id: `${Date.now()}-${i}`,
    label: p.textContent || "",
    level: 0,
    completed: false,
  }));
};

const plainTextToHtml = (plain: string): string =>
  plain
    .split(/\r?\n/)
    .map((line) => `<p>${line || "<br>"}</p>`)
    .join("");

const MIN_HEIGHT = 218;
const MAX_HEIGHT = 340;

export default function NotesPage({ widgetData }: NotesPageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [item, setItem] = useState<ItemType[]>([]);
  // const [edititem, setEditItem] = useState<ItemType[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [notesTab, setNotesTab] = useState("simple");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [reminderNote, setReminderNote] = useState<Note | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [isLoading, setisLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [showMultiSelect, setShowMultiSelect] = useState(false);
  const currentUser = useSelector((state: RootState) => state.user.user);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
  const [notes, setNotes] = useState<NoteType[]>([]);
  const pinnedNotesWrapperRef = useRef(null);
  const otherNotesWrapperRef = useRef(null);
  const multiSelectBarRef = useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const editTitleInputRef = useRef<HTMLInputElement | null>(null);
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [checkBoxNotes, setCheckBoxNotes] = useState<ItemType[]>([]);
  const [htmlNote, setHtmlNote] = useState("");
  const htmlNoteRef = useRef(htmlNote);
  const plainTextFromHtml = htmlToPlainText(htmlNote);
  const [simpleNote, setSimpleNote] = useState("");
  const [richNote, setRichNote] = useState("");
  const [sharedHeight, setSharedHeight] = useState(MIN_HEIGHT);
  const [transitionHeight, setTransitionHeight] = useState<number | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSimpleNote, setEditSimpleNote] = useState("");
  const [editChecklist, setEditChecklist] = useState<ItemType[]>([]);
  const [editHtmlNote, setEditHtmlNote] = useState("");
  const [editTab, setEditTab] = useState("simple");
  const [isMounted, setIsMounted] = useState(false);
  const [editTabChange, seteditTabChange] = useState<
    "simple" | "checklist" | "richeditor"
  >("simple");
  const [confirmRichTextLoss, setConfirmRichTextLoss] = useState(false);

  const latestNotesRef = useRef<ItemType[]>([]);
  const latestNotesTabRef = useRef("simple");
  const latestsimpleNoteRef = useRef(simpleNote);

  // console.log("editTabeditTab", editTab);

  console.log("selectedNote", selectedNote);

  console.log("isEditModalOpen", isEditModalOpen);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title || "");
      setEditSimpleNote(selectedNote.content || "");
      setEditChecklist(selectedNote?.checkedItems || []);
      setEditHtmlNote(selectedNote.content || "");
      setEditTab(selectedNote.type || "simple");
    }
  }, [selectedNote]);

  useEffect(() => {
    latestNotesRef.current = checkBoxNotes;
  }, [checkBoxNotes]);

  const handleSaveEditedNote = async () => {
    if (!selectedNote) return;

    console.log("selectedNote", selectedNote);

    console.log(
      "editedTitle",
      editTitle,
      "editHtmlNote",
      editHtmlNote,
      "editSimpleNote",
      editSimpleNote,
      "editChecklist",
      editChecklist,
      editTab
    );

    let desc = "";

    if (editTab === "simple") {
      desc = editSimpleNote;
    } else if (editTab === "checklist") {
      desc = encodeBase64(JSON.stringify(editChecklist));
    } else if (editTab === "richeditor") {
      desc = encodeBase64(editHtmlNote);
    }

    const res = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-TYPE": "update",
      },
      body: JSON.stringify({
        data: {
          record_id: selectedNote.id,
          feature_name: widgetData?.config?.config?.data_source,
          last_updated: new Date().toISOString(),
          fields_to_update: {
            "feature_data.record_data": [
              {
                record_label: "title",
                record_value: editTitle,
              },
              {
                record_label: "description",
                record_value: desc,
              },
              {
                record_label: "type",
                record_value: editTab,
              },
            ],
          },
        },
        dataset: "feature_data",
      }),
    });

    if (res.ok) {
      toast.success("Note updated successfully");
    }

    await fetchNotes();
    setIsEditModalOpen(false);
    setSelectedNote(null);
  };

  useEffect(() => {
    const updatedChecklist = parseTextToChecklist(plainTextFromHtml);
    setCheckBoxNotes(updatedChecklist);
    setNote(plainTextFromHtml);
  }, [htmlNote]);

  useEffect(() => {
    htmlNoteRef.current = htmlNote;
  }, [htmlNote]);

  useEffect(() => {
    latestsimpleNoteRef.current = simpleNote;
  }, [simpleNote]);

  useEffect(() => {
    if (notesTab === "richeditor") {
      // Sync rich editor with simple or checklist
      if (simpleNote.trim()) {
        setHtmlNote(plainTextToHtml(simpleNote));
      } else if (checkBoxNotes.length > 0) {
        const text = convertChecklistToText(checkBoxNotes);
        setSimpleNote(text);
        setHtmlNote(plainTextToHtml(text));
      }
    } else if (notesTab === "simple") {
      // Sync simple with rich or checklist
      if (htmlNote.trim()) {
        setSimpleNote(htmlToPlainText(htmlNote));
      } else if (checkBoxNotes.length > 0) {
        setSimpleNote(convertChecklistToText(checkBoxNotes));
      }
    } else if (notesTab === "checklist") {
      // Sync checklist with simple or rich
      if (simpleNote.trim()) {
        setCheckBoxNotes(convertTextToChecklist(simpleNote));
      } else if (htmlNote.trim()) {
        const plain = htmlToPlainText(htmlNote);
        setSimpleNote(plain);
        setCheckBoxNotes(convertTextToChecklist(plain));
      }
    }
  }, [notesTab]);

  const handleTabSwitch = (tab: "simple" | "checklist" | "richeditor") => {
    if (tab === "simple" && notesTab === "richeditor") {
      // Convert HTML to plain text for textarea
      setSimpleNote(htmlToPlainText(richNote));
    }

    if (tab === "richeditor" && notesTab === "simple") {
      // Convert plain text to HTML for rich editor
      const html = simpleNote
        .split("\n")
        .map((line) => `<p>${line}</p>`)
        .join("");
      setRichNote(html);
    }

    setTransitionHeight(sharedHeight);
    // setNotesTab(tab);

    if (transitionTimeoutRef.current)
      clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => {
      setTransitionHeight(null);
    }, 150);

    setNotesTab(tab);
    latestNotesTabRef.current = tab;
  };

  const handleTabEditSwitchConfirm = (tab: "simple" | "checklist") => {
    if (editTab === "richeditor") {
      if (tab === "simple" || tab === "checklist") {
        seteditTabChange(tab);
        setConfirmRichTextLoss(true);
        return;
      }
    }
  };

  const handleTabEditSwitch = (tab: "simple" | "checklist" | "richeditor") => {
    if (tab === editTab) return;

    if (editTab === "simple") {
      const html = plainTextToHtml(editSimpleNote);
      const checklist = convertTextToChecklist(editSimpleNote);
      setEditHtmlNote(html);
      setEditChecklist(checklist);
    }

    if (editTab === "checklist") {
      const text = convertChecklistToText(editChecklist);
      const html = plainTextToHtml(text);
      setEditSimpleNote(text);
      setEditHtmlNote(html);
    }

    if (editTab === "richeditor") {
      const plain = htmlToPlainText(editHtmlNote);
      const checklist = convertTextToChecklist(plain);
      setEditSimpleNote(plain);
      setEditChecklist(checklist);
    }

    setEditTab(tab);
  };

  function parseTextToChecklist(text: string): ItemType[] {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((label, index) => ({
        id: `item-${Date.now()}-${index}`,
        label,
        level: 0,
        completed: false,
      }));
  }

  function convertChecklistToText(items: ItemType[]): string {
    return items.map((item) => item.label).join("\n");
  }

  useEffect(() => {
    if (isExpanded && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isExpanded]);

  interface CalendarSection {
    Calendar?: {
      data_source?: string;
    };
    Reminders?: {
      categories?: { value: string }[];
    };
    [key: string]: unknown;
  }

  interface WidgetConfig {
    config?: CalendarSection[];
    [key: string]: unknown;
  }

  interface Widget {
    componentName?: string;
    config?: WidgetConfig;
    [key: string]: unknown;
  }

  interface Layout {
    widgets?: Widget[];
    [key: string]: unknown;
  }

  interface PermissionItem {
    layouts?: Layout[];
    [key: string]: unknown;
  }

  interface FindCalendarDataResult {
    dataSource: string | null;
    hasNoteReminders: boolean;
  }

  function findCalendarData(
    dataArray: PermissionItem[]
  ): FindCalendarDataResult {
    for (const item of dataArray) {
      const firstWidget = item.layouts?.[0]?.widgets?.[0];
      if (!firstWidget || firstWidget.componentName !== "DynamicCalendar")
        continue;

      const configArray = firstWidget.config?.config;
      if (!Array.isArray(configArray)) continue;

      let dataSource: string | null = null;
      let hasNoteReminders = false;

      for (const section of configArray) {
        if (section.Calendar?.data_source) {
          dataSource = section.Calendar.data_source;
        }

        if (section.Reminders?.categories) {
          hasNoteReminders = section.Reminders.categories.some(
            (cat) => cat.value === "note-reminders"
          );
        }
      }

      return { dataSource, hasNoteReminders };
    }
    return { dataSource: null, hasNoteReminders: false };
  }

  const { dataSource, hasNoteReminders } = findCalendarData(
    currentUser?.more_data?.user_permissions || []
  );

  useEffect(() => {
    if (isEditModalOpen && editTitleInputRef.current) {
      editTitleInputRef.current.focus();
    }
  }, [isEditModalOpen]);

  const fetchNotes = async () => {
    setisLoading(true);

    try {
      const response = await fetch("/api/proxy", {
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
              value: widgetData?.config?.config?.data_source || "notes",
            },
          ],
          sort: [{ modified_on: "desc" }],
          combination_type: "and",
          limit: "1000",
          dataset: "feature_data",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }
      const data = await response.json();
      const notes = transformApiData(data?.data);

      setNotes(notes);
      setisLoading(false);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  useEffect(() => {
    if (!isMounted) return;
    fetchNotes();
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    import("bootstrap").then(({ Tooltip }) => {
      if (typeof document !== "undefined") {
        document
          .querySelectorAll('[data-bs-toggle="tooltip"]')
          .forEach((el) => new Tooltip(el));
      }
    });
  }, [isMounted]);

  const saveNote = async () => {
    if (!title) {
      toast.error("Please enter a title");
      return;
    }
    let description = null;

    const latest = latestNotesRef.current;
    const tab = latestNotesTabRef.current;

    console.log("htmlnotereffffffffffffffffffffffffff", htmlNoteRef.current);

    if (tab === "simple") {
      description = latestsimpleNoteRef.current;
    } else if (tab === "checklist") {
      description = encodeBase64(JSON.stringify(latest));
    } else if (tab === "richeditor") {
      description = encodeBase64(htmlNoteRef.current);
    }

    const payload = {
      title,
      type: tab,
      description,
    };

    console.log("payload................", payload);

    const res = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-TYPE": "create",
      },
      body: JSON.stringify({
        data: {
          record_id: Date.now().toString(),
          feature_name: widgetData?.config?.config?.data_source,
          record_status: "active",
          created_on_date: new Date().toISOString().split("T")[0],
          modified_on: new Date().toISOString(),
          created_by: currentUser?.record_id,
          feature_data: {
            record_data: [
              {
                record_value: title,
                record_label: "title",
                record_type: "type_text",
              },
              {
                record_value: description,
                record_label: "description",
                record_type: "type_text",
              },
              {
                record_value: tab,
                record_label: "type",
                record_type: "type_text",
              },
              {
                record_value: false,
                record_label: "isPinned",
                record_type: "type_text",
              },
            ],
          },
          setReminder: {
            date: "",
            time: "",
            title: "",
            description: "",
          },
        },
      }),
    });

    if (!res.ok) throw new Error("Failed to fetch data");

    if (res.ok) {
      await fetchNotes();
    }

    setTitle("");
    setNote("");
    setItem([]);
    setSimpleNote("");
    setCheckBoxNotes([]);
    setHtmlNote("");
    setIsChecked(false);
    setIsExpanded(false);
  };

  useEffect(() => {
    if (!isMounted) return;
    if (!wrapperRef.current) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        if (title.trim()) {
          setTimeout(() => {
            saveNote();
          }, 0);
        } else {
          setIsExpanded(false);
          setIsChecked(false);
          setNote("");
          setItem([]);
          setCheckBoxNotes([]);
          setTitle("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [title, note, item, wrapperRef.current, isMounted]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [note, isChecked]);

  useEffect(() => {
    if (!isEditModalOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsEditModalOpen(false); // Just close modal
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditModalOpen]);

  const handleSaveReminder = async () => {
    if (
      !reminderNote ||
      !reminderNote.date ||
      !reminderNote.time ||
      !reminderNote.reminderTitle ||
      !description
    ) {
      toast.error("Please enter a title,description, date and time");
      return;
    }
    setShowReminderModal(false);

    const res = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-TYPE": "update",
      },
      body: JSON.stringify({
        data: {
          record_id: reminderNote.id,
          feature_name: widgetData?.config?.config?.data_source,
          last_updated: new Date().toISOString(),
          fields_to_update: {
            modified_on: new Date().toISOString(),
            setReminder: {
              date: reminderNote.date,
              time: reminderNote.time,
              title: reminderNote.reminderTitle,
              description: description,
            },
          },
        },
        dataset: "feature_data",
      }),
    });

    if (!res.ok) throw new Error("Failed to fetch data");

    if (res.ok) {
      await fetchNotes();
      toast.success("Reminder saved successfully");
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
                record_value_text: "reminders",
                record_type: "type_text",
              },
              {
                record_label: "note_id",
                record_value_text: reminderNote.id,
                record_type: "type_text",
              },
              {
                record_label: "reminder_id",
                record_value_text: reminderNote.id,
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
            ],
          },
          more_data: {},
        },
        dataset: "feature_data",
      });
    }

    if (reminderNote.isreminder) {
      await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-TYPE": "update",
        },
        body: JSON.stringify({
          data: {
            record_id: reminderNote.id,
            feature_name: dataSource || "calendar",
            last_updated: new Date().toISOString(),
            fields_to_update: {
              "feature_data.record_data": [
                {
                  record_value: reminderNote.date,
                  record_label: "date",
                  record_type: "type_date",
                },
                {
                  record_value: reminderNote.time,
                  record_label: "time",
                  record_type: "type_time",
                },
                {
                  record_value: reminderNote.reminderTitle,
                  record_label: "title",
                  record_type: "type_text",
                },
                {
                  // encode befour storing encode and store description below
                  record_value: encodeBase64(description),
                  // record_value: description,
                  record_label: "description",
                  record_type: "type_text",
                },
                {
                  record_value: "note-reminders",
                  record_label: "category",
                  record_type: "type_text",
                },
              ],
            },
          },
          dataset: "feature_data",
        }),
      });
    } else {
      await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-TYPE": "create",
        },
        body: JSON.stringify({
          data: {
            record_id: reminderNote.id,
            feature_name: "calendar",
            record_status: "active",
            created_on_date: new Date().toISOString().split("T")[0],
            created_by: currentUser?.record_id,
            feature_data: {
              record_data: [
                {
                  record_value: reminderNote.date,
                  record_label: "date",
                  record_type: "type_date",
                },
                {
                  record_value: reminderNote.time,
                  record_label: "time",
                  record_type: "type_time",
                },
                {
                  record_value: reminderNote.reminderTitle,
                  record_label: "title",
                  record_type: "type_text",
                },
                {
                  record_value: encodeBase64(description),
                  record_label: "description",
                  record_type: "type_text",
                },
                {
                  record_value: "note-reminders",
                  record_label: "category",
                  record_type: "type_text",
                },
              ],
            },
          },
          dataset: "feature_data",
        }),
      });
      // Log reminder add
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
                record_value_text: "reminders",
                record_type: "type_text",
              },
              {
                record_label: "note_id",
                record_value_text: reminderNote.id,
                record_type: "type_text",
              },
              {
                record_label: "reminder_id",
                record_value_text: reminderNote.id,
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
            ],
          },
          more_data: {},
        },
        dataset: "feature_data",
      });
    }
  };

  const handleConfirmDelete = async () => {
    setNotes((prevNotes) =>
      prevNotes.filter((note) => !selectedNotes.includes(note.id))
    );

    const res = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-TYPE": "delete",
      },
      body: JSON.stringify({
        data: {
          record_id: selectedNotes,
          feature_name: widgetData?.config?.config?.data_source,
          delete_entire_document: true,
        },
        dataset: "feature_data",
      }),
    });

    if (!res.ok) throw new Error("Failed to fetch data");

    if (res.ok) {
      // await fetchNotes();
      setSelectedNotes([]);
      toast.success("Note deleted successfully");
    }
  };

  useEffect(() => {
    setShowMultiSelect(selectedNotes.length > 0);
  }, [selectedNotes]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDeleteModal) return;

      const target = event.target as HTMLElement;
      const clickedInsideNoteCard = target.closest(".note-card");
      const clickedInsideMultiBar = multiSelectBarRef.current?.contains(target);

      if (!clickedInsideNoteCard && !clickedInsideMultiBar) {
        setSelectedNotes([]);
        setShowMultiSelect(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDeleteModal]); // include showDeleteModal in dependency array

  const pinnedNotes = notes.filter((n) => n.pinned);
  const otherNotes = notes.filter((n) => !n.pinned);

  function renderNoteCard(n: NoteType) {
    const maxVisibleItems = 8;
    const checkedItems: ItemType[] = n.checkedItems || [];
    const incomplete: ItemType[] = checkedItems.filter((i) => !i.completed);
    const completed: ItemType[] = checkedItems.filter((i) => i.completed);

    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // Prevent click from inner elements like check icon or pin button
      const target = e.target as HTMLElement;
      if (
        target.closest(".hover-wrapper") ||
        target.closest(".fa-circle-check") ||
        target.closest(".bi-pin") ||
        target.closest(".fa-clock")
      ) {
        return;
      }

      console.log("nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn", n);
      setSelectedNote({
        ...n,
        createdAt: n.modifiedOn || new Date().toISOString(),
      });
      setIsEditModalOpen(true);
    };

    return (
      <div className="col position-relative note-card" key={n.id}>
        <div
          className="position-relative w-100 h-100"
          style={{ cursor: "pointer" }}
          onClick={handleCardClick}
          onMouseEnter={() => setHoveredNoteId(n.id)}
          onMouseLeave={() => setHoveredNoteId(null)}
        >
          {(hoveredNoteId === n.id || selectedNotes.includes(n.id)) && (
            <div
              className="position-absolute"
              style={{
                top: -4,
                left: -4,
                zIndex: 20,
                pointerEvents: "auto",
              }}
              onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                e.stopPropagation()
              }
            >
              <div
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Select Note"
              >
                <i
                  className={`fa-solid fa-circle-check`}
                  style={{ fontSize: "18px", cursor: "pointer" }}
                  onClick={(e: React.MouseEvent<HTMLElement>) => {
                    e.stopPropagation();
                    setSelectedNotes((prev) =>
                      prev.includes(n.id)
                        ? prev.filter((id) => id !== n.id)
                        : [...prev, n.id]
                    );
                    setShowMultiSelect(true);
                  }}
                ></i>
              </div>
            </div>
          )}

          {(hoveredNoteId === n.id || selectedNotes.includes(n.id)) && (
            <div
              className="position-absolute"
              style={{
                top: 4,
                right: 22,
                zIndex: 20,
                pointerEvents: "auto",
              }}
              onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                e.stopPropagation()
              }
            >
              <div
                className="d-flex align-items-center p-2 rounded-circle hover-wrapper"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title={`${n.pinned ? "Unpin" : "Pin"}`}
                style={{
                  cursor: "pointer",
                  width: "35px",
                  height: "35px",
                  justifyContent: "center",
                }}
              >
                <i
                  className={`bi ${n.pinned ? "bi-pin-fill" : "bi-pin"}`}
                  style={{
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "800",
                  }}
                  onClick={async () => {
                    const updated = notes.map((note) =>
                      note.id === n.id
                        ? { ...note, pinned: !note.pinned }
                        : note
                    );
                    setNotes(updated);

                    await fetch("/api/proxy", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-API-TYPE": "update",
                      },
                      body: JSON.stringify({
                        data: {
                          record_id: n.id,
                          feature_name: widgetData?.config?.config?.data_source,
                          fields_to_update: {
                            "feature_data.record_data": [
                              {
                                record_label: "isPinned",
                                record_value: !n.pinned,
                                record_type: "type_text",
                              },
                            ],
                          },
                        },
                      }),
                    });
                  }}
                ></i>
              </div>
            </div>
          )}

          {n.type === "checklist" ? (
            <div
              className="card h-100 shadow-sm d-flex flex-column "
              style={{
                border: selectedNotes?.includes(n.id) ? "2px solid" : "",
                minHeight: "200px",
              }}
              onMouseEnter={() => setHoveredNoteId(n.id)}
            >
              <div
                className="card-body d-flex flex-column hover-shadow position-relative"
                style={{ paddingBottom: "30px" }}
              >
                <h5
                  className="card-title mb-3"
                  style={{ fontSize: "20px", fontWeight: "400", color: "#000" }}
                >
                  {n.title}
                </h5>

                {[...incomplete, ...completed]
                  .slice(0, maxVisibleItems)
                  .map((item, index) => (
                    <div
                      key={item.id + index}
                      className="form-check"
                      style={{
                        marginLeft: `${item.level * 20}px`,
                        marginBottom: "2px",
                      }}
                    >
                      <input
                        className="minimal-checkbox"
                        type="checkbox"
                        disabled={item.placeholder}
                        checked={!!item.completed}
                        style={{
                          pointerEvents: item.placeholder ? "none" : undefined,
                        }}
                      />
                      <label
                        className={`form-check-label ${
                          item.completed ? "text-muted" : ""
                        }`}
                        style={{
                          fontSize: "14.6px",
                          fontWeight: "400",
                          textDecoration: item.completed
                            ? "line-through"
                            : "none",
                          paddingLeft: "6px",
                        }}
                      >
                        {item.label}
                      </label>
                    </div>
                  ))}

                {completed.length > 0 && (
                  <div
                    className="text-muted"
                    style={{ fontSize: "13.5px", marginTop: "4px" }}
                  >
                    {completed.length} Completed item
                    {completed.length > 1 ? "s" : ""}
                  </div>
                )}

                {[...incomplete, ...completed].length > maxVisibleItems && (
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      lineHeight: "1.6",
                    }}
                  >
                    ...
                  </div>
                )}
              </div>
              {hasNoteReminders && (
                <div
                  className="position-absolute"
                  style={{
                    bottom: 8,
                    left: 16,
                  }}
                >
                  {n?.date && n?.time ? (
                    <div
                      className="d-inline-flex align-items-center px-2 py-1"
                      style={{
                        borderRadius: "20px",
                        backgroundColor: "#f1f1f1",
                        width: "fit-content",
                        opacity: 0.6,
                        cursor: "pointer",
                      }}
                      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.stopPropagation();
                        setReminderNote({
                          ...n,
                          createdAt: new Date().toISOString(),
                        });
                        setDescription(n?.content || "");
                        setShowReminderModal(true);
                      }}
                    >
                      <div
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="
                        Edit Reminder"
                      >
                        <i className="fa-regular fa-clock"></i>
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#757575",
                          marginLeft: "4px",
                        }}
                      >
                        {formatReminderDateTime(n.date, n.time)}
                      </span>
                    </div>
                  ) : (
                    hoveredNoteId === n.id && (
                      <div
                        className="d-flex align-items-center p-2 rounded-circle hover-wrapper"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Set Reminder"
                        style={{
                          cursor: "pointer",
                          width: "35px",
                          height: "35px",
                          justifyContent: "center",
                        }}
                      >
                        <i
                          className="fa-regular fa-clock"
                          style={{
                            fontSize: "14px",
                            color: "#999",
                            cursor: "pointer",
                          }}
                          onClick={(e: React.MouseEvent<HTMLElement>) => {
                            e.stopPropagation();
                            setReminderNote({
                              ...n,
                              createdAt: new Date().toISOString(),
                            });
                            setDescription(n?.content || "");
                            setShowReminderModal(true);
                          }}
                        ></i>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          ) : n.type === "simple" ? (
            <div
              className="card h-100 shadow-sm d-flex flex-column"
              style={{
                border: selectedNotes?.includes(n.id) ? "2px solid #000" : "",
                minHeight: "180px",
              }}
              onMouseEnter={() => setHoveredNoteId(n.id)}
            >
              <div
                className="d-flex flex-column px-3 pt-4 pb-2"
                style={{ flexGrow: 1 }}
              >
                <h5
                  style={{ fontSize: "20px", fontWeight: 400, color: "#000" }}
                >
                  {n.title}
                </h5>
                <p
                  className="card-text"
                  style={{
                    fontSize: "14.6px",
                    fontWeight: "400",
                    color: "#202020",
                    backgroundColor: "#fff",
                    whiteSpace: "pre-line",
                    flexGrow: 1,
                  }}
                >
                  {(() => {
                    const lines = n.content.split("\n");
                    const visibleLines = lines.slice(0, 9).join("\n");
                    const hasMore = lines.length > 9;
                    return hasMore ? `${visibleLines}\n...` : n.content;
                  })()}
                </p>
                {hasNoteReminders && (
                  <div>
                    {n?.date && n?.time ? (
                      <div
                        className="d-inline-flex align-items-center  px-2 py-1"
                        style={{
                          borderRadius: "20px",
                          backgroundColor: "#f1f1f1",
                          width: "fit-content",
                          opacity: 0.6,
                          cursor: "pointer",
                        }}
                        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                          e.stopPropagation();
                          setReminderNote({
                            ...n,
                            createdAt: n.modifiedOn || new Date().toISOString(),
                          });
                          setDescription(n?.content || "");
                          setShowReminderModal(true);
                        }}
                      >
                        <div
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title="Set Reminder"
                        >
                          <i className="fa-regular fa-clock"></i>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#757575",
                              marginLeft: "4px",
                            }}
                          >
                            {formatReminderDateTime(n?.date, n.time)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="d-flex align-items-center p-2 rounded-circle hover-wrapper"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Set Reminder"
                        style={{
                          cursor: "pointer",
                          width: "35px",
                          height: "35px",
                          justifyContent: "center",
                        }}
                      >
                        <i
                          className="fa-regular fa-clock"
                          style={{
                            visibility:
                              hoveredNoteId === n.id ||
                              selectedNotes.includes(n.id)
                                ? "visible"
                                : "hidden",
                            fontSize: "14px",
                            color: "#999",
                            cursor: "pointer",
                          }}
                          onClick={(e: React.MouseEvent<HTMLElement>) => {
                            e.stopPropagation();
                            setReminderNote({
                              ...n,
                              createdAt:
                                n.modifiedOn || new Date().toISOString(),
                            });
                            setDescription(n?.content || "");
                            setShowReminderModal(true);
                          }}
                        ></i>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            n.type === "richeditor" && (
              <div
                className="card h-100 shadow-sm d-flex flex-column"
                style={{
                  border: selectedNotes?.includes(n.id) ? "2px solid #000" : "",
                  minHeight: "180px",
                }}
                onMouseEnter={() => setHoveredNoteId(n.id)}
              >
                <div
                  className="d-flex flex-column px-3 pt-4 pb-2"
                  style={{ flexGrow: 1 }}
                >
                  <h5
                    style={{ fontSize: "20px", fontWeight: 400, color: "#000" }}
                  >
                    {n.title}
                  </h5>

                  <QuillViewer content={n.content} />

                  {hasNoteReminders && (
                    <div>
                      {n?.date && n?.time ? (
                        <div
                          className="d-inline-flex align-items-center px-2 py-1"
                          style={{
                            borderRadius: "20px",
                            backgroundColor: "#f1f1f1",
                            width: "fit-content",
                            opacity: 0.6,
                            cursor: "pointer",
                          }}
                          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                            e.stopPropagation();
                            setReminderNote({
                              ...n,
                              createdAt:
                                n.modifiedOn || new Date().toISOString(),
                            });
                            setDescription(n?.content || "");
                            setShowReminderModal(true);
                          }}
                        >
                          <div data-bs-toggle="tooltip" title="Set Reminder">
                            <i className="fa-regular fa-clock"></i>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#757575",
                                marginLeft: "4px",
                              }}
                            >
                              {formatReminderDateTime(n?.date, n.time)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="d-flex align-items-center p-2 rounded-circle hover-wrapper"
                          data-bs-toggle="tooltip"
                          title="Set Reminder"
                          style={{
                            cursor: "pointer",
                            width: "35px",
                            height: "35px",
                            justifyContent: "center",
                          }}
                        >
                          <i
                            className="fa-regular fa-clock"
                            style={{
                              visibility:
                                hoveredNoteId === n.id ||
                                selectedNotes.includes(n.id)
                                  ? "visible"
                                  : "hidden",
                              fontSize: "14px",
                              color: "#999",
                              cursor: "pointer",
                            }}
                            onClick={(e: React.MouseEvent<HTMLElement>) => {
                              e.stopPropagation();
                              setReminderNote({
                                ...n,
                                createdAt:
                                  n.modifiedOn || new Date().toISOString(),
                              });
                              setDescription(n?.content || "");
                              setShowReminderModal(true);
                            }}
                          ></i>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // useEffect(() => {
  //   const tooltipTriggerList = document.querySelectorAll(
  //     '[data-bs-toggle="tooltip"]'
  //   );
  //   tooltipTriggerList.forEach((tooltipTriggerEl) => {
  //     new Tooltip(tooltipTriggerEl);
  //   });
  // }, []);
  useEffect(() => {
    if (!isMounted) return;

    // Dynamically import Bootstrap only on client
    import("bootstrap").then(({ Tooltip }) => {
      const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]'
      );
      tooltipTriggerList.forEach(
        (tooltipTriggerEl) => new Tooltip(tooltipTriggerEl)
      );
    });
  }, [isMounted]);

  if (isLoading)
    return (
      <div className="d-flex justify-content-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  if (!isMounted) {
    // Return a loading placeholder or null during SSR
    return null;
  }

  return (
    <div className="container mt-2">
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
              <span className="flex-grow-1 text-muted">Take a note...</span>
              <div className="d-flex gap-3 align-items-center">
                <i
                  className="bi bi-check2-square"
                  style={{ fontSize: "16px" }}
                ></i>
                <i className="bi bi-pencil" style={{ fontSize: "16px" }}></i>
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
            <div className="card-body" style={{ position: "relative" }}>
              <input
                type="text"
                className="form-control border-0 custom-placeholder"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ fontSize: "20px", fontWeight: "400" }}
              />

              <div
                style={{
                  minHeight: `${MIN_HEIGHT}px`,
                  maxHeight: `${MAX_HEIGHT}px`,
                  height:
                    transitionHeight !== null
                      ? `${transitionHeight}px`
                      : notesTab === "simple"
                      ? `${sharedHeight}px`
                      : "auto",

                  overflow: "hidden",
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  display: "flex",
                  flexDirection: "column",
                  transition: "height 0.2s ease",
                }}
              >
                <div
                  style={{
                    flexGrow: 1,
                    overflowY: "auto",
                    height: "100%",
                  }}
                >
                  {notesTab === "simple" && (
                    <textarea
                      value={simpleNote}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSimpleNote(val);
                        // setHtmlNote(plainTextToHtml(val));
                        setCheckBoxNotes(convertTextToChecklist(val));
                      }}
                      onInput={(e) => {
                        const ta = e.currentTarget;
                        ta.style.height = "auto";
                        const newHeight = Math.min(ta.scrollHeight, MAX_HEIGHT);
                        ta.style.height = `${newHeight}px`;
                        setSharedHeight(newHeight);
                      }}
                      className="form-control border-0 custom-placeholder-task"
                      placeholder="Take a note..."
                      style={{
                        fontSize: "16px",
                        resize: "none",
                        height: "100%",
                        minHeight: `${MIN_HEIGHT}px`,
                        maxHeight: `${MAX_HEIGHT}px`,
                        overflowY:
                          sharedHeight >= MAX_HEIGHT ? "auto" : "hidden",
                        width: "100%",
                      }}
                      rows={4}
                    />
                  )}

                  {notesTab === "checklist" && (
                    <div style={{ height: "100%" }}>
                      <TaskTracker
                        notes={checkBoxNotes}
                        setItem={(items) => {
                          setCheckBoxNotes(items);
                          const itemsArray = Array.isArray(items) ? items : [];
                          const text = convertChecklistToText(itemsArray);
                          setSimpleNote(text);
                          // setHtmlNote(plainTextToHtml(text));
                        }}
                      />
                    </div>
                  )}

                  {notesTab === "richeditor" && (
                    <div style={{ height: "100%" }}>
                      <QuillEditor
                        value={htmlNote}
                        onChange={(html) => {
                          setHtmlNote(html);
                          htmlNoteRef.current = html; // Update ref with latest value
                          const plain = htmlToPlainText(html);
                          setSimpleNote(plain);
                          setCheckBoxNotes(convertTextToChecklist(plain));
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <button onClick={() => handleTabSwitch("simple")}>
                    Simple
                  </button>
                  <button onClick={() => handleTabSwitch("checklist")}>
                    Checklist
                  </button>
                  <button onClick={() => handleTabSwitch("richeditor")}>
                    Rich Editor
                  </button>
                </div>
                <button
                  className="btn btn-sm btn-outline-dark"
                  onClick={() => {
                    setTitle("");
                    setHtmlNote("");
                    setCheckBoxNotes([]);
                    setSimpleNote("");
                    setNotesTab("simple");
                    textareaRef.current?.focus();
                    textareaRef.current?.setSelectionRange(0, 0);
                    setIsExpanded(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {notes.length > 0 ? (
        <div>
          {pinnedNotes.length > 0 && (
            <>
              <h6 className="text-uppercase text-muted mb-2 ps-1">Pinned</h6>
              <div
                className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 mb-4"
                ref={pinnedNotesWrapperRef}
              >
                {pinnedNotes.map((n) => renderNoteCard(n))}
              </div>
            </>
          )}

          {otherNotes.length > 0 && (
            <>
              {pinnedNotes.length > 0 && (
                <h6 className="text-uppercase text-muted mb-2 ps-1">Others</h6>
              )}
              <div
                className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 mb-5"
                ref={otherNotesWrapperRef}
              >
                {otherNotes.map((n) => renderNoteCard(n))}
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="text-center text-muted">No notes yet.</p>
      )}
      {isEditModalOpen && selectedNote && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            width: "100vw",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            zIndex: 1040,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflowY: "auto",
            padding: "1rem",
          }}
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            role="document"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "800px" }}
          >
            <div
              className="modal-content"
              style={{
                display: "flex",
                flexDirection: "column",
                maxHeight: "80vh",
              }}
            >
              <div
                style={{
                  position: "sticky",
                  top: 0,
                  backgroundColor: "#fff",
                  zIndex: 20,
                  borderBottom: "1px solid #dee2e6",
                  padding: "12px",
                  display: "flex",
                  gap: "10px",
                }}
              >
                <input
                  type="text"
                  className="form-control border-0"
                  placeholder="Title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ fontSize: "20px", fontWeight: "400" }}
                />
              </div>

              <div
                className="modal-body"
                style={{ flex: 1, overflowY: "auto", padding: "1rem" }}
              >
                {editTab === "simple" && (
                  <textarea
                    className="form-control"
                    rows={6}
                    value={editSimpleNote}
                    onChange={(e) => {
                      setEditSimpleNote(e.target.value);
                      setEditChecklist(convertTextToChecklist(e.target.value));
                      setEditHtmlNote(plainTextToHtml(e.target.value));
                    }}
                    style={{ resize: "none", minHeight: "120px" }}
                  />
                )}

                {editTab === "checklist" && (
                  <TaskTracker
                    notes={editChecklist}
                    setItem={(items) => {
                      setEditChecklist(items);
                      const itemsArray = Array.isArray(items) ? items : [];
                      const text = convertChecklistToText(itemsArray);
                      setEditSimpleNote(text);
                      setEditHtmlNote(plainTextToHtml(text));
                    }}
                  />
                )}

                {editTab === "richeditor" && (
                  <QuillEditor
                    value={editHtmlNote}
                    onChange={(html) => {
                      setEditHtmlNote(html);
                      const plain = htmlToPlainText(html);
                      setEditSimpleNote(plain);
                      setEditChecklist(convertTextToChecklist(plain));
                    }}
                  />
                )}
              </div>

              <div
                className="modal-footer bg-white"
                style={{ padding: "10px 16px" }}
              >
                <div>
                  <button
                    onClick={() => {
                      if (editTab === "richeditor") {
                        handleTabEditSwitchConfirm("simple");
                      } else {
                        handleTabEditSwitch("simple");
                      }
                    }}
                  >
                    Simple
                  </button>
                  <button
                    onClick={() => {
                      if (editTab === "richeditor") {
                        handleTabEditSwitchConfirm("checklist");
                      } else {
                        handleTabEditSwitch("checklist");
                      }
                    }}
                  >
                    Checklist
                  </button>
                  <button
                    onClick={() => {
                      handleTabEditSwitch("richeditor");
                    }}
                  >
                    Rich Editor
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={handleSaveEditedNote}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReminderModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Reminder</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowReminderModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input
                    className="form-control"
                    value={reminderNote?.reminderTitle || ""}
                    onChange={(e) =>
                      setReminderNote({
                        ...(reminderNote
                          ? { ...reminderNote, id: reminderNote.id ?? "" }
                          : {
                              id: "",
                              title: "",
                              content: "",
                              createdAt: "",
                              isChecked: false,
                            }),
                        reminderTitle: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <QuillEditor
                    value={description}
                    onChange={(value: string) => setDescription(value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={reminderNote?.date || ""}
                    onChange={(e) =>
                      setReminderNote({
                        ...reminderNote,
                        id: reminderNote?.id ?? "",
                        title: reminderNote?.title ?? "",
                        content: reminderNote?.content ?? "",
                        createdAt: reminderNote?.createdAt ?? "",
                        isChecked: reminderNote?.isChecked ?? false,
                        checkedItems: reminderNote?.checkedItems ?? [],
                        isreminder: reminderNote?.isreminder ?? false,
                        date: e.target.value,
                        time: reminderNote?.time ?? "",
                        reminderTitle: reminderNote?.reminderTitle ?? "",
                        reminderDescription:
                          reminderNote?.reminderDescription ?? "",
                        modifiedOn: reminderNote?.modifiedOn ?? "",
                        pinned: reminderNote?.pinned ?? false,
                      })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={reminderNote?.time || ""}
                    onChange={(e) =>
                      setReminderNote({
                        ...reminderNote,
                        id: reminderNote?.id ?? "",
                        title: reminderNote?.title ?? "",
                        content: reminderNote?.content ?? "",
                        createdAt: reminderNote?.createdAt ?? "",
                        isChecked: reminderNote?.isChecked ?? false,
                        checkedItems: reminderNote?.checkedItems ?? [],
                        isreminder: reminderNote?.isreminder ?? false,
                        date: reminderNote?.date ?? "",
                        time: e.target.value,
                        reminderTitle: reminderNote?.reminderTitle ?? "",
                        reminderDescription:
                          reminderNote?.reminderDescription ?? "",
                        modifiedOn: reminderNote?.modifiedOn ?? "",
                        pinned: reminderNote?.pinned ?? false,
                      })
                    }
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowReminderModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleSaveReminder();
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showMultiSelect && (
        <div className="d-flex justify-conetnt-center align-items-center">
          <div
            className="position-fixed"
            ref={multiSelectBarRef}
            style={{
              bottom: "8px",
              transform: "none",
              zIndex: 1050,
              left: "40%",
              right: "40%",
              width: "34%",
              background: "	#343a40",
              color: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
              padding: "12px 20px",
              userSelect: "none",
              backdropFilter: "blur(4px)",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="d-flex align-items-center  rounded-circle hover-wrapper "
                  data-bs-toggle="tooltip"
                  title="Cancel Selection"
                  data-bs-placement="top"
                  style={{
                    cursor: "pointer",
                    width: "35px",
                    height: "35px",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="fa-solid fa-xmark   fs-5"
                    style={{ fontSize: "18px", cursor: "pointer" }}
                    onClick={() => {
                      setSelectedNotes([]);
                      setShowMultiSelect(false);
                    }}
                  ></i>
                </div>
                <span className="text-white fs-6">
                  {selectedNotes.length} note
                  {selectedNotes.length > 1 ? "s" : ""} selected
                </span>
              </div>
              {selectedNotes.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "20px",
                  }}
                >
                  {(() => {
                    const selected = notes.filter((note) =>
                      selectedNotes.includes(note.id)
                    );
                    const allPinned =
                      selected.length > 0 &&
                      selected.every((note) => note.pinned);

                    return (
                      <div
                        className="d-flex align-items-center p-2 rounded-circle hover-wrapper"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title={allPinned ? "Unpin" : "Pin"}
                        style={{
                          cursor: "pointer",
                          width: "35px",
                          height: "35px",
                          justifyContent: "center",
                        }}
                      >
                        <i
                          className={`bi ${
                            allPinned ? "bi-pin-fill" : "bi-pin"
                          } fs-5`}
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title={allPinned ? "Unpin" : "Pin"}
                          onClick={async () => {
                            const newPinnedValue = !allPinned;
                            const updatedNotes = notes.map((note) =>
                              selectedNotes.includes(note.id)
                                ? { ...note, pinned: newPinnedValue }
                                : note
                            );
                            setNotes(updatedNotes);
                            // setSelectedNotes([]);

                            const payload = {
                              data: selected.map((note) => ({
                                record_id: note.id,
                                feature_name:
                                  widgetData?.config?.config?.data_source,
                                fields_to_update: {
                                  "feature_data.record_data": [
                                    {
                                      record_value: newPinnedValue,
                                      record_label: "isPinned",
                                      record_type: "type_text",
                                    },
                                  ],
                                },
                              })),
                              dataset: "feature_data",
                            };

                            try {
                              const res = await fetch("/api/proxy", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Accept: "application/json",
                                  "X-API-TYPE": "update",
                                },
                                body: JSON.stringify(payload),
                              });

                              if (!res.ok) {
                                console.error("Bulk update failed");
                              }
                            } catch (err) {
                              console.error("Bulk update error:", err);
                            }
                          }}
                        ></i>
                      </div>
                    );
                  })()}
                  <div
                    className="d-flex align-items-center p-2 rounded-circle hover-wrapper"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Copy"
                    style={{
                      cursor: "pointer",
                      width: "35px",
                      height: "35px",
                      justifyContent: "center",
                    }}
                  >
                    <i
                      className="bi bi-copy fs-5"
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                      title="Copy"
                      style={{ cursor: "pointer" }}
                      onClick={async () => {
                        if (selectedNotes.length === 0) return;

                        const copiedNotes = notes
                          .filter((note) => selectedNotes.includes(note.id))
                          .map((note) => ({
                            ...note,
                            id: `${Date.now()}${Math.random()}`,
                            title: `${note.title}  Copy`,
                            createdAt: new Date().toISOString(),
                            pinned: false,
                          }));

                        setNotes((prev) => [...copiedNotes, ...prev]);

                        const payload = {
                          data: copiedNotes.map((note) => ({
                            record_id: note.id,
                            feature_name:
                              widgetData?.config?.config?.data_source,
                            record_status: "active",
                            created_on_date: new Date()
                              .toISOString()
                              .split("T")[0],
                            modified_on: new Date().toISOString(),
                            created_by: currentUser?.record_id,
                            feature_data: {
                              record_data: [
                                {
                                  record_value: note.title,
                                  record_label: "title",
                                  record_type: "type_text",
                                },
                                {
                                  record_label: "notepad",
                                  record_value: note.content,
                                  record_type: "type_text",
                                },
                                {
                                  record_value: encodeBase64(
                                    JSON.stringify(note.checkedItems || [])
                                  ),
                                  record_label: "checklist",
                                  record_type: "type_text",
                                },
                                {
                                  record_value: note.isChecked,
                                  record_label: "isChecked",
                                  record_type: "type_text",
                                },
                                {
                                  record_value: false,
                                  record_label: "isPinned",
                                  record_type: "type_text",
                                },
                              ],
                            },
                            setReminder: {
                              date: note.date,
                              time: note.time,
                              title: note.reminderTitle,
                              description: note.reminderDescription,
                            },
                          })),
                        };

                        await fetch("/api/proxy", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                            "X-API-TYPE": "create",
                          },
                          body: JSON.stringify({
                            data: payload.data,
                            dataset: "feature_data",
                          }),
                        }).catch((err) => {
                          console.error("Error copying notes:", err);
                        });

                        // setSelectedNotes([]);
                      }}
                    ></i>
                  </div>

                  <div
                    className="d-flex  align-items-center p-2 rounded-circle hover-wrapper"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Delete"
                    style={{
                      cursor: "pointer",
                      width: "35px",
                      height: "35px",
                      justifyContent: "center",
                    }}
                  >
                    <i
                      className="bi bi-trash3 fs-5"
                      onClick={() => {
                        if (selectedNotes.length === 0) return;
                        setShowDeleteModal(true);
                      }}
                    ></i>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {confirmRichTextLoss && (
        <div className="d-flex justify-conetnt-center align-items-center">
          <div
            className="position-fixed"
            // ref={multiSelectBarRef}
            style={{
              bottom: "8px",
              transform: "none",
              zIndex: 1050,
              left: "40%",
              right: "40%",
              width: "34%",
              background: "	#343a40",
              color: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
              padding: "12px 20px",
              userSelect: "none",
              backdropFilter: "blur(4px)",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="d-flex align-items-center  rounded-circle hover-wrapper "
                  data-bs-toggle="tooltip"
                  title="Cancel Selection"
                  data-bs-placement="top"
                  style={{
                    cursor: "pointer",
                    width: "35px",
                    height: "35px",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="fa-solid fa-xmark   fs-5"
                    style={{ fontSize: "18px", cursor: "pointer" }}
                    onClick={() => {
                      // setSelectedNotes([]);
                      setConfirmRichTextLoss(false);
                    }}
                  ></i>
                </div>
                {/* you will lose styling and then give a button to confirm*/}
                <div className="fs-6">You will lose styling</div>
                <button
                  onClick={() => {
                    handleTabEditSwitch(editTabChange);
                    setConfirmRichTextLoss(false);
                  }}
                  className="btn btn-secondary"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Delete</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowReminderModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>
                    Are you sure you want to delete {selectedNotes.length} note
                    {selectedNotes.length > 1 ? "s" : ""}?
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleConfirmDelete();
                      setShowDeleteModal(false);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type RecordDataItem = {
  record_value: string | boolean;
  record_label: string;
  record_type: string;
};

type APIRecord = {
  record_id: string;
  feature_data: {
    record_data: RecordDataItem[];
  };
  setReminder?: {
    date: string;
    time: string;
    title: string;
    description: string;
  };
  modified_on: string;
  created_on_date: string;
};

type TransformedNote = {
  id: string;
  title: string;
  content: string;
  isChecked: boolean;
  date?: string;
  time?: string;
  modifiedOn: string;
  pinned?: boolean;
  type: string;
  checkedItems?: {
    id: string;
    label: string;
    completed?: boolean;
    placeholder?: boolean;
    level: number;
    parentId?: string;
  }[]; // ✅ make this an array
  isreminder?: boolean;
  reminderDescription?: string;
  reminderTitle?: string;
  createdAt: string;
};

export function transformApiData(apiData: APIRecord[]): TransformedNote[] {
  return apiData.map((record) => {
    const data = record.feature_data.record_data;

    const titleRaw = data.find((d) => d.record_label === "title")?.record_value;
    const title = typeof titleRaw === "string" ? titleRaw : "";
    const typeRaw = data.find((d) => d.record_label === "type")?.record_value;
    const type = typeof typeRaw === "string" ? typeRaw : "";

    const descriptionRaw = data.find(
      (d) => d.record_label === "description"
    )?.record_value;
    const description =
      typeof descriptionRaw === "string" ? descriptionRaw : "";
    let content = "";

    if (type === "simple") {
      content = description;
    }

    if (type === "richeditor") {
      content = decodeBase64(description).trim();
    }

    const pinned = Boolean(
      data.find((d) => d.record_label === "isPinned")?.record_value
    );

    let checkedItems = [];
    try {
      if (type === "checklist") {
        checkedItems = JSON.parse(decodeBase64(description || ""));
      }
    } catch (e) {
      if (e instanceof Error) {
        console.warn("Invalid checklist data", e.message, description);
      } else {
        console.warn("Invalid checklist data", description);
      }
    }

    const isreminder = record.setReminder?.date ? true : false;

    const date = record.setReminder?.date || "";
    const time = record.setReminder?.time || "";
    const reminderTitle = record.setReminder?.title || title || "";
    const reminderDescription =
      record.setReminder?.description || content || "";
    const modifiedOn = record.modified_on ? record.modified_on : "";

    const note: TransformedNote = {
      id: record.record_id,
      title,
      content,
      isChecked: type === "checklist",
      createdAt: new Date(record.created_on_date).toISOString(),
      type,
      date,
      time,
      reminderTitle,
      reminderDescription,
      isreminder,
      modifiedOn,
      pinned,
    };

    if (type === "checklist") {
      note.checkedItems = checkedItems;
    }

    return note;
  });
}

export function formatReminderDateTime(
  dateStr: string,
  timeStr: string
): string {
  try {
    const dateTime = new Date(`${dateStr}T${timeStr}`);
    return dateTime.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return `${dateStr}, ${timeStr}`;
  }
}
