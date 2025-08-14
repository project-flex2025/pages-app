"use client";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../redux/store";
import { setFontFamily } from "../redux/slices/fontSlice";

const fonts = [
  { name: "Poppins", value: "'Poppins', sans-serif" },
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Courier New", value: "'Courier New', monospace" },
];

const FontSwitcher = () => {
  const dispatch = useDispatch<AppDispatch>();
  const fontFamily = useSelector((state: RootState) => state.font.fontFamily);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setFontFamily(e.target.value));
  };

  return (
    <div className="mb-3 font-control-panel">
      <label htmlFor="font-select" className="form-label ">
        Choose Font
      </label>
      <select
        id="font-select"
        className="form-select"
        value={fontFamily}
        onChange={handleChange}
      >
        {fonts.map((font) => (
          <option key={font.value} value={font.value}>
            {font.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FontSwitcher;
