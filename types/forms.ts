// src/types/form-types.ts
export interface Field {
    label: string;
    type: string;
    record_label: string;
    placeholder?: string;
    note?: string;
    default_value?: string;
    record_path: string;
    validations?: {
      required?: string;
      minLength?: string;
      maxLength?: string;
    };
    options?: {
      label: string;
      value: string;
    }[];
    display_settings?: {
      table_view?: string;
      detailed_view?: string;
      sortable?: string;
      filterable?: string;
    };
  }
  
  export interface FormRow {
    row_number: number;
    fields: Field[];
  }
  
  export interface FormStep {
    step: string;
    title: string;
    description: string;
    rows: FormRow[];
  }
  
  export interface TableSettings {
    pagination?: {
      default?: string;
      page_size?: string;
      current_page?: string;
      page_size_options?: string;
    };
    search?: {
      default?: string;
    };
    filters?: {
      default?: string;
    };
    actions?: {
      add?: {
        default?: string;
        name?: string;
      };
      view?: {
        default?: string;
      };
      edit?: {
        default?: string;
      };
      toggle?: {
        default?: string;
      };
    };
    export?: {
      csv?: {
        default?: string;
      };
      excel?: {
        default?: string;
      };
      pdf?: {
        default?: string;
      };
    };
    import?: {
      csv?: {
        default?: string;
      };
      excel?: {
        default?: string;
      };
    };
  }
  
  export interface FormConfig {
    widgetID?: string;
    title?: string;
    data_source?: string;
    data_set?: string;
    description?: string;
    form_type?: string;
    multi_step?: "true" | "false";
    window_type?: string;
    form_size?: string;
    table_settings?: TableSettings;
    steps?: FormStep[]; // For multi-step forms
    rows?: FormRow[]; // For non-multi-step forms
  }
  
  export interface FormWidgetData {
    widget_id: string;
    name: string;
    icon?: string;
    row: number;
    widgetID: string;
    componentName: string;
    type?: string;
    widget?: string;
    width?: number;
    height?: number;
    config: FormConfig; // Made required since it's always present in your examples
    layoutConfig?: {
      row?: number;
    };
  }
  
  export interface FormData {
    [stepIndex: string]: {
      [rowIndex: string]: {
        [fieldLabel: string]: string;
      };
    };
  }
  