export type TableWidgetField = {
  type: string;
  label: string;
  [key: string]: unknown;
  record_path: string;
  placeholder: string;
  note: string;
  default_value: string;
  record_label: string;
  display_settings: {
    table_view: string;
    detailed_view: string;
    sortable: string;
    filterable: string;
    searchable: string;
  };
  validations: {
    required: boolean | string;
    min?: number | string | undefined;
    max?: number | string | undefined;
    minLength?: number | string | undefined;
    maxLength?: number | string | undefined;
    pattern?: string;
  };
  options?: Array<{
    disabled: boolean;
    label: string;
    value: string;
    record_label: string;
    color?: string;
  }>;
  dynamic_options?: Array<{
    location?: {
      country?: Array<{ default: string; lock: string }>;
      states?: Array<{ 
        default: string; 
        lock: string; 
        country_field?: string;
      }>;
      cities?: Array<{ 
        default: string; 
        lock: string; 
        country_field?: string;
        state_field?: string;
      }>;
    };
  }>;
  multiple?: boolean;
  value_path?: string;
};

export type FieldOption = {
  label: string;
  value: string;
  record_label?: string;
  color?: string;
};

export type DisplaySettings = {
  table_view: string | boolean;
  detailed_view: string | boolean;
  sortable: string | boolean;
  filterable: string | boolean;
  searchable?: string | boolean;
};

export type Column = {
  label: string;
  record_path: string;
  record_label: string;
  display_settings: DisplaySettings;
  type?: string;
  options?: Array<{ label: string; value: string; color: string }>;
};

export type TableAction = {
  default: boolean | string;
  name: string;
  icon?: string;
};

export type TableSettings = {
  pagination: {
    page_size: number | string;
    current_page: number | string;
    default: boolean | string;
    page_size_options: string;
  };
  search: {
    default: boolean | string;
    name: string;
  };
  filters: {
    default: boolean | string;
    name: string;
  };
  actions: {
    view: TableAction;
    toggle: TableAction;
    add?: TableAction;
    edit?: TableAction;
    delete?: TableAction;
  };
  export: {
    csv: TableAction;
    excel: TableAction;
    pdf: TableAction;
  };
  import?: {
    csv: TableAction;
    excel: TableAction;
  };
};

// export type FieldConfig = {
//   type: string;
//   label: string;
//   record_path: string;
//   placeholder: string;
//   note: string;
//   default_value: string;
//   record_label: string;
//   display_settings: {
//     table_view: boolean;
//     detailed_view: boolean;
//     sortable: boolean;
//     filterable: boolean;
//     searchable: boolean;
//   };
//   validations: {
//     required: boolean;
//     minLength?: number;
//     maxLength?: number;
//     pattern?: string;
//   };
//   options?: Array<{
//     disabled: boolean;
//     label: string;
//     value: string;
//   }>;
//   multiple?: boolean;
//   steps: Step[];
// };
export type FieldConfig = TableWidgetField; // Alias for compatibility

export type RowConfig = {
  row_number: number;
  field_count: number;
  fields: FieldConfig[];
};

export type FormConfig = {
  title: string;
  description: string;
  form_type: string;
  multi_step: boolean;
  data_source: string;
  rows: RowConfig[];
  icon: string;
  conditions?: Condition[];
  combination_type?: string;
  dataset?: string;
  type: "count" | "sum" | "avg" | "min" | "max";
  table_settings?: TableSettings;
};

export type FeatureRecord =
  | {
      record_label: string;
      record_type: "type_text";
      record_value: string;
    }
  | {
      record_label: string;
      record_type: "type_number";
      record_value_number: number;
    }
  | {
      record_label: string;
      record_type: "type_date";
      record_value_date: string;
    };

export interface TableRow {
  field_count: number;
  row_number: number;
  fields: TableWidgetField[];
}

export interface ApiResponse {
  total_results?: number;
  data?: ApiDataItem[];
  status?: boolean;
  message?: string;
}

export interface ApiResponse {
  record_id: string;
  feature_name: string;
  added_by: string;
  record_status: string;
  created_on_date: string;
  feature_data: {
    record_data: ApiRecordData[];
  };
  more_data: Record<string, string>;
  doc_position: number;
  total_results?: number;
  data?: ApiDataItem[];
  status?: boolean;
  message?: string;
}

export interface ApiRecordData {
  record_label: string;
  record_value: string;
  record_value_text?: string;
  record_value_date?: string;
  record_value_number?: number;
}

