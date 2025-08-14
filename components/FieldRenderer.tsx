import React from "react";
import { TableWidgetField } from "@/types/table";

interface FieldRendererProps {
  field: TableWidgetField;
  formData: Record<string, unknown>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  formData,
  onInputChange,
  onSelectChange,
}) => {
  const isRequired =
    field.validations?.required === true ||
    field.validations?.required === "true";

  // Helper functions to handle numeric validations
  const getNumberValue = (
    value: number | string | undefined
  ): number | undefined => {
    if (value === undefined) return undefined;
    return typeof value === "string" ? parseInt(value, 10) : value;
  };

  const getMinMaxProps = () => {
    if (field.type === "number") {
      return {
        min: getNumberValue(field.validations?.min),
        max: getNumberValue(field.validations?.max),
      };
    }
    return {
      minLength: getNumberValue(field.validations?.minLength),
      maxLength: getNumberValue(field.validations?.maxLength),
    };
  };

  const renderSelectField = () => (
    <div className="mb-3" key={field.record_label}>
      <label htmlFor={field.record_label} className="form-label">
        {field.label}
        {isRequired && <span className="text-danger">*</span>}
      </label>
      <select
        className="form-select"
        id={field.record_label}
        name={field.record_label}
        value={
          (formData[field.record_label] as string) || field.default_value || ""
        }
        onChange={onSelectChange}
        required={isRequired}
        multiple={field.multiple}
      >
        {!field.default_value && <option value="">Select an option</option>}
        {field.options?.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {field.note && <small className="text-muted">{field.note}</small>}
    </div>
  );

  const renderInputField = () => {
    const { minLength, maxLength, ...minMaxProps } = getMinMaxProps();

    return (
      <div className="mb-3" key={field.record_label}>
        <label htmlFor={field.record_label} className="form-label">
          {field.label}
          {isRequired && <span className="text-danger">*</span>}
        </label>
        <input
          type={field.type}
          className="form-control"
          id={field.record_label}
          name={field.record_label}
          value={(formData[field.record_label] as string) || ""}
          onChange={onInputChange}
          placeholder={field.placeholder}
          required={isRequired}
          pattern={field.validations?.pattern}
          minLength={minLength}
          maxLength={maxLength}
          {...minMaxProps}
        />
        {field.note && <small className="text-muted">{field.note}</small>}
      </div>
    );
  };

  switch (field.type) {
    case "select":
      return renderSelectField();
    case "email":
    case "tel":
    case "text":
    case "number":
    case "date":
    case "password":
    default:
      return renderInputField();
  }
};

export default FieldRenderer;
