import React from "react";
import { TemplateFormProps } from "..";
import { FormStep } from "@/types/forms";

const Template4Form: React.FC<TemplateFormProps> = ({
  widgetData,
  currentStep,
  loading,
  error,
  onInputChange,
  onNext,
  onPrevious,
  onSubmit,
  setCurrentStep,
}) => {
  const getFieldId = (
    stepIndex: number,
    rowIndex: number,
    fieldLabel: string
  ) => {
    return `field-${stepIndex}-${rowIndex}-${fieldLabel
      .replace(/\s+/g, "-")
      .toLowerCase()}`;
  };

  const isMultiStep = widgetData?.config?.multi_step === "true";
  const steps = isMultiStep
    ? widgetData?.config?.steps || widgetData?.config?.rows || []
    : widgetData?.config?.rows || [];

  const currentStepData = isMultiStep ? steps[currentStep - 1] : null;
  const allFields = !isMultiStep
    ? steps.flatMap((step) => ("fields" in step && step.fields) || [])
    : [];

  return (
    <div className="container-fluid">
      <div className="row">
        {isMultiStep && (
          <div className="col-md-3 col-lg-2">
            <div className="sticky-top pt-4">
              <h5 className="mb-4 ps-3">{widgetData?.config?.title}</h5>
              <div className="v-stepper">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`stepper-item ${
                      currentStep > index + 1 ? "completed" : ""
                    } ${currentStep === index + 1 ? "active" : ""}`}
                    onClick={() => setCurrentStep(index + 1)}
                  >
                    <div className="step-counter">
                      {currentStep > index + 1 ? (
                        <i className="bi bi-check"></i>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div className="step-name">
                      {"title" in step ? step.title : `Step ${index + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div
          className={isMultiStep ? "col-md-9 col-lg-10 py-4" : "col-12 py-4"}
        >
          <div className="card border-0 shadow-none">
            <div className="card-body p-lg-5">
              {isMultiStep && currentStepData && (
                <>
                  <h4 className="mb-4 ps-3">{widgetData?.config?.title}</h4>
                  <p className="text-muted mb-4">
                    {"description" in currentStepData
                      ? currentStepData.description
                      : ""}
                  </p>
                </>
              )}

              <div className="row g-4">
                {isMultiStep &&
                  (currentStepData as FormStep).rows?.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                      {row?.fields?.map((field) => (
                        <div
                          key={field.label}
                          className={
                            field.type === "textarea" ? "col-12" : "col-md-6"
                          }
                        >
                          <div className="form-floating mb-3">
                            {field.type === "textarea" ? (
                              <>
                                <textarea
                                  className="form-control"
                                  id={getFieldId(
                                    currentStep,
                                    rowIndex,
                                    field.label
                                  )}
                                  placeholder={field.placeholder}
                                  defaultValue={field.default_value}
                                  required={
                                    field.validations?.required === "true"
                                  }
                                  onChange={(e) =>
                                    onInputChange(
                                      currentStep,
                                      rowIndex,
                                      field.record_label,
                                      e.target.value
                                    )
                                  }
                                  style={{ height: "120px" }}
                                />
                                <label
                                  htmlFor={getFieldId(
                                    currentStep,
                                    rowIndex,
                                    field.label
                                  )}
                                >
                                  {field.label}
                                </label>
                              </>
                            ) : (
                              <>
                                <input
                                  type={field.type}
                                  className="form-control"
                                  id={getFieldId(
                                    currentStep,
                                    rowIndex,
                                    field.label
                                  )}
                                  placeholder={field.placeholder}
                                  defaultValue={field.default_value}
                                  required={
                                    field.validations?.required === "true"
                                  }
                                  onChange={(e) =>
                                    onInputChange(
                                      currentStep,
                                      rowIndex,
                                      field.record_label,
                                      e.target.value
                                    )
                                  }
                                />
                                <label
                                  htmlFor={getFieldId(
                                    currentStep,
                                    rowIndex,
                                    field.label
                                  )}
                                >
                                  {field.label}
                                </label>
                              </>
                            )}
                            {field.note && (
                              <div className="form-text text-muted mt-1">
                                <i className="bi bi-info-circle me-1"></i>
                                {field.note}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}

                {/* Single-step mode form */}
                {!isMultiStep && (
                  <h4 className="mb-4 ps-3">{widgetData?.config?.title}</h4>
                )}

                {!isMultiStep &&
                  allFields.map((field, fieldIndex) => (
                    <div
                      key={field.label}
                      className={
                        field.type === "textarea" ? "col-12" : "col-md-6"
                      }
                    >
                      <div className="form-floating mb-3">
                        {field.type === "textarea" ? (
                          <>
                            <textarea
                              className="form-control"
                              id={`field-1-${fieldIndex}-${field.label}`}
                              placeholder={field.placeholder}
                              defaultValue={field.default_value}
                              required={field.validations?.required === "true"}
                              onChange={(e) =>
                                onInputChange(1, 0, field.label, e.target.value)
                              }
                              style={{ height: "120px" }}
                            />
                            <label
                              htmlFor={`field-1-${fieldIndex}-${field.label}`}
                            >
                              {field.label}
                            </label>
                          </>
                        ) : (
                          <>
                            <input
                              type={field.type}
                              className="form-control"
                              id={`field-1-${fieldIndex}-${field.label}`}
                              placeholder={field.placeholder}
                              defaultValue={field.default_value}
                              required={field.validations?.required === "true"}
                              onChange={(e) =>
                                onInputChange(1, 0, field.label, e.target.value)
                              }
                            />
                            <label
                              htmlFor={`field-1-${fieldIndex}-${field.label}`}
                            >
                              {field.label}
                            </label>
                          </>
                        )}
                        {field.note && (
                          <div className="form-text text-muted mt-1">
                            <i className="bi bi-info-circle me-1"></i>
                            {field.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Navigation Buttons */}
              <div className="d-flex justify-content-between mt-5 pt-3 border-top">
                <div>
                  {isMultiStep && currentStep > 1 && (
                    <button
                      className="btn btn-outline-secondary"
                      onClick={onPrevious}
                    >
                      <i className="bi bi-chevron-left me-2"></i>
                      Back
                    </button>
                  )}
                </div>
                <div>
                  {isMultiStep && currentStep < steps.length ? (
                    <button className="btn btn-primary px-4" onClick={onNext}>
                      Continue
                      <i className="bi bi-chevron-right ms-2"></i>
                    </button>
                  ) : (
                    <button
                      className="btn btn-success px-4"
                      onClick={onSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></span>
                          Finalizing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send-check me-2"></i>
                          Submit
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="alert alert-danger mt-4">
                  <i className="bi bi-exclamation-octagon-fill me-2"></i>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .v-stepper {
          position: relative;
          padding-left: 30px;
        }
        .stepper-item {
          position: relative;
          padding-bottom: 24px;
          cursor: pointer;
        }
        .stepper-item.completed .step-counter {
          background-color: var(--bs-success);
          color: white;
        }
        .stepper-item.active .step-counter {
          background-color: var(--bs-primary);
          color: white;
        }
        .stepper-item:not(.active):not(.completed) .step-counter {
          background-color: #e9ecef;
          color: #6c757d;
        }
        .stepper-item:not(:last-child)::after {
          content: "";
          position: absolute;
          left: 15px;
          top: 30px;
          height: calc(100% - 30px);
          width: 2px;
          background-color: #e9ecef;
        }
        .stepper-item.completed:not(:last-child)::after {
          background-color: var(--bs-success);
        }
        .step-counter {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          left: -30px;
          top: 0;
        }
        .step-name {
          padding-left: 10px;
          font-weight: 500;
          color: var(--bs-body-color);
        }
        .stepper-item.active .step-name,
        .stepper-item.completed .step-name {
          font-weight: 600;
          color: var(--bs-dark);
        }
      `}</style>
    </div>
  );
};

export default Template4Form;
