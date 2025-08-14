// types/layout_slug.tsx

export type BreadcrumbItem = {
  name: string;
  slug: string;
};

// Widget Config Types
export type WidgetField = {
  type: string;
  label: string;
  record_path: string;
  placeholder: string;
  note: string;
  default_value: string;
  record_label: string;
  display_settings: {
    table_view: boolean;
    detailed_view: boolean;
    sortable: boolean;
    filterable: boolean;
    searchable: boolean;
  };
  validations: {
    required: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  options?: Array<{
    disabled: boolean;
    label: string;
    value: string;
  }>;
  multiple?: boolean;
};

export type TableSettings = {
  search: { default: boolean; name: string };
  pagination: { default: boolean; current_page: number; page_size: number };
  import: {
    excel: { default: boolean; name: string };
    csv: { default: boolean; name: string };
  };
  filters: { default: boolean; name: string };
  actions: Record<string, { default: boolean; name: string; icon: string }>;
  export: {
    excel: { default: boolean; name: string };
    pdf: { default: boolean; name: string };
    csv: { default: boolean; name: string };
  };
};

export type WidgetRow = {
  row_number: number;
  field_count: number;
  fields: WidgetField[];
};

export type WidgetConfig = {
  title: string;
  description: string;
  form_type: string;
  multi_step: boolean;
  data_source: string;
  table_settings: TableSettings;
  rows: WidgetRow[];
};

export type WidgetData = {
  widget: string;
  widget_id: string;
  name: string;
  componentName: string;
  height?: number;
  width?: number;
  row?: number;
  config: WidgetConfig;
};

// === Match Redux Structure Exactly ===

export type MenuItem = {
  type: "menu"; // matches Redux type
  slugID: string;
  name: string;
  slug: string;
  icon?: string;
  active?: boolean;
  isDropdown?: boolean;
  layouts: {
    row: number;
    widgets: WidgetData[];
  }[];
  sub_menus: MenuItem[];
};

export type DynamicComponentProps = {
  widgetData: WidgetData;
};
