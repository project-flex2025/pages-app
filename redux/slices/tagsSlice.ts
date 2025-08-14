import { decompressJson,compressJson } from "@/utils/decompress";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Tag {
  label: string;
  value: string;
  color: string;
}

interface TagsState {
  tags: Tag[];
  loading: boolean;
  error: string | null;
  isFetching: boolean;
}

const initialState: TagsState = {
  tags: [],
  loading: false,
  error: null,
  isFetching: false,
};

interface FetchTagsError {
  message: string;
}

interface UpdateTagsError {
  message: string;
}

// Async thunk for fetching tags
export const fetchTags = createAsyncThunk<
  Tag[], // Return type
  void, // No argument
  { rejectValue: FetchTagsError }
>("tags/fetchTags", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/sub_proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TYPE": "search",
      },
      body: JSON.stringify({
        conditions: [
          {
            field: "feature_name",
            search_type: "exact",
          },
          {
            field: "record_id",
            value: "control_panel",
            search_type: "exact",
          },
        ],
        combination_type: "and",
        dataset: "features",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.total_results > 0 && data.data.length > 0) {
      const { more_data } = data.data[0];
      if (more_data?.configuration?.tags) {
        const decodedTagString = decompressJson(more_data.configuration.tags);
        return decodedTagString ?? [];
      }
    }
    return [];
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue({ message: error.message });
    }
    return rejectWithValue({ message: "Failed to fetch tags" });
  }
});

// Async thunk for updating tags
export const updateTags = createAsyncThunk<
  Tag[], // Return type
  Tag[], // Argument type (tags array)
  { rejectValue: UpdateTagsError }
>("tags/updateTags", async (tags, { rejectWithValue }) => {
  try {
    const tagsString = JSON.stringify(tags);
    const encodedTags = compressJson(tagsString);

    const response = await fetch("/api/sub_proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TYPE": "update",
      },
      body: JSON.stringify({
        data: {
          record_id: "control_panel",
          fields_to_update: {
            more_data: {
              configuration: {
                tags: encodedTags,
                last_updated: new Date().toISOString().split("T")[0],
              },
            },
            record_status: "active",
          },
        },
        dataset: "features",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update tags");
    }

    return tags;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue({ message: error.message });
    }
    return rejectWithValue({ message: "Failed to update tags" });
  }
});

const tagsSlice = createSlice({
  name: "tags",
  initialState,
  reducers: {
    setTags: (state, action: PayloadAction<Tag[]>) => {
      state.tags = action.payload;
    },
    addTag: (state, action: PayloadAction<Tag>) => {
      state.tags.push(action.payload);
    },
    updateTag: (state, action: PayloadAction<{ index: number; tag: Tag }>) => {
      const { index, tag } = action.payload;
      if (index >= 0 && index < state.tags.length) {
        state.tags[index] = tag;
      }
    },
    deleteTag: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index >= 0 && index < state.tags.length) {
        state.tags.splice(index, 1);
      }
    },
    resetTagsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTags.pending, (state) => {
        state.isFetching = true;
        state.error = null;
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.isFetching = false;
        state.tags = action.payload;
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.isFetching = false;
        state.error = action.payload?.message || "Failed to fetch tags";
      })
      .addCase(updateTags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTags.fulfilled, (state, action) => {
        state.loading = false;
        state.tags = action.payload;
      })
      .addCase(updateTags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update tags";
      });
  },
});

export const { setTags, addTag, updateTag, deleteTag, resetTagsState } =
  tagsSlice.actions;

export default tagsSlice.reducer;
