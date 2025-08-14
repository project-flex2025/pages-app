// export interface User {
//   record_id: string;
//   feature_name?: string; // Made optional
//   user_credentials?: {
//     username?: string;
//     password?: string;
//     email?: string;
//   };
//   profile_information?: {
//     // Made optional
//     full_name?: string;
//     phone?: string;
//     profile_pic?: string;
//   };
//   created_by?: string; // Made optional
//   role_id?: number | string; // Made optional
//   control_access?: string; // Made optional
//   user_roles?: string[]; // Made optional
//   record_status?: string; // Added since you're using it

// }

export interface PermissionSubMenu {
  name: string;
  slug: string;
}

export interface UserPermission {
  name: string;
  slug: string;
  icon: string;
  sub_menus?: PermissionSubMenu[];
}

export interface MoreData {
  user_permissions?: UserPermission[];
  last_login?: string; // if you want to keep this too
}

export interface User {
  record_id: string;
  username: string;
  name?: string;
  role_id: string;
  control_access?: string;
  record_status?: string;
  user_credentials?: {
    username?: string;
    password?: string;
    email?: string;
  };
  profile_information?: {
    full_name?: string;
    phone?: string;
    profile_pic?: string; // ✅ Make sure this line exists
  };
  more_data?: MoreData;
  // Add these for UI convenience
  initials?: string;
  color?: string;
  
}


export interface Department {
  id: number;
  name: string;
}

export interface UserFormData {
  user_credentials: {
    username: string;
    password: string;
    email: string;
  };
  dep_id: number[];
  role_id: number | string;
  control_access: string;
  record_status: string;
  parent_id: string;
  profile_information: {
    full_name: string;
    phone: string;
    profile_pic: string;
  };
}
