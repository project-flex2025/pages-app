"use client";

// import { useState } from "react";
// import { templates, TemplateType } from "./templates";
// import { WidgetData } from "@/types/table";
// import { getSnowflakeId } from "@/utils/snowflake";
// import { useSelector } from "react-redux";
// import { RootState } from "../../redux/store";

// // Define a proper FormData type that matches your actual data structure
// interface FormData {
//   [stepIndex: number]: {
//     [rowIndex: number]: {
//       [fieldLabel: string]: string;
//     };
//   };
// }

// interface DynamicFormProps {
//   widgetData: WidgetData;
// }

// const DynamicForm: React.FC<DynamicFormProps> = ({ widgetData }) => {
//   const [currentStep, setCurrentStep] = useState<number>(1);
//   const [formData, setFormData] = useState<FormData>({});
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);

//   const selectedTemplate = useSelector(
//     (state: RootState) => state.templateRef.selectedTemplate
//   ) as TemplateType;

//   const handleInputChange = (
//     stepIndex: number,
//     rowIndex: number,
//     fieldLabel: string,
//     value: string
//   ) => {
//     setFormData((prevData) => {
//       const newData = { ...prevData };
//       if (!newData[stepIndex]) {
//         newData[stepIndex] = {};
//       }
//       if (!newData[stepIndex][rowIndex]) {
//         newData[stepIndex][rowIndex] = {};
//       }
//       newData[stepIndex][rowIndex][fieldLabel] = value;
//       return newData;
//     });
//   };

//   const handleNext = () => {
//     if (
//       widgetData?.config?.steps &&
//       currentStep < widgetData.config.steps.length
//     ) {
//       setCurrentStep(currentStep + 1);
//     }
//   };

//   const handlePrevious = () => {
//     if (currentStep > 1) {
//       setCurrentStep(currentStep - 1);
//     }
//   };

//   const handleSubmit = async () => {
//     setLoading(true);
//     try {
//       const feature_name = widgetData?.config?.data_source;

//       // Type-safe form data processing
//       const recordData = Object.entries(formData).flatMap(([stepData]) => {
//         if (typeof stepData === "object" && stepData !== null) {
//           return Object.entries(stepData).flatMap(([rowData]) => {
//             if (typeof rowData === "object" && rowData !== null) {
//               return Object.entries(rowData).map(
//                 ([fieldLabel, fieldValue]) => ({
//                   record_label: fieldLabel,
//                   record_value: fieldValue,
//                   record_type: "type_text",
//                 })
//               );
//             }
//             return [];
//           });
//         }
//         return [];
//       });

//       const wildSearch = Object.values(formData)
//         .flatMap((step) => {
//           if (typeof step === "object" && step !== null) {
//             return Object.values(step).flatMap((row) => {
//               if (typeof row === "object" && row !== null) {
//                 return Object.values(row);
//               }
//               return [];
//             });
//           }
//           return [];
//         })
//         .join(" ");

//       const payload = {
//         record_id: getSnowflakeId(123),
//         feature_name,
//         created_on_date: new Date().toISOString().split("T")[0],
//         feature_data: {
//           record_data: recordData,
//         },
//         more_data: {
//           wild_search: wildSearch,
//         },
//       };

//       const endpoint = "create";
//       const response = await fetch("/api/proxy", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//           "X-API-TYPE": endpoint,
//         },
//         body: JSON.stringify({
//           data: payload,
//           dataset: "feature_data",
//         }),
//       });

//       if (!response.ok) throw new Error("Failed to update data");
//     } catch (error) {
//       setError(error instanceof Error ? error.message : "Submission failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const FormComponent = templates[selectedTemplate]?.DynamicForm;

//   if (!FormComponent) {
//     return <div className="alert alert-danger">Invalid template selected</div>;
//   }

//   return (
//     <FormComponent
//       widgetData={widgetData}
//       formData={formData as Record<string, unknown>}
//       currentStep={currentStep}
//       loading={loading}
//       error={error}
//       onInputChange={handleInputChange}
//       onNext={handleNext}
//       onPrevious={handlePrevious}
//       onSubmit={handleSubmit}
//       setCurrentStep={setCurrentStep}
//     />
//   );
// };

