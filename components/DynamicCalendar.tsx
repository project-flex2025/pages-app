"use client";
import React, { useState } from "react";
import CalendarPage from "./Calendar";
import DefaultCalendarEvent from "./EventsTable";
import CalendarReminder from "./CalendarReminder";
type CalendarOptionMode = "day-wise" | "week-wise" | "month-wise" | "year-wise";

type CalendarWidgetConfig = {
  Calendar: {
    data_source: string;
    options: {
      default: CalendarOptionMode;
      view_modes: CalendarOptionMode[];
    };
  };
};

type ReminderWidgetConfig = {
  Reminders: {
    categories: {
      label: string;
      value: string;
    }[];
  };
};

type EventsWidgetConfig = {
  Events: {
    categories: {
      label: string;
      value: string;
    }[];
  };
};

type WidgetConfigItem =
  | CalendarWidgetConfig
  | ReminderWidgetConfig
  | EventsWidgetConfig;

type WidgetConfig = {
  widgetID: string;
  dataset: string;
  config: WidgetConfigItem[];
};
type WidgetTabItem =
  | {
      Calendar: {
        data_source: string;
        options: { default: string; view_modes: string[] };
      };
    }
  | { Reminders: { categories: { label: string; value: string }[] } }
  | { Events: { categories: { label: string; value: string }[] } };

type WidgetData = {
  row: number;
  widgetID: string;
  componentName: string;
  type: string;
  widget: string;
  width: number;
  height: number;
  config: WidgetConfig;
  layoutConfig: {
    row: number;
  };
};

type DynamicCalendarProps = {
  widgetData: WidgetData;
};

const DynamicCalendar = ({ widgetData }: DynamicCalendarProps) => {
  const configArray = widgetData?.config?.config || [];

  const tabKeys = widgetData?.config?.config?.map(
    (item: WidgetTabItem) => Object.keys(item)[0]
  ) as string[];

  console.log("widgetData........", widgetData);

  const [switchTab, setSwitchTab] = useState<string>(tabKeys?.[0] || "");

  return (
    <div className="card custom-card rounded-card">
      <div className="card-body">
        {widgetData?.config?.config?.length > 1 && (
          <div className="d-flex justify-content-center align-items-center ">
            <div className="btn-group ">
              {configArray.map((item) => {
                const key = Object.keys(item)[0];
                const label = key.charAt(0).toUpperCase() + key.slice(1);

                return (
                  <button
                    key={key}
                    type="button"
                    className={`btn ${
                      switchTab === key
                        ? "btn-primary text-white"
                        : "btn-light text-black"
                    }`}
                    onClick={() => setSwitchTab(key)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {switchTab === "Calendar" && (
          <CalendarPage config={widgetData?.config?.config} />
        )}
        {switchTab === "Reminders" && (
          <CalendarReminder config={widgetData?.config?.config} />
        )}
        {switchTab === "Events" && (
          <DefaultCalendarEvent config={widgetData?.config?.config} />
        )}
      </div>
    </div>
  );
};

export default DynamicCalendar;
