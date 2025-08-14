import { useState, useEffect } from "react";
import { Table, Form } from "react-bootstrap";
import ControlPanelModal from "./ControlPanel";
import { useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";
import { fetchEmployees } from "../redux/slices/employeesSlice";
import { User, Department, UserFormData } from "../types/user";
import { decompressJson } from "@/utils/decompress";
import { convertToPng } from "@/utils/imageUtils";
// import Image from "next/image";

const UserCreate: React.FC = () => {
  const loginUserState = useSelector((state: RootState) => state.loginUser) ?? {
    user: null,
    status: "idle",
    error: null,
  }; // safe fallback
  const { user } = loginUserState;
  const dispatch = useDispatch<AppDispatch>();
  const employees = useSelector(
    (state: RootState) => state.employees.employees
  );

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loginSetting, setLoginSetting] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>(
    []
  );

  const [userRoles, setUserRoles] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [recordId, setRecordId] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const isFetching = useSelector(
    (state: RootState) => state.employees.isFetching
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // const [uploading, setUploading] = useState(false);

  // console.log("user roles", userRoles);
  const [filteredUplineUsers, setFilteredUplineUsers] = useState<User[]>([]);
  const { data: session } = useSession();

  const [formData, setFormData] = useState<UserFormData>({
    user_credentials: {
      username: "",
      password: "",
      email: "",
    },
    dep_id: [],
    role_id: "",
    control_access: "",
    record_status: "",
    parent_id: user?.record_id || "",
    profile_information: {
      full_name: "",
      phone: "",
      profile_pic: "",
    },
  });

  const userId = user?.record_id || session?.user?.id;
  const userRoleId = user?.role_id;
  // const userDeptIds=user?.dep_id;

  useEffect(() => {
    if (userId) {
      setFormData((prev) => ({ ...prev, parent_id: userId }));
      dispatch(fetchEmployees(userId)); // Add this line to fetch employees on mount
    }

    // fetchDepartments();
    // fetchUsersRoles();
    fetchConfigurationData();
  }, [userId, dispatch]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const pngFile = await convertToPng(file);
      setSelectedFile(pngFile); // 👈 set the converted PNG file

      const previewUrl = URL.createObjectURL(pngFile);
      setPreviewUrl(previewUrl);

      setFormData((prev) => ({
        ...prev,
        profile_information: {
          ...prev.profile_information,
          profile_pic: previewUrl,
        },
      }));
    } catch (error) {
      console.error("Image conversion failed:", error);
    }
  };

  // const uploadImage = async (): Promise<string | null> => {
  //   if (!selectedFile) return null;
  //   // setUploading(true);
  //   try {
  //     const formDataUpload = new FormData();
  //     formDataUpload.append("file", selectedFile);

  //     const res = await fetch("/api/upload", {
  //       method: "POST",
  //       body: formDataUpload,
  //     });

  //     const data = await res.json();
  //     // setUploading(false);

  //     if (res.ok && data.url) {
  //       return data.url; // URL of uploaded image
  //     } else {
  //       alert(data.error || "Image upload failed");
  //       return null;
  //     }
  //   } catch (error) {
  //     // setUploading(false);
  //     console.log(error);
  //     alert("Upload error");
  //     return null;
  //   }
  // };

  // const uploadImage = async (): Promise<string | null> => {
  //   if (!selectedFile) return null;

  //   try {
  //     const formDataUpload = new FormData();
  //     formDataUpload.append("file", selectedFile);

  //     const safeName = formData.profile_information.full_name || "guest";

  //     formDataUpload.append("safeName", safeName);
  //     formDataUpload.append("uniqueId", userId || "unknown");

  //     const res = await fetch("/api/upload", {
  //       method: "POST",
  //       body: formDataUpload,
  //     });

  //     const data = await res.json();

  //     if (res.ok && data.url) {
  //       return data.url; // URL of uploaded image
  //     } else {
  //       alert(data.error || "Image upload failed");
  //       return null;
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     alert("Upload error");
  //     return null;
  //   }
  // };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile || !userId) return null;

    const formDataUpload = new FormData();
    formDataUpload.append("file", selectedFile); // This is now a PNG!
    formDataUpload.append("safeName", "profile");
    formDataUpload.append("uniqueId", userId);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formDataUpload,
    });

    const data = await res.json();
    return res.ok && data.url ? data.url : null;
  };

  const fetchConfigurationData = async () => {
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

      const result = await response.json();

      if (result.total_results > 0 && result.data.length > 0) {
        const { more_data } = result.data[0];

        console.log("login settings", more_data);

        // Process departments (base64 decoded)
        if (more_data?.configuration?.departments) {
          try {
            const decodedDeptsString = decompressJson(
              more_data.configuration.departments
            );

            const departmentsArray = decodedDeptsString
              ? decodedDeptsString
              : [];
            // console.log("data 3", departmentsArray);
            setDepartments(departmentsArray);
          } catch (decodeError) {
            console.error("Error decoding departments data:", decodeError);
          }
        }

        // Process user roles (filtered based on logged-in user's role)
        if (more_data?.configuration?.userroles) {
          try {
            const decodedRolesString = decompressJson(
              more_data.configuration.userroles
            );
            const allRoles = decodedRolesString ? decodedRolesString : [];

            // Get the logged-in user's role_id (example: stored in localStorage)
            const loggedInUserRoleId = userRoleId || 0; // Default to 0 if not provided

            // Filter roles where role.id > current user's role_id
            const filteredRoles = allRoles.filter(
              (role: { id: number }) => role.id > Number(loggedInUserRoleId)
            );

            setUserRoles(filteredRoles);
          } catch (decodeError) {
            console.error("Error decoding user roles data:", decodeError);
          }
        }

        // Process app_data (base64 decoded)
        if (more_data?.configuration?.app_data) {
          try {
            const decodedAppDataString = decompressJson(
              more_data.configuration.app_data
            );

            const appDataArray = decodedAppDataString
              ? decodedAppDataString
              : [];
            // console.log("data 3", departmentsArray);
            setLoginSetting(appDataArray);
          } catch (decodeError) {
            console.error("Error decoding departments data:", decodeError);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching configuration data:", error);
    }
  };

  console.log("login setting from user", loginSetting);
  console.log("login setting from user222", user);

  useEffect(() => {
    if (user && "dep_id" in user && user.dep_id && departments.length > 0) {
      const userDeptIds = Array.isArray(user.dep_id)
        ? user.dep_id
        : [user.dep_id];
      const filtered = departments.filter((dept) =>
        userDeptIds.includes(dept.id)
      );
      setFilteredDepartments(filtered);
    }
  }, [user, departments]);

  useEffect(() => {
    setRecordId(`user_${Date.now()}`);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      user_credentials: { ...prev.user_credentials, [name]: value },
    }));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      profile_information: { ...prev.profile_information, [name]: value },
    }));
  };

  // const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const selectedOptions = Array.from(e.target.selectedOptions, (option) =>
  //     Number(option.value)
  //   );
  //   setFormData((prev) => ({ ...prev, dep_id: selectedOptions }));
  // };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const numericValue = Number(value);

    setFormData((prev) => {
      // Create a new array based on current selection
      let newDepartments = [...(prev.dep_id || [])];

      if (checked) {
        // Add department if checked and not already present
        if (!newDepartments.includes(numericValue)) {
          newDepartments.push(numericValue);
        }
      } else {
        // Remove department if unchecked
        newDepartments = newDepartments.filter((id) => id !== numericValue);
      }

      return { ...prev, dep_id: newDepartments };
    });
  };

  console.log("user depart", user);

  const handleOpenModal = () => {
    setRecordId(`user_${Date.now()}`);
    setShowModal(true);
  };
  // Add this function inside your component (before the return statement)
  const getRoleName = (roleId: string | number | undefined) => {
    if (roleId === undefined) return "Unknown";
    const role = userRoles.find((role) => role.id == String(roleId));
    return role ? role.name : "Unknown";
  };

  const handleOpenUserModal = (recordId: string, userName: string) => {
    setSelectedUserId(recordId);
    setSelectedUserName(userName);

    setShowUserModal(true);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      role_id: e.target.value,
    }));
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   if (!formData.role_id) {
  //     alert("Please select a role before submitting.");
  //     return;
  //   }

  //   const payload = {
  //     data: {
  //       record_id: recordId,
  //       feature_name: "user_management",
  //       created_on_date: new Date().toISOString().split("T")[0],
  //       feature_data: { record_data: [] },
  //       user_credentials: formData.user_credentials,
  //       dep_id: formData.dep_id,
  //       role_id: formData.role_id,
  //       control_access: "active",
  //       parent_id: formData.parent_id || user?.record_id,
  //       profile_information: formData.profile_information,
  //       created_by: user?.record_id,
  //       record_status: "active",
  //       doc_position: 6,
  //       more_data: {
  //         last_login: new Date().toISOString(),
  //         user_permissions: "",
  //       },
  //     },
  //     dataset: "users",
  //   };

  //   const res = await fetch("/api/proxy", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       "X-API-TYPE": "create",
  //     },
  //     body: JSON.stringify(payload),
  //   });

  //   const result = await res.json();
  //   console.log(result);
  //   // alert("User Created Successfully!");
  //   setShowModal(false);
  //   if (userId) {
  //     dispatch(fetchEmployees(userId));
  //   } else {
  //     console.error("User ID is undefined");
  //   }
  // };

  // New function to handle toggle switch and update control_access

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.role_id) {
      alert("Please select a role before submitting.");
      return;
    }

    let uploadedImageUrl = formData.profile_information.profile_pic; // existing pic url or ""

    if (selectedFile) {
      const url = await uploadImage();
      if (!url) return; // stop if upload failed
      uploadedImageUrl = url;
    }

    const payload = {
      data: {
        record_id: recordId,
        feature_name: "user_management",
        created_on_date: new Date().toISOString().split("T")[0],
        feature_data: { record_data: [] },
        user_credentials: formData.user_credentials,
        dep_id: formData.dep_id,
        role_id: formData.role_id,
        control_access: "active",
        parent_id: formData.parent_id || user?.record_id,
        profile_information: {
          ...formData.profile_information,
          profile_pic: uploadedImageUrl,
        },
        created_by: user?.record_id,
        record_status: "active",
        doc_position: 6,
        more_data: {
          last_login: new Date().toISOString(),
          user_permissions: "",
        },
      },
      dataset: "users",
    };

    const res = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TYPE": "create",
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    console.log(result);
    setFormData({
      user_credentials: {
        username: "",
        password: "",
        email: "",
      },
      dep_id: [],
      role_id: "",
      control_access: "",
      record_status: "",
      parent_id: user?.record_id || "",
      profile_information: {
        full_name: "",
        phone: "",
        profile_pic: "",
      },
    });

    setShowModal(false);
    setSelectedFile(null);
    if (userId) {
      dispatch(fetchEmployees(userId));
    } else {
      console.error("User ID is undefined");
    }
  };

  const handleToggleUserAccess = async (
    recordId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      const updatePayload = {
        data: {
          record_id: recordId,
          feature_name: "user_management", // Add this field
          fields_to_update: {
            record_status: newStatus,
          },
        },
        dataset: "users",
      };

      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "update",
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error("API Error Response:", errorResponse);
        alert(`Failed to update control access: ${errorResponse.error}`);
        return;
      }

      const result = await response.json();

      if (result.status) {
        alert("Control access updated successfully!");
        if (userId) {
          dispatch(fetchEmployees(userId));
        } else {
          console.error("User ID is undefined");
        }
      } else {
        console.error("API Response indicates failure:", result);
        alert("Failed to update control access.");
      }
    } catch (error) {
      console.error("Error updating control access:", error);
      alert("An error occurred while updating control access.");
    }
  };
  const handleToggleControlAccess = async (
    recordId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      const updatePayload = {
        data: {
          record_id: recordId,
          feature_name: "user_management", // Add this field
          fields_to_update: {
            control_access: newStatus,
          },
        },
        dataset: "users",
      };

      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "update",
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error("API Error Response:", errorResponse);
        alert(`Failed to update control access: ${errorResponse.error}`);
        return;
      }

      const result = await response.json();

      if (result.status) {
        alert("Control access updated successfully!");
        if (userId) {
          dispatch(fetchEmployees(userId));
        } else {
          console.error("User ID is undefined");
        }
      } else {
        console.error("API Response indicates failure:", result);
        alert("Failed to update control access.");
      }
    } catch (error) {
      console.error("Error updating control access:", error);
      alert("An error occurred while updating control access.");
    }
  };

  useEffect(() => {
    if (formData.role_id && employees.length > 0) {
      // Filter employees whose role_id is less than the selected role_id
      const filtered = employees.filter(
        (emp) => Number(emp.role_id) < Number(formData.role_id)
      );
      setFilteredUplineUsers(filtered);
    } else {
      // If no role is selected or no employees, show all
      setFilteredUplineUsers(employees);
    }
  }, [formData.role_id, employees]);

  console.log("departments", departments);

  return (
    <div className="container mx-auto p-4">
      {/* <h2 className="text-xl font-bold mb-4">Users List</h2> */}
      <div className="d-flex justify-content-between align-items-center">
        <h4 className="text-xl text-primary font-bold">Users List</h4>
        <button
          className="btn btn-primary mb-3 ms-auto me-0"
          onClick={handleOpenModal}
        >
          <i className="fa-solid fa-user-plus"></i>
        </button>
      </div>

      <Table bordered hover>
        <thead className="table-secondary">
          <tr>
            <th>ID</th>
            {/* <th>Profile</th> */}
            <th>Username</th>
            <th>Email</th>
            <th>Full Name</th>
            <th>Phone</th>
            <th>Role</th>
            <th>User Status</th>
            <th>Access</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isFetching ? (
            // Loading state - shows first
            <tr>
              <td colSpan={9} className="text-center">
                <div className="d-flex justify-content-center align-items-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="ms-2">Loading ...</span>
                </div>
              </td>
            </tr>
          ) : employees.length > 0 ? (
            // Data loaded successfully - show employees
            employees.map((user: User) => (
              <tr key={user.record_id}>
                <td>{user.record_id}</td>
                {/* <td>
                  <Image
                    src={user.profile_information?.profile_pic || ""}
                    alt="profile image"
                    width={50}
                    height={50}
                  />
                </td> */}
                <td>{user.user_credentials?.username}</td>
                <td>{user.user_credentials?.email}</td>
                <td>{user.profile_information?.full_name}</td>
                <td>{user.profile_information?.phone}</td>
                <td>{getRoleName(user?.role_id)}</td>
                <td>
                  <Form.Check
                    type="switch"
                    id={`control-access-switch-${user.record_id}`}
                    checked={user.record_status === "active"}
                    onChange={() => {
                      if (user.record_status) {
                        handleToggleUserAccess(
                          user.record_id,
                          user.record_status
                        );
                      }
                    }}
                  />
                </td>
                <td>
                  <Form.Check
                    type="switch"
                    id={`control-access-switch-${user.record_id}`}
                    checked={user.control_access === "active"}
                    onChange={() => {
                      if (user.control_access) {
                        handleToggleControlAccess(
                          user.record_id,
                          user.control_access
                        );
                      }
                    }}
                  />
                </td>
                <td>
                  <i
                    className="fa-solid fa-gear text-primary fs-4"
                    onClick={() =>
                      handleOpenUserModal(
                        user.record_id,
                        user.profile_information?.full_name || "Unknown User"
                      )
                    }
                  ></i>
                </td>
              </tr>
            ))
          ) : (
            // No data found state - only shows after loading completes
            <tr>
              <td colSpan={9} className="text-center py-4">
                <div className="d-flex flex-column align-items-center">
                  <p className="text-muted mb-3">No users found</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {showUserModal && (
        <ControlPanelModal
          showUserModal={showUserModal}
          setShowUserModal={setShowUserModal}
          selectedUserId={selectedUserId || ""} // Fallback to empty string
          selectedUserName={selectedUserName || ""} // Fallback to empty string
        />
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add New User</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <form
                    onSubmit={handleSubmit}
                    className="needs-validation"
                    noValidate
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: "1rem",
                      }}
                    >
                      <label
                        htmlFor="file-upload"
                        style={{
                          cursor: "pointer",
                          borderRadius: "50%",
                          width: "120px",
                          height: "120px",
                          overflow: "hidden",
                          border: "2px solid #007bff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#f8f9fa",
                        }}
                        title="Click to select profile picture"
                      >
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Profile Preview"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <span style={{ color: "#007bff" }}>
                            Upload Profile Pic
                          </span>
                        )}
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>

                    <div className="row">
                      <div className="col-lg-6 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Full Name</label>
                          <input
                            type="text"
                            name="full_name"
                            value={formData.profile_information.full_name}
                            onChange={handleProfileChange}
                            className="form-control"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6 col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">Username</label>
                          <input
                            type="text"
                            name="username"
                            value={formData.user_credentials.username}
                            onChange={handleChange}
                            className="form-control"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Phone</label>
                          <input
                            type="text"
                            name="phone"
                            value={formData.profile_information.phone}
                            onChange={handleProfileChange}
                            className="form-control"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.user_credentials.email}
                            onChange={handleChange}
                            className="form-control"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Password</label>
                          <input
                            type="password"
                            name="password"
                            value={formData.user_credentials.password}
                            onChange={handleChange}
                            className="form-control"
                            required
                          />
                        </div>
                      </div>

                      <div className="col-lg-6 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Select Departments{" "}
                            {formData.dep_id?.length
                              ? `(${formData.dep_id.length} selected)`
                              : ""}
                          </label>
                          <div
                            className="border p-3 rounded"
                            style={{ maxHeight: "200px", overflowY: "auto" }}
                          >
                            {filteredDepartments.map((dept) => (
                              <div key={dept.id} className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`dept-${dept.id}`}
                                  value={dept.id}
                                  onChange={handleDepartmentChange}
                                  checked={
                                    formData.dep_id?.includes(dept.id) || false
                                  }
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor={`dept-${dept.id}`}
                                >
                                  {dept.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Select Role</label>
                          <select
                            name="role_id"
                            value={formData.role_id}
                            onChange={handleRoleChange}
                            className="form-select"
                          >
                            <option value="">Select Role</option>
                            {userRoles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Select Upline User
                          </label>
                          <select
                            name="parent_id"
                            value={formData.parent_id}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                parent_id: e.target.value,
                              })
                            }
                            className="form-select"
                          >
                            {user && (
                              <option
                                value={
                                  (user as { record_id?: string })?.record_id
                                }
                              >
                                {
                                  (
                                    user as {
                                      profile_information?: {
                                        full_name?: string;
                                      };
                                    }
                                  )?.profile_information?.full_name
                                }{" "}
                                (You)
                              </option>
                            )}
                            {filteredUplineUsers.map((user: User) => (
                              <option
                                key={user.record_id}
                                value={user.record_id}
                              >
                                {user.user_credentials?.username}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-center">
                      <button
                        type="submit"
                        className="btn btn-primary btn-rounded w-50"
                      >
                        Create User
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCreate;
