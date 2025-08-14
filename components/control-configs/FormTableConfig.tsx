import { Form } from "react-bootstrap";
import { ComponentConfig, Field } from "@/types/controlpanel";

interface FormTableConfigProps {
  config: ComponentConfig;
  onTableSettingChange: (section: string, key: string, value: unknown) => void;
  onActionChange: (action: string, key: string, value: boolean | string) => void;
  onFieldSettingChange: (fieldIndex: number, path: string, value: unknown) => void;
}

export const FormTableConfig = ({
  config,
  onTableSettingChange,
  onFieldSettingChange,
  onActionChange,
}: FormTableConfigProps) => {
  const handleTableSetting = (section: string, key: string, value: unknown) => {
    onTableSettingChange(section, key, value);
  };

  const handleActionSetting = (action: string, key: string, value: boolean | string) => {
    onActionChange(action, key, value);
  };

  const handleFieldChange = (
    rowIndex: number,
    fieldIndex: number,
    path: string,
    value: unknown
  ) => {
    if (!config.rows) return;
    const flatIndex = rowIndex * config.rows[rowIndex].fields.length + fieldIndex;
    onFieldSettingChange(flatIndex, path, value);
  };

  // Helper to safely access table settings
  const getTableSettings = () => {
    return {
      pagination: config.table_settings?.pagination ?? {
        default: false,
        page_size: 10,
        current_page: 1,
      },
      search: config.table_settings?.search ?? { default: false, name: "" },
      filters: config.table_settings?.filters ?? { default: false, name: "" },
      actions: config.table_settings?.actions ?? {},
      export: config.table_settings?.export ?? {},
      import: config.table_settings?.import ?? {},
    };
  };

  const tableSettings = getTableSettings();

  // console.log("config data in form",config);
  return (
    <div className="row">
      <div className="col-md-12">
        <div className="config-section mb-3">
          <h6>Table Settings</h6>

          {/* Pagination Settings */}
          <div className="mb-3 p-2 border rounded">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <strong>Pagination</strong>
              <Form.Check
                type="switch"
                checked={tableSettings.pagination.default}
                onChange={(e) =>
                  handleTableSetting("pagination", "default", e.target.checked)
                }
              />
            </div>
            {tableSettings.pagination.default && (
              <div className="ms-3">
                <Form.Label>Page Size</Form.Label>
                <Form.Control
                  type="number"
                  value={tableSettings.pagination.page_size}
                  onChange={(e) =>
                    handleTableSetting(
                      "pagination",
                      "page_size",
                      parseInt(e.target.value) || 10
                    )
                  }
                />
              </div>
            )}
          </div>

          {/* Search Settings */}
          <div className="mb-3 p-2 border rounded">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <strong>Search</strong>
              <Form.Check
                type="switch"
                checked={tableSettings.search.default}
                onChange={(e) =>
                  handleTableSetting("search", "default", e.target.checked)
                }
              />
            </div>
          </div>

          {/* Filters Settings */}
          <div className="mb-3 p-2 border rounded">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <strong>Filters</strong>
              <Form.Check
                type="switch"
                checked={tableSettings.filters.default}
                onChange={(e) =>
                  handleTableSetting("filters", "default", e.target.checked)
                }
              />
            </div>
          </div>

          {/* Actions Settings */}
          {Object.keys(tableSettings.actions).length > 0 && (
            <div className="mb-3 p-2 border rounded">
              <h6>Actions</h6>
              {Object.entries(tableSettings.actions).map(([actionKey, actionConfig]) => (
                <div
                  key={actionKey}
                  className="d-flex justify-content-between align-items-center mb-2"
                >
                  <div>
                    <Form.Label className="mb-0">
                      {typeof actionConfig === "object" ? actionConfig.name || actionKey : actionKey}
                    </Form.Label>
                  </div>
                  <Form.Check
                    type="switch"
                    checked={
                      typeof actionConfig === "object" ? Boolean(actionConfig.default) : Boolean(actionConfig)
                    }
                    onChange={(e) =>
                      handleActionSetting(actionKey, "default", e.target.checked)
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Export Settings */}
          {Object.keys(tableSettings.export).length > 0 && (
            <div className="mb-3 p-2 border rounded">
              <h6>Export</h6>
              {Object.entries(tableSettings.export).map(([exportKey, exportConfig]) => (
                <div
                  key={exportKey}
                  className="d-flex justify-content-between align-items-center mb-2"
                >
                  <div>
                    <Form.Label className="mb-0">
                      {typeof exportConfig === "object" ? exportConfig.name || exportKey : exportKey}
                    </Form.Label>
                  </div>
                  <Form.Check
                    type="switch"
                    checked={
                      typeof exportConfig === "object" ? Boolean(exportConfig.default) : Boolean(exportConfig)
                    }
                    onChange={(e) =>
                      handleTableSetting(
                        "export",
                        exportKey,
                        typeof exportConfig === "object"
                          ? { ...exportConfig, default: e.target.checked }
                          : e.target.checked
                      )
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Import Settings */}
          {tableSettings.import && Object.keys(tableSettings.import).length > 0 && (
            <div className="mb-3 p-2 border rounded">
              <h6>Import</h6>
              {Object.entries(tableSettings.import).map(([importKey, importConfig]) => (
                <div
                  key={importKey}
                  className="d-flex justify-content-between align-items-center mb-2"
                >
                  <div>
                    <Form.Label className="mb-0">
                      {typeof importConfig === "object" ? importConfig.name || importKey : importKey}
                    </Form.Label>
                  </div>
                  <Form.Check
                    type="switch"
                    checked={
                      typeof importConfig === "object" ? Boolean(importConfig.default) : Boolean(importConfig)
                    }
                    onChange={(e) =>
                      handleTableSetting(
                        "import",
                        importKey,
                        typeof importConfig === "object"
                          ? { ...importConfig, default: e.target.checked }
                          : e.target.checked
                      )
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {config.rows && (
        <div className="col-md-12">
          <div className="config-section mb-3">
            <h6>Form Fields Configuration</h6>
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Table View</th>
                    <th>Detailed View</th>
                    <th>Sortable</th>
                    <th>Filterable</th>
                    <th>Required</th>
                  </tr>
                </thead>
                <tbody>
                  {config.rows.map((row, rowIndex) =>
                    row.fields.map((field: Field, fieldIndex) => (
                      <tr key={`${rowIndex}-${fieldIndex}`}>
                        <td>
                          <Form.Control
                            size="sm"
                            value={field.label}
                            onChange={(e) =>
                              handleFieldChange(rowIndex, fieldIndex, "label", e.target.value)
                            }
                          />
                        </td>
                        <td className="text-center">
                          <Form.Check
                            checked={field.display_settings.table_view}
                            onChange={(e) =>
                              handleFieldChange(
                                rowIndex,
                                fieldIndex,
                                "display_settings.table_view",
                                e.target.checked
                              )
                            }
                          />
                        </td>
                        <td className="text-center">
                          <Form.Check
                            checked={field.display_settings.detailed_view}
                            onChange={(e) =>
                              handleFieldChange(
                                rowIndex,
                                fieldIndex,
                                "display_settings.detailed_view",
                                e.target.checked
                              )
                            }
                          />
                        </td>
                        <td className="text-center">
                          <Form.Check
                            checked={field.display_settings.sortable}
                            onChange={(e) =>
                              handleFieldChange(
                                rowIndex,
                                fieldIndex,
                                "display_settings.sortable",
                                e.target.checked
                              )
                            }
                          />
                        </td>
                        <td className="text-center">
                          <Form.Check
                            checked={field.display_settings.filterable}
                            onChange={(e) =>
                              handleFieldChange(
                                rowIndex,
                                fieldIndex,
                                "display_settings.filterable",
                                e.target.checked
                              )
                            }
                          />
                        </td>
                        <td className="text-center">
                          <Form.Check
                            checked={field.validations.required}
                            onChange={(e) =>
                              handleFieldChange(
                                rowIndex,
                                fieldIndex,
                                "validations.required",
                                e.target.checked
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};