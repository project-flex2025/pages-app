import { Form } from "react-bootstrap";
import { ComponentConfig } from "@/types/controlpanel";

interface DynamicFormConfigProps {
  config: ComponentConfig;
  onConfigChange: (path: string[], value: unknown) => void;
}

export const DynamicFormConfig = ({
  config,
  onConfigChange,
}: DynamicFormConfigProps) => {
  return (
    <div className="config-section mb-3">
      <h6>Form Settings</h6>

      <div className="row">
        <div className="col-md-6">
          <Form.Group className="mb-3">
            <Form.Label>Form Title</Form.Label>
            <Form.Control
              type="text"
              value={config.title || ""}
              onChange={(e) => onConfigChange(["title"], e.target.value)}
            />
          </Form.Group>
        </div>

        <div className="col-md-6">
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              type="text"
              value={config.description || ""}
              onChange={(e) => onConfigChange(["description"], e.target.value)}
            />
          </Form.Group>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <Form.Group className="mb-3">
            <Form.Label>Window Type</Form.Label>
            <Form.Select
              value={config.window_type || ""}
              onChange={(e) => onConfigChange(["window_type"], e.target.value)}
            >
              <option value="current-tab">Current Tab</option>
              <option value="new-tab">New Tab</option>
              <option value="modal">Modal</option>
            </Form.Select>
          </Form.Group>
        </div>
        <div className="col-md-6">
          <Form.Group className="mb-3">
            <Form.Label>Form Size</Form.Label>
            <Form.Select
              value={config.form_size || ""}
              onChange={(e) => onConfigChange(["form_size"], e.target.value)}
            >
              <option value="modal-sm">Small</option>
              <option value="modal-md">Medium</option>
              <option value="modal-lg">Large</option>
            </Form.Select>
          </Form.Group>
        </div>
      </div>
    </div>
  );
};
