"use client";

/// <reference types="react" />

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { RootState } from "@/redux/store";
import { MenuItem, WidgetData } from "@/types/slug_types";

type LayoutGroup = {
  row?: number;
  widgets?: WidgetData[];
};

type WidgetWithLayoutConfig = WidgetData & {
  row?: number;
  type?: string;
  layoutConfig: {
    row?: number;
  };
};

const componentCache = new Map<
  string,
  React.ComponentType<{ widgetData: WidgetWithLayoutConfig }>
>();

const getDynamicComponent = (componentName: string) => {
  if (componentCache.has(componentName)) {
    return componentCache.get(componentName)!;
  }

  const DynamicComponent = dynamic<{ widgetData: WidgetWithLayoutConfig }>(
    () =>
      import(`../components/${componentName}`)
        .then((mod) => mod.default)
        .catch(() => {
          const NotFound = () => (
            <div className="alert alert-warning p-2">
              Component {componentName} not found
            </div>
          );
          return NotFound;
        }),
    {
      ssr: false,
      loading: () => (
        <div className="text-center p-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ),
    }
  );

  componentCache.set(componentName, DynamicComponent);
  return DynamicComponent;
};

const WidgetCard = ({ item }: { item: WidgetWithLayoutConfig }) => {
  const componentName = item?.componentName?.replace(/\s+/g, "") || "";
  const ComponentToRender = getDynamicComponent(componentName);
  return <ComponentToRender widgetData={item} />;
};

const MemoizedWidgetCard = React.memo(WidgetCard);

function getWidthClass(width: number = 100): string {
  return `col-md-${Math.round((12 * width) / 100)}`;
}

const renderWidgetsGrouped = (
  widgets: WidgetWithLayoutConfig[]
): React.ReactElement => {
  const rowItems: React.ReactElement[] = [];
  const fullRowWidth = 100;
  let remainingWidth = fullRowWidth;

  const fullHeightWidgets: WidgetWithLayoutConfig[] = [];
  const partialHeightWidgets: WidgetWithLayoutConfig[] = [];

  // Separate full height and partial height widgets
  widgets.forEach((widget) => {
    if ((widget.height ?? 100) === 100) {
      fullHeightWidgets.push(widget);
    } else {
      partialHeightWidgets.push(widget);
    }
  });

  // Step 1: Render full height widgets
  fullHeightWidgets.forEach((widget) => {
    rowItems.push(
      <div
        key={widget.widget_id}
        className={getWidthClass(widget.width ?? 100)}
      >
        <MemoizedWidgetCard item={widget} />
      </div>
    );
    remainingWidth -= widget.width ?? 100;
  });

  // Step 2: Group remaining widgets (partial height) by width
  const groupedByWidth: { [key: number]: WidgetWithLayoutConfig[] } = {};
  partialHeightWidgets.forEach((widget) => {
    const width = widget.width ?? 100;
    if (!groupedByWidth[width]) groupedByWidth[width] = [];
    groupedByWidth[width].push(widget);
  });

  // Step 3: Render partial widgets inside remaining column
  if (partialHeightWidgets.length > 0) {
    const totalPartialWidth = partialHeightWidgets.reduce(
      (sum, w) => sum + (w.width ?? 100),
      0
    );
    rowItems.push(
      <div className={getWidthClass(remainingWidth)} key="partial-group">
        <div className="row">
          {Object.entries(groupedByWidth).map(([widthStr, widgetGroup]) => {
            const width = parseInt(widthStr, 10);
            return (
              <div
                key={`group-${width}`}
                className={getWidthClass(
                  (width / totalPartialWidth) * remainingWidth
                )}
              >
                {widgetGroup.length > 1 ? (
                  <div className="row">
                    {widgetGroup.map((widget) => (
                      <div key={widget.widget_id} className="col-md-12">
                        <MemoizedWidgetCard item={widget} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <MemoizedWidgetCard item={widgetGroup[0]} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return <div className="row">{rowItems}</div>;
};

export default function RootDashboard() {
  const { status } = useSession();
  const [currentLayouts, setCurrentLayouts] = useState<
    Record<string, WidgetWithLayoutConfig[]>
  >({});
  // const [breadcrumbs, setBreadcrumbs] = useState<
  //   Array<{ name: string; slug: string }>
  // >([]);
  const [subMenus, setSubMenus] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const loginUserState = useSelector((state: RootState) => state.loginUser) ?? {
    user: null,
    status: "idle",
    error: null,
  }; // safe fallback

  const { user } = loginUserState;

  const userPermissions = useMemo(
    () => user?.more_data?.user_permissions ?? [],
    [user?.more_data?.user_permissions]
  );

  const loadDashboardLayout = useCallback(
    (currentPath: string) => {
      const pathSegments = currentPath.split("/").filter(Boolean);
      let currentLevel: { sub_menus: MenuItem[] } = {
        sub_menus: userPermissions,
      };
      const crumbs: { name: string; slug: string }[] = [];
      let foundWidgets: WidgetWithLayoutConfig[] = [];
      let foundSubMenus: MenuItem[] = [];

      for (const segment of pathSegments) {
        const nextLevel = currentLevel.sub_menus.find(
          (menu) =>
            menu.slug === `/${segment}` || menu.slug.endsWith(`/${segment}`)
        );

        if (!nextLevel) break;

        crumbs.push({ name: nextLevel.name, slug: nextLevel.slug });
        currentLevel = { sub_menus: nextLevel.sub_menus ?? [] };

        if (nextLevel.layouts) {
          foundWidgets = nextLevel.layouts.flatMap((layout: LayoutGroup) => {
            return (layout.widgets ?? []).map((widget) => ({
              ...widget,
              row: layout.row,
              layoutConfig: { row: layout.row },
            }));
          });
        }

        if (nextLevel.sub_menus) {
          foundSubMenus = nextLevel.sub_menus;
        }
      }

      // setBreadcrumbs(crumbs);
      setSubMenus(foundSubMenus);

      const groupedWidgets = foundWidgets.reduce(
        (acc: Record<string, WidgetWithLayoutConfig[]>, widget) => {
          const rowKey = `row-${widget.row ?? 1}`;
          if (!acc[rowKey]) acc[rowKey] = [];
          acc[rowKey].push(widget);
          return acc;
        },
        {}
      );

      setCurrentLayouts(groupedWidgets);
      setIsLoading(false);
    },
    [userPermissions]
  );

  console.log("widget data", userPermissions);

  useEffect(() => {
    if (userPermissions.length > 0 && pathname) {
      loadDashboardLayout(pathname);
    }
  }, [userPermissions, pathname, loadDashboardLayout]);

  console.log("user permia", userPermissions);
  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    if (Object.keys(currentLayouts).length === 0) {
      return (
        <div className="alert alert-info">
          {subMenus.length > 0
            ? "Select a sub-section or configure components for this page"
            : "No components configured for this path"}
        </div>
      );
    }

    return (
      <>
        {Object.entries(currentLayouts).map(([rowKey, widgets]) => (
          <React.Fragment key={rowKey}>
            {renderWidgetsGrouped(widgets)}
          </React.Fragment>
        ))}
      </>
    );
  }, [isLoading, currentLayouts, subMenus]);

  if (status === "loading") {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Checking session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-2 pb-2">
        {/* <div>{pageTitle}</div> */}
      </div>
      {content}
    </div>
  );
}
