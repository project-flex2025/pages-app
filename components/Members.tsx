import { useState, useEffect, useRef, useCallback } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { useSession } from "next-auth/react";
import { User, Department } from "../types/user";
import { decompressJson } from "@/utils/decompress";
import Select from "react-select";
import { sendLog } from "../utils/sendLog";

// Add this type for search conditions
type SearchCondition = {
  field?: string;
  value?: string | number;
  search_type?: string;
  combination_type?: "or" | "and";
  conditions?: SearchCondition[];
};

const Members: React.FC = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch<AppDispatch>();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loginSetting, setLoginSetting] = useState<Department[]>([]);
  const [userRoles, setUserRoles] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [assignedUsersData, setAssignedUsersData] = useState<string[]>([]);
  const [taskMembers, setTaskMembers] = useState<User[]>([]);
  const [hasFetchedMembers, setHasFetchedMembers] = useState(false);
  const [loadingTaskMembers, setLoadingTaskMembers] = useState(false);

  const userId = user?.record_id || session?.user?.id;
  const userRoleId = user?.role_id;

  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  console.log("departments", departments);
  console.log("loginSetting", loginSetting);
  console.log("assignedUsersData", assignedUsersData);
  console.log("taskMembers", taskMembers);
  console.log("taskMembers", taskMembers);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const fetchConfigurationData = useCallback(async () => {
    try {
      const response = await fetch("/api/sub_proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "search",
        },
        body: JSON.stringify({
          conditions: [
            { field: "feature_name", search_type: "exact" },
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

        if (more_data?.configuration?.departments) {
          try {
            const decodedDeptsString = decompressJson(
              more_data.configuration.departments
            );
            setDepartments(decodedDeptsString ?? []);
          } catch (decodeError) {
            console.error("Error decoding departments data:", decodeError);
          }
        }

        if (more_data?.configuration?.userroles) {
          try {
            const decodedRolesString = decompressJson(
              more_data.configuration.userroles
            );
            const allRoles = decodedRolesString ?? [];
            const loggedInUserRoleId = userRoleId || 0;
            const filteredRoles = allRoles.filter(
              (role: { id: number }) => role.id > Number(loggedInUserRoleId)
            );
            setUserRoles(filteredRoles);
          } catch (decodeError) {
            console.error("Error decoding user roles data:", decodeError);
          }
        }

        if (more_data?.configuration?.app_data) {
          try {
            const decodedAppDataString = decompressJson(
              more_data.configuration.app_data
            );
            setLoginSetting(decodedAppDataString ?? []);
          } catch (decodeError) {
            console.error("Error decoding app_data:", decodeError);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching configuration data:", error);
    }
  }, [userRoleId]);

  const fetchAssignedUsers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "search",
        },
        body: JSON.stringify({
          conditions: [
            {
              field: "feature_name",
              value: "task_management",
              search_type: "exact",
            },
            {
              field: "record_id",
              value: "client_0045",
              search_type: "exact",
            },
          ],
          combination_type: "and",
          page: 1,
          limit: 10,
          dataset: "features",
        }),
      });

      const result = await response.json();
      console.log("Assigned Users Response:", result);

      if (result.data && result.data.length > 0) {
        const assignedMembers = Array.isArray(result.data[0]?.members)
          ? result.data[0].members
          : [];
        setAssignedUsersData(assignedMembers);
        console.log("Assigned Members:", assignedMembers);

        // Always fetch task members, even if empty, to update UI immediately
        fetchTaskMembers(assignedMembers);
      } else {
        setAssignedUsersData([]);
        setTaskMembers([]);
      }
    } catch (error) {
      console.error("Error fetching assigned users:", error);
      setAssignedUsersData([]);
    } finally {
      setLoadingMembers(false);
      setHasFetchedMembers(true);
    }
  }, []);

  const fetchTaskMembers = async (memberIds: string[]) => {
    if (!memberIds || memberIds.length === 0) {
      setTaskMembers([]);
      setLoadingTaskMembers(false);
      return;
    }
    setLoadingTaskMembers(true);
    try {
      // Create conditions for each member ID
      const memberConditions = memberIds.map((id) => ({
        field: "record_id",
        value: id,
        search_type: "exact",
      }));

      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "search",
        },
        body: JSON.stringify({
          conditions: [
            {
              field: "feature_name",
              value: "user_management",
              search_type: "exact",
            },
            {
              combination_type: "or",
              conditions: memberConditions,
            },
          ],
          combination_type: "and",
          page: 1,
          limit: 10,
          dataset: "users",
        }),
      });

      const result = await response.json();
      console.log("Task Members Response:", result);

      if (result.data && result.data.length > 0) {
        setTaskMembers(result.data);
        console.log("Task Members:", result.data);
      } else {
        setTaskMembers([]);
      }
    } catch (error) {
      console.error("Error fetching task members:", error);
      setTaskMembers([]);
    } finally {
      setLoadingTaskMembers(false);
    }
  };

  // Add a user to the members array and update backend
  const addUserToMembers = async (newUserId: string) => {
    // If user already exists, do nothing
    if (assignedUsersData.includes(newUserId)) {
      setShowAddModal(false);
      setSelectedRole("");
      setSelectedUser(null);
      return;
    }
    const updatedMembers = Array.from(
      new Set([...assignedUsersData, newUserId])
    );

    try {
      const payload = {
        data: {
          record_id: userId,
          feature_name: "task_management",
          fields_to_update: {
            members: updatedMembers,
          },
        },
        dataset: "features",
      };

      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "update",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("Update members result:", result);

      // Update local state and refetch task members
      setAssignedUsersData(updatedMembers);
      fetchTaskMembers(updatedMembers);
      // Log member addition
      try {
        await sendLog({
          data: {
            record_id: `activity_log_${Date.now()}`,
            feature_name: "activity_logs",
            added_by: "editor_user",
            record_status: "active",
            created_on_date: new Date().toISOString().split("T")[0],
            feature_data: {
              record_data: [
                {
                  record_label: "category",
                  record_value_text: "members",
                  record_type: "type_text",
                },
                {
                  record_label: "user_id",
                  record_value_text: user?.record_id || "editor_user",
                  record_type: "type_text",
                },
                {
                  record_label: "user_role",
                  record_value_text: user?.role_id || "editor_user",
                  record_type: "type_text",
                },
                {
                  record_label: "action",
                  record_value_text: "add",
                  record_type: "type_text",
                },
                {
                  record_label: "member_id",
                  record_value_text: newUserId,
                  record_type: "type_text",
                },
              ],
            },
            more_data: {},
          },
          dataset: "feature_data",
        });
      } catch (logErr) {
        console.error("Failed to log member addition", logErr);
      }
    } catch (err) {
      console.error("Failed to update members", err);
    }
  };

  // Remove a user from the members array and update backend
  const removeUserFromMembers = async (removeUserId: string) => {
    const updatedMembers = assignedUsersData.filter(
      (id) => id !== removeUserId
    );
    try {
      const payload = {
        data: {
          record_id: userId,
          feature_name: "task_management",
          fields_to_update: {
            members: updatedMembers,
          },
        },
        dataset: "features",
      };
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "update",
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      console.log("Remove member result:", result);
      setAssignedUsersData(updatedMembers);
      fetchTaskMembers(updatedMembers);
      // Log member removal
      try {
        await sendLog({
          data: {
            record_id: `activity_log_${Date.now()}`,
            feature_name: "activity_logs",
            added_by: "editor_user",
            record_status: "active",
            created_on_date: new Date().toISOString().split("T")[0],
            feature_data: {
              record_data: [
                {
                  record_label: "category",
                  record_value_text: "members",
                  record_type: "type_text",
                },
                {
                  record_label: "user_id",
                  record_value_text: user?.record_id || "editor_user",
                  record_type: "type_text",
                },
                {
                  record_label: "user_role",
                  record_value_text: user?.role_id || "editor_user",
                  record_type: "type_text",
                },
                {
                  record_label: "action",
                  record_value_text: "remove",
                  record_type: "type_text",
                },
                {
                  record_label: "member_id",
                  record_value_text: removeUserId,
                  record_type: "type_text",
                },
              ],
            },
            more_data: {},
          },
          dataset: "feature_data",
        });
      } catch (logErr) {
        console.error("Failed to log member removal", logErr);
      }
    } catch (err) {
      console.error("Failed to remove member", err);
    }
  };

  const getRoleName = (roleId: string | number | undefined) => {
    if (roleId === undefined) return "Unknown";
    const role = userRoles.find((role) => role.id == String(roleId));
    return role ? role.name : "Unknown";
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const userSearchRef = useRef<HTMLInputElement>(null);

  const fetchUsers = useCallback(
    async (roleId?: string) => {
      setLoadingUsers(true);
      const baseConditions: SearchCondition[] = [
        {
          field: "feature_name",
          value: "user_management",
          search_type: "exact",
        },
      ];

      if (roleId) {
        baseConditions.push({
          field: "role_id",
          value: roleId,
          search_type: "exact",
        });
      } else if (String(userRoleId) === "0") {
        // No extra condition
      } else {
        const higherRoles = userRoles
          .filter((role) => Number(role.id) > Number(userRoleId))
          .map((role) => ({
            field: "role_id",
            value: role.id,
            search_type: "exact",
          }));
        if (higherRoles.length > 0) {
          baseConditions.push({
            combination_type: "or",
            conditions: higherRoles,
          });
        }
      }

      const body = {
        conditions: baseConditions,
        combination_type: "and" as const,
        page: 1,
        limit: 100,
        dataset: "users",
      };

      try {
        const res = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-TYPE": "search",
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        setUsers(data?.data || []);
      } catch (err) {
        console.error("Error fetching users", err);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    },
    [userRoleId, userRoles]
  );

  useEffect(() => {
    fetchConfigurationData();
    if (userId) {
      fetchAssignedUsers();
    }
  }, [userId, dispatch, fetchAssignedUsers, fetchConfigurationData]);

  useEffect(() => {
    fetchUsers(selectedRole);
  }, [userRoleId, selectedRole, fetchUsers]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userSearchRef.current &&
        !userSearchRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    }
    if (showUserDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserDropdown]);

  useEffect(() => {
    setSelectedUser(null);
  }, [selectedRole]);

  // For table rendering, filter taskMembers based on userRoleId
  const filteredTaskMembers = taskMembers.filter((user) =>
    String(userRoleId) === "0"
      ? true
      : Number(user.role_id) > Number(userRoleId)
  );

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  return (
    <>
      <div className="card custom-card rounded-card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="text-xl text-primary font-bold">
              Member Management
            </h4>
            <div
              className="d-flex align-items-center"
              style={{ position: "relative" }}
            >
              <button
                className="btn btn-primary ms-auto me-0"
                onClick={() => setShowAddModal(true)}
              >
                <i className="fa-solid fa-user-plus"></i>
              </button>
            </div>
          </div>
        </div>
        <div className="card-body pt-0">
          {/* Assigned Users Table (now the main table) */}
          <table className="table table-hover text-center">
            <thead className="table-head">
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingMembers || loadingTaskMembers ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    <div className="d-flex justify-content-center align-items-center">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2">Loading members...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTaskMembers.length > 0 ? (
                filteredTaskMembers.map((user, idx) => (
                  <tr key={user.record_id + "-" + idx}>
                    <td>{user.record_id}</td>
                    <td>{user.user_credentials?.username}</td>
                    <td>{user.user_credentials?.email}</td>
                    <td>{user.profile_information?.full_name}</td>
                    <td>{user.profile_information?.phone}</td>
                    <td>{getRoleName(user.role_id)}</td>
                    <td>
                      <button
                        className="btn btn-link text-danger p-0"
                        title="Remove user"
                        onClick={() => {
                          setUserToDelete(user);
                          setShowDeleteConfirmation(true);
                        }}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                hasFetchedMembers &&
                !loadingMembers &&
                !loadingTaskMembers && (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <p className="text-muted mb-3">No users assigned</p>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        <Modal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Add User</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Select Role</Form.Label>
                <Form.Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="">Select Role</option>
                  {userRoles
                    .filter((role) => Number(role.id) > Number(userRoleId))
                    .map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Select User</Form.Label>
                <Select
                  options={users
                    .filter((u) => {
                      // Exclude already assigned users
                      if (assignedUsersData.includes(u.record_id)) return false;
                      // Always only show users with a higher role than the current user
                      if (Number(u.role_id) <= Number(userRoleId)) return false;
                      // If a role is selected, also require the user's role to match
                      if (selectedRole)
                        return String(u.role_id) === String(selectedRole);
                      // If no role is selected, just the above filter is enough
                      return true;
                    })
                    .map((u) => ({
                      value: u.record_id,
                      label:
                        u.profile_information?.full_name ||
                        u.user_credentials?.username ||
                        u.user_credentials?.email ||
                        u.record_id,
                      user: u,
                    }))}
                  value={
                    selectedUser
                      ? {
                          value: selectedUser.record_id,
                          label:
                            selectedUser.profile_information?.full_name ||
                            selectedUser.user_credentials?.username ||
                            selectedUser.user_credentials?.email ||
                            selectedUser.record_id,
                          user: selectedUser,
                        }
                      : null
                  }
                  onChange={(option) => setSelectedUser(option?.user || null)}
                  isClearable
                  placeholder={
                    loadingUsers ? (
                      <span className="d-flex align-items-center">
                        <span
                          className="spinner-border spinner-border-sm text-primary me-2"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </span>
                        Loading users...
                      </span>
                    ) : (
                      "Select User"
                    )
                  }
                  isLoading={loadingUsers}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (selectedUser) {
                  addUserToMembers(selectedUser.record_id);
                }
                setShowAddModal(false);
                setSelectedRole("");
                setSelectedUser(null);
              }}
              disabled={!selectedUser}
            >
              Add
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
      {showDeleteConfirmation && userToDelete && (
        <div className="d-flex justify-content-center align-items-center">
          <div
            className="position-fixed"
            style={{
              left: "40%",
              top: "auto",
              bottom: "8px",
              transform: "none",
              zIndex: 1050,
              minWidth: "34%",
              right: "40%",
              background: "#343a40",
              color: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              userSelect: "none",
              backdropFilter: "blur(4px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button
                className="btn btn-link text-white p-0 close-create-task-btn"
                style={{
                  fontSize: 16,
                  textDecoration: "none",
                  border: "none",
                  background: "none",
                  padding: "4px 8px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  transition: "background 0.2s",
                }}
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setUserToDelete(null);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                title="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
              <span style={{ fontWeight: 500, fontSize: 16, marginRight: 24 }}>
                Remove member{" "}
                {userToDelete?.profile_information?.full_name ||
                  userToDelete?.user_credentials?.username ||
                  userToDelete?.user_credentials?.email ||
                  userToDelete?.record_id}
                ?
              </span>
            </div>
            <button
              className="btn btn-outline-light text-white btn-sm"
              onClick={() => {
                if (userToDelete) {
                  removeUserFromMembers(userToDelete.record_id);
                }
                setShowDeleteConfirmation(false);
                setUserToDelete(null);
              }}
              style={{
                borderRadius: 50,
                fontWeight: 500,
                fontSize: 14,
                width: "35px",
                height: "35px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                gap: 6,
              }}
            >
              <i
                className="fa-regular fa-trash-can"
                style={{ fontSize: 14 }}
              ></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Members;
