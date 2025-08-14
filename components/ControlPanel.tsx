import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { decompressJson, compressJson } from "@/utils/decompress";
import {
  LayoutItem,
  ComponentConfig,
  SubMenu,
  UserPermission,
} from "@/types/controlpanel";
import { TableConfig } from "./control-configs/TableConfig";
import { FormTableConfig } from "./control-configs/FormTableConfig";
import { ChartConfig } from "./control-configs/ChartConfig";
import { DynamicFormConfig } from "./control-configs/DynamicFormConfig";

export interface LayoutRow {
  row: number;
  widgets: LayoutItem[];
}

export interface ControlPanelModalProps {
  showUserModal: boolean;
  setShowUserModal: (show: boolean) => void;
  selectedUserId: string | null;
  selectedUserName: string | null;
}

const ControlPanelModal: React.FC<ControlPanelModalProps> = ({
  setShowUserModal,
  selectedUserId,
  selectedUserName,
}) => {
  const [menuItems, setMenuItems] = useState<UserPermission[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [selectedItem, setSelectedItem] = useState<
    UserPermission | SubMenu | null
  >(null);

  const [featureSelections, setFeatureSelections] = useState<
    Record<string, string[]>
  >({});
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { status } = useSession();
  const router = useRouter();
  // const currentUser = useSelector((state: RootState) => state.user.user);
  const loginUserState = useSelector((state: RootState) => state.loginUser) ?? {
    user: null,
    status: "idle",
    error: null,
  }; // safe fallback
  const { user } = loginUserState;
  const [activePath, setActivePath] = useState<string | null>(null);
  const [componentConfig, setComponentConfig] =
    useState<ComponentConfig | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [activeLayoutItem, setActiveLayoutItem] = useState<LayoutItem | null>(
    null
  );
  const [componentConfigs, setComponentConfigs] = useState<
    Record<string, ComponentConfig>
  >({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status]);

  const initializeSelections = useCallback(
    (selectedUserPermissions: UserPermission[]) => {
      if (!user?.more_data?.user_permissions) return;

      const allPermissions = user.more_data.user_permissions;
      const newCheckedItems: Record<string, boolean> = {};
      const newFeatureSelections: Record<string, string[]> = {};
      const newComponentConfigs: Record<string, ComponentConfig> = {};

      allPermissions.forEach((permission: UserPermission) => {
        if (permission.slug) {
          newCheckedItems[permission.slug] = false;
          newFeatureSelections[permission.slug] = [];
          if (permission.sub_menus) {
            permission.sub_menus.forEach((subMenu) => {
              if (subMenu.slug) {
                newCheckedItems[subMenu.slug] = false;
                newFeatureSelections[subMenu.slug] = [];
              }
            });
          }
        }
      });
      selectedUserPermissions.forEach((selectedPermission) => {
        if (!selectedPermission.slug) return;

        newCheckedItems[selectedPermission.slug] = true;

        if (selectedPermission.layouts) {
          newFeatureSelections[selectedPermission.slug] =
            selectedPermission.layouts.flatMap((layout) => {
              return (
                layout.widgets?.map((item) => {
                  if (item.config) {
                    newComponentConfigs[item.widgetID] = item.config;
                  }
                  return item.widgetID;
                }) || []
              );
            });
        }

        if (selectedPermission.sub_menus) {
          selectedPermission.sub_menus.forEach((subMenu) => {
            if (!subMenu.slug) return;
            newCheckedItems[subMenu.slug] = true;

            if (subMenu.layouts) {
              newFeatureSelections[subMenu.slug] = subMenu.layouts.flatMap(
                (layout) => {
                  return (
                    layout.widgets?.map((item) => {
                      if (item.config) {
                        newComponentConfigs[item.widgetID] = item.config;
                      }
                      return item.widgetID;
                    }) || []
                  );
                }
              );
            }
          });
        }
      });

      setMenuItems(
        allPermissions.map((permission: UserPermission) => ({
          ...permission,
          sub_menus: permission.sub_menus?.map((sub) => ({
            ...sub,
            slugID: sub.slug || sub.slug, // fallback if needed
          })),
        }))
      );
      setCheckedItems(newCheckedItems);
      setFeatureSelections(newFeatureSelections);
      setComponentConfigs(newComponentConfigs);
      setComponentConfig(null); // No default component config
      setSelectedItem(null); // No default selected menu
      setActivePath(null); // No default path
      setActiveFeature(null); // No default feature
    },
    [user]
  );

  // console.log("current user",currentUser);

  const fetchSelectedUserPermissions = useCallback(async () => {
    setLoadingPermissions(true);
    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "search",
        },
        body: JSON.stringify({
          conditions: [
            {
              field: "record_id",
              value: selectedUserId,
              search_type: "exact",
            },
          ],
          combination_type: "and",
          page: 1,
          limit: 10,
          dataset: "users",
        }),
      });

      const result = await response.json();
      let selectedUserPermissions: UserPermission[] = [];

      if (
        result.total_results > 0 &&
        result.data?.[0]?.more_data?.user_permissions
      ) {
        const permissions = result.data[0].more_data.user_permissions;

        try {
          const decompressed = decompressJson(permissions);
          selectedUserPermissions = Array.isArray(decompressed)
            ? decompressed
            : [];
        } catch (e) {
          selectedUserPermissions =
            typeof permissions === "string"
              ? JSON.parse(permissions)
              : permissions;
          console.log(e);
        }
      }

      initializeSelections(selectedUserPermissions);
    } catch (error) {
      console.error("Error fetching selected user permissions:", error);
      initializeSelections([]);
    } finally {
      setLoadingPermissions(false);
    }
  }, [selectedUserId, initializeSelections]);

  useEffect(() => {
    if (user?.more_data?.user_permissions) {
      const fixedPermissions = user.more_data.user_permissions.map(
        (item: UserPermission) => ({
          ...item,
          sub_menus: item.sub_menus?.map((sub) => ({
            ...sub,
            slugID: sub.slug || "", // generate or assign a fallback value
          })),
        })
      );
      setMenuItems(fixedPermissions);
    }

    fetchSelectedUserPermissions();
  }, [selectedUserId, user, fetchSelectedUserPermissions]);

  const handleMenuSelection = useCallback(
    (item: UserPermission | SubMenu, parentItem?: UserPermission) => {
      if (!item.slug) return;

      const newChecked = !checkedItems[item.slug];
      const newCheckedItems = { ...checkedItems, [item.slug]: newChecked };

      if (parentItem) {
        setActivePath(`${item.slug}`);
      } else {
        setActivePath(`${item.slug}`);
      }

      if ("sub_menus" in item && item.sub_menus) {
        item.sub_menus.forEach((subMenu) => {
          if (subMenu.slug) {
            newCheckedItems[subMenu.slug] = newChecked;
          }
        });
      } else {
        const parent = menuItems.find((menu) =>
          menu.sub_menus?.some((sub) => sub.slug === item.slug)
        );

        if (parent?.slug && newChecked) {
          const allSiblingsSelected = parent.sub_menus?.every((sub) =>
            sub.slug
              ? sub.slug === item.slug
                ? newChecked
                : checkedItems[sub.slug]
              : true
          );

          if (allSiblingsSelected) {
            newCheckedItems[parent.slug] = true;
          }
        }
      }

      setCheckedItems(newCheckedItems);
      setSelectedItem(item);
    },
    [checkedItems, menuItems]
  );

  const handleFeatureSelection = (
    item: UserPermission | SubMenu,
    featureName: string
  ) => {
    if (!item.slug) return;

    setFeatureSelections((prev) => {
      const updatedFeatures = prev[item.slug] ? [...prev[item.slug]] : [];
      return {
        ...prev,
        [item.slug]: updatedFeatures.includes(featureName)
          ? updatedFeatures.filter((name) => name !== featureName)
          : [...updatedFeatures, featureName],
      };
    });
  };

  const handleFeatureClick = useCallback(
    (featureName: string, layoutItem?: LayoutItem) => {
      if (activeFeature && componentConfig) {
        setComponentConfigs((prev) => ({
          ...prev,
          [activeFeature]: componentConfig,
        }));
      }

      setActiveFeature(featureName);
      setActiveLayoutItem(layoutItem ?? null);

      if (layoutItem?.type === "component") {
        const configToLoad =
          componentConfigs[featureName] || layoutItem.config || null;
        setComponentConfig(configToLoad);

        if (!componentConfigs[featureName] && layoutItem.config) {
          setComponentConfigs((prev) => ({
            ...prev,
            [featureName]: layoutItem.config!,
          }));
        }
      } else {
        setComponentConfig(componentConfigs[featureName] || null);
      }
    },
    [activeFeature, componentConfig, componentConfigs]
  );

  useEffect(() => {
    if (menuItems.length > 0 && !selectedItem) {
      const firstMenuItem = menuItems[0];
      handleMenuSelection(firstMenuItem);

      if (firstMenuItem.layouts?.[0]?.widgets?.[0]) {
        const firstFeature = firstMenuItem.layouts[0].widgets[0];
        handleFeatureClick(firstFeature.widgetID, firstFeature);
      }
    }
  }, [menuItems, selectedItem, handleMenuSelection, handleFeatureClick]);

  const generateFilteredJson = (
    data: UserPermission[],
    checkedItems: Record<string, boolean>,
    featureSelections: Record<string, string[]>,
    componentConfigs: Record<string, ComponentConfig>
  ): UserPermission[] => {
    if (!Array.isArray(data)) return [];

    return data
      .filter((item) => item.slug && checkedItems[item.slug])
      .map((item) => {
        const processedLayouts =
          item.layouts
            ?.map((layout) => {
              const filteredWidgets =
                layout.widgets
                  ?.filter((widget) => {
                    return (
                      !featureSelections[item.slug!] ||
                      featureSelections[item.slug!].includes(widget.widgetID) ||
                      featureSelections[item.slug!].includes(
                        widget.componentName
                      )
                    );
                  })
                  ?.map((widget) => {
                    const widgetConfig = componentConfigs[widget.widgetID];
                    return widgetConfig
                      ? { ...widget, config: widgetConfig }
                      : widget;
                  }) || [];

              return {
                ...layout,
                widgets: filteredWidgets,
              };
            })
            .filter((layout) => layout.widgets.length > 0) || [];

        const processedSubMenus =
          item.sub_menus
            ?.filter((sub) => sub.slug && checkedItems[sub.slug])
            .map((sub) => {
              const subLayouts =
                sub.layouts
                  ?.map((layout) => {
                    const filteredWidgets =
                      layout.widgets
                        ?.filter((widget) => {
                          return (
                            !featureSelections[sub.slug!] ||
                            featureSelections[sub.slug!].includes(
                              widget.widgetID
                            ) ||
                            featureSelections[sub.slug!].includes(
                              widget.componentName
                            )
                          );
                        })
                        ?.map((widget) => {
                          const widgetConfig =
                            componentConfigs[widget.widgetID];
                          return widgetConfig
                            ? { ...widget, config: widgetConfig }
                            : widget;
                        }) || [];

                    return {
                      ...layout,
                      widgets: filteredWidgets,
                    };
                  })
                  .filter((layout) => layout.widgets.length > 0) || [];

              return {
                ...sub,
                layouts: subLayouts,
              };
            })
            .filter((sub) => sub.layouts.length > 0) || [];

        return {
          ...item,
          layouts: processedLayouts.length > 0 ? processedLayouts : undefined,
          sub_menus:
            processedSubMenus.length > 0 ? processedSubMenus : undefined,
        };
      })
      .filter(
        (item) =>
          (item.layouts && item.layouts.length > 0) ||
          (item.sub_menus && item.sub_menus.length > 0)
      );
  };

  const handleConfigChange = useCallback((path: string[], value: unknown) => {
    setComponentConfig((prev) => {
      if (!prev) return null;

      const newConfig = JSON.parse(JSON.stringify(prev));
      let current = newConfig;

      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }

      current[path[path.length - 1]] = value;
      return newConfig;
    });
  }, []);

  const handleTableSettingChange = useCallback(
    (section: string, key: string, value: unknown) => {
      setComponentConfig((prev) => {
        if (!prev) return null;

        const newConfig = JSON.parse(JSON.stringify(prev));

        if (!newConfig.table_settings) {
          newConfig.table_settings = {};
        }

        if (!newConfig.table_settings[section]) {
          newConfig.table_settings[section] = {};
        }

        newConfig.table_settings[section][key] = value;
        return newConfig;
      });
    },
    []
  );

  const handleActionChange = useCallback(
    (action: string, key: string, value: unknown) => {
      setComponentConfig((prev) => {
        if (!prev || !prev.table_settings?.actions) return prev;

        const newConfig = JSON.parse(JSON.stringify(prev));

        if (!newConfig.table_settings.actions[action]) {
          newConfig.table_settings.actions[action] = {};
        }

        newConfig.table_settings.actions[action][key] = value;
        return newConfig;
      });
    },
    []
  );

  const handleFieldSettingChange = useCallback(
    (flatIndex: number, path: string, value: unknown) => {
      setComponentConfig((prev) => {
        if (!prev || !prev.rows) return prev;

        const newConfig = JSON.parse(JSON.stringify(prev));
        let currentIndex = 0;

        for (const row of newConfig.rows) {
          for (const field of row.fields) {
            if (currentIndex === flatIndex) {
              const pathParts = path.split(".");
              let current = field;

              for (let i = 0; i < pathParts.length - 1; i++) {
                if (!current[pathParts[i]]) {
                  current[pathParts[i]] = {};
                }
                current = current[pathParts[i]];
              }

              current[pathParts[pathParts.length - 1]] = value;
              return newConfig;
            }
            currentIndex++;
          }
        }

        return prev;
      });
    },
    []
  );

  useEffect(() => {
    if (activeFeature && componentConfig) {
      setComponentConfigs((prev) => ({
        ...prev,
        [activeFeature]: componentConfig,
      }));
    }
  }, [componentConfig, activeFeature]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeFeature && componentConfig) {
      setComponentConfigs((prev) => ({
        ...prev,
        [activeFeature]: componentConfig,
      }));
    }

    const filteredData = generateFilteredJson(
      menuItems,
      checkedItems,
      featureSelections,
      componentConfigs
    );

    if (!filteredData || filteredData.length === 0) {
      alert(
        "No permissions selected! Please select at least one menu item and its features."
      );
      return;
    }

    setLoading(true);

    try {
      const filteredDataString = JSON.stringify(filteredData);
      const encodedData = compressJson(filteredDataString);
      // const encodedData = compressJson(filteredData); // ✅ Use compression

      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "update",
        },
        body: JSON.stringify({
          data: {
            record_id: selectedUserId,
            feature_name: "user_management",
            fields_to_update: {
              more_data: {
                user_permissions: encodedData,
              },
            },
          },
          dataset: "users",
        }),
      });

      const result = await response.json();
      alert(result.message || "Permissions updated successfully!");
    } catch (error) {
      console.error("Error updating permissions:", error);
      alert("Failed to update permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="control-panel">
      <div className="modal-overlay">
        <div className="modal fade show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header  ctrl-head">
                <h5 className="modal-title">
                  <span className="text-primary">
                    {" "}
                    {user?.profile_information?.full_name ||
                      "Current User"}{" "}
                    Permissions
                  </span>
                  <br />
                  <small className="fs-6 mt-3">
                    Editing permissions for: {selectedUserName}
                  </small>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowUserModal(false)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="row mt-2">
                {loadingPermissions && (
                  <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading permissions...</p>
                  </div>
                )}

                {!loadingPermissions ? (
                  <div className="col-md-3 col-lg-3">
                    <div className="modal-sidebar">
                      <h5 className="modal-sidebar-title text-primary">
                        Menu Items
                      </h5>
                      <ul className="nav flex-column">
                        {menuItems.map((item) => (
                          <li
                            key={item.slug}
                            id={`menu-${item.slug}`}
                            className={`nav-item ${
                              selectedItem?.slug === item.slug ? "active" : ""
                            }`}
                          >
                            <div className="d-flex align-items-center modal-menu-item">
                              <input
                                type="checkbox"
                                checked={!!checkedItems[item.slug]}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleMenuSelection(item);
                                }}
                                id={`menu-${item.slug}`}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <label
                                htmlFor={`menu-${item.slug}`}
                                className="nav-link"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedItem(item);
                                  setActivePath(`${item.slug}`);
                                }}
                              >
                                {item.name}
                              </label>
                            </div>

                            {item.sub_menus && item.sub_menus.length > 0 && (
                              <ul className="modal-sub-menu">
                                {item.sub_menus.map((sub) => (
                                  <li
                                    key={sub.slug}
                                    className={`nav-item ${
                                      selectedItem?.slug === sub.slug
                                        ? "active"
                                        : ""
                                    }`}
                                  >
                                    <div className="d-flex align-items-center modal-submenu-item">
                                      <input
                                        type="checkbox"
                                        checked={!!checkedItems[sub.slug]}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          handleMenuSelection(sub, item);
                                        }}
                                        id={`submenu-${sub.slug}`}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <label
                                        htmlFor={`submenu-${sub.slug}`}
                                        className="nav-link"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setSelectedItem(sub);
                                          setActivePath(`${sub.slug}`);
                                        }}
                                      >
                                        {sub.name}
                                      </label>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}

                {!loadingPermissions ? (
                  <div className="col-md-9 col-lg-9">
                    <div className="modal-content-box p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">{selectedItem?.name}</h5>
                        {activePath && (
                          <div className="active-path-badge bg-light text-dark p-2 rounded">
                            <i className="fas fa-link me-2"></i>
                            Current path: <strong>{activePath}</strong>
                          </div>
                        )}
                      </div>
                      {selectedItem ? (
                        <div className="feature-list d-flex flex-wrap gap-2">
                          {selectedItem.layouts
                            ?.flatMap((row) => row.widgets || [])
                            .map((layout, index) => {
                              const isChecked =
                                featureSelections[selectedItem.slug!]?.includes(
                                  layout.widgetID
                                ) || false;
                              const isActive =
                                activeFeature === layout.widgetID;

                              return (
                                <div
                                  key={index}
                                  className={`feature-item ${
                                    isActive ? "active-feature" : ""
                                  } ${isChecked ? "checked-feature" : ""}`}
                                >
                                  <input
                                    type="checkbox"
                                    className="feature-input"
                                    id={`feature-${index}`}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleFeatureSelection(
                                        selectedItem,
                                        layout.widgetID
                                      );
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <label
                                    htmlFor={`feature-${index}`}
                                    className="ms-2 feature-input"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleFeatureClick(
                                        layout.widgetID,
                                        layout
                                      );
                                    }}
                                  >
                                    {layout.componentName}
                                  </label>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <p className="text-center fw-bold text-decoration-underline">
                          Please select a menu item from the sidebar
                        </p>
                      )}

                      <div className="message-box mt-3">
                        {componentConfig && (
                          <div className="component-config mt-3 p-3 bg-light rounded">
                            <h6>
                              Component Configuration: {componentConfig.title}
                              <small className="text-muted ms-2">
                                ({activeLayoutItem?.widget})
                              </small>
                            </h6>

                            {activeLayoutItem?.widget === "Table" && (
                              <TableConfig
                                config={componentConfig}
                                onTableSettingChange={handleTableSettingChange}
                                onActionChange={handleActionChange}
                                onFieldSettingChange={handleFieldSettingChange}
                              />
                            )}

                            {activeLayoutItem?.widget === "Form-Table" && (
                              <FormTableConfig
                                config={componentConfig}
                                onTableSettingChange={handleTableSettingChange}
                                onActionChange={handleActionChange}
                                onFieldSettingChange={handleFieldSettingChange}
                              />
                            )}

                            {activeLayoutItem?.widget?.includes("Chart") &&
                              componentConfig?.chart_type && (
                                <ChartConfig
                                  config={componentConfig}
                                  onConfigChange={handleConfigChange}
                                />
                              )}
                            {activeLayoutItem?.widget?.includes("Form") && (
                              <DynamicFormConfig
                                config={componentConfig}
                                onConfigChange={handleConfigChange}
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {selectedItem ? (
                        <div className="d-flex justify-content-center mt-3">
                          <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={
                              loading ||
                              !checkedItems ||
                              Object.keys(checkedItems).length === 0
                            }
                          >
                            {loading ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanelModal;
