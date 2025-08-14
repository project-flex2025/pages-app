// components/TemplateSelector.tsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../redux/store";
import { setTemplate } from "../redux/slices/templateSlice";
import { TemplateType } from "./templates";

const TempSwitcher = () => {
  const dispatch = useDispatch<AppDispatch>();
  const selectedTemplate = useSelector(
    (state: RootState) => state.templateRef.selectedTemplate
  );

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setTemplate(e.target.value as TemplateType));
  };

  return (
    <div className="mb-3 font-control-panel">
      <label htmlFor="font-select" className="form-label ">
        Choose Template
      </label>
      <select
        className="form-select"
        value={selectedTemplate}
        onChange={handleChange}
      >
        <option value="template1">Template 1</option>
        <option value="template2">Template 2</option>
        {/* <option value="template3">Template 3</option>
        <option value="template4">Template 4</option> */}
      </select>
    </div>
  );
};

export default TempSwitcher;