export interface ApiDataItem {
  feature_data?: FeatureData;
  more_data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ColumnConfig {
  label: string;
  record_path: string;
  record_label: string;
  display_settings: {
    table_view: string;
    detailed_view: string;
    sortable: string;
    filterable: string;
  };
}

export interface ApiRecord {
  record_id?: string;
  record_status?: string;
  more_data?: Record<string, string>;
  feature_data?: {
    record_data?: {
      record_label: string;
      record_value?: string;
      record_value_date?: string;
      record_value_number?: number;
      record_value_text?: string;
    }[];
  };
  [key: string]: unknown;
}

export type WidgetConfig = FormConfig & {
  widgetID: string;
  steps?: Step[];
  props?: {
    value?: string;
  };
  form_size?: string;

  columns?: Column[];
  tags?: {
    default: boolean | string;
    name: string;
  };
};

export type WidgetDataTable = {
  row: number;
  widgetID: string;
  widget_id: string;
  componentName: string;
  type: string;
  widget: string;
  width: number;
  height: number;
  name: string;
  icon: string;
  config: WidgetConfig;
  layoutConfig: {
    row: number;
  };
};

export type TableWidgetConfig = FormConfig & {
  widgetID: string;
  table_settings: TableSettings;
  form_size?: string;
  window_type?: string;
  tags?: {
    default: boolean | string;
    name: string;
  };
};

export interface TableWidgetData {
  widget: string;
  widget_id: string;
  config: TableWidgetConfig;
}

export interface RecordItem {
  record_label: string;
  record_value?: string;
  record_value_text?: string;
  record_value_date?: string;
  record_value_number?: number;
  record_type?: string;
}

export interface FeatureData {
  record_data?: RecordItem[];
}

export interface MoreData {
  tags?: string[];
  [key: string]: string | string[] | undefined;
}

export interface RowData {
  feature_data?: FeatureData | string | number | boolean | null;
  more_data?: Record<string, string | string[] | undefined>;
  [key: string]:
    | string
    | number
    | boolean
    | null
    | RowData
    | RecordItem[]
    | FeatureData
    | undefined;
}

// export type RowData = {
//   [key: string]: string | number | boolean | null | RowData | RecordItem[];

// };

export interface CardData {
  title: string;
  value: string | number;
  description: string;
  icon?: string;
}

export interface Condition {
  field: string;
  value: string;
  search_type: "exact" | "contains" | "starts_with" | "ends_with";
}

export interface Step {
  step: string;
  title: string;
  description: string;
  rows: Row[];
  row_count: string;
}

export interface Row {
  row_number: string;
  fields: Field[];
  field_count: string;
}

export interface Field {
  type: string;
  label: string;
  record_path: string;
  record_label: string;
  placeholder: string;
  note: string;
  default_value: string;
  validations: {
    required: string;
    minDate?: string;
    maxDate?: string;
    disabledDates?: string[];
  };
}

export interface WidgetData {
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
  widget_id: string;
  name: string;
  icon: string;
}

export interface WidgetConfigTable {
  widgetID: string;
  title: string;
  description: string;
  data_source: string;
  data_set: string;
  columns: TableWidgetField[];
  table_settings: TableSettings;
}

export interface TableWidgetFieldTable {
  label: string;
  record_path: string;
  record_label: string;
  display_settings: DisplaySettings;
  placeholder?: string;
  note?: string;
  default_value?: string;
  validations: {
    required: boolean | string;
    min?: number | string | undefined;
    max?: number | string | undefined;
    minLength?: number | string | undefined;
    maxLength?: number | string | undefined;
    pattern?: string;
  };
  options?: Array<{
    disabled: boolean;
    label: string;
    value: string;
    record_label: string;
  }>;
  type?: string;
}

export interface DisplaySettingsTable {
  table_view: string;
  detailed_view: string;
  sortable: string;
  filterable: string;
}

export interface TableSettingsTable {
  pagination: {
    default: string;
    page_size: string;
    current_page: string;
  };
  search: {
    default: string;
    name: string;
    placeholder: string;
  };
  filters: {
    default: string;
  };
  actions: {
    add?: TableAction;
    view?: TableAction;
    edit?: TableAction;
    delete?: TableAction;
  };
  export: {
    csv?: TableAction;
    excel?: TableAction;
    pdf?: TableAction;
  };
  import: {
    csv?: TableAction;
    excel?: TableAction;
  };
}

export interface CalendarConfig {
  calendar?: {
    data_source: string;
  };
  reminders?: {
    categories: string[];
  };
  events?: {
    categories: string[];
    bulkupload?: boolean;
  };
  [key: string]: unknown; // Allow other dynamic keys if needed
}

export interface CalendarProps {
  config: CalendarConfig[];
}
