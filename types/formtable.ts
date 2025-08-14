// src/types/table-types.ts

// Base field type (renamed from FieldConfig to avoid conflicts)
// export type TableWidgetField = {
//   type: string;
//   label: string;
//   [key: string]: unknown;
//   record_path: string;
//   placeholder: string;
//   note: string;
//   default_value: string;
//   record_label: string;
//   display_settings: {
//     table_view: string;
//     detailed_view: string;
//     sortable: string;
//     filterable: string;
//     searchable: string;
//   };
//   validations: {
//     required: boolean | string;
//     min?: number | string;
//     max?: number | string;
//     minLength?: number | string;
//     maxLength?: number | string;
//     pattern?: string;
//   };
//   options?: Array<{
//     disabled: boolean;
//     label: string;
//     value: string;
//   }>;
//   multiple?: boolean;
//   value_path?: string;
// };

// Table settings (renamed from TableConfig to TableWidgetSettings)
// export type TableWidgetSettings = {
//   search: {
//     default: boolean | string;
//     name: string;
//   };
//   pagination: {
//     default: boolean;
//     current_page: number | string;
//     page_size: number | string;
//   };
//   import: {
//     excel: {
//       default: boolean;
//       name: string;
//     };
//     csv: {
//       default: boolean;
//       name: string;
//     };
//   };
//   filters: {
//     default: boolean | string;
//     name: string;
//   };
//   actions: {
//     add: {
//       default: boolean | string;
//       name: string;
//       icon: string;
//     };
//     view: {
//       default: boolean | string;
//       name: string;
//       icon: string;
//     };
//     edit: {
//       default: boolean | string;
//       name: string;
//       icon: string;
//     };
//     toggle: {
//       default: boolean | string;
//       name: string;
//       icon: string;
//     };
//     delete: {
//       default: boolean | string;
//       name: string;
//       icon: string;
//     };
//   };
//   export: {
//     excel: {
//       default: boolean;
//       name: string;
//     };
//     pdf: {
//       default: boolean;
//       name: string;
//     };
//     csv: {
//       default: boolean;
//       name: string;
//     };
//   };
// };

// Row type (renamed from TableRow to TableWidgetRow to avoid MUI conflict)
// export type TableWidgetRow = {
//   row_number: number;
//   field_count: number;
//   fields: TableWidgetField[];
// };

// Config type (renamed from WidgetConfig to TableWidgetConfig)
// export type TableWidgetConfig = {
//   title: string;
//   description: string;
//   form_type: string;
//   multi_step: boolean;
//   data_source: string;
//   table_settings: TableWidgetSettings;
//   rows: TableWidgetRow[];
//   widgetID: string
// };

// Data type (kept as WidgetData since it's specific)
// export interface TableWidgetData {
//   widget: string;
//   widget_id: string;
//   name: string;
//   config: TableWidgetConfig;
// }

// Data item type (renamed from TableField to TableDataField to avoid MUI conflict)
// export interface TableDataField {
//   label: string;
//   [key: string]: unknown;
// }

// Data row type (renamed from TableRow to TableDataRow to avoid MUI conflict)
// export interface TableDataRow {
//   fields: TableDataField[];
// }

// export interface RecordDataItem {
//   record_label: string;
//   record_value: string | number | boolean | null;
//   record_type: string;
//   record_value_text?: string;
//   record_value_date?: string;
//   record_value_number?: number;
// }

// export type FeatureData = RecordDataItem[];

