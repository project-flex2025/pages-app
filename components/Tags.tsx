"use client";

import { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import {
  fetchTags,
  updateTags,
  addTag,
  updateTag,
  deleteTag,
} from "../redux/slices/tagsSlice";
import { sendLog } from "@/utils/sendLog";

const COLOR_PALETTE = [
  { name: "primary", value: "#5c67f7" },
  { name: "primary1", value: "#e354d4" },
  { name: "primary2", value: "#ff5d9f" },
  { name: "primary3", value: "#ff8e6f" },
  { name: "secondary", value: "#9e5cf7" },
  { name: "success", value: "#21ce9e" },
  { name: "danger", value: "#fb4242" },
  { name: "warning", value: "#ffc658" },
  { name: "info", value: "#0ea5e8" },
  { name: "dark", value: "#0a0a0a" },
];

export default function Tags() {
  const dispatch = useDispatch<AppDispatch>();
  const { tags, loading, error, isFetching } = useSelector(
    (state: RootState) => state.tags
  );
  const currentUser = useSelector((state: RootState) => state.user.user);
  const [showModal, setShowModal] = useState(false);
  const [newTag, setNewTag] = useState({
    label: "",
    value: "",
    color: "#5c67f7",
  });
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null);
  const [showModalColorPicker, setShowModalColorPicker] = useState(false);

  // Refs for detecting outside clicks
  const tableColorPickerRef = useRef<HTMLDivElement>(null);
  const modalColorPickerRef = useRef<HTMLDivElement>(null);
  const tableColorSwatchRefs = useRef<(HTMLDivElement | null)[]>([]);
  const modalColorSwatchRef = useRef<HTMLDivElement>(null);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // For table color picker
      if (
        showColorPicker !== null &&
        tableColorPickerRef.current &&
        !tableColorPickerRef.current.contains(event.target as Node) &&
        !tableColorSwatchRefs.current[showColorPicker]?.contains(
          event.target as Node
        )
      ) {
        setShowColorPicker(null);
      }

      // For modal color picker
      if (
        showModalColorPicker &&
        modalColorPickerRef.current &&
        !modalColorPickerRef.current.contains(event.target as Node) &&
        !modalColorSwatchRef.current?.contains(event.target as Node)
      ) {
        setShowModalColorPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorPicker, showModalColorPicker]);

  useEffect(() => {
    dispatch(fetchTags());
  }, [dispatch]);

  const handleEditTag = (
    index: number,
    field: "label" | "value" | "color",
    newValue: string
  ) => {
    const updatedTag = { ...tags[index], [field]: newValue };
    dispatch(updateTag({ index, tag: updatedTag }));
  };

  const handleAddTag = async () => {
    if (!newTag.label.trim() || !newTag.value.trim()) return;
    await dispatch(
      addTag({
        label: newTag.label.trim(),
        value: newTag.value.trim(),
        color: newTag.color,
      })
    );
    // Log tag add
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
              record_value_text: "tags",
              record_type: "type_text",
            },
            {
              record_label: "user_id",
              record_value_text: currentUser?.record_id || "",
              record_type: "type_text",
            },
            {
              record_label: "user_role",
              record_value_text: currentUser?.role_id || "",
              record_type: "type_text",
            },
            {
              record_label: "action",
              record_value_text: "add",
              record_type: "type_text",
            },
            {
              record_label: "tags",
              record_value: [newTag.value.trim()],
              record_type: "type_array",
            },
          ],
        },
        more_data: {},
      },
      dataset: "feature_data",
    });
    setNewTag({ label: "", value: "", color: "#5c67f7" });
    setShowModal(false);
  };

  const handleDeleteTag = (index: number) => {
    dispatch(deleteTag(index));
  };

  const handleSaveTags = async () => {
    await dispatch(updateTags(tags));
    // Log tag update
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
              record_value_text: "tags",
              record_type: "type_text",
            },
            {
              record_label: "user_id",
              record_value_text: currentUser?.record_id || "",
              record_type: "type_text",
            },
            {
              record_label: "action",
              record_value_text: "update",
              record_type: "type_text",
            },
            {
              record_label: "tags",
              record_value: tags.map((t) => t.value),
              record_type: "type_array",
            },
          ],
        },
        more_data: {},
      },
      dataset: "feature_data",
    });
  };

  const toggleColorPicker = (index: number) => {
    setShowColorPicker(showColorPicker === index ? null : index);
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Tags Management</h5>
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
              disabled={isFetching}
            >
              <i className="fa-solid fa-user-tag"></i>
            </button>
          </div>

          {isFetching ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading tags...</p>
            </div>
          ) : (
            <>
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Color</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.length > 0 ? (
                    tags.map((tag, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={tag.label}
                            onChange={(e) =>
                              handleEditTag(index, "label", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center position-relative">
                            <div
                              ref={(el) => {
                                tableColorSwatchRefs.current[index] = el;
                              }}
                              className="color-display me-2"
                              style={{
                                width: "30px",
                                height: "30px",
                                backgroundColor: tag.color,
                                borderRadius: "4px",
                                cursor: "pointer",
                                border: "1px solid #ddd",
                              }}
                              onClick={() => toggleColorPicker(index)}
                            />
                            {/* <input
                              type="text"
                              className="form-control"
                              value={tag.color}
                              disabled
                              style={{ maxWidth: "100px" }}
                            /> */}
                            {showColorPicker === index && (
                              <div
                                className="color-palette-popover p-2 shadow-sm rounded"
                                ref={tableColorPickerRef}
                                style={{
                                  position: "absolute",
                                  zIndex: 1000,
                                  background: "white",
                                  top: "100%",
                                  left: 0,
                                  width: "200px",
                                }}
                              >
                                <div className="d-flex flex-wrap gap-2 mb-2">
                                  {COLOR_PALETTE.map((color) => (
                                    <div
                                      key={color.name}
                                      className="color-option"
                                      style={{
                                        width: "25px",
                                        height: "25px",
                                        backgroundColor: color.value,
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        border:
                                          tag.color === color.value
                                            ? "2px solid #333"
                                            : "1px solid #ddd",
                                      }}
                                      onClick={() => {
                                        handleEditTag(
                                          index,
                                          "color",
                                          color.value
                                        );
                                        setShowColorPicker(null);
                                      }}
                                      title={`${color.name} (${color.value})`}
                                    />
                                  ))}
                                </div>
                                <input
                                  type="color"
                                  className="form-control form-control-color"
                                  value={tag.color}
                                  onChange={(e) => {
                                    handleEditTag(
                                      index,
                                      "color",
                                      e.target.value
                                    );
                                    setShowColorPicker(null);
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteTag(index)}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center">
                        {error || "No tags found. Add your first tag!"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="mt-3">
                <button
                  className="btn btn-primary"
                  onClick={handleSaveTags}
                  disabled={loading || tags.length === 0}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
                {error && <div className="text-danger mt-2">{error}</div>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Tag Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Tag</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Label</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter label"
                    value={newTag.label}
                    onChange={(e) =>
                      setNewTag({ ...newTag, label: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Value</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter value"
                    value={newTag.value}
                    onChange={(e) =>
                      setNewTag({ ...newTag, value: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3 position-relative">
                  <label className="form-label">Color</label>
                  <div className="d-flex align-items-center">
                    <div
                      ref={modalColorSwatchRef}
                      className="color-display me-2"
                      style={{
                        width: "30px",
                        height: "30px",
                        backgroundColor: newTag.color,
                        borderRadius: "4px",
                        cursor: "pointer",
                        border: "1px solid #ddd",
                      }}
                      onClick={() =>
                        setShowModalColorPicker(!showModalColorPicker)
                      }
                    />
                    {/* <input
                      type="text"
                      className="form-control"
                      value={newTag.color}
                      disabled
                      style={{ maxWidth: "100px" }}
                    /> */}
                  </div>
                  {showModalColorPicker && (
                    <div
                      className="color-palette-popover p-2 shadow-sm rounded mt-2"
                      ref={modalColorPickerRef}
                      style={{
                        position: "absolute",
                        zIndex: 1000,
                        background: "white",
                        width: "200px",
                      }}
                    >
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {COLOR_PALETTE.map((color) => (
                          <div
                            key={color.name}
                            className="color-option"
                            style={{
                              width: "25px",
                              height: "25px",
                              backgroundColor: color.value,
                              borderRadius: "4px",
                              cursor: "pointer",
                              border:
                                newTag.color === color.value
                                  ? "2px solid #333"
                                  : "1px solid #ddd",
                            }}
                            onClick={() => {
                              setNewTag({ ...newTag, color: color.value });
                              setShowModalColorPicker(false);
                            }}
                            title={`${color.name} (${color.value})`}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={newTag.color}
                        onChange={(e) => {
                          setNewTag({ ...newTag, color: e.target.value });
                          setShowModalColorPicker(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddTag}
                  disabled={!newTag.label || !newTag.value}
                >
                  Add Tag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
