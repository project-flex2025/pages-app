// import React from "react";
// import { TemplateFormProps } from "../index";
// import { Field } from "@/types/tempforms";

// const Template3Form: React.FC<TemplateFormProps> = ({
//   widgetData,
//   currentStep,
//   loading,
//   error,
//   onInputChange,
//   onNext,
//   onPrevious,
//   onSubmit,
//   setCurrentStep,
// }) => {
//   // Safe access to steps with fallback
//   const steps = widgetData?.config?.steps || [];
//   const currentStepData = steps[currentStep - 1];
//   const totalSteps = steps.length;

//   // Helper function to safely generate field IDs
//   const getFieldId = (
//     stepIndex: number,
//     rowIndex: number,
//     fieldLabel: string
//   ) => {
//     return `field-${stepIndex}-${rowIndex}-${fieldLabel
//       .replace(/\s+/g, "-")
//       .toLowerCase()}`;
//   };

//   // Helper function to check if field is required
//   const isFieldRequired = (required: boolean | string | undefined): boolean => {
//     if (typeof required === "boolean") return required;
//     if (typeof required === "string") return required.toLowerCase() === "true";
//     return false;
//   };

//   // Early return if no steps are defined
//   if (steps.length === 0) {
//     return (
//       <div className="container">
//         <div className="alert alert-danger">
//           No form steps are configured for this widget.
//         </div>
//       </div>
//     );
//   }

//   // Early return if current step data is missing
//   if (!currentStepData) {
//     return (
//       <div className="container">
//         <div className="alert alert-danger">
//           Invalid step configuration. Step {currentStep} does not exist.
//         </div>
//       </div>
//     );
//   }

//   const handleStepClick = (stepIndex: number) => {
//     // Only allow navigating to completed steps
//     const completedSteps = steps
//       .slice(0, stepIndex)
//       .filter((step) =>
//         step.rows?.every((row) =>
//           row?.fields?.every((field) => field.default_value)
//         )
//       );

//     if (completedSteps.length === stepIndex) {
//       setCurrentStep(stepIndex + 1);
//     }
//   };

//   return (
//     <div className="container">
//       <div className="row justify-content-center">
//         <div className="col-lg-8">
//           {/* Header with Progress */}
//           <div className="text-center mb-5">
//             <h2 className="fw-bold text-primary">
//               {widgetData?.config?.title || "Untitled Form"}
//             </h2>
//             <div className="d-flex justify-content-between align-items-center mt-4">
//               {steps.map((step, index) => (
//                 <React.Fragment key={`step-${index}`}>
//                   <div
//                     className={`d-flex flex-column align-items-center ${
//                       index <= currentStep - 1 ? "active-step" : ""
//                     }`}
//                     style={{
//                       cursor: index < currentStep ? "pointer" : "default",
//                     }}
//                     onClick={() =>
//                       index < currentStep && handleStepClick(index)
//                     }
//                   >
//                     <div
//                       className={`rounded-circle ${
//                         index < currentStep - 1
//                           ? "bg-success"
//                           : index === currentStep - 1
//                           ? "bg-primary"
//                           : "bg-light border"
//                       } text-white d-flex align-items-center justify-content-center`}
//                       style={{
//                         width: "40px",
//                         height: "40px",
//                         color: index >= currentStep - 1 ? "var(--bs-dark)" : "",
//                       }}
//                     >
//                       {index < currentStep - 1 ? (
//                         <i className="bi bi-check"></i>
//                       ) : (
//                         <span>{index + 1}</span>
//                       )}
//                     </div>
//                     <span className="mt-2 fw-medium">
//                       {step.title || `Step ${index + 1}`}
//                     </span>
//                   </div>
//                   {index < totalSteps - 1 && (
//                     <div
//                       className="flex-grow-1 mx-2"
//                       style={{ height: "2px", backgroundColor: "#dee2e6" }}
//                     >
//                       <div
//                         className="h-100 bg-primary"
//                         style={{
//                           width: index < currentStep - 1 ? "100%" : "0%",
//                           transition: "width 0.3s ease",
//                         }}
//                       ></div>
//                     </div>
//                   )}
//                 </React.Fragment>
//               ))}
//             </div>
//           </div>

//           {/* Current Step Card */}
//           <div className="card shadow-sm border-0 mb-4">
//             <div className="card-body p-4">
//               {currentStepData.description && (
//                 <h4 className="card-title text-center mb-4">
//                   {currentStepData.description}
//                 </h4>
//               )}

