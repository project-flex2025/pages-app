import React from "react";
import { TemplateFormProps } from "..";
import { FormStep } from "@/types/forms";
import { FieldOption } from "@/types/table";

// type FormFieldValue = string | number | boolean | null;

type FormFieldValue = string | number | boolean | null | string[] | Date | File;

export type FormDataType = {
  [step: number]: {
    [row: number]: {
      [recordLabel: string]: FormFieldValue;
    };
  };
};

const Template1Form: React.FC<
  TemplateFormProps & { formData: FormDataType }
> = ({
  widgetData,
  currentStep,
  loading,
  error,
  onInputChange,
  onNext,
  onPrevious,
  onSubmit,
  setCurrentStep,
  formData,
}) => {
  // Safely get steps with fallback to empty array
  const isMultiStep = widgetData?.config?.multi_step === "true";

  const steps = isMultiStep
    ? widgetData?.config?.steps || widgetData?.config?.rows || []
    : widgetData?.config?.rows || [];

  // Get current step data - for multi-step or all fields for single form
  const currentStepData = isMultiStep ? steps[currentStep - 1] : null;

  const allFields = !isMultiStep
    ? steps.flatMap((step) => ("fields" in step && step.fields) || [])
    : [];

  // console.log("configuration data.....0123456", widgetData?.config);

  return (
    <div className="container template1-container">
      <div className="row justify-content-center">
        <div className="card custom-card template1-card">
          <h5 className="text-center">{widgetData?.config?.title}</h5>

          {/* Stepper - Only show for multi-step forms */}
          {isMultiStep && steps.length > 0 && (
            <div className="template1-stepper-container">
              {/* Background Bar */}
              <div className="template1-stepper-bar" />

              {steps.map((step, index) => {
                const stepPosition = (index / (steps.length - 1)) * 100;
                const isVisited = index < currentStep - 1;
                const isCurrent = index === currentStep - 1;

                return (
                  <div
                    key={index}
                    className="template1-step-container"
                    style={{ left: `${stepPosition}%` }}
                    onClick={() => setCurrentStep(index + 1)}
                  >
                    <div
                      className={`template1-step-dot ${
                        isVisited ? "template1-step-dot-visited" : ""
                      } ${isCurrent ? "template1-step-dot-current" : ""}`}
                    >
                      {/* Visited (solid blue with white center) */}
                      {isVisited && (
                        <div className="template1-step-inner-dot" />
                      )}

                      {/* Current (blue ring with white center) */}
                      {isCurrent && (
                        <div className="template1-step-dot-current">
                          <div className="template1-step-inner-dot template1-step-inner-dot-current" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Step Labels */}
              {steps.map((step, index) => {
                const stepPosition = (index / (steps.length - 1)) * 100;
                const isActive = index + 1 === currentStep;
                return (
                  <div
                    key={index}
                    className={`template1-step-label ${
                      isActive ? "template1-step-label-active" : ""
                    }`}
                    style={{ left: `${stepPosition}%` }}
                  >
                    {("title" in step ? step.title : undefined) ||
                      `Step ${index + 1}`}
                  </div>
                );
              })}
            </div>
          )}

          {/* Form Content */}
          <div
            className={`p-4 rounded template1-form-content ${
              isMultiStep ? "" : "mt-3"
            }`}
          >
            {isMultiStep && currentStepData && (
              <h4 className="text-center text-primary">
                {"description" in currentStepData
                  ? currentStepData.description
                  : ""}
              </h4>
            )}

            {/* Multi-step form fields */}

            {isMultiStep &&
              currentStepData &&
              (currentStepData as FormStep).rows?.map((row, rowIndex) => (
                <div key={row.row_number || rowIndex} className="row mb-3">
                  {row.fields?.map((field) => {
                    const value =
                      formData?.[currentStep]?.[rowIndex]?.[
                        field.record_label
                      ] ??
                      field.default_value ??
                      "";

                    const handleChange = (
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLTextAreaElement
                        | HTMLSelectElement
                      >,
                      key: string = field.record_label
                    ) => {
                      const inputValue =
                        field.type === "checkbox"
                          ? e.currentTarget instanceof HTMLInputElement
                            ? e.currentTarget.checked
                            : false
                          : field.type === "file"
                          ? e.currentTarget instanceof HTMLInputElement
                            ? e.currentTarget.files?.[0] ?? ""
                            : ""
                          : e.currentTarget.value;

                      onInputChange(
                        currentStep,
                        rowIndex,
                        key,
                        String(inputValue)
                      );
                    };

                    // console.log("field type", field.type);

                    return (
                      <div key={field.label} className="col-md-6 mb-3">
                        <label className="form-label">{field.label}</label>

                        {(() => {
                          switch (field.type) {
                            case "textarea":
                              return (
                                <textarea
                                  className="form-control"
                                  placeholder={field.placeholder}
                                  value={
                                    typeof value === "string" ||
                                    typeof value === "number"
                                      ? value
                                      : ""
                                  }
                                  required={
                                    field.validations?.required === "true"
                                  }
                                  onChange={handleChange}
                                />
                              );

                            case "select":
                              return (
                                <select
                                  className="form-select"
                                  value={
                                    typeof value === "string" ||
                                    typeof value === "number"
                                      ? value
                                      : ""
                                  }
                                  required={
                                    field.validations?.required === "true"
                                  }
                                  onChange={handleChange}
                                >
                                  <option value="">Select {field.label}</option>
                                  {(field.options || []).map(
                                    (opt: FieldOption, idx: number) => (
                                      <option key={idx} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    )
                                  )}
                                </select>
                              );

                            case "checkbox":
                              return (
                                <div className="form-check">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id={`check-${field.record_label}`}
                                    checked={!!value}
                                    onChange={handleChange}
                                  />
                                  <label
                                    className="form-check-label"
                                    htmlFor={`check-${field.record_label}`}
                                  >
                                    {field.placeholder || field.label}
                                  </label>
                                </div>
                              );

                            case "radio":
                              return (
                                <div>
                                  {(field.options || []).map(
                                    (opt: FieldOption, idx: number) => (
                                      <div className="form-check" key={idx}>
                                        <input
                                          className="form-check-input"
                                          type="radio"
                                          name={`${field.record_label}-${rowIndex}`}
                                          value={opt.value}
                                          checked={value === opt.value}
                                          onChange={handleChange}
                                          id={`radio-${field.record_label}-${idx}`}
                                        />
                                        <label
                                          className="form-check-label"
                                          htmlFor={`radio-${field.record_label}-${idx}`}
                                        >
                                          {opt.label}
                                        </label>
                                      </div>
                                    )
                                  )}
                                </div>
                              );

                            case "file":
                              return (
                                <input
                                  type="file"
                                  className="form-control"
                                  onChange={handleChange}
                                />
                              );

                            case "date_picker":
                            case "date":
                              return (
                                <input
                                  type="date"
                                  className="form-control"
                                  value={
                                    typeof value === "string" ||
                                    typeof value === "number"
                                      ? value
                                      : ""
                                  }
                                  required={
                                    field.validations?.required === "true"
                                  }
                                  onChange={handleChange}
                                />
                              );

                            case "time_picker":
                            case "time":
                              return (
                                <input
                                  type="time"
                                  className="form-control"
                                  value={
                                    typeof value === "string" ||
                                    typeof value === "number"
                                      ? value
                                      : ""
                                  }
                                  required={
                                    field.validations?.required === "true"
                                  }
                                  onChange={handleChange}
                                />
                              );

                            case "date_range_picker":
                              const startKey = `${field.record_label}_start`;
                              const endKey = `${field.record_label}_end`;
                              const startValue =
                                formData?.[currentStep]?.[rowIndex]?.[
                                  startKey
                                ] ?? "";
                              const endValue =
                                formData?.[currentStep]?.[rowIndex]?.[endKey] ??
                                "";

                              return (
                                <div className="d-flex gap-2">
                                  <input
                                    type="date"
                                    className="form-control"
                                    value={
                                      typeof startValue === "string" ||
                                      typeof startValue === "number"
                                        ? startValue
                                        : ""
                                    }
                                    onChange={(e) => handleChange(e, startKey)}
                                    required={
                                      field.validations?.required === "true"
                                    }
                                    placeholder="Start Date"
                                  />
                                  <input
                                    type="date"
                                    className="form-control"
                                    value={
                                      typeof endValue === "string" ||
                                      typeof endValue === "number"
                                        ? endValue
                                        : ""
                                    }
                                    onChange={(e) => handleChange(e, endKey)}
                                    required={
                                      field.validations?.required === "true"
                                    }
                                    placeholder="End Date"
                                  />
                                </div>
                              );

                            case "datetime-local":
                              return (
                                <input
                                  type="datetime-local"
                                  className="form-control"
                                  value={
                                    typeof value === "string" ||
                                    typeof value === "number"
                                      ? value
                                      : ""
                                  }
                                  onChange={handleChange}
                                  required={
                                    field.validations?.required === "true"
                                  }
                                />
                              );

                            case "email":
                            case "number":
                            case "password":
                            case "text":
                            default:
                              return (
                                <input
                                  type={field.type}
                                  className="form-control"
                                  placeholder={field.placeholder}
                                  value={
                                    typeof value === "string" ||
                                    typeof value === "number"
                                      ? value
                                      : ""
                                  }
                                  required={
                                    field.validations?.required === "true"
                                  }
                                  onChange={handleChange}
                                />
                              );
                          }
                        })()}

                        {field.note && (
                          <small className="text-muted">{field.note}</small>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

            {/* Single form fields (all fields at once) */}
            {!isMultiStep && allFields.length > 0 && (
              <div className="row">
                {allFields.map((field) => {
                  const value =
                    formData?.[1]?.[0]?.[field.record_label] ??
                    field.default_value ??
                    "";

                  const handleChange = (
                    e: React.ChangeEvent<
                      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
                    >,
                    key: string = field.record_label
                  ) => {
                    const inputValue =
                      field.type === "checkbox"
                        ? e.currentTarget instanceof HTMLInputElement
                          ? e.currentTarget.checked
                          : false
                        : field.type === "file"
                        ? e.currentTarget instanceof HTMLInputElement
                          ? e.currentTarget.files?.[0] ?? ""
                          : ""
                        : e.currentTarget.value;

                    onInputChange(1, 0, key, String(inputValue));
                  };

                  return (
                    <div key={field.label} className="col-md-6 mb-3">
                      <label className="form-label">{field.label}</label>

                      {(() => {
                        switch (field.type) {
                          case "textarea":
                            return (
                              <textarea
                                className="form-control"
                                placeholder={field.placeholder}
                                value={
                                  typeof value === "string" ||
                                  typeof value === "number"
                                    ? value
                                    : ""
                                }
                                required={
                                  field.validations?.required === "true"
                                }
                                onChange={handleChange}
                              />
                            );

                          case "select":
                            return (
                              <select
                                className="form-select"
                                value={
                                  typeof value === "string" ||
                                  typeof value === "number"
                                    ? value
                                    : ""
                                }
                                required={
                                  field.validations?.required === "true"
                                }
                                onChange={handleChange}
                              >
                                <option value="">Select {field.label}</option>
                                {(field?.options || []).map(
                                  (opt: FieldOption, idx: number) => (
                                    <option key={idx} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  )
                                )}
                              </select>
                            );

                          case "checkbox":
                            return (
                              <div className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id={`check-${field.record_label}`}
                                  checked={!!value}
                                  onChange={handleChange}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor={`check-${field.record_label}`}
                                >
                                  {field.placeholder || field.label}
                                </label>
                              </div>
                            );

                          case "radio":
                            return (
                              <div>
                                {(field?.options || []).map(
                                  (opt: FieldOption, idx: number) => (
                                    <div className="form-check" key={idx}>
                                      <input
                                        className="form-check-input"
                                        type="radio"
                                        name={field.record_label}
                                        value={opt.value}
                                        checked={value === opt.value}
                                        onChange={handleChange}
                                        id={`radio-${field.record_label}-${idx}`}
                                      />
                                      <label
                                        className="form-check-label"
                                        htmlFor={`radio-${field.record_label}-${idx}`}
                                      >
                                        {opt.label}
                                      </label>
                                    </div>
                                  )
                                )}
                              </div>
                            );

                          case "file":
                            return (
                              <input
                                type="file"
                                className="form-control"
                                onChange={handleChange}
                              />
                            );

                          case "date_picker":
                          case "date":
                            return (
                              <input
                                type="date"
                                className="form-control"
                                value={
                                  typeof value === "string" ||
                                  typeof value === "number"
                                    ? value
                                    : ""
                                }
                                required={
                                  field.validations?.required === "true"
                                }
                                onChange={handleChange}
                              />
                            );

                          case "time_picker":
                          case "time":
                            return (
                              <input
                                type="time"
                                className="form-control"
                                value={
                                  typeof value === "string" ||
                                  typeof value === "number"
                                    ? value
                                    : ""
                                }
                                required={
                                  field.validations?.required === "true"
                                }
                                onChange={handleChange}
                              />
                            );

                          case "date_range_picker":
                            const startKey = `${field.record_label}_start`;
                            const endKey = `${field.record_label}_end`;
                            const startValue =
                              formData?.[1]?.[0]?.[startKey] ?? "";
                            const endValue = formData?.[1]?.[0]?.[endKey] ?? "";

                            return (
                              <div className="d-flex gap-2">
                                <input
                                  type="date"
                                  className="form-control"
                                  value={
                                    typeof startValue === "string" ||
                                    typeof startValue === "number"
                                      ? startValue
                                      : ""
                                  }
                                  onChange={(e) => handleChange(e, startKey)}
                                  required={
                                    field.validations?.required === "true"
                                  }
                                  placeholder="Start Date"
                                />
                                <input
                                  type="date"
                                  className="form-control"
                                  value={
                                    typeof endValue === "string" ||
                                    typeof endValue === "number"
                                      ? endValue
                                      : ""
                                  }
                                  onChange={(e) => handleChange(e, endKey)}
                                  required={
                                    field.validations?.required === "true"
                                  }
                                  placeholder="End Date"
                                />
                              </div>
                            );

                          case "datetime-local":
                            return (
                              <input
                                type="datetime-local"
                                className="form-control"
                                value={
                                  typeof value === "string" ||
                                  typeof value === "number"
                                    ? value
                                    : ""
                                }
                                onChange={handleChange}
                              />
                            );

                          case "email":
                          case "number":
                          case "password":
                          case "text":
                          default:
                            return (
                              <input
                                type={field.type}
                                className="form-control"
                                placeholder={field.placeholder}
                                value={
                                  typeof value === "string" ||
                                  typeof value === "number"
                                    ? value
                                    : ""
                                }
                                required={
                                  field.validations?.required === "true"
                                }
                                onChange={handleChange}
                              />
                            );
                        }
                      })()}

                      {field.note && (
                        <small className="text-muted">{field.note}</small>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between mt-4">
            {isMultiStep && currentStep > 1 && (
              <button className="btn btn-secondary" onClick={onPrevious}>
                Previous
              </button>
            )}

            {isMultiStep && currentStep < steps.length ? (
              <button className="btn btn-primary ms-auto" onClick={onNext}>
                Next
              </button>
            ) : (
              <button
                className="btn btn-success ms-auto"
                onClick={onSubmit}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            )}
          </div>

          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default Template1Form;
