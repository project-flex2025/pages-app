import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { decompressJson } from "@/utils/decompress";
import type { LayoutRow, SubMenu, ApiLayoutItem } from "@/types/layout";

// Minimal API response interfaces
interface ApiWidgetItem {
  record_id: string;
  slug_id?: string;
  subslug_id?: string;
  more_data?: { config?: string | object };
}
interface ApiResponse<T> {
  data?: T[];
}
interface UserProfile {
  record_id: string;
  more_data?: {
    user_permissions?: any; // replace any with the actual permission data type
    [key: string]: any;
  };
  [key: string]: any;
}

type PermissionsDecoded = any[];

interface LoginUserState {
  status: "idle" | "loading" | "error" | "succeeded";
  error: string | null;
  user: UserProfile | null;
}

const initialState: LoginUserState = {
  status: "idle",
  error: null,
  user: null,
};

export const fetchUserAndAllowedMenus = createAsyncThunk<
  { user: UserProfile },
  string,
  { rejectValue: string }
>("loginUser/fetchUserAndAllowedMenus", async (userId, { rejectWithValue }) => {
  try {
    console.log(
      "[loginUserSlice] Start fetching user profile for userId:",
      userId
    );

    // 1. Fetch user profile
    const userRes = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TYPE": "search",
      },
      body: JSON.stringify({
        conditions: [
          { field: "record_id", value: userId, search_type: "exact" },
        ],
        combination_type: "and",
        page: 1,
        limit: 1,
        dataset: "users",
      }),
    });

    if (!userRes.ok) throw new Error("Failed to fetch user profile");

    const userData = await userRes.json();
    if (!userData?.data?.[0]) throw new Error("User record not found");

    const user = userData.data[0];
    const permString = user.more_data?.user_permissions;

    if (
      !permString ||
      typeof permString !== "string" ||
      permString.trim() === ""
    ) {
      user.more_data.user_permissions = [];
      return { user };
    }

    const permissionsDecoded: PermissionsDecoded[] =
      decompressJson(permString) ?? [];
    if (!permissionsDecoded)
      throw new Error("Failed to decompress or parse user permissions");

    // 2. Fetch pages
    const pageLayoutRes = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TYPE": "search",
      },
      body: JSON.stringify({
        conditions: [
          { field: "feature_name", value: "page_layout", search_type: "exact" },
        ],
        combination_type: "and",
        page: 1,
        limit: 100,
        dataset: "feature_data",
      }),
    });
    if (!pageLayoutRes.ok) throw new Error("Failed to fetch page layouts");
    const pageLayoutData: ApiResponse<ApiLayoutItem> =
      await pageLayoutRes.json();

    const pageLayoutsArr = (pageLayoutData.data ?? [])
      .map((item) => {
        if (typeof item.more_data?.config === "string") {
          const decoded = decompressJson(item.more_data.config);
          if (decoded) return { record_id: item.record_id, layout: decoded };
        }
        return null;
      })
      .filter(Boolean) as { record_id: string; layout: any }[];

    // 3. Fetch subpages for these pages
    const subPageRes = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TYPE": "search",
      },
      body: JSON.stringify({
        conditions: [
          {
            field: "feature_name",
            value: "subpage_layout",
            search_type: "exact",
          },
          {
            combination_type: "or",
            conditions: pageLayoutsArr.map((p) => ({
              field: "slug_id",
              value: p.record_id,
              search_type: "exact",
            })),
          },
        ],
        combination_type: "and",
        page: 1,
        limit: 100,
        dataset: "feature_data",
      }),
    });
    if (!subPageRes.ok) throw new Error("Failed to fetch subpage layouts");
    const subPageData: ApiResponse<ApiLayoutItem> = await subPageRes.json();

    const subLayoutsArr = (subPageData.data ?? [])
      .map((item) => {
        if (typeof item.more_data?.config === "string") {
          const decoded = decompressJson(item.more_data.config);
          if (decoded)
            return {
              record_id: item.record_id,
              slug_id: item.slug_id,
              layout: decoded,
            };
        }
        return null;
      })
      .filter(Boolean) as { record_id: string; slug_id: string; layout: any }[];

    // 4. Prepare widget fetch conditions
    const widgetConditions: any[] = [];
    pageLayoutsArr.forEach((page) => {
      const subpagesForPage = subLayoutsArr.filter(
        (s) => s.slug_id === page.record_id
      );
      if (subpagesForPage.length === 0) {
        // Page without subpages -> fetch by slug_id
        widgetConditions.push({
          field: "slug_id",
          value: page.record_id,
          search_type: "exact",
        });
      } else {
        // Page with subpages -> fetch only by subslug_id
        subpagesForPage.forEach((sub) => {
          widgetConditions.push({
            field: "subslug_id",
            value: sub.record_id,
            search_type: "exact",
          });
        });
      }
    });

    if (widgetConditions.length === 0) {
      user.more_data.user_permissions = [];
      return { user };
    }

    // 5. Fetch widgets
    const widgetRes = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TYPE": "search",
      },
      body: JSON.stringify({
        conditions: [
          {
            field: "feature_name",
            value: "widget_layout",
            search_type: "exact",
          },
          { combination_type: "or", conditions: widgetConditions },
        ],
        combination_type: "and",
        page: 1,
        limit: 100,
        dataset: "feature_data",
      }),
    });
    if (!widgetRes.ok) throw new Error("Failed to fetch widget layouts");
    const widgetData: ApiResponse<ApiWidgetItem> = await widgetRes.json();

    const widgetLookup: Record<string, any> = {};
    (widgetData.data ?? []).forEach((item) => {
      let decodedLayout: any = {};
      if (typeof item.more_data?.config === "string") {
        decodedLayout = decompressJson(item.more_data.config) ?? {};
      } else if (typeof item.more_data?.config === "object") {
        decodedLayout = item.more_data?.config;
      }

      if (item.subslug_id) {
        // Widgets tied to subpages
        widgetLookup[`sub::${item.subslug_id}::${item.record_id}`] =
          decodedLayout;
      } else if (item.slug_id) {
        // Widgets tied directly to pages
        widgetLookup[`page::${item.slug_id}::${item.record_id}`] =
          decodedLayout;
      }
    });

    const applyWidgetConfigs = (
      widgets: any[],
      parentId: string,
      isSub: boolean
    ): any[] =>
      widgets.map((widget) => ({
        ...widget,
        config:
          widgetLookup[
            `${isSub ? "sub" : "page"}::${parentId}::${widget.widgetID}`
          ] ??
          widget.config ??
          {},
      }));

    // 6. Build menu map
    const menuMap: Record<string, any> = {};
    pageLayoutsArr.forEach((item) => {
      const layout = Array.isArray(item.layout) ? item.layout[0] : item.layout;
      const newLayouts: LayoutRow[] = (layout.layouts ?? []).map(
        (row: LayoutRow) => ({
          ...row,
          widgets: applyWidgetConfigs(row.widgets ?? [], item.record_id, false),
        })
      );

      menuMap[item.record_id] = {
        type: "menu",
        slugID: item.record_id,
        name: layout.name || "Untitled",
        icon: layout.icon || "ri-folder-line",
        slug: layout.slug || "/",
        active: layout.active ?? true,
        isDropdown: layout.isDropdown ?? false,
        sub_menus: [],
        layouts: newLayouts,
      };
    });

    subLayoutsArr.forEach((item) => {
      const layout = Array.isArray(item.layout) ? item.layout[0] : item.layout;
      const newLayouts: LayoutRow[] = (layout.layouts ?? []).map(
        (row: LayoutRow) => ({
          ...row,
          widgets: applyWidgetConfigs(row.widgets ?? [], item.record_id, true),
        })
      );

      const submenu: SubMenu = {
        name: layout.name || "Submenu",
        slug: layout.slug || "/sub",
        subSlugID: item.record_id,
        icon: layout.icon || "ri-file-line",
        layouts: newLayouts,
      };
      if (menuMap[item.slug_id]) menuMap[item.slug_id].sub_menus.push(submenu);
    });

    // 7. Filter by permissions
    const permissionMap = new Map<string, any>();
    permissionsDecoded.forEach((perm: any) => {
      const { slugID, widgets = [], sub_permissions = [] } = perm;
      widgets.forEach((w: any) => {
        const widgetID = typeof w === "string" ? w : w.widgetID;
        if (widgetID) permissionMap.set(`${slugID}|${widgetID}`, w);
      });
      sub_permissions.forEach((sub: any) => {
        sub.widgets?.forEach((w: any) => {
          const widgetID = typeof w === "string" ? w : w.widgetID;
          if (widgetID) permissionMap.set(`${sub.subSlugID}|${widgetID}`, w);
        });
      });
    });

    function applyStrictFieldPermissions(widget: any, permission: any | null) {
      if (!widget.config?.rows) return widget;
      const newRows = widget.config.rows.map((row: any) => ({
        ...row,
        fields: row.fields.map((field: any) => {
          const fieldPerm = permission?.fields?.[field.record_label];
          const display_settings: Record<string, string> = {};
          Object.keys(field.display_settings ?? {}).forEach((key) => {
            display_settings[key] = fieldPerm?.includes(key) ? "true" : "false";
          });
          return { ...field, display_settings };
        }),
      }));
      return { ...widget, config: { ...widget.config, rows: newRows } };
    }

    const combinedMenus: any[] = [];
    Object.values(menuMap).forEach((menu) => {
      const filteredLayouts = (menu.layouts || [])
        .map((layout: any) => {
          const updatedWidgets = (layout.widgets || [])
            .map((widget: any) => {
              const permission =
                permissionMap.get(`${menu.slugID}|${widget.widgetID}`) || null;
              return permission
                ? applyStrictFieldPermissions(widget, permission)
                : null;
            })
            .filter(Boolean);
          return updatedWidgets.length
            ? { ...layout, widgets: updatedWidgets }
            : null;
        })
        .filter(Boolean);

      const filteredSubMenus = (menu.sub_menus || [])
        .map((sub: any) => {
          const newLayouts = (sub.layouts || [])
            .map((layout: any) => {
              const updatedWidgets = (layout.widgets || [])
                .map((widget: any) => {
                  const permission =
                    permissionMap.get(`${sub.subSlugID}|${widget.widgetID}`) ||
                    null;
                  return permission
                    ? applyStrictFieldPermissions(widget, permission)
                    : null;
                })
                .filter(Boolean);
              return updatedWidgets.length
                ? { ...layout, widgets: updatedWidgets }
                : null;
            })
            .filter(Boolean);
          return newLayouts.length ? { ...sub, layouts: newLayouts } : null;
        })
        .filter(Boolean);

      if (filteredLayouts.length || filteredSubMenus.length) {
        combinedMenus.push({
          ...menu,
          layouts: filteredLayouts,
          sub_menus: filteredSubMenus,
        });
      }
    });

    user.more_data.user_permissions = combinedMenus;
    return { user };
  } catch (err: any) {
    return rejectWithValue(err?.message || "Failed fetching login user info");
  }
});

const loginUserSlice = createSlice({
  name: "loginUser",
  initialState,
  reducers: {
    clearLoginUser(state) {
      state.user = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserAndAllowedMenus.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserAndAllowedMenus.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.user = payload.user;
      })
      .addCase(fetchUserAndAllowedMenus.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "Unknown error";
      });
  },
});

export const { clearLoginUser } = loginUserSlice.actions;
export default loginUserSlice.reducer;