//               <div className="row g-3">
//                 {currentStepData.rows?.map((row, rowIndex) => (
//                   <React.Fragment key={`row-${row.row_number}`}>
//                     {row?.fields?.map((field: Field) => (
//                       <div key={`field-${field.label}`} className="col-md-6">
//                         <div className="form-floating mb-3">
//                           <input
//                             type={field.type || "text"}
//                             className={`form-control ${
//                               isFieldRequired(field.validations?.required)
//                                 ? "required-field"
//                                 : ""
//                             }`}
//                             id={getFieldId(currentStep, rowIndex, field.label)}
//                             placeholder={field.placeholder || field.label}
//                             defaultValue={field.default_value || ""}
//                             required={isFieldRequired(
//                               field.validations?.required
//                             )}
//                             onChange={(e) =>
//                               onInputChange(
//                                 currentStep,
//                                 rowIndex,
//                                 field.label,
//                                 e.target.value
//                               )
//                             }
//                           />
//                           <label
//                             htmlFor={getFieldId(
//                               currentStep,
//                               rowIndex,
//                               field.label
//                             )}
//                           >
//                             {field.label}
//                             {isFieldRequired(field.validations?.required) && (
//                               <span className="text-danger"> *</span>
//                             )}
//                           </label>
//                           {field.note && (
//                             <div className="form-text text-muted mt-1 small">
//                               <i className="bi bi-info-circle me-1"></i>
//                               {field.note}
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </React.Fragment>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Navigation Buttons */}
//           <div className="d-flex justify-content-between">
//             <div>
//               {currentStep > 1 && (
//                 <button
//                   className="btn btn-outline-primary"
//                   onClick={onPrevious}
//                   disabled={loading}
//                 >
//                   <i className="bi bi-arrow-left me-2"></i>
//                   Previous
//                 </button>
//               )}
//             </div>
//             <div>
//               {currentStep < totalSteps ? (
//                 <button
//                   className="btn btn-primary"
//                   onClick={onNext}
//                   disabled={loading}
//                 >
//                   Next
//                   <i className="bi bi-arrow-right ms-2"></i>
//                 </button>
//               ) : (
//                 <button
//                   className="btn btn-success"
//                   onClick={onSubmit}
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <>
//                       <span
//                         className="spinner-border spinner-border-sm me-2"
//                         role="status"
//                       ></span>
//                       Processing...
//                     </>
//                   ) : (
//                     <>
//                       <i className="bi bi-check-circle me-2"></i>
//                       Submit
//                     </>
//                   )}
//                 </button>
//               )}
//             </div>
//           </div>

//           {error && (
//             <div className="alert alert-danger mt-4">
//               <i className="bi bi-exclamation-triangle-fill me-2"></i>
//               {error}
//             </div>
//           )}
//         </div>
//       </div>

//       <style jsx>{`
//         .active-step span {
//           color: var(--bs-primary);
//           font-weight: 600;
//         }
//         .required-field {
//           border-left: 3px solid var(--bs-danger);
//         }
//         .bg-light.border {
//           border: 1px solid var(--bs-gray-400) !important;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Template3Form;

import React from "react";
import { TemplateFormProps } from "../index";
import { Field } from "@/types/forms";

