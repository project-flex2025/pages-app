// types/controlpanel.ts

export interface Field {
  type: string;
  label: string;
  value_path: string;
  placeholder: string;
  note: string;
  default_value: string;
  display_settings: {
    table_view: boolean;
    detailed_view: boolean;
    sortable: boolean;
    filterable: boolean;
    searchable: boolean;
  };
  validations: {
    required: boolean;
  };
}
export interface Field2 {
  type: string;
  label: string;
  value_path: string;
  placeholder: string;
  note: string;
  default_value: string;
  display_settings: {
    table_view: string;
    detailed_view: string;
    sortable: string;
    filterable: string;
    searchable: string;
  };
  validations: {
    required: boolean;
  };
}

export interface LayoutItem {
  widget: string;
  componentName: string;
  width: number;
  row: number;
  type: string;
  height: number;
  widgetID: string;
  config?: ComponentConfig | null; // Made config nullable to support components with no configuration
}

export interface ComponentConfig {
  title: string;
  table_name: string;
  description: string;
  form_type: string;
  widgetID: string;
  multi_step: boolean;
  table_settings: {
    pagination: {
      default: boolean;
      page_size: number;
      current_page: number;
    };
    search: {
      default: boolean;
      name: string;
    };
    filters: {
      default: boolean;
      name: string;
    };
    actions: {
      [key: string]: {
        default: boolean;
        name: string;
        icon?: string;
      };
    };
    export: {
      [key: string]: {
        default: boolean;
        name: string;
      };
    };
    import?: {
      [key: string]: {
        default: boolean;
        name: string;
      };
    };
  };
  rows?: Column[];
  chart_type: string;
  colors: string;
  columns?: Field[];

  fields: string;
  data_source: string;
  xAxisLabel: string;
  yAxisLabel: string;
  display_settings: Array<{
    table_view: boolean;
    detailed_view: boolean;
    sortable: boolean;
    filterable: boolean;
    searchable: boolean;
  }>;
  form_size:string;
  window_type:string;
}

export interface LayoutRow {
  row: number;
  widgets: LayoutItem[];
}

export interface SubMenu {
  name: string;
  icon:string;
  slugID?: string;
  slug: string;
  layouts?: LayoutRow[];
}

export interface UserPermission {
  name: string;
  icon: string;
  slug: string;
  layouts?: LayoutRow[];
  sub_menus?: SubMenu[];
}

export interface User {
  profile_information?: {
    full_name?: string;
  };
}

// Table setting change handler
export type TableSettingChangeHandler = (
  section: string,
  key: string,
  value: unknown
) => void;

export interface Column {
  row_number: number;
  fields: Field[];
  field_count: number;
}

// Config change handler
export type ConfigChangeHandler = (path: string[], value: unknown) => void;
