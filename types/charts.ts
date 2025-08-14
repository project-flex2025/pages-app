export type RecordData = {
  record_label: string;
  record_value?: string;
  record_value_number?: number;
  record_type: string;
  record_value_date?: string;
};

export type FeatureData = {
  record_data: RecordData[];
};

export type APIRecord = {
  record_id: string;
  feature_name: string;
  added_by: string;
  record_status: string;
  created_on_date: string;
  feature_data: FeatureData;
  more_data: {
    wild_search: string;
  };
  inc_id: number;
  doc_position: number;
};

export type BarLineConfig = {
  dataKey: string;
  color: string;
  name: string;
};

export type LineWidgetConfig = {
  widgetID: string;
  chart_type: string;
  title: string;
  record_path: string;
  xAxisLabel: string;
  yAxisLabel: string;
  data_source: string;
  X_value: string;
  y_value: string;
  lines: BarLineConfig[];
};

export type LineWidgetData = {
  row: number;
  widgetID: string;
  componentName: string;
  type: string;
  widget: string;
  width: number;
  height: number;
  config: LineWidgetConfig;
  layoutConfig: {
    row: number;
  };
};

export type BarWidgetConfig = {
  widgetID: string;
  chart_type: string;
  title: string;
  record_path: string;
  xAxisLabel: string;
  yAxisLabel: string;
  data_source: string;
  X_value: string;
  bars: BarLineConfig[];
};

export type BarWidgetData = {
  row: number;
  widgetID: string;
  componentName: string;
  type: string;
  widget: string;
  width: number;
  height: number;
  config: BarWidgetConfig;
  layoutConfig: {
    row: number;
  };
};

export type PieWidgetConfig = {
  widgetID: string;
  chart_type: string;
  title: string;
  record_path: string;
  data_source: string;
  name_key: string;
  value_key: string;
  colors: string[];
};

export type PieWidgetData = {
  row: number;
  widgetID: string;
  componentName: string;
  type: string;
  widget: string;
  width: number;
  height: number;
  config: PieWidgetConfig;
  layoutConfig: {
    row: number;
  };
};

export type TransformedRecord = {
  [key: string]: string | number;
};