const Template3Form: React.FC<TemplateFormProps> = ({
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
  const isMultiStep = widgetData?.config?.multi_step === "true";
  const steps = widgetData?.config?.steps || [];
  const rows = widgetData?.config?.rows || [];
  const totalSteps = isMultiStep ? steps.length : 1;

  const currentStepData = isMultiStep ? steps[currentStep - 1] : { rows };

  const getFieldId = (
    stepIndex: number,
    rowIndex: number,
    fieldLabel: string
  ) => {
    return `field-${stepIndex}-${rowIndex}-${fieldLabel
      .replace(/\s+/g, "-")
      .toLowerCase()}`;
  };

  const isFieldRequired = (required: boolean | string | undefined): boolean => {
    if (typeof required === "boolean") return required;
    if (typeof required === "string") return required.toLowerCase() === "true";
    return false;
  };

  const handleStepClick = (stepIndex: number) => {
    const completedSteps = steps
      .slice(0, stepIndex)
      .filter((step) =>
        step.rows?.every((row) =>
          row?.fields?.every((field) => field.default_value)
        )
      );

    if (completedSteps.length === stepIndex) {
      setCurrentStep?.(stepIndex + 1);
    }
  };

  if (
    (isMultiStep && steps.length === 0) ||
    (!isMultiStep && rows.length === 0)
  ) {
    return (
      <div className="container">
        <div className="alert alert-danger">
          No form configuration found for this widget.
        </div>
      </div>
    );
  }

  if (!currentStepData) {
    return (
      <div className="container">
        <div className="alert alert-danger">
          Invalid step configuration. Step {currentStep} does not exist.
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Header */}
          <div className="text-center mb-5">
            <h2 className="fw-bold text-primary">
              {widgetData?.config?.title || "Untitled Form"}
            </h2>

            {isMultiStep && (
              <div className="d-flex justify-content-between align-items-center mt-4">
                {steps.map((step, index) => (
                  <React.Fragment key={`step-${index}`}>
                    <div
                      className={`d-flex flex-column align-items-center ${
                        index <= currentStep - 1 ? "active-step" : ""
                      }`}
                      style={{
                        cursor: index < currentStep ? "pointer" : "default",
                      }}
                      onClick={() =>
                        index < currentStep && handleStepClick(index)
                      }
                    >
                      <div
                        className={`rounded-circle ${
                          index < currentStep - 1
                            ? "bg-success"
                            : index === currentStep - 1
                            ? "bg-primary"
                            : "bg-light border"
                        } text-white d-flex align-items-center justify-content-center`}
                        style={{
                          width: "40px",
                          height: "40px",
                          color:
                            index >= currentStep - 1 ? "var(--bs-dark)" : "",
                        }}
                      >
                        {index < currentStep - 1 ? (
                          <i className="bi bi-check"></i>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <span className="mt-2 fw-medium">
                        {step.title || `Step ${index + 1}`}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className="flex-grow-1 mx-2"
                        style={{
                          height: "2px",
                          backgroundColor: "#dee2e6",
                        }}
                      >
                        <div
                          className="h-100 bg-primary"
                          style={{
                            width: index < currentStep - 1 ? "100%" : "0%",
                            transition: "width 0.3s ease",
                          }}
                        ></div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Step Content */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body p-4">
              {isMultiStep &&
                "description" in currentStepData &&
                currentStepData.description && (
                  <h4 className="card-title text-center mb-4">
                    {currentStepData.description}
                  </h4>
                )}

              <div className="row g-3">
                {currentStepData.rows?.map((row, rowIndex) => (
                  <React.Fragment key={`row-${row.row_number || rowIndex}`}>
                    {row?.fields?.map((field: Field) => (
                      <div
                        key={`field-${field.label}`}
                        className={
                          field.type === "textarea" ? "col-12" : "col-md-6"
                        }
                      >
                        <div className="form-floating mb-3">
                          {field.type === "textarea" ? (
                            <textarea
                              className={`form-control ${
                                isFieldRequired(field.validations?.required)
                                  ? "required-field"
                                  : ""
                              }`}
                              id={getFieldId(
                                currentStep,
                                rowIndex,
                                field.label
                              )}
                              placeholder={field.placeholder || field.label}
                              defaultValue={field.default_value || ""}
                              required={isFieldRequired(
                                field.validations?.required
                              )}
                              onChange={(e) =>
                                onInputChange(
                                  currentStep,
                                  rowIndex,
                                  field.record_label,
                                  e.target.value
                                )
                              }
                              rows={3}
                            />
                          ) : (
                            <input
                              type={field.type || "text"}
                              className={`form-control ${
                                isFieldRequired(field.validations?.required)
                                  ? "required-field"
                                  : ""
                              }`}
                              id={getFieldId(
                                currentStep,
                                rowIndex,
                                field.label
                              )}
                              placeholder={field.placeholder || field.label}
                              defaultValue={field.default_value || ""}
                              required={isFieldRequired(
                                field.validations?.required
                              )}
                              onChange={(e) =>
                                onInputChange(
                                  currentStep,
                                  rowIndex,
                                  field.record_label,
                                  e.target.value
                                )
                              }
                            />
                          )}
                          <label
                            htmlFor={getFieldId(
                              currentStep,
                              rowIndex,
                              field.record_label
                            )}
                          >
                            {field.record_label}
                            {isFieldRequired(field.validations?.required) && (
                              <span className="text-danger"> *</span>
                            )}
                          </label>
                          {field.note && (
                            <div className="form-text text-muted mt-1 small">
                              <i className="bi bi-info-circle me-1"></i>
                              {field.note}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between">
            <div>
              {isMultiStep && currentStep > 1 && (
                <button
                  className="btn btn-outline-primary"
                  onClick={onPrevious}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Previous
                </button>
              )}
            </div>
            <div>
              {isMultiStep && currentStep < totalSteps ? (
                <button
                  className="btn btn-primary"
                  onClick={onNext}
                  disabled={loading}
                >
                  Next
                  <i className="bi bi-arrow-right ms-2"></i>
                </button>
              ) : (
                <button
                  className="btn btn-success"
                  onClick={onSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Submit
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="alert alert-danger mt-4">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .active-step span {
          color: var(--bs-primary);
          font-weight: 600;
        }
        .required-field {
          border-left: 3px solid var(--bs-danger);
        }
        .bg-light.border {
          border: 1px solid var(--bs-gray-400) !important;
        }
      `}</style>
    </div>
  );
};

export default Template3Form;
