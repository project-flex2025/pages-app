import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
// import { User } from "./userSlice";
import type { User } from "./userSlice";

interface EmployeesState {
  employees: User[];
  selectedEmployee: User | null;
  loading: boolean;
  error: string | null;
  isFetching: boolean;
}

const initialState: EmployeesState = {
  employees: [],
  selectedEmployee: null,
  loading: false,
  error: null,
  isFetching: false,
};

interface FetchEmployeesError {
  message: string;
}

interface CreateEmployeeError {
  message: string;
}

interface UpdateEmployeeAccessError {
  message: string;
}

// Async thunk for fetching employees
export const fetchEmployees = createAsyncThunk<
  User[], // Return type
  string, // Argument type (userId)
  { rejectValue: FetchEmployeesError }
>("employees/fetchEmployees", async (userId: string, { rejectWithValue }) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const response = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TYPE": "search",
      },
      body: JSON.stringify({
        conditions: [
          {
            field: "parent_id",
            value: userId,
            search_type: "exact",
          },
        ],
        combination_type: "and",
        page: 1,
        limit: 100,
        dataset: "users",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data || [];
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue({ message: error.message });
    }
    return rejectWithValue({ message: "Failed to fetch employees" });
  }
});

// Async thunk for creating an employee
export const createEmployee = createAsyncThunk<
  User, // Return type
  User, // Argument type (employeeData)
  { rejectValue: CreateEmployeeError }
>(
  "employees/createEmployee",
  async (employeeData: User, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "create",
        },
        body: JSON.stringify({
          data: employeeData,
          dataset: "users",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create employee");
      }

      const data = await response.json();
      return data.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue({ message: error.message });
      }
      return rejectWithValue({ message: "Failed to create employee" });
    }
  }
);

// Async thunk for updating employee control access
export const updateEmployeeAccess = createAsyncThunk<
  { recordId: string; control_access: string }, // Return type
  { recordId: string; control_access: string }, // Argument type
  { rejectValue: UpdateEmployeeAccessError }
>(
  "employees/updateEmployeeAccess",
  async ({ recordId, control_access }, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "update",
        },
        body: JSON.stringify({
          data: {
            record_id: recordId,
            fields_to_update: { control_access },
          },
          dataset: "users",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update employee access");
      }

      const data = await response.json();
      return { recordId, control_access: data.data.control_access };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue({ message: error.message });
      }
      return rejectWithValue({ message: "Failed to update employee access" });
    }
  }
);

const employeesSlice = createSlice({
  name: "employees",
  initialState,
  reducers: {
    setEmployees: (state, action: PayloadAction<User[]>) => {
      state.employees = action.payload;
      state.loading = false;
      state.error = null;
    },
    setSelectedEmployee: (state, action: PayloadAction<User | null>) => {
      state.selectedEmployee = action.payload;
    },
    addEmployee: (state, action: PayloadAction<User>) => {
      state.employees.push(action.payload);
    },
    updateEmployee: (state, action: PayloadAction<User>) => {
      const index = state.employees.findIndex(
        (emp) => emp.record_id === action.payload.record_id
      );
      if (index !== -1) {
        state.employees[index] = action.payload;
      }
    },
    removeEmployee: (state, action: PayloadAction<string>) => {
      state.employees = state.employees.filter(
        (emp) => emp.record_id !== action.payload
      );
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    resetEmployeesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.isFetching = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.isFetching = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.isFetching = false;
        state.error = action.payload?.message || "Failed to fetch employees";
      })
      .addCase(createEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.employees.push(action.payload);
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to create employee";
      })
      .addCase(updateEmployeeAccess.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEmployeeAccess.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.employees.findIndex(
          (emp) => emp.record_id === action.payload.recordId
        );
        if (index !== -1) {
          state.employees[index].control_access = action.payload.control_access;
        }
      })
      .addCase(updateEmployeeAccess.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to update employee access";
      });
  },
});

export const {
  setEmployees,
  setSelectedEmployee,
  addEmployee,
  updateEmployee,
  removeEmployee,
  setLoading,
  setError,
  resetEmployeesState,
} = employeesSlice.actions;

export default employeesSlice.reducer;
