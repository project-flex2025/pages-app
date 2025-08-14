import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { decompressJson } from '@/utils/decompress';

// Define structure of each app data item
export interface AppDataValue {
  value: string;
  type: string;
  validation?: {
    required: boolean;
    customValidation?: string;
    params?: Record<string, unknown>;
  };
  [key: string]: unknown;
}

// Entire appData object
export type AppData = Record<string, AppDataValue>;

interface AppDataState {
  appData: AppData;
  loading: boolean;
  error: string | null;
}

const initialState: AppDataState = {
  appData: {},
  loading: false,
  error: null,
};

// Thunk to fetch appData before login
export const fetchAppData = createAsyncThunk<AppData, void, { rejectValue: string }>(
  'appData/fetchAppData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/sub_proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-TYPE': 'search',
        },
        body: JSON.stringify({
          conditions: [
            { field: 'feature_name', search_type: 'exact' },
            { field: 'record_id', value: 'control_panel', search_type: 'exact' },
          ],
          combination_type: 'and',
          dataset: 'features',
        }),
      });

      const result = await response.json();

      if (result.total_results > 0 && result.data.length > 0) {
        const { more_data } = result.data[0];
        const rawAppData = more_data?.configuration?.app_data || '';
        const decoded: AppData = decompressJson(rawAppData) || {};
        return decoded;
      }

      return {};
    } catch {
      return rejectWithValue('Failed to fetch appData');
    }
  }
);

const appDataSlice = createSlice({
  name: 'appData',
  initialState,
  reducers: {
    clearAppData: (state) => {
      state.appData = {};
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppData.fulfilled, (state, action: PayloadAction<AppData>) => {
        state.appData = action.payload;
        state.loading = false;
      })
      .addCase(fetchAppData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

export const { clearAppData } = appDataSlice.actions;
export default appDataSlice.reducer;
