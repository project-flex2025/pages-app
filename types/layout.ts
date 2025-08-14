// types/layout.ts

export interface UserProfile {
  record_id: string;
  [key: string]: unknown;
  more_data: Record<string, unknown> & {
    user_permissions?: string | MenuStructure[];
  };
}

export interface Widget {
  widgetID: string;
  config?: Record<string, unknown> | unknown[];
  actions?: unknown;
  export?: unknown;
  import?: unknown;
  [key: string]: unknown;
}

export interface LayoutRow {
  widgets: Widget[];
  [key: string]: unknown;
}

export interface PageLayout {
  record_id: string;
  layout: {
    name?: string;
    slug?: string;
    icon?: string;
    active?: boolean;
    isDropdown?: boolean;
    layouts: LayoutRow[];
    [key: string]: unknown;
  };
}

export interface SubPageLayout {
  record_id: string;
  slug_id: string;
  layout: {
    name?: string;
    slug?: string;
    icon?: string;
    layouts: LayoutRow[];
    [key: string]: unknown;
  };
}

export interface WidgetDecoded {
  record_id: string;
  slug_id: string;
  decoded_layout: Record<string, unknown> | unknown[];
}

export interface MenuStructure {
  type: string;
  slugID: string;
  name: string;
  icon: string;
  slug: string;
  active: boolean;
  isDropdown: boolean;
  sub_menus: SubMenu[];
  layouts: LayoutRow[];
}

export interface SubMenu {
  name: string;
  slug: string;
  subSlugID: string;
  icon: string;
  layouts: LayoutRow[];
}

export interface ApiLayoutItem {
  record_id: string;
  slug_id?: string;
  more_data?: {
    layout?: string;
    config?: string | Record<string, unknown> | unknown[];
  };
  [key: string]: unknown;
}

export interface ApiWidgetItem {
  record_id: string;
  slug_id?: string;
  subslug_id?: string;
  more_data?: {
    config?: string | Record<string, unknown> | unknown[];
  };
}

export interface ApiResponse<T> {
  data?: T[];
}
