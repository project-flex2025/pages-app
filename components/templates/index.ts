import {
  Column,
  RowData,
  WidgetData,
  CardData,
  WidgetDataTable,
} from "@/types/table";

import {
  LineWidgetData,
  TransformedRecord,
  BarWidgetData,
  PieWidgetData,
} from "@/types/charts";
import { TableWidgetData, TableWidgetField } from "@/types/table";

import Template1Card from "./template1/DynamicCard";
import Template1Form, { FormDataType } from "./template1/DynamicForm";
import Template1Table from "./template1/DynamicTable";
import Template1LineChart from "./template1/LineChart";
import Template1BarChart from "./template1/BarChart";
import Template1PieChart from "./template1/PieChart";
import Template1FormTable from "./template1/DynamicFormTable";

import Template2Card from "./template2/DynamicCard";
import Template2Form from "./template2/DynamicForm";
import Template2Table from "./template2/DynamicTable";
import Template2LineChart from "./template2/LineChart";
import Template2BarChart from "./template2/BarChart";
import Template2PieChart from "./template2/PieChart";
import Template2FormTable from "./template2/DynamicFormTable";

import Template1Login from "./template1/Login";
import Template2Login from "./template2/Login";

import { FormWidgetData } from "@/types/forms";

export interface TemplateFormProps {
  widgetData: FormWidgetData;
  currentStep: number;
  loading: boolean;
  error: string | null;
  onInputChange: (
    stepIndex: number,
    rowIndex: number,
    fieldLabel: string,
    value: string
  ) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  setCurrentStep: (step: number) => void;
  formData: FormDataType;
}

export interface TemplateCardsProps {
  widgetData: WidgetData;
  cardData: CardData;
  error: string | null;
  loading: boolean;
}

export interface setSelectedFilterTemplateTableProps {
  widgetData: WidgetData;
  data: RowData[];
  visibleColumns: Column[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  search: string;
  selectedFilter: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onViewMore: (recordId: string) => void;
  loading: boolean;
  onFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export interface TemplateLineChartProps {
  widgetData: LineWidgetData;
  formattedData: TransformedRecord[];
  loading: boolean;
  error: string | null;
}

export interface TemplateBarChartProps {
  widgetData: BarWidgetData;
  formattedData: TransformedRecord[];
  loading: boolean;
  error: string | null;
}

export interface TemplatePieChartProps {
  widgetData: PieWidgetData;
  formattedData: TransformedRecord[];
  loading: boolean;
  error: string | null;
}

interface TagOption {
  label: string;
  value: string;
  color: string;
}

export interface AppDataValidationParams {
  min?: number;
  max?: number;
  type?: string[];
}

export interface AppDataValidation {
  required?: boolean;
  customValidation?: string;
  params?: AppDataValidationParams;
}

export interface AppDataValue {
  value?: string;
  type?: string;
  display_type?: string;
  validation?: AppDataValidation;
}

export interface TemplateLoginProps {
  credential: string;
  setCredential: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  isLoading: boolean;
  handleLogin: (e: React.FormEvent) => void;
  appData?: Record<string, AppDataValue>;
}

export interface TemplateFormTableProps {
  widgetData: TableWidgetData;
  data: RowData[];
  displayColumns: TableWidgetField[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  search: string;
  selectedFilter: string;
  selectedFilterValue: string;
  selectedField: TableWidgetField | null;
  loading: boolean;
  sortConfig: {
    key: string;
    direction: "asc" | "desc";
  } | null;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onEditClick: (row: RowData) => void;
  onViewClick: (row: RowData) => void;
  onNewUser: () => void;
  onFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onFilterTags: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onFilterValueChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSort: (key: string) => void;
  tags: TagOption[];
  userId?: string;
}

export type TemplateType = "template1" | "template2";

export interface TemplateTableProps {
  widgetData: WidgetDataTable;
  data: RowData[];
  onSort: (key: string) => void;
  sortConfig: {
    key: string;
    direction: "asc" | "desc";
  } | null;
  visibleColumns: Column[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  search: string;
  selectedFilter: string;
  selectedField: TableWidgetField | null;
  onPageChange: (newPage: number) => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRowsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onViewMore: (recordId: string) => void;
  loading: boolean;
  onFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onFilterValueChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  userId?: string;
}

export interface TemplateComponents {
  DynamicForm: React.ComponentType<TemplateFormProps>;
  DynamicCard: React.ComponentType<TemplateCardsProps>;
  DynamicTable: React.ComponentType<TemplateTableProps>;
  LineChart: React.ComponentType<TemplateLineChartProps>;
  BarChart: React.ComponentType<TemplateBarChartProps>;
  PieChart: React.ComponentType<TemplatePieChartProps>;
  DynamicFormTable: React.ComponentType<TemplateFormTableProps>;
  Login: React.ComponentType<TemplateLoginProps>;
}

export const templates: Record<TemplateType, TemplateComponents> = {
  template1: {
    DynamicCard: Template1Card,
    DynamicForm: Template1Form,
    DynamicTable: Template1Table,
    LineChart: Template1LineChart,
    BarChart: Template1BarChart,
    PieChart: Template1PieChart,
    DynamicFormTable: Template1FormTable,
    Login: Template1Login,
  },
  template2: {
    DynamicCard: Template2Card,
    DynamicForm: Template2Form,
    DynamicTable: Template2Table,
    LineChart: Template2LineChart,
    BarChart: Template2BarChart,
    PieChart: Template2PieChart,
    DynamicFormTable: Template2FormTable,
    Login: Template2Login,
  },
};
