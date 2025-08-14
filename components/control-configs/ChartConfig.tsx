import { Form } from "react-bootstrap";
import { ComponentConfig } from "@/types/controlpanel";

interface ChartConfigProps {
  config: ComponentConfig;
  onConfigChange: (path: string[], value: unknown) => void;
}

export const ChartConfig = ({ config, onConfigChange }: ChartConfigProps) => {

  return (
    <div className="config-section mb-3">
      <h6>Chart Settings</h6>
      <div className="row">
        <div className="col-md-6">
          <Form.Group className="mb-3">
            <Form.Label>Chart Title</Form.Label>
            <Form.Control
              type="text"
              value={config.title || ""}
              onChange={(e) => onConfigChange(["title"], e.target.value)}
            />
          </Form.Group>
        </div>
        <div className="col-md-6">
          <Form.Group className="mb-3">
            <Form.Label>Chart Type</Form.Label>
            <Form.Control
              type="text"
              value={config.chart_type || ""}
              disabled
            />
          </Form.Group>
        </div>
      </div>


      {config.chart_type === "piechart" && (
        <>
         
        </>
      )}

      {config.chart_type === "barchart" && (
        <>
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>X-Axis Label</Form.Label>
                <Form.Control
                  type="text"
                  value={config.xAxisLabel || ""}
                  onChange={(e) =>
                    onConfigChange(["xAxisLabel"], e.target.value)
                  }
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Y-Axis Label</Form.Label>
                <Form.Control
                  type="text"
                  value={config.yAxisLabel || ""}
                  onChange={(e) =>
                    onConfigChange(["yAxisLabel"], e.target.value)
                  }
                />
              </Form.Group>
            </div>
          </div>
        </>
      )}

      {config.chart_type === "linechart" && (
        <>
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>X-Axis Label</Form.Label>
                <Form.Control
                  type="text"
                  value={config.xAxisLabel || ""}
                  onChange={(e) =>
                    onConfigChange(["xAxisLabel"], e.target.value)
                  }
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Y-Axis Label</Form.Label>
                <Form.Control
                  type="text"
                  value={config.yAxisLabel || ""}
                  onChange={(e) =>
                    onConfigChange(["yAxisLabel"], e.target.value)
                  }
                />
              </Form.Group>
            </div>
          </div>

        </>
      )}
    </div>
  );
};