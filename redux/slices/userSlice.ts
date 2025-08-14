import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  record_id: string;
  username: string;
  role_id: string;
  control_access?: string;
  user_credentials?: {
    username: string;
    password: string;
    email: string;
  };
  profile_information?: {
    full_name?: string;
    phone?: string;
    profile_pic?: string;
  };
  more_data?: {
    user_permissions?: {
      name: string;
      slug: string;
      icon: string;
      sub_menus?: {
        name: string;
        slug: string;
        icon: string;
      }[];
    }[];
  };
}

interface UserState {
  user: User | null;
}

const initialState: UserState = {
  user: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    logoutUser: (state) => {
      state.user = null;
    },
    // ✅ New reducer to update profile picture only
    updateUserProfilePic: (state, action: PayloadAction<string>) => {
      if (state.user && state.user.profile_information) {
        state.user.profile_information.profile_pic = action.payload;
      }
    },
  },
});

export const { setUser, logoutUser, updateUserProfilePic } = userSlice.actions;
export default userSlice.reducer;
