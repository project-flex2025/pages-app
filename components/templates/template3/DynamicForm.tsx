// import React from "react";
// import { TemplateFormProps } from "../index";

// const Template2Form: React.FC<TemplateFormProps> = ({
//   widgetData,
//   currentStep,
//   loading,
//   error,
//   onInputChange,
//   onNext,
//   onPrevious,
//   onSubmit,
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

//   return (
//     <div className="container">
//       <div className="row justify-content-center">
//         <div className="col-lg-12">
//           {/* Form Card */}
//           <div className="card border-0 shadow-sm rounded-lg overflow-hidden">
//             {/* Header with Progress */}
//             <div className="card-header bg-white border-bottom-0 pt-4">
//               <h3 className="text-center text-primary">
//                 {widgetData?.config?.title || "Untitled Form"}
//               </h3>

//               <div className="d-flex align-items-center">
//                 <div className="flex-grow-1">
//                   <div className="progress" style={{ height: "6px" }}>
//                     <div
//                       className="progress-bar bg-primary"
//                       role="progressbar"
//                       style={{
//                         width: `${((currentStep - 1) / totalSteps) * 100}%`,
//                       }}
//                     ></div>
//                   </div>
//                 </div>
//                 <div className="ms-3 text-muted">
//                   Step {currentStep} of {totalSteps}
//                 </div>
//               </div>
//             </div>

//             {/* Form Body */}
//             <div className="card-body p-4">
//               {/* Step Title & Description */}
//               <div className="text-center mb-3">
//                 <h4 className="fw-bold mb-2">
//                   {currentStepData.title || "Untitled Step"}
//                 </h4>
//                 {currentStepData.description && (
//                   <p className="text-muted">{currentStepData.description}</p>
//                 )}
//               </div>

//               {/* Form Fields */}
//               <div className="row g-4">
//                 {currentStepData.rows?.map((row, rowIndex) => (
//                   <React.Fragment key={`row-${row.row_number}`}>
//                     {row.fields?.map((field) => (
//                       <div
//                         key={`field-${field.label}`}
//                         className={
//                           field.type === "textarea" ? "col-12" : "col-md-6"
//                         }
//                       >
//                         <div className="mb-2">
//                           <label
//                             htmlFor={getFieldId(
//                               currentStep,
//                               rowIndex,
//                               field.label
//                             )}
//                             className="form-label fw-medium text-dark mb-2"
//                           >
//                             {field.label}
//                             {isFieldRequired(field.validations?.required) && (
//                               <span className="text-danger ms-1">*</span>
//                             )}
//                           </label>

//                           {field.type === "textarea" ? (
//                             <textarea
//                               className="form-control border-2"
//                               id={getFieldId(
//                                 currentStep,
//                                 rowIndex,
//                                 field.label
//                               )}
//                               placeholder={field.placeholder || ""}
//                               defaultValue={field.default_value || ""}
//                               required={isFieldRequired(
//                                 field.validations?.required
//                               )}
//                               onChange={(e) =>
//                                 onInputChange(
//                                   currentStep,
//                                   rowIndex,
//                                   field.label,
//                                   e.target.value
//                                 )
//                               }
//                               rows={3}
//                               style={{ minHeight: "0px" }}
//                             />
//                           ) : (
//                             <input
//                               type={field.type || "text"}
//                               className="form-control border-2"
//                               id={getFieldId(
//                                 currentStep,
//                                 rowIndex,
//                                 field.label
//                               )}
//                               placeholder={field.placeholder || ""}
//                               defaultValue={field.default_value || ""}
//                               required={isFieldRequired(
//                                 field.validations?.required
//                               )}
//                               onChange={(e) =>
//                                 onInputChange(
//                                   currentStep,
//                                   rowIndex,
//                                   field.label,
//                                   e.target.value
//                                 )
//                               }
//                             />
//                           )}

//                           {field.note && (
//                             <div className="form-text text-muted mt-2">
//                               <i className="bi bi-info-circle me-2"></i>
//                               {field.note}
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </React.Fragment>
//                 ))}
//               </div>

