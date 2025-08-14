"use client";
import React, { useState, useRef, useEffect, KeyboardEvent } from "react";

interface SubItem {
  label: string;
  value: string;
  color?: string;
  badge?: string;
  isEditing?: boolean;
}

interface APIRecord {
  record_id: string;
  feature_name: string;
  created_on_date: string;
  feature_data: { record_data: unknown[] }; // If unknown shape, keep minimal
  more_data: {
    label: string;
    ispined: string;
    colorMode: string;
    badgeMode: string;
    items: SubItem[];
  };
}

interface Card {
  record_id?: string;
  title: string;
  sublist: SubItem[];
  ispined: boolean;
  colorMode: boolean;
  badgeMode: boolean;
  pinned?: boolean;
}

const DataCenter: React.FC = () => {
  const [title, setTitle] = useState<string>("");
  const [cards, setCards] = useState<Card[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null
  );
  const [subListItems, setSubListItems] = useState<SubItem[]>([]);
  const [colorMode, setColorMode] = useState<boolean>(false);
  const [badgeMode, setBadgeMode] = useState<boolean>(false);
  const inputRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [hoveredItemID, setHoveredItemID] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const generateValueFromLabel = (label: string) =>
    label.trim().toLowerCase().replace(/\s+/g, "_");

  // --- Create card ---
  const handleAdd = async () => {
    if (title.trim() === "") return;
    const record_id = `domain_${Date.now()}`;
    const nowDate = new Date();
    const newCard: Card = {
      record_id,
      title,
      sublist: [],
      ispined: false,
      colorMode: false,
      badgeMode: false,
    };

    setCards((prev) => [...prev, newCard]);
    setTitle("");

    const formattedData = {
      data: {
        record_id,
        feature_name: "data_center",
        created_on_date: nowDate.toISOString().split("T")[0],
        feature_data: { record_data: [] },
        more_data: {
          label: title,
          ispined: "false",
          colorMode: "false",
          badgeMode: "false",
          items: [],
        },
      },
      dataset: "feature_data",
    };

    try {
      await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "create",
        },
        body: JSON.stringify(formattedData),
      });
    } catch (error) {
      console.error("Failed to create card:", error);
    }
  };

  // --- Fetch cards from backend on mount ---
  useEffect(() => {
    const fetchCards = async () => {
      const body = {
        conditions: [
          {
            field: "feature_name",
            value: "data_center",
            search_type: "exact",
          },
        ],
        combination_type: "and",
        page: 1,
        limit: 100,
        dataset: "feature_data",
      };

      try {
        const response = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-API-TYPE": "search",
          },
          body: JSON.stringify(body),
        });
        const result: { total_results: number; data: APIRecord[] } =
          await response.json();
        if (result?.data) {
          const loadedCards: Card[] = result.data.map((record) => ({
            record_id: record.record_id,
            title: record.more_data.label,
            sublist: record.more_data.items || [],
            ispined: record.more_data.ispined === "true",
            colorMode: record.more_data.colorMode === "true",
            badgeMode: record.more_data.badgeMode === "true",
          }));
          setCards(loadedCards);
        }
      } catch (error) {
        console.error("Failed to fetch cards:", error);
      }
    };
    fetchCards();
  }, []);

  // --- Edit card ---
  const openModal = (index: number) => {
    const card = cards[index];
    if (!card) return;
    setSelectedCardIndex(index);
    setSubListItems(
      card.sublist.map((item) => ({
        label: item.label,
        value: item.value || generateValueFromLabel(item.label),
        color: item.color || "#000000",
        badge: item.badge || "#ffffff",
        isEditing: false,
      }))
    );
    setColorMode(card.colorMode);
    setBadgeMode(card.badgeMode);
    setShowModal(true);
    setTimeout(() => {
      inputRefs.current = [];
    }, 0);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCardIndex(null);
    setSubListItems([]);
    setColorMode(false);
    setBadgeMode(false);
  };

  const handleInputChange = (index: number, value: string) => {
    const updated = [...subListItems];
    updated[index].label = value;
    updated[index].value = generateValueFromLabel(value);
    setSubListItems(updated);
  };

  const handleColorChange = (index: number, color: string) => {
    const updated = [...subListItems];
    updated[index].color = color;
    setSubListItems(updated);
  };

  const handleBadgeColorChange = (index: number, color: string) => {
    const updated = [...subListItems];
    updated[index].badge = color;
    setSubListItems(updated);
  };

  const handleEdit = (index: number) => {
    const updated = [...subListItems];
    updated[index].isEditing = true;
    setSubListItems(updated);
  };

  const handleDelete = (index: number) => {
    const updated = [...subListItems];
    updated.splice(index, 1);
    setSubListItems(updated);
  };

  const handleAddMore = () => {
    setSubListItems((prev) => [
      ...prev,
      {
        label: "",
        value: "",
        color: "#000000",
        badge: "#ffffff",
        isEditing: true,
      },
    ]);
  };

  const handleEnterToAddMore = (
    e: KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Enter" && subListItems[idx].label.trim() !== "") {
      e.preventDefault();
      const updated = [...subListItems];
      updated[idx].isEditing = false;
      setSubListItems(updated);
      setTimeout(() => {
        setSubListItems((prev) => [
          ...prev,
          {
            label: "",
            value: "",
            color: "#000000",
            badge: "#ffffff",
            isEditing: true,
          },
        ]);
      }, 100);
    }
  };

  // --- Save edited card ---
  const handleSave = async () => {
    if (selectedCardIndex === null) return;
    const cardToUpdate = cards[selectedCardIndex];
    if (!cardToUpdate.record_id) {
      console.error("Missing record_id for the card, cannot update.");
      return;
    }
    const cleanList: SubItem[] = subListItems
      .filter((item) => item.label.trim() !== "")
      .map((item) => ({
        label: item.label,
        value: item.value,
        color: colorMode ? item.color : "#000000",
        badge: badgeMode ? item.badge : "#ffffff",
      }));

    const updatedMoreData = {
      label: cardToUpdate.title,
      ispined: colorMode ? "true" : "false",
      colorMode: colorMode ? "true" : "false",
      badgeMode: badgeMode ? "true" : "false",
      items: cleanList,
    };

    const payload = {
      data: {
        record_id: cardToUpdate.record_id,
        feature_name: "data_center",
        fields_to_update: { more_data: updatedMoreData },
      },
      dataset: "feature_data",
    };

    try {
      await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "update",
        },
        body: JSON.stringify(payload),
      });

      // Update React state locally
      const updatedCards = [...cards];
      updatedCards[selectedCardIndex] = {
        ...updatedCards[selectedCardIndex],
        sublist: cleanList,
        colorMode,
        badgeMode,
      };
      setCards(updatedCards);

      closeModal();
    } catch (error) {
      console.error("Failed to update card:", error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAdd();
  };

  // Click-outside to end editing or remove blank items
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const updated = [...subListItems];
      let changed = false;
      inputRefs.current.forEach((ref, idx) => {
        if (
          ref &&
          !(ref as HTMLElement).contains(event.target as Node) &&
          updated[idx] &&
          updated[idx].isEditing
        ) {
          if (updated[idx].label.trim() === "") {
            updated.splice(idx, 1);
          } else {
            updated[idx].isEditing = false;
          }
          changed = true;
        }
      });
      if (changed) setSubListItems(updated);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [subListItems]);

  // --- RENDER ---
  return (
    <div className="container">
      {/* Add Card */}
      <div className="row justify-content-center mt-5">
        <div className="col-md-6">
          <div
            className="d-flex align-items-center justify-content-between px-2 py-1"
            style={{
              borderRadius: 8,
              backgroundColor: "#fff",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
              fontSize: 16,
              color: "#5f6368",
              minHeight: 48,
            }}
          >
            <input
              type="text"
              className="form-control me-3"
              placeholder="Enter card title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="btn btn-primary" onClick={handleAdd}>
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div className="row mt-4">
        {cards.map((card, index) => {
          const showHoverActions =
            hoveredItemID === index || selectedItems.includes(index);
          const visibleSubList = card.sublist.slice(0, 8);

          return (
            <div
              className="col-sm-4 col-md-3 mb-3 position-relative"
              key={card.record_id || index}
              onMouseEnter={() => setHoveredItemID(index)}
              onMouseLeave={() => setHoveredItemID(null)}
            >
              {/* Select checkmark */}
              {showHoverActions && (
                <div
                  className="position-absolute"
                  style={{ top: -4, left: 10, zIndex: 20 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItems((prev) =>
                      prev.includes(index)
                        ? prev.filter((id) => id !== index)
                        : [...prev, index]
                    );
                  }}
                >
                  <i
                    className="fa-solid fa-circle-check"
                    style={{ fontSize: 18, cursor: "pointer" }}
                    title="Select Note"
                  />
                </div>
              )}

              {/* Card */}
              <div
                className="card h-100 shadow-sm d-flex flex-column"
                style={{
                  cursor: "pointer",
                  border: selectedItems.includes(index) ? "2px solid #000" : "",
                }}
                onClick={() => openModal(index)}
              >
                <div className="card-body">
                  <h5
                    className="mb-3"
                    style={{ fontSize: 20, fontWeight: 400, color: "#000" }}
                  >
                    {card.title}
                  </h5>
                  <ul className="mt-2 ps-3">
                    {visibleSubList.map((item, i) => (
                      <li key={i} className="fs-6">
                        <span
                          style={{
                            color: item.color || "#000",
                            backgroundColor: item.badge || "transparent",
                            padding: "2px 8px",
                            borderRadius: 8,
                            display: "inline-block",
                          }}
                        >
                          {item.label}
                        </span>
                      </li>
                    ))}
                    {card.sublist.length > 8 && (
                      <li
                        className="text-muted fst-italic"
                        style={{ fontSize: 14 }}
                      >
                        more...
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Edit Modal */}
      {showModal && selectedCardIndex !== null && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header justify-content-between">
                <h5 className="modal-title">
                  {cards[selectedCardIndex].title}
                </h5>
                <div className="d-flex align-items-center gap-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={colorMode}
                      onChange={() => setColorMode(!colorMode)}
                      id="colorToggle"
                    />
                    <label className="form-check-label" htmlFor="colorToggle">
                      Text Color
                    </label>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={badgeMode}
                      onChange={() => setBadgeMode(!badgeMode)}
                      id="badgeToggle"
                    />
                    <label className="form-check-label" htmlFor="badgeToggle">
                      Badge Color
                    </label>
                  </div>
                  <button className="btn-close" onClick={closeModal}></button>
                </div>
              </div>
              <div className="modal-body">
                {subListItems.map((item, idx) => (
                  <div className="d-flex align-items-center mb-2" key={idx}>
                    {item.isEditing ? (
                      <div
                        className="input-group w-100"
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                      >
                        <input
                          type="text"
                          className="form-control rounded-start-5 rounded-end-5"
                          placeholder="List item label"
                          value={item.label}
                          onChange={(e) =>
                            handleInputChange(idx, e.target.value)
                          }
                          onKeyDown={(e) => handleEnterToAddMore(e, idx)}
                          autoFocus
                        />
                        {colorMode && (
                          <div
                            title="Text Color"
                            style={{
                              width: 36,
                              height: 36,
                              overflow: "hidden",
                              borderRadius: "50%",
                              marginLeft: 5,
                              border: "1px solid gray",
                            }}
                          >
                            <input
                              type="color"
                              value={item.color || "#000000"}
                              onChange={(e) =>
                                handleColorChange(idx, e.target.value)
                              }
                              className="form-control p-0"
                              style={{
                                width: "100%",
                                height: "100%",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                              }}
                            />
                          </div>
                        )}
                        {badgeMode && (
                          <div
                            title="Badge Background"
                            style={{
                              width: 36,
                              height: 36,
                              overflow: "hidden",
                              borderRadius: "50%",
                              marginLeft: 5,
                              border: "1px solid gray",
                            }}
                          >
                            <input
                              type="color"
                              value={item.badge || "#ffffff"}
                              onChange={(e) =>
                                handleBadgeColorChange(idx, e.target.value)
                              }
                              className="form-control p-0"
                              style={{
                                width: "100%",
                                height: "100%",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="d-flex justify-content-between w-100 align-items-center border p-2 ps-3 pe-3 rounded-start-5 rounded-end-5"
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                      >
                        <span
                          style={{
                            color: colorMode ? item.color : "#000",
                            backgroundColor: badgeMode
                              ? item.badge
                              : "transparent",
                            borderRadius: 4,
                            padding: "2px 6px",
                          }}
                        >
                          {item.label}
                        </span>
                        <div>
                          <i
                            className="bi bi-pencil me-2"
                            role="button"
                            onClick={() => handleEdit(idx)}
                          />
                          <i
                            className="bi bi-trash"
                            role="button"
                            onClick={() => handleDelete(idx)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  className="btn btn-link p-0 mt-2"
                  onClick={handleAddMore}
                >
                  + Add More
                </button>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataCenter;
