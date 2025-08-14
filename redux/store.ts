// store.ts
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import employeesReducer from "./slices/employeesSlice";
import templateReducer from "./slices/templateSlice";
import fontReducer from "./slices/fontSlice";
import tagsReducer from "./slices/tagsSlice"
import appDataReducer from "./slices/appDataSlice";
// import layoutReducer from "./slices/layoutSlice";
import loginUserReducer from "./slices/loginUserSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    loginUser: loginUserReducer,
    employees: employeesReducer,
    templateRef:templateReducer,
     appData: appDataReducer,
    font: fontReducer,
    tags: tagsReducer,
    // layout: layoutReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;