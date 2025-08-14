"use client";

import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useEffect } from "react";

const FontApplier = () => {
  const fontFamily = useSelector((state: RootState) => state.font.fontFamily);

  useEffect(() => {
    document.body.style.fontFamily = fontFamily;
  }, [fontFamily]);

  return null; // this component only applies font
};

export default FontApplier;
