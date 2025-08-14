// store/slices/templateSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import LoginJson from "../../pages/login-settings.json";

// strictly type what TemplateType can be:
type TemplateType = "template1" | "template2";

// Read default template from JSON properly
const defaultTemplate: TemplateType = LoginJson["Template"].type as TemplateType;

const getInitialTemplate = (): TemplateType => {
  if (typeof window !== 'undefined') {
    try {
      const savedTemplate = localStorage.getItem('selectedTemplate');
      return savedTemplate ? JSON.parse(savedTemplate) : defaultTemplate;
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return defaultTemplate;
    }
  }
  return defaultTemplate;
};

const initialState = {
  selectedTemplate: getInitialTemplate(),
};

const templateSlice = createSlice({
  name: "template",
  initialState,
  reducers: {
    setTemplate(state, action: { payload: TemplateType }) {
      state.selectedTemplate = action.payload;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('selectedTemplate', JSON.stringify(action.payload));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }
    },
  },
});

export const { setTemplate } = templateSlice.actions;
export default templateSlice.reducer;
