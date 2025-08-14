// "use client";

// import { EventClickArg } from "@fullcalendar/core/index.js";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import FullCalendar from "@fullcalendar/react";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import { useEffect, useRef, useState } from "react";

// interface EventItem {
//   title: string;
//   date: string;
//   category: string;
// }

// interface ReminderItem extends EventItem {
//   id: string;
//   backgroundColor?: string;
//   textColor?: string;
//   time: string;
//   description?: string;
// }

// type CalendarConfig = {
//   Calendar: {
//     data_source: string;
//     options: {
//       default: string;
//       view_modes: string[];
//     };
//   };
// };

// type RemindersConfig = {
//   Reminders: {
//     categories: {
//       label: string;
//       value: string;
//     }[];
//   };
// };

// type EventsConfig = {
//   Events: {
//     categories: {
//       label: string;
//       value: string;
//     }[];
//   };
// };

// export type CalendarPageConfig = (
//   | CalendarConfig
//   | RemindersConfig
//   | EventsConfig
// )[];

// export type CalendarPageProps = {
//   config: CalendarPageConfig;
// };

// components/CalendarPage.tsx
"use client";
import { useRef, useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { EventApi, EventClickArg } from "@fullcalendar/core/index.js";

interface EventItem {
  title: string;
  date: string;
  category: string;
}

interface ReminderItem extends EventItem {
  id: string;
  backgroundColor?: string;
  textColor?: string;
  time: string;
  description?: string;
}

type CalendarConfig = {
  Calendar: {
    data_source: string;
    options: {
      default: string;
      view_modes: string[];
    };
  };
};

type RemindersConfig = {
  Reminders: {
    categories: {
      label: string;
      value: string;
    }[];
  };
};

type EventsConfig = {
  Events: {
    categories: {
      label: string;
      value: string;
    }[];
  };
};

export type CalendarPageConfig = (
  | CalendarConfig
  | RemindersConfig
  | EventsConfig
)[];

export type CalendarPageProps = {
  config: CalendarPageConfig;
};

// export default function CalendarPage({ config }: CalendarPageProps) {
//   const calendarRef = useRef<FullCalendar | null>(null);
//   const [events, setEvents] = useState<EventItem[]>([]);
//   const [reminders, setReminders] = useState<ReminderItem[]>([]);
//   const [filter, setFilter] = useState("all");

//   const [currentYear, setCurrentYear] = useState<number>(
//     new Date().getFullYear()
//   );

//   useEffect(() => {
//     const fetchData = async () => {
//       const res = await fetch("/api/proxy", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//           "X-API-TYPE": "search",
//         },
//         body: JSON.stringify({
//           conditions: [
//             {
//               field: "feature_name",
//               search_type: "exact",
//               value: config.find(
//                 (item): item is CalendarConfig => "Calendar" in item
//               )?.Calendar?.data_source,
//             },
//           ],
//           combination_type: "and",
//           limit: "1000",
//           dataset: "feature_data",
//         }),
//       });

//       const data = await res.json();

//       if (res.ok) {
//         const events: { title: string; date: string; category: string }[] = [];
//         const reminders: {
//           id: string;
//           title: string;
//           date: string;
//           time: string;
//           backgroundColor: string;
//           textColor: string;
//           category: string;
//         }[] = [];

//         (data?.data as ApiRecord[])?.forEach(
//           (record: ApiRecord, idx: number) => {
//             if (!record.feature_data || !record.feature_data.record_data) {
//               return;
//             }
//             const recordData = record.feature_data.record_data;

//             const getFieldValue = (label: string): string => {
//               const entry = recordData.find((d) => d.record_label === label);
//               return (
//                 (entry?.record_value as string) ??
//                 (entry?.record_value_date as string) ??
//                 (entry?.record_value_date as string) ??
//                 entry?.record_value_number?.toString() ??
//                 ""
//               );
//             };

//             const category = getFieldValue("category").toLowerCase();
//             const title = getFieldValue("title");
//             const date = getFieldValue("date");
//             const time = getFieldValue("time");

//             const reminderCategories: string[] =
//               config
//                 .find((c) => "Reminders" in c)
//                 ?.Reminders?.categories?.map(
//                   (cat: { label: string; value: string }) => cat.value
//                 ) || [];

//             const eventCategories: string[] =
//               config
//                 .find((c) => "Events" in c)
//                 ?.Events?.categories?.map(
//                   (cat: { label: string; value: string }) => cat.value
//                 ) || [];

//             // Then inside your loop
//             if (reminderCategories.includes(category)) {
//               reminders.push({
//                 id: record.record_id ?? `${title}-${date}-${idx}`,
//                 title,
//                 date,
//                 time: time || "",
//                 backgroundColor: "red",
//                 textColor: "white",
//                 category,
//               });
//             }

//             if (eventCategories.includes(category)) {
//               events.push({ title, date, category });
//             }
//           }
//         );

//         setEvents(events);
//         setReminders(reminders);
//       }
//     };

//     fetchData();
//   }, []);

//   const getFilteredEvents = (): (EventItem | ReminderItem)[] => {
//     const lowerFilter = filter.toLowerCase();

//     const reminderCategories: string[] =
//       config
//         .find((c) => "Reminders" in c)
//         ?.Reminders?.categories?.map(
//           (cat: { label: string; value: string }) => cat.value
//         ) || [];

//     const eventCategories: string[] =
//       config
//         .find((c) => "Events" in c)
//         ?.Events?.categories?.map(
//           (cat: { label: string; value: string }) => cat.value
//         ) || [];

//     // Return all matching current year
//     if (lowerFilter === "all") {
//       return [...reminders, ...events].filter(
//         (item) => new Date(item.date).getFullYear() === currentYear
//       );
//     }

//     if (reminderCategories.includes(lowerFilter)) {
//       return reminders.filter(
//         (r) =>
//           r?.category.toLowerCase() === lowerFilter &&
//           new Date(r.date).getFullYear() === currentYear
//       );
//     }

//     if (eventCategories.includes(lowerFilter)) {
//       return events.filter(
//         (e) =>
//           e.category.toLowerCase() === lowerFilter &&
//           new Date(e.date).getFullYear() === currentYear
//       );
//     }

//     return [];
//   };

//   const yearOptions = Array.from(
//     { length: 5 },
//     (_, i) => new Date().getFullYear() + i
//   );

//   const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const value = e.target.value;
//     setFilter(value);
//   };

//   return (
//     <div
//       className="container-fluid"
//       style={{
//         height: "calc(100vh - 180px)",
//         maxHeight: "calc(100vh - 180px)",
//         display: "flex",
//         flexDirection: "column",
//         minHeight: 0,
//       }}
//     >
//       <div className="d-flex justify-content-between align-items-center  flex-wrap gap-2">
//         <div style={{ maxWidth: "300px" }}>
//           <select
//             className="form-select"
//             value={filter}
//             onChange={handleFilterChange}
//           >
//             <option value="all">All</option>

//             {config.map((item) => {
//               if ("Reminders" in item) {
//                 const categories = item.Reminders.categories;
//                 return (
//                   <optgroup key="Reminders" label="Reminders">
//                     {categories.map(
//                       (category: { label: string; value: string }) => (
//                         <option key={category.value} value={category.value}>
//                           {category.label}
//                         </option>
//                       )
//                     )}
//                   </optgroup>
//                 );
//               } else if ("Events" in item) {
//                 const categories = item.Events.categories;
//                 return (
//                   <optgroup key="Events" label="Events">
//                     {categories.map(
//                       (category: { label: string; value: string }) => (
//                         <option key={category.value} value={category.value}>
//                           {category.label}
//                         </option>
//                       )
//                     )}
//                   </optgroup>
//                 );
//               }
//               return null;
//             })}
//           </select>
//         </div>

//         <div className="d-flex gap-2">
//           <div className="form-group">
//             <select
//               className="form-select"
//               value={currentYear}
//               onChange={(e) => setCurrentYear(parseInt(e.target.value))}
//             >
//               {yearOptions.map((year) => (
//                 <option key={year} value={year}>
//                   {year}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>
//       <div style={{ height: "100%", minHeight: 0 }} className="p-2">
//         <FullCalendar
//           ref={calendarRef}
//           plugins={[dayGridPlugin, timeGridPlugin]}
//           initialView="dayGridMonth"
//           initialDate={new Date("2025-07-01")}
//           height="100%"
//           expandRows={true}
//           events={getFilteredEvents()}
//           dayCellClassNames={(arg) => {
//             const isToday =
//               arg.date.getDate() === new Date().getDate() &&
//               arg.date.getMonth() === new Date().getMonth() &&
//               arg.date.getFullYear() === new Date().getFullYear();
//             return isToday ? "fc-today-custom" : "";
//           }}
//           eventContent={(arg) => {
//             const bgColor = arg.event.backgroundColor || "red";
//             const textColor = arg.event.textColor || "#fff";
//             return {
//               html: `<div style="
//               background-color: ${bgColor};
//               color: ${textColor};
//               padding: 2px 4px;
//               border-radius: 4px;
//               font-size: 0.8rem;
//               overflow: hidden;
//               text-overflow: ellipsis;
//               white-space: nowrap;
//             ">${arg.event.title}</div>`,
//             };
//           }}
//           // datesSet={handleOverflow}
//         />
//       </div>
//     </div>
//   );
// }

// import React, { useEffect, useRef, useState } from "react";
// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import timeGridPlugin from "@fullcalendar/timegrid";

type PopupInfoType = {
  x: number;
  y: number;
  event: EventApi;
} | null;

export default function CalendarPage({ config }: CalendarPageProps) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [, setShowModal] = useState(false);
  const [setSelectedEvent, setsetSelectedEvent] = useState<string>("");
  const [editEvent, seteditEvent] = useState<Partial<ReminderItem>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupInfo, setPopupInfo] = useState<PopupInfoType>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      const isInsidePopup = popupRef.current?.contains(target);
      const isCalendarEvent = target.closest(".fc-event");

      if (!isInsidePopup && !isCalendarEvent && popupRef.current) {
        popupRef.current.classList.remove("popup-bounce"); // reset if already animating
        void popupRef.current.offsetWidth; // force reflow
        popupRef.current.classList.add("popup-bounce"); // trigger animation
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventEl = clickInfo.el as HTMLElement;
    const container = containerRef.current;

    if (!eventEl || !container) return;

    const eventRect = eventEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const popupWidth = 220;
    const popupHeight = 278;

    let x = eventRect.right - containerRect.left + 36;
    let y = eventRect.top - containerRect.top;

    if (eventRect.right + popupWidth > containerRect.right) {
      x = eventRect.left - containerRect.left - popupWidth - 108;
    }

    if (y + popupHeight > containerRect.height) {
      y = containerRect.height - popupHeight - 10;
    }

    console.log("popup position", x, y);

    setPopupInfo({
      x,
      y,
      event: clickInfo.event,
    });

    setsetSelectedEvent(clickInfo.event.id);
    seteditEvent({
      title: reminders.find((reminder) => reminder.id === clickInfo.event.id)
        ?.title,
      date: reminders.find((reminder) => reminder.id === clickInfo.event.id)
        ?.date,
      time: reminders.find((reminder) => reminder.id === clickInfo.event.id)
        ?.time,
      category: reminders.find((reminder) => reminder.id === clickInfo.event.id)
        ?.category,
      description: reminders.find(
        (reminder) => reminder.id === clickInfo.event.id
      )?.description,
    });
  };

  // const closePopup = () => {
  //   setPopupInfo(null);
  // };

  useEffect(() => {
    const fetchData = async () => {
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
              value: config.find(
                (item): item is CalendarConfig => "Calendar" in item
              )?.Calendar?.data_source,
            },
          ],
          combination_type: "and",
          limit: "1000",
          dataset: "feature_data",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const events: { title: string; date: string; category: string }[] = [];
        const reminders: {
          id: string;
          title: string;
          date: string;
          time: string;
          backgroundColor: string;
          textColor: string;
          category: string;
        }[] = [];

        interface RecordDataEntry {
          record_label: string;
          record_value?: string;
          record_value_date?: string;
          record_value_number?: number;
        }

        interface ApiRecordType {
          record_id?: string;
          feature_data?: {
            record_data?: RecordDataEntry[];
          };
        }

        data?.data?.forEach((record: ApiRecordType, idx: number) => {
          if (!record.feature_data?.record_data) return;
          const getFieldValue = (label: string): string => {
            const entry = record.feature_data!.record_data!.find(
              (d: RecordDataEntry) => d.record_label === label
            );
            return (
              entry?.record_value ??
              entry?.record_value_date ??
              entry?.record_value_number?.toString() ??
              ""
            );
          };

          const category: string = getFieldValue("category").toLowerCase();
          const title: string = getFieldValue("title");
          const date: string = getFieldValue("date");
          const time: string = getFieldValue("time") || "";
          const description: string = getFieldValue("description") || "";

          const reminderCats: string[] =
            config
              .find((c): c is RemindersConfig => "Reminders" in c)
              ?.Reminders?.categories.map((c) => c.value) || [];
          const eventCats: string[] =
            config
              .find((c): c is EventsConfig => "Events" in c)
              ?.Events?.categories.map((c) => c.value) || [];

          const item: ReminderItem = {
            title,
            date,
            time,
            category,
            description,
            id: record.record_id ?? `${title}-${date}-${idx}`,
            backgroundColor: "red",
            textColor: "white",
          };

          if (reminderCats.includes(category)) {
            reminders.push({
              ...item,
              backgroundColor: item.backgroundColor ?? "red",
              textColor: item.textColor ?? "white",
            });
          }
          if (eventCats.includes(category)) events.push(item);
        });

        setReminders(reminders);
        setEvents(events);
      }
    };

    fetchData();
  }, []);

  const getFilteredEvents = () => {
    const all = [...reminders, ...events].filter(
      (item) => new Date(item.date).getFullYear() === currentYear
    );

    if (filter.toLowerCase() === "all") return all;

    return all.filter(
      (item) => item.category.toLowerCase() === filter.toLowerCase()
    );
  };

  const handleMoreClick = () => {
    // setModalDate(info.date.toISOString().slice(0, 10));
    // setModalEvents(info.allSegs.map((seg) => seg.event));
    setShowModal(true);
  };

  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() + i
  );

  // const handleEventClick = (clickInfo: EventClickArg) => {
  //   setEditOpen(true);
  //   setsetSelectedEvent(clickInfo.event.id);
  //   seteditEvent({
  //     title: reminders.find((reminder) => reminder.id === clickInfo.event.id)
  //       ?.title,
  //     date: reminders.find((reminder) => reminder.id === clickInfo.event.id)
  //       ?.date,
  //     time: reminders.find((reminder) => reminder.id === clickInfo.event.id)
  //       ?.time,
  //     category: reminders.find((reminder) => reminder.id === clickInfo.event.id)
  //       ?.category,
  //     description: reminders.find(
  //       (reminder) => reminder.id === clickInfo.event.id
  //     )?.description,
  //   });
  // };

  // const handleEventClick = (clickInfo: EventClickArg) => {
  //   const { jsEvent, event } = clickInfo;
  //   const rect = (jsEvent.target as HTMLElement).getBoundingClientRect();

  //   setPopupPosition({
  //     top: rect.top + window.scrollY + rect.height + 5,
  //     left: rect.left + window.scrollX,
  //   });

  //   setsetSelectedEvent(event.id);
  //   seteditEvent({
  //     title: reminders.find((r) => r.id === event.id)?.title || "",
  //     date: reminders.find((r) => r.id === event.id)?.date || "",
  //     time: reminders.find((r) => r.id === event.id)?.time || "",
  //     category: reminders.find((r) => r.id === event.id)?.category || "",
  //     description: reminders.find((r) => r.id === event.id)?.description || "",
  //   });
  //   setEditOpen(true);
  // };

  // const handleEventClick = (clickInfo: EventClickArg) => {
  //   const { jsEvent, event } = clickInfo;
  //   const target = jsEvent.target as HTMLElement;
  //   const rect = target.getBoundingClientRect();

  //   const popupWidth = 300;
  //   const popupHeight = 200;
  //   const padding = 10;

  //   const windowWidth = window.innerWidth;
  //   const windowHeight = window.innerHeight;

  //   let top = rect.top + window.scrollY;
  //   let left = rect.left + window.scrollX;
  //   if (rect.left + rect.width + popupWidth + padding > windowWidth) {
  //     left = rect.left + window.scrollX - popupWidth - padding;
  //   } else {
  //     left = rect.left + window.scrollX + rect.width + padding;
  //   }

  //   if (rect.top + popupHeight + padding > windowHeight) {
  //     top = rect.top + window.scrollY - popupHeight - padding;
  //   }

  //   setPopupPosition({ top, left });

  //   setsetSelectedEvent(event.id);
  //   const reminder = reminders.find((r) => r.id === event.id);
  //   if (reminder) {
  //     seteditEvent({
  //       title: reminder.title || "",
  //       date: reminder.date || "",
  //       time: reminder.time || "",
  //       category: reminder.category || "",
  //       description: reminder.description || "",
  //     });
  //   }

  //   setEditOpen(true);
  // };

  // const handleEventClick = (clickInfo: EventClickArg) => {
  //   const target = clickInfo.jsEvent.target as HTMLElement;
  //   const rect = target.getBoundingClientRect();

  //   const top = rect.top + window.scrollY;
  //   const left = rect.left + window.scrollX;

  //   console.log("Event Position:", { top, left });

  //   // Optional: use top/left to position something
  //   setPopupPosition({ top, left });
  // };
  // const handleEventClick = (clickInfo: EventClickArg) => {
  //   const { jsEvent, event } = clickInfo;

  //   // 🟡 Instead of target (which might be <div> inside event), get closest .fc-event
  //   const eventElement = (jsEvent.target as HTMLElement)?.closest(
  //     ".fc-event"
  //   ) as HTMLElement;

  //   if (!eventElement) return;

  //   const eventRect = eventElement.getBoundingClientRect();

  //   const popupWidth = 320;
  //   const popupHeight = 220;
  //   const offset = 5;

  //   const viewportWidth = window.innerWidth;
  //   const viewportHeight = window.innerHeight;

  //   console.log("viewportWidth", viewportWidth, viewportHeight);

  //   let top = eventRect.top + window.scrollY;
  //   let left = eventRect.right + window.scrollX + offset;

  //   console.log("Event Position:", { top, left });

  //   // 🔄 Adjust left if popup would overflow on right
  //   if (left + popupWidth > viewportWidth) {
  //     left = eventRect.left + window.scrollX - popupWidth - offset;
  //   }

  //   // 🔄 Adjust top if popup would overflow bottom
  //   if (top + popupHeight > viewportHeight) {
  //     top = viewportHeight - popupHeight - offset;
  //   }

  //   setPopupPosition({ top, left });
  //   setsetSelectedEvent(event.id);

  //   const reminder = reminders.find((r) => r.id === event.id);
  //   if (reminder) {
  //     seteditEvent({
  //       title: reminder.title || "",
  //       date: reminder.date || "",
  //       time: reminder.time || "",
  //       category: reminder.category || "",
  //       description: reminder.description || "",
  //     });
  //   }

  //   setEditOpen(true);
  // };

  const handleConfirmEdit = () => {
    setReminders((prev) =>
      prev.map((reminder) =>
        reminder.id === setSelectedEvent
          ? {
              ...reminder,
              title: editEvent.title ?? "",
              date: editEvent.date ?? "",
              time: editEvent.time ?? "",
              category: editEvent.category ?? "",
              description: editEvent.description ?? "",
            }
          : reminder
      )
    );

    fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TYPE": "update",
      },
      body: JSON.stringify({
        data: {
          record_id: setSelectedEvent,
          feature_name: config.find((item) => "Calendar" in item)?.Calendar
            ?.data_source,
          fields_to_update: {
            "feature_data.record_data": [
              {
                record_label: "title",
                record_value: editEvent.title,
              },
              {
                record_label: "date",
                record_value: editEvent.date,
              },
              {
                record_label: "time",
                record_value: editEvent.time,
              },

              {
                record_label: "description",
                record_value: editEvent.description,
              },
            ],
          },
        },
        dataset: "feature_data",
      }),
    });
  };

  const generateFilterDropdownHTML = () => {
    return `
    <select id="filterDropdown" class="form-select form-select-sm" style="max-width: 280px;">
      <option value="all">All</option>
      ${config
        .map((item) => {
          if ("Reminders" in item) {
            return `
              <optgroup label="Reminders">
                ${item.Reminders.categories
                  .map(
                    (cat) =>
                      `<option value="${cat.value}">${cat.label}</option>`
                  )
                  .join("")}
              </optgroup>`;
          } else if ("Events" in item) {
            return `
              <optgroup label="Events">
                ${item.Events.categories
                  .map(
                    (cat) =>
                      `<option value="${cat.value}">${cat.label}</option>`
                  )
                  .join("")}
              </optgroup>`;
          }
          return "";
        })
        .join("")}
    </select>
  `;
  };

  useEffect(() => {
    const toolbarEl = document.querySelector(".fc-toolbar-chunk:first-child");

    if (toolbarEl && !toolbarEl.querySelector(".custom-selects")) {
      const wrapper = document.createElement("div");
      wrapper.className = "custom-selects d-flex gap-2 align-items-center ";
      wrapper.innerHTML = `
      <select id="yearDropdown" class="form-select form-select-sm" style="max-width: 82px;">
        ${yearOptions
          .map(
            (year) =>
              `<option value="${year}" ${
                year === currentYear ? "selected" : ""
              }>${year}</option>`
          )
          .join("")}
      </select>

  ${generateFilterDropdownHTML()}
    `;
      toolbarEl.prepend(wrapper);
      const yearSelect = wrapper.querySelector(
        "#yearDropdown"
      ) as HTMLSelectElement | null;
      if (yearSelect) {
        yearSelect.addEventListener("change", (e: Event) => {
          const target = e.target as HTMLSelectElement;
          setCurrentYear(parseInt(target.value));
        });
      }

      const filterSelect = wrapper.querySelector(
        "#filterDropdown"
      ) as HTMLSelectElement | null;
      if (filterSelect) {
        filterSelect.addEventListener("change", (e: Event) => {
          const target = e.target as HTMLSelectElement;
          setFilter(target.value);
        });
      }
    }
  }, [currentYear, filter, config, yearOptions]);

  useEffect(() => {
    const rightChunk = document.querySelector(".fc-toolbar-chunk:last-child");

    if (rightChunk && !rightChunk.querySelector(".view-today-group")) {
      rightChunk.innerHTML = "";

      const wrapper = document.createElement("div");
      wrapper.className = "view-today-group d-flex align-items-center gap-2";
      wrapper.style.display = "flex";
      wrapper.style.alignItems = "center";
      wrapper.style.flexWrap = "nowrap";

      const select = document.createElement("select");
      select.className = "form-select form-select-sm";
      select.style.maxWidth = "120px";
      select.style.margin = "0";

      const views = [
        { value: "dayGridMonth", label: "Month" },
        { value: "timeGridWeek", label: "Week" },
        { value: "timeGridDay", label: "Day" },
      ];

      select.innerHTML = views
        .map((v) => `<option value="${v.value}">${v.label}</option>`)
        .join("");

      select.value =
        calendarRef.current?.getApi()?.view?.type ?? "dayGridMonth";

      select.addEventListener("change", (e: Event) => {
        const target = e.target as HTMLSelectElement | null;
        const newView = target?.value;
        if (newView) {
          calendarRef.current?.getApi()?.changeView(newView);
        }
      });

      const todayBtn = document.querySelector(
        ".fc-today-button"
      ) as HTMLElement | null;
      const prevBtn = document.querySelector(
        ".fc-prev-button"
      ) as HTMLElement | null;
      const nextBtn = document.querySelector(
        ".fc-next-button"
      ) as HTMLElement | null;

      [todayBtn, prevBtn, nextBtn].forEach((btn) => {
        if (btn) {
          btn.style.margin = "0";
          btn.style.order = "initial";
        }
      });

      wrapper.appendChild(select);
      if (todayBtn) wrapper.appendChild(todayBtn);
      if (prevBtn) wrapper.appendChild(prevBtn);
      if (nextBtn) wrapper.appendChild(nextBtn);

      rightChunk.appendChild(wrapper);
    }
  }, []);

  return (
    <div
      className="container-fluid "
      style={{
        height: "calc(100vh - 180px)",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={containerRef}
        style={{
          height: "100%",
          minHeight: 0,
          position: "relative",
          // maxHeight: "350px",
        }}
        className="p-2"
        onClick={(e) => e.stopPropagation()} // prevent document click from closing popup if click inside
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "customDropdowns",
            center: "title",
            right: "customControls today prev,next",
          }}
          customButtons={{
            customControls: {
              text: "",
              click: () => {},
            },
          }}
          initialDate={new Date()}
          height="100%"
          expandRows={true}
          events={getFilteredEvents()}
          dayMaxEvents={2}
          eventClick={handleEventClick}
          moreLinkClick={handleMoreClick}
          dayCellClassNames={(arg) => {
            const today = new Date();
            return arg.date.getDate() === today.getDate() &&
              arg.date.getMonth() === today.getMonth() &&
              arg.date.getFullYear() === today.getFullYear()
              ? "fc-today-custom"
              : "";
          }}
          eventContent={(arg) => {
            const { backgroundColor = "red", textColor = "#fff" } = arg.event;
            return {
              html: `<div style="background-color: ${backgroundColor}; color: ${textColor}; padding: 0px 4px; font-size: 0.8rem; overflow: hidden; 
              text-overflow: ellipsis; white-space: nowrap; cursor: pointer">${arg.event.title}</div>`,
            };
          }}
          datesSet={() => setPopupInfo(null)}
        />
      </div>

      {popupInfo && (
        <div
          ref={popupRef}
          className="calendar-popup shadow rounded-4 p-3 fade-in"
          style={{
            top: `${popupInfo.y}px`,
            left: `${popupInfo.x}px`,
            position: "absolute",
            zIndex: 9999,
            width: "350px",
            backgroundColor: "#F0F4F9",
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Edit Reminder</h6>
            <button
              type="button"
              className="btn-close"
              onClick={() => setPopupInfo(null)}
            ></button>
          </div>

          <div className="mb-2 row align-items-center">
            <label className="col-4 col-form-label">Title</label>
            <div className="col-8">
              <input
                type="text"
                className="form-control form-control-sm bg-color-#F0F4F9"
                style={{ backgroundColor: "#F0F4F9" }}
                value={editEvent?.title || ""}
                onChange={(e) =>
                  seteditEvent({ ...editEvent, title: e.target.value })
                }
              />
            </div>
          </div>

          <div className="mb-2 row">
            <label className="col-4 col-form-label">Date</label>
            <div className="col-8">
              <input
                type="date"
                className="form-control form-control-sm"
                style={{ backgroundColor: "#F0F4F9" }}
                value={editEvent?.date || ""}
                onChange={(e) =>
                  seteditEvent({ ...editEvent, date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="mb-2 row">
            <label className="col-4 col-form-label">Time</label>
            <div className="col-8">
              <input
                type="time"
                className="form-control form-control-sm"
                style={{ backgroundColor: "#F0F4F9" }}
                value={editEvent?.time || ""}
                onChange={(e) =>
                  seteditEvent({ ...editEvent, time: e.target.value })
                }
              />
            </div>
          </div>

          <div className="mb-2 row">
            <label className="col-4 col-form-label">Category</label>
            <div className="col-8 d-flex align-items-center">
              <div
                className="form-control-plaintext form-control-sm"
                style={{ backgroundColor: "#F0F4F9", paddingLeft: "0.375rem" }}
              >
                {config
                  .find((c) => "Reminders" in c)
                  ?.Reminders?.categories.find(
                    (cat) => cat.value === editEvent?.category
                  )?.label || "—"}
              </div>
            </div>
          </div>

          <div className="mb-2 row">
            <label className="col-4 col-form-label">Description</label>
            <div className="col-8">
              <textarea
                className="form-control form-control-sm"
                style={{ backgroundColor: "#F0F4F9" }}
                rows={3}
                maxLength={76}
                value={editEvent?.description || ""}
                onChange={(e) =>
                  seteditEvent({
                    ...editEvent,
                    description: e.target.value,
                  })
                }
              ></textarea>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setPopupInfo(null)}
            >
              Cancel
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                handleConfirmEdit();
                setPopupInfo(null);
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