//               {/* Navigation Buttons */}
//               <div className="d-flex justify-content-between mt-5 pt-3 border-top">
//                 <div>
//                   {currentStep > 1 && (
//                     <button
//                       className="btn btn-outline-secondary px-4 py-2 rounded-pill"
//                       onClick={onPrevious}
//                       disabled={loading}
//                     >
//                       <i className="bi bi-arrow-left me-2"></i>
//                       Previous
//                     </button>
//                   )}
//                 </div>
//                 <div>
//                   {currentStep < totalSteps ? (
//                     <button
//                       className="btn btn-primary px-4 py-2 rounded-pill"
//                       onClick={onNext}
//                       disabled={loading}
//                     >
//                       Continue
//                       <i className="bi bi-arrow-right ms-2"></i>
//                     </button>
//                   ) : (
//                     <button
//                       className="btn btn-success px-4 py-2 rounded-pill"
//                       onClick={onSubmit}
//                       disabled={loading}
//                     >
//                       {loading ? (
//                         <>
//                           <span
//                             className="spinner-border spinner-border-sm me-2"
//                             role="status"
//                           ></span>
//                           Processing...
//                         </>
//                       ) : (
//                         <>
//                           <i className="bi bi-check-circle me-2"></i>
//                           Submit Form
//                         </>
//                       )}
//                     </button>
//                   )}
//                 </div>
//               </div>

//               {error && (
//                 <div className="alert alert-danger mt-4">
//                   <i className="bi bi-exclamation-triangle-fill me-2"></i>
//                   {error}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Template2Form;

import React from "react";
import { TemplateFormProps } from "../index";

const Template2Form: React.FC<TemplateFormProps> = ({
  widgetData,
  currentStep,
  loading,
  error,
  onInputChange,
  onNext,
  onPrevious,
  onSubmit,
}) => {
  const isMultiStep = widgetData?.config?.multi_step === "true";
  const steps = widgetData?.config?.steps || [];
  const rows = widgetData?.config?.rows || [];

  const currentStepData = isMultiStep ? steps[currentStep - 1] : { rows };
  const totalSteps = isMultiStep ? steps.length : 1;

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
        <div className="col-lg-12">
          <div className="card border-0 shadow-sm rounded-lg overflow-hidden">
            {/* Form Title */}
            <div className="card-header bg-white border-bottom-0 pt-4">
              <h5 className="text-center text-primary">
                {widgetData?.config?.title || "Untitled Form"}
              </h5>

              {isMultiStep && (
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="progress" style={{ height: "6px" }}>
                      <div
                        className="progress-bar bg-primary"
                        role="progressbar"
                        style={{
                          width: `${((currentStep - 1) / totalSteps) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="ms-3 text-muted">
                    Step {currentStep} of {totalSteps}
                  </div>
                </div>
              )}
            </div>

            <div className="card-body p-4">
              {isMultiStep && (
                <div className="text-center mb-3">
                  <h4 className="fw-bold mb-2">
                    {"title" in currentStepData ? currentStepData.title : "Untitled Step"}
                  </h4>
                  {"description" in currentStepData && currentStepData.description && (
                    <p className="text-muted">
                      {" "}
                      {"description" in currentStepData
                        ? currentStepData.description
                        : ""}
                    </p>
                  )}
                </div>
              )}

              <div className="row g-4">
                {currentStepData.rows?.map((row, rowIndex) => (
                  <React.Fragment key={`row-${row.row_number || rowIndex}`}>
                    {row.fields?.map((field) => (
                      <div
                        key={`field-${field.label}`}
                        className={
                          field.type === "textarea" ? "col-12" : "col-md-6"
                        }
                      >
                        <div className="mb-2">
                          <label
                            htmlFor={getFieldId(
                              currentStep,
                              rowIndex,
                              field.label
                            )}
                            className="form-label fw-medium text-dark mb-2"
                          >
                            {field.label}
                            {isFieldRequired(field.validations?.required) && (
                              <span className="text-danger ms-1">*</span>
                            )}
                          </label>

                          {field.type === "textarea" ? (
                            <textarea
                              className="form-control border-2"
                              id={getFieldId(
                                currentStep,
                                rowIndex,
                                field.label
                              )}
                              placeholder={field.placeholder || ""}
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
                              className="form-control border-2"
                              id={getFieldId(
                                currentStep,
                                rowIndex,
                                field.label
                              )}
                              placeholder={field.placeholder || ""}
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

                          {field.note && (
                            <div className="form-text text-muted mt-2">
                              <i className="bi bi-info-circle me-2"></i>
                              {field.note}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>

              {/* Navigation */}
              <div className="d-flex justify-content-between mt-5 pt-3 border-top">
                <div>
                  {isMultiStep && currentStep > 1 && (
                    <button
                      className="btn btn-outline-secondary px-4 py-2 rounded-pill"
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
                      className="btn btn-primary px-4 py-2 rounded-pill"
                      onClick={onNext}
                      disabled={loading}
                    >
                      Continue
                      <i className="bi bi-arrow-right ms-2"></i>
                    </button>
                  ) : (
                    <button
                      className="btn btn-success px-4 py-2 rounded-pill"
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
                          Submit Form
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
        </div>
      </div>
    </div>
  );
};

export default Template2Form;