// export default DynamicForm;

// src/app/components/DynamicForm/DynamicForm.tsx
"use client";

import { useState } from "react";
import { templates, TemplateType } from "./templates";
import { getSnowflakeId } from "@/utils/snowflake";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { FormWidgetData } from "@/types/forms";
import { toast } from "react-toastify";

interface DynamicFormProps {
  widgetData: FormWidgetData;
}

interface FormData {
  [stepIndex: string]: {
    [rowIndex: string]: {
      [fieldLabel: string]: string;
    };
  };
}

const DynamicForm: React.FC<DynamicFormProps> = ({ widgetData }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useSelector(
    (state: RootState) => state.templateRef.selectedTemplate
  ) as TemplateType;

  // console.log("widgetdataaaaaaaaaaaaaaaaaaa", widgetData);

  const handleInputChange = (
    stepIndex: number,
    rowIndex: number,
    fieldLabel: string,
    value: string
  ) => {
    setFormData((prevData) => ({
      ...prevData,
      [stepIndex]: {
        ...prevData[stepIndex],
        [rowIndex]: {
          ...prevData[stepIndex]?.[rowIndex],
          [fieldLabel]: value,
        },
      },
    }));
  };

  const handleNext = () => {
    const steps = widgetData?.config?.steps;
    if (steps && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // const handleSubmit = async () => {
  //   setLoading(true);

  //   console.log("Form data:", formData);

  //   const steps = widgetData?.config?.steps || [];
  //   const rows = widgetData?.config?.rows || [];

  //   console.log("steps", steps);

  //   console.log("rows", rows);

  //   const isMultiStep = steps.length > 0;

  //   console.log("isMultiStep", isMultiStep);

  //   try {
  //     // if (!formData || Object.keys(formData).length === 0) {
  //     //   toast.error("Form is empty");
  //     //   setLoading(false);
  //     //   return;
  //     // }

  //     if (isMultiStep == false) {
  //       // Loop through formData
  //       for (const [stepIndex, stepData] of Object.entries(formData)) {
  //         const stepNumber = parseInt(stepIndex);

  //         for (const [rowIndex, rowData] of Object.entries(stepData)) {
  //           console.log(rowIndex);

  //           // Get all rows for this step
  //           const configRows = isMultiStep
  //             ? steps?.[stepNumber - 1]?.rows || []
  //             : rows;

  //           // Validate each field from all configRows
  //           for (const configRow of configRows) {
  //             for (const field of configRow.fields || []) {
  //               const key = field.record_label;
  //               const label = field.label;
  //               const validations: FieldValidations = field.validations || {};
  //               const minLength = validations.minLength;
  //               const maxLength = validations.maxLength;
  //               let value = (rowData as Record<string, string>)?.[key];

  //               // If value is not found in current row, check other rows in this step (multi-step mode)
  //               if (isMultiStep && (value === undefined || value === "")) {
  //                 // const otherRowsInStep = Object.values(stepData) as any[];
  //                 const otherRowsInStep: Record<string, string>[] =
  //                   Object.values(stepData);
  //                 for (const otherRow of otherRowsInStep) {
  //                   if (otherRow?.[key]) {
  //                     value = otherRow[key];
  //                     break;
  //                   }
  //                 }
  //               }

  //               // Required check
  //               if (
  //                 validations.required === "true" &&
  //                 (!value || value === "")
  //               ) {
  //                 toast.error(`${label} is required`);
  //                 setLoading(false);
  //                 return;
  //               }

  //               // Email validation
  //               const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //               const isEmailField =
  //                 field.type === "email" || key.toLowerCase().includes("email");

  //               if (isEmailField && value && !emailRegex.test(value)) {
  //                 toast.error(`Invalid email format in ${label}`);
  //                 setLoading(false);
  //                 return;
  //               }

  //               // Type-based validation
  //               switch (field.type) {
  //                 case "date":
  //                 case "date_picker":
  //                   if (value && isNaN(Date.parse(value))) {
  //                     toast.error(`Invalid date in ${label}`);
  //                     setLoading(false);
  //                     return;
  //                   }
  //                   break;

  //                 case "number":
  //                   if (value && isNaN(Number(value))) {
  //                     toast.error(`${label} must be a number`);
  //                     setLoading(false);
  //                     return;
  //                   }
  //                   break;

  //                 case "text":
  //                 case "textarea":
  //                   if (minLength && value.length < parseInt(minLength)) {
  //                     toast.error(
  //                       `${label} must be at least ${minLength} characters`
  //                     );
  //                     setLoading(false);
  //                     return;
  //                   }

  //                   if (maxLength && value.length > parseInt(maxLength)) {
  //                     toast.error(
  //                       `${label} must be less than ${maxLength} characters`
  //                     );
  //                     setLoading(false);
  //                     return;
  //                   }
  //                   break;
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }

  //     if (isMultiStep == true) {
  //       for (const [stepIdx, step] of steps.entries()) {
  //         const stepNumber = parseInt(step.step); // or stepIdx + 1
  //         const stepData = formData?.[stepNumber] || {};

  //         for (const [rowIdx, configRow] of step.rows.entries()) {
  //           const rowData = stepData?.[rowIdx] || {};

  //           for (const field of configRow.fields || []) {
  //             const key = field.record_label;
  //             const label = field.label;
  //             const validations: FieldValidations = field.validations || {};
  //             const minLength = validations.minLength;
  //             const maxLength = validations.maxLength;

  //             let value = rowData?.[key];

  //             // If value not found in current row, search other rows in the same step
  //             if (value === undefined || value === "") {
  //               const otherRowsInStep: Record<string, string>[] =
  //                 Object.values(stepData);
  //               for (const otherRow of otherRowsInStep) {
  //                 if (otherRow?.[key]) {
  //                   value = otherRow[key];
  //                   break;
  //                 }
  //               }
  //             }

  //             // Required check
  //             if (validations.required === "true" && (!value || value === "")) {
  //               toast.error(`${label} is required`);
  //               setLoading(false);
  //               return;
  //             }

  //             // Email validation
  //             const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //             const isEmailField =
  //               field.type === "email" || key.toLowerCase().includes("email");
  //             if (isEmailField && value && !emailRegex.test(value)) {
  //               toast.error(`Invalid email format in ${label}`);
  //               setLoading(false);
  //               return;
  //             }

  //             // Type-based validation
  //             switch (field.type) {
  //               case "date":
  //               case "date_picker":
  //                 if (value && isNaN(Date.parse(value))) {
  //                   toast.error(`Invalid date in ${label}`);
  //                   setLoading(false);
  //                   return;
  //                 }
  //                 break;

  //               case "number":
  //                 if (value && isNaN(Number(value))) {
  //                   toast.error(`${label} must be a number`);
  //                   setLoading(false);
  //                   return;
  //                 }
  //                 break;

  //               case "text":
  //               case "textarea":
  //                 if (minLength && value?.length < parseInt(minLength)) {
  //                   toast.error(
  //                     `${label} must be at least ${minLength} characters`
  //                   );
  //                   setLoading(false);
  //                   return;
  //                 }

  //                 if (maxLength && value?.length > parseInt(maxLength)) {
  //                   toast.error(
  //                     `${label} must be less than ${maxLength} characters`
  //                   );
  //                   setLoading(false);
  //                   return;
  //                 }
  //                 break;
  //             }
  //           }
  //         }
  //       }
  //     }
  //     // Loop through all steps from config (not formData)

  //     // Submission payload
  //     const feature_name = widgetData?.config?.data_source || "";

  //     const recordData = Object.values(formData).flatMap((stepData) =>
  //       Object.values(stepData).flatMap((rowData) =>
  //         Object.entries(rowData as Record<string, string>).map(
  //           ([fieldLabel, fieldValue]) => ({
  //             record_label: fieldLabel,
  //             record_value: fieldValue,
  //             record_type: "type_text",
  //           })
  //         )
  //       )
  //     );

  //     const wildSearch = Object.values(formData)
  //       .flatMap((step) => Object.values(step))
  //       .flatMap((row) => Object.values(row as Record<string, string>))
  //       .join(" ");

  //     const payload = {
  //       record_id: getSnowflakeId(123),
  //       feature_name,
  //       created_on_date: new Date().toISOString().split("T")[0],
  //       feature_data: {
  //         record_data: recordData,
  //       },
  //       more_data: {
  //         wild_search: wildSearch,
  //       },
  //     };

  //     const response = await fetch("/api/proxy", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Accept: "application/json",
  //         "X-API-TYPE": "create",
  //       },
  //       body: JSON.stringify({
  //         data: payload,
  //         dataset: "feature_data",
  //       }),
  //     });

  //     if (!response.ok) throw new Error("Failed to update data");

  //     // Only reset if response is successful
  //     console.log("Form submitted successfully, resetting form data");
  //     setCurrentStep(1);
  //     setFormData({});
  //   } catch (error) {
  //     setError(error instanceof Error ? error.message : "Submission failed");
  //   } finally {
  //     setLoading(false);
  //     // Reset form data after submission
  //     console.log("Form submitted successfully, resetting form data");

  //     // setCurrentStep(1);
  //     // setFormData({});
  //   }
  // };

  const handleSubmit = async () => {
    setLoading(true);

    const steps = widgetData?.config?.steps || [];
    const rows = widgetData?.config?.rows || [];
    const isMultiStep = steps.length > 0;

    try {
      if (!formData || Object.keys(formData).length === 0) {
        toast.error("Form is empty");
        setLoading(false);
        return;
      }
      if (!isMultiStep) {
        const rowData = formData?.["1"]?.["0"] || {};

        for (const row of rows) {
          for (const field of row.fields || []) {
            const { record_label: key, label, type, validations = {} } = field;
            const value = rowData[key];
            if (validations.required === "true" && (!value || value === "")) {
              toast.error(`${label} is required`);
              setLoading(false);
              return;
            }
            if (
              (type === "email" || key.toLowerCase().includes("email")) &&
              value
            ) {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                toast.error(`Invalid email format in ${label}`);
                setLoading(false);
                return;
              }
            }

            // Date
            if ((type === "date" || type === "date_picker") && value) {
              if (isNaN(Date.parse(value))) {
                toast.error(`Invalid date in ${label}`);
                setLoading(false);
                return;
              }
            }

            // Number
            if (type === "number" && value && isNaN(Number(value))) {
              toast.error(`${label} must be a number`);
              setLoading(false);
              return;
            }

            // Text limits
            if (["text", "textarea"].includes(type)) {
              if (
                validations.minLength &&
                value &&
                value.length < Number(validations.minLength)
              ) {
                toast.error(
                  `${label} must be at least ${validations.minLength} characters`
                );
                setLoading(false);
                return;
              }
              if (
                validations.maxLength &&
                value &&
                value.length > Number(validations.maxLength)
              ) {
                toast.error(
                  `${label} must be less than ${validations.maxLength} characters`
                );
                setLoading(false);
                return;
              }
            }
          }
        }
      } else {
        for (const [stepIndex, stepData] of Object.entries(formData)) {
          const stepNumber = parseInt(stepIndex);
          const configRows = steps?.[stepNumber - 1]?.rows || [];

          for (const configRow of configRows) {
            for (const field of configRow.fields || []) {
              const {
                record_label: key,
                label,
                type,
                validations = {},
              } = field;

              let value: string | undefined;

              // Search for value in all rows of this step
              const allRows = Object.values(stepData);
              for (const row of allRows) {
                if (row?.[key]) {
                  value = row[key];
                  break;
                }
              }

              // Required
              if (validations.required === "true" && (!value || value === "")) {
                toast.error(`${label} is required`);
                setLoading(false);
                return;
              }

              // Email
              if (
                (type === "email" || key.toLowerCase().includes("email")) &&
                value
              ) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                  toast.error(`Invalid email format in ${label}`);
                  setLoading(false);
                  return;
                }
              }

              // Date
              if ((type === "date" || type === "date_picker") && value) {
                if (isNaN(Date.parse(value))) {
                  toast.error(`Invalid date in ${label}`);
                  setLoading(false);
                  return;
                }
              }

              // Number
              if (type === "number" && value && isNaN(Number(value))) {
                toast.error(`${label} must be a number`);
                setLoading(false);
                return;
              }

              // Text limits
              if (["text", "textarea"].includes(type)) {
                if (
                  validations.minLength &&
                  value &&
                  value.length < Number(validations.minLength)
                ) {
                  toast.error(
                    `${label} must be at least ${validations.minLength} characters`
                  );
                  setLoading(false);
                  return;
                }
                if (
                  validations.maxLength &&
                  value &&
                  value.length > Number(validations.maxLength)
                ) {
                  toast.error(
                    `${label} must be less than ${validations.maxLength} characters`
                  );
                  setLoading(false);
                  return;
                }
              }
            }
          }
        }
      }

      // === 🔹 Payload Building ===
      const feature_name = widgetData?.config?.data_source || "";
      const recordData = Object.values(formData).flatMap((stepData) =>
        Object.values(stepData).flatMap((rowData) =>
          Object.entries(rowData as Record<string, string>).map(
            ([fieldLabel, fieldValue]) => ({
              record_label: fieldLabel,
              record_value: fieldValue,
              record_type: "type_text",
            })
          )
        )
      );

      const wildSearch = Object.values(formData)
        .flatMap((step) => Object.values(step))
        .flatMap((row) => Object.values(row as Record<string, string>))
        .join(" ");

      const payload = {
        record_id: getSnowflakeId(123),
        feature_name,
        created_on_date: new Date().toISOString().split("T")[0],
        feature_data: {
          record_data: recordData,
        },
        more_data: {
          wild_search: wildSearch,
        },
      };

      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-TYPE": "create",
        },
        body: JSON.stringify({
          data: payload,
          dataset: "feature_data",
        }),
      });

      if (!response.ok) throw new Error("Failed to update data");

      toast.success("Form submitted successfully");

      setCurrentStep(1);
      setFormData({});
    } catch (error) {
      console.error("Submission error:", error);
      setError(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  // const handleSubmit = async () => {
  //   setLoading(true);
  //   try {
  //     const feature_name = widgetData?.config?.data_source || "";

  //     const recordData = Object.values(formData).flatMap((stepData) =>
  //       Object.values(stepData).flatMap((rowData) =>
  //         Object.entries(rowData as Record<string, string>).map(
  //           ([fieldLabel, fieldValue]) => ({
  //             record_label: fieldLabel,
  //             record_value: fieldValue,
  //             record_type: "type_text",
  //           })
  //         )
  //       )
  //     );

  //     const wildSearch = Object.values(formData)
  //       .flatMap((step) => Object.values(step))
  //       .flatMap((row) => Object.values(row as Record<string, string>))
  //       .join(" ");

  //     const payload = {
  //       record_id: getSnowflakeId(123),
  //       feature_name,
  //       created_on_date: new Date().toISOString().split("T")[0],
  //       feature_data: {
  //         record_data: recordData,
  //       },
  //       more_data: {
  //         wild_search: wildSearch,
  //       },
  //     };

  //     const response = await fetch("/api/proxy", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Accept: "application/json",
  //         "X-API-TYPE": "create",
  //       },
  //       body: JSON.stringify({
  //         data: payload,
  //         dataset: "feature_data",
  //       }),
  //     });

  //     if (!response.ok) throw new Error("Failed to update data");
  //   } catch (error) {
  //     setError(error instanceof Error ? error.message : "Submission failed");
  //   } finally {
  //     setLoading(false);
  //     // Reset form data after submission
  //     console.log("Form submitted successfully, resetting form data");

  //     setCurrentStep(1);
  //     setFormData({});
  //   }
  // };

  // const handleSubmit = async () => {
  //   // setLoading(true);

  //   const steps = widgetData?.config?.rows || []; // single form uses rows
  //   const stepNumber = 1;
  //   const rowNumber = 0;

  //   const currentRowData = formData?.[stepNumber]?.[rowNumber] || {};

  //   // --- Validation logic ---
  //   for (const field of steps.flatMap((s: any) => s.fields || [])) {
  //     const label = field.label;
  //     const key = field.record_label;
  //     const value = currentRowData?.[key];

  //     // Check for required
  //     if (field.validations?.required === "true" && (!value || value === "")) {
  //       toast.error(`${label} is required`);
  //       setLoading(false);
  //       return;
  //     }

  //     // Type-specific validations
  //     switch (field.type) {
  //       case "email":
  //         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //         if (value && !emailRegex.test(value)) {
  //           toast.error(`Invalid email format in ${label}`);
  //           setLoading(false);
  //           return;
  //         }
  //         break;

  //       case "date":
  //       case "date_picker":
  //         if (value && isNaN(Date.parse(value))) {
  //           toast.error(`Invalid date in ${label}`);
  //           setLoading(false);
  //           return;
  //         }
  //         break;

  //       case "select":
  //         if (
  //           field.validations?.required === "true" &&
  //           (!value || value === "")
  //         ) {
  //           toast.error(`Please select a value for ${label}`);
  //           setLoading(false);
  //           return;
  //         }
  //         break;

  //       case "number":
  //         if (value && isNaN(Number(value))) {
  //           toast.error(`${label} must be a number`);
  //           setLoading(false);
  //           return;
  //         }
  //         break;

  //       case "text":
  //       case "textarea":
  //         if (
  //           field.validations?.minLength &&
  //           value.length < parseInt(field.validations.minLength)
  //         ) {
  //           toast.error(
  //             `${label} must be at least ${field.validations.minLength} characters`
  //           );
  //           setLoading(false);
  //           return;
  //         }

  //         if (
  //           field.validations?.maxLength &&
  //           value.length > parseInt(field.validations.maxLength)
  //         ) {
  //           toast.error(
  //             `${label} must be less than ${field.validations.maxLength} characters`
  //           );
  //           setLoading(false);
  //           return;
  //         }
  //         break;

  //       // Add more types as needed
  //     }
  //   }

  //   try {
  //     const feature_name = widgetData?.config?.data_source || "";

  //     const recordData = Object.values(formData).flatMap((stepData) =>
  //       Object.values(stepData).flatMap((rowData) =>
  //         Object.entries(rowData as Record<string, string>).map(
  //           ([fieldLabel, fieldValue]) => ({
  //             record_label: fieldLabel,
  //             record_value: fieldValue,
  //             record_type: "type_text",
  //           })
  //         )
  //       )
  //     );

  //     const wildSearch = Object.values(formData)
  //       .flatMap((step) => Object.values(step))
  //       .flatMap((row) => Object.values(row as Record<string, string>))
  //       .join(" ");

  //     const payload = {
  //       record_id: getSnowflakeId(123),
  //       feature_name,
  //       created_on_date: new Date().toISOString().split("T")[0],
  //       feature_data: {
  //         record_data: recordData,
  //       },
  //       more_data: {
  //         wild_search: wildSearch,
  //       },
  //     };

  //     // const response = await fetch("/api/proxy", {
  //     //   method: "POST",
  //     //   headers: {
  //     //     "Content-Type": "application/json",
  //     //     Accept: "application/json",
  //     //     "X-API-TYPE": "create",
  //     //   },
  //     //   body: JSON.stringify({
  //     //     data: payload,
  //     //     dataset: "feature_data",
  //     //   }),
  //     // });

  //     // if (!response.ok) throw new Error("Failed to update data");
  //     toast.success("Form submitted successfully!");
  //   } catch (error) {
  //     setError(error instanceof Error ? error.message : "Submission failed");
  //     toast.error("Form submission failed");
  //   } finally {
  //     // setLoading(false);
  //     // setCurrentStep(1);
  //     // setFormData({});
  //   }
  // };

  // const handleSubmit = async () => {
  //   setLoading(true);

  //   const steps = widgetData?.config?.steps || []; // multistep uses `steps`
  //   const isMultiStep = Array.isArray(widgetData?.config?.steps);
  //   const configRows = isMultiStep
  //     ? steps.flatMap((step: any) => step.rows || [])
  //     : widgetData?.config?.rows || [];

  //   // --- Validate all steps/rows/fields ---
  //   for (const [stepKey, step] of Object.entries(formData)) {
  //     for (const [rowIndex, rowData] of Object.entries(step)) {
  //       for (const field of configRows.flatMap((r: any) => r.fields || [])) {
  //         const label = field.label;
  //         const key = field.record_label;
  //         const value = rowData?.[key];

  //         // Required field
  //         if (
  //           field.validations?.required === "true" &&
  //           (!value || value === "")
  //         ) {
  //           toast.error(`${label} is required`);
  //           setLoading(false);
  //           return;
  //         }

  //         switch (field.type) {
  //           case "email":
  //             const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //             if (value && !emailRegex.test(value)) {
  //               toast.error(`Invalid email format in ${label}`);
  //               setLoading(false);
  //               return;
  //             }
  //             break;

  //           case "date":
  //           case "date_picker":
  //             if (value && isNaN(Date.parse(value))) {
  //               toast.error(`Invalid date in ${label}`);
  //               setLoading(false);
  //               return;
  //             }
  //             break;

  //           case "select":
  //             if (
  //               field.validations?.required === "true" &&
  //               (!value || value === "")
  //             ) {
  //               toast.error(`Please select a value for ${label}`);
  //               setLoading(false);
  //               return;
  //             }
  //             break;

  //           case "number":
  //             if (value && isNaN(Number(value))) {
  //               toast.error(`${label} must be a number`);
  //               setLoading(false);
  //               return;
  //             }
  //             break;

  //           case "text":
  //           case "textarea":
  //             if (
  //               field.validations?.minLength &&
  //               value.length < parseInt(field.validations.minLength)
  //             ) {
  //               toast.error(
  //                 `${label} must be at least ${field.validations.minLength} characters`
  //               );
  //               setLoading(false);
  //               return;
  //             }

  //             if (
  //               field.validations?.maxLength &&
  //               value.length > parseInt(field.validations.maxLength)
  //             ) {
  //               toast.error(
  //                 `${label} must be less than ${field.validations.maxLength} characters`
  //               );
  //               setLoading(false);
  //               return;
  //             }
  //             break;

  //           // Add more types if needed
  //         }
  //       }
  //     }
  //   }

  //   try {
  //     const feature_name = widgetData?.config?.data_source || "";

  //     const recordData = Object.values(formData).flatMap((stepData) =>
  //       Object.values(stepData).flatMap((rowData) =>
  //         Object.entries(rowData as Record<string, string>).map(
  //           ([fieldLabel, fieldValue]) => ({
  //             record_label: fieldLabel,
  //             record_value: fieldValue,
  //             record_type: "type_text",
  //           })
  //         )
  //       )
  //     );

  //     const wildSearch = Object.values(formData)
  //       .flatMap((step) => Object.values(step))
  //       .flatMap((row) => Object.values(row as Record<string, string>))
  //       .join(" ");

  //     const payload = {
  //       record_id: getSnowflakeId(123),
  //       feature_name,
  //       created_on_date: new Date().toISOString().split("T")[0],
  //       feature_data: {
  //         record_data: recordData,
  //       },
  //       more_data: {
  //         wild_search: wildSearch,
  //       },
  //     };

  //     // Submit data
  //     // const response = await fetch(...);
  //     // if (!response.ok) throw new Error("Failed to submit");

  //     toast.success("Form submitted successfully!");
  //   } catch (error) {
  //     setError(error instanceof Error ? error.message : "Submission failed");
  //     toast.error("Form submission failed");
  //   } finally {
  //     setLoading(false);
  //     // Reset state if needed
  //     // setCurrentStep(1);
  //     // setFormData({});
  //   }
  // };

  const FormComponent = templates[selectedTemplate]?.DynamicForm;

  if (!FormComponent) {
    return <div className="alert alert-danger">Invalid template selected</div>;
  }

  return (
    <FormComponent
      widgetData={widgetData}
      formData={formData}
      currentStep={currentStep}
      loading={loading}
      error={error}
      onInputChange={handleInputChange}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onSubmit={handleSubmit}
      setCurrentStep={setCurrentStep}
    />
  );
};

export default DynamicForm;
