"use client";
import React, { useState, useRef, useEffect, CSSProperties } from "react";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  DragMoveEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { v4 as uuidv4 } from "uuid";

export type ItemType = {
  id: string;
  label: string;
  level: number;
  completed?: boolean;
  parentId?: string;
  placeholder?: boolean;
  disabled?: boolean;
};

type SortableItemProps = {
  item: ItemType;
  onLabelChange: (id: string, value: string) => void;
  onEnterKey: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  focusedId: string | null;
  showCheckbox: boolean;
};

export function SortableItem({
  item,
  onLabelChange,
  onEnterKey,
  onToggleComplete,
  onDelete,
  inputRefs,
  focusedId,
  showCheckbox,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    margin: "8px 1px",
    padding: "1px 0px",
    backgroundColor: "#fff",
    borderRadius: 6,
    marginLeft: `${item.level * 40}px`,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    opacity: item.placeholder ? 0.6 : 1,
    fontStyle: "normal",
  };

  useEffect(() => {
    if (focusedId === item.id && inputRefs.current[item.id]) {
      const input = inputRefs.current[item.id];
      input?.focus();
      input?.setSelectionRange(input.value.length, input.value.length);
    }
  }, [focusedId, item.id, inputRefs]);

  return (
    <div ref={setNodeRef} style={style}>
      {item.completed ? null : (
        <div {...attributes} {...listeners} style={{ cursor: "grab" }}>
          ☰
        </div>
      )}

      {showCheckbox ? (
        <input
          type="checkbox"
          checked={item.completed ?? false}
          onChange={() => !item.disabled && onToggleComplete(item.id)}
          disabled={item.disabled}
        />
      ) : (
        <span style={{ width: 16 }} />
      )}

      <input
        ref={(el) => {
          inputRefs.current[item.id] = el;
        }}
        className="form-control"
        value={item.label}
        type="text"
        disabled={item.placeholder}
        placeholder="Enter label..."
        onChange={(e) => onLabelChange(item.id, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnterKey(item.id);
          }
        }}
        style={{
          border: "none",
          outline: "none",
          width: "100%",
          fontSize: "16px",
          backgroundColor: "transparent",
          textDecoration: item.completed ? "line-through" : "none",
          paddingLeft: "2px",
          paddingRight: "4px",
        }}
      />

      {!item.placeholder && (
        <button
          onClick={() => onDelete(item.id)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      )}
    </div>
  );
}

// Props for main TaskTracker component
export type TaskTrackerProps = {
  notes: ItemType[];
  setItem: React.Dispatch<React.SetStateAction<ItemType[]>>;
};

export default function TaskTracker({ notes, setItem }: TaskTrackerProps) {
  const [items, setItems] = useState<ItemType[]>(notes || []);
  const sensors = useSensors(useSensor(PointerSensor));
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    setItem(items);
  }, [items, setItem]);

  console.log("items", items, "notes", notes);

  const addMainTask = () => {
    const id = uuidv4();
    setItems((prev) => [...prev, { id, label: "", level: 0 }]);
    setTimeout(() => setFocusedId(id), 10);
  };

  const onLabelChange = (id: string, value: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, label: value } : i))
    );
  };

  const onEnterKey = (id: string) => {
    const index = items.findIndex((i) => i.id === id);
    const current = items[index];

    if (!current) return;

    if (current.level === 0) {
      // Check if this parent already has children
      const hasChildren = items.some((i) => i.parentId === current.id);

      if (hasChildren) {
        // Add new child under this parent
        const childId = uuidv4();
        const newChild: ItemType = {
          id: childId,
          label: "",
          level: 1,
          parentId: current.id,
        };
        const newItems = [...items];
        newItems.splice(index + 1, 0, newChild);
        setItems(newItems);
        setTimeout(() => setFocusedId(childId), 10);
      } else {
        const newId = uuidv4();
        const newTask: ItemType = { id: newId, label: "", level: 0 };

        const newItems = [...items];
        newItems.splice(index + 1, 0, newTask);
        setItems(newItems);
        setTimeout(() => setFocusedId(newId), 10);
      }
    } else if (current.level === 1) {
      const childId = uuidv4();
      const newChild: ItemType = {
        id: childId,
        label: "",
        level: 1,
        parentId: current.parentId,
      };

      const newItems = [...items];
      newItems.splice(index + 1, 0, newChild);
      setItems(newItems);
      setTimeout(() => setFocusedId(childId), 10);
    }
  };

  const onDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id && i.parentId !== id));
  };

  const getSubTree = (id: string): ItemType[] => {
    const result: ItemType[] = [];
    const stack: string[] = [id];

    while (stack.length) {
      const currentId = stack.pop()!;
      const currentItem = items.find((i) => i.id === currentId);
      if (currentItem) {
        result.push(currentItem);
        const children = items
          .filter((i) => i.parentId === currentId)
          .map((i) => i.id);
        stack.push(...children);
      }
    }

    return result.sort(
      (a, b) =>
        items.findIndex((i) => i.id === a.id) -
        items.findIndex((i) => i.id === b.id)
    );
  };

  const promoteToParent = (item: ItemType) => {
    const index = items.findIndex((i) => i.id === item.id);
    const siblingsBelow = items
      .slice(index + 1)
      .filter((i) => i.parentId === item.parentId);
    const updated = items.map((i) => {
      if (i.id === item.id) return { ...i, level: 0, parentId: undefined };
      if (siblingsBelow.some((s) => s.id === i.id))
        return { ...i, parentId: item.id };
      return i;
    });
    setItems(updated);
  };

  const demoteToChild = (item: ItemType, newItems: ItemType[]) => {
    const index = newItems.findIndex((i) => i.id === item.id);
    if (index === -1 || index === 0) return;

    // ✅ Find the first non-placeholder parent ABOVE in the new sorted list
    const newParent = [...newItems]
      .slice(0, index) // only above
      .reverse()
      .find((i) => i.level === 0 && !i.placeholder);

    if (!newParent) return;

    // Update the item itself
    let updatedItems = newItems.map((i) => {
      if (i.id === item.id) {
        return { ...i, level: 1, parentId: newParent.id };
      }
      return i;
    });

    // Optional: If any children of the item exist, reparent them under new parent too
    updatedItems = updatedItems.map((i) => {
      if (i.parentId === item.id) {
        return { ...i, parentId: newParent.id };
      }
      return i;
    });

    // Update placeholders, if any
    updatedItems = updatedItems.map((i) => {
      if (i.placeholder && i.id === item.id) {
        return {
          ...i,
          id: newParent.id,
          label: newParent.label,
          level: 0,
          parentId: undefined,
        };
      }
      return i;
    });

    const seenPlaceholders = new Set<string>();
    updatedItems = updatedItems.filter((item) => {
      if (item.placeholder) {
        if (seenPlaceholders.has(item.id)) {
          return false;
        }
        seenPlaceholders.add(item.id);
      }
      return true;
    });

    setItems(updatedItems);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const deltaX = event.delta.x;
    const draggedId = event.active.id;
    const draggedItem = items.find((i) => i.id === draggedId);
    if (!draggedItem) return;

    if (deltaX > 40 && draggedItem.level === 0) {
      demoteToChild(draggedItem, items);
    }
    if (deltaX < -40 && draggedItem.level === 1) {
      promoteToParent(draggedItem);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const movedItem = items.find((i) => i.id === active.id);
    if (!movedItem) return;

    // Move the item to new position
    const newItems = arrayMove(items, oldIndex, newIndex);

    // Determine potential new parent (only if inside tree)
    const prevItem = newItems[newIndex - 1] ?? null;
    const nextItem = newItems[newIndex + 1] ?? null;

    let newParentId: string | undefined = undefined;

    const getRootAncestor = (id: string): string | undefined => {
      let current = items.find((i) => i.id === id);
      while (current && current.parentId) {
        current = items.find((i) => i.id === current!.parentId);
      }
      return current ? current.id : undefined;
    };

    const prevRoot = prevItem && getRootAncestor(prevItem.id);
    const nextRoot = nextItem && getRootAncestor(nextItem.id);

    if (prevRoot && prevRoot === nextRoot && prevRoot !== movedItem.id) {
      newParentId = prevRoot;
    }

    // Now apply your simplified rule:
    const updatedItems = newItems.map((item) => {
      // Update moved task
      if (item.id === movedItem.id) {
        return {
          ...item,
          parentId: newParentId,
          level: newParentId ? 1 : 0,
        };
      }

      // Update its immediate children
      if (item.parentId === movedItem.id) {
        return {
          ...item,
          parentId: newParentId,
          level: 1,
        };
      }

      return item;
    });

    setItems(updatedItems);
  };

  const toggleComplete = (id: string, completed: boolean) => {
    const subtree = getSubTree(id);
    let updated = [...items];
    updated = updated.map((i) => {
      if (subtree.some((s) => s.id === i.id)) {
        return { ...i, completed };
      }
      return i;
    });

    const changedItem = items.find((i) => i.id === id);
    if (!changedItem) return;
    if (!completed && changedItem.parentId) {
      const parent = items.find((i) => i.id === changedItem.parentId);
      if (parent && parent.completed) {
        updated = updated.map((i) => {
          if (i.id === parent.id || i.id === changedItem.id) {
            return { ...i, completed: false };
          }
          return i;
        });
      }
    }
    updated = updated.filter((i) => !i.placeholder);
    const completedChildrenMap = new Map<string, boolean>();
    for (const i of updated) {
      if (i.completed && i.parentId) {
        completedChildrenMap.set(i.parentId, true);
      }
    }

    for (const [parentId] of completedChildrenMap.entries()) {
      const parentInUpdated = updated.find(
        (i) => i.id === parentId && !i.placeholder
      );
      const alreadyHasPlaceholder = updated.some(
        (i) => i.id === parentId && i.placeholder
      );
      if (
        parentInUpdated &&
        !parentInUpdated.completed &&
        !alreadyHasPlaceholder
      ) {
        updated.push({
          ...parentInUpdated,
          completed: true,
          placeholder: true,
        });
      }
    }
    const placeholderIdsToRemove = updated
      .filter((i) => i.placeholder)
      .filter((placeholder) => {
        const stillHasCompletedChildren = updated.some(
          (child) =>
            child.parentId === placeholder.id &&
            child.completed &&
            !child.placeholder
        );
        return !stillHasCompletedChildren;
      })
      .map((i) => i.id);

    updated = updated.filter((i) => !placeholderIdsToRemove.includes(i.id));

    setItems(updated);
  };

  const completedItems = items
    .filter((i) => i.completed || i.placeholder)
    .sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      if (a.parentId === b.id) return 1;
      if (b.parentId === a.id) return -1;
      return 0;
    });

  const handleCheckboxToggle = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const completed = !(item.completed ?? false);
    toggleComplete(id, completed);
  };

  const creationItems = items.filter(
    (i) => !(i.completed ?? false) && !i.placeholder
  );

  const renderItems = (list: ItemType[]) => {
    const activeIds = new Set(creationItems.map((i) => i.id));
    const disabledIds = new Set<string>();
    const isCompletedArea =
      list.length > 0 && (list[0].completed || list[0].placeholder);

    if (isCompletedArea) {
      for (const item of list) {
        if (item.level === 0 && !item.placeholder) {
          const hasChildInCreation = items.some(
            (i) => i.parentId === item.id && activeIds.has(i.id)
          );
          if (hasChildInCreation) disabledIds.add(item.id);
        }
      }
    }

    return (
      <DndContext
        sensors={sensors}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={list.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {list.map((item) => {
            const isPlaceholder = item.placeholder;
            return (
              <SortableItem
                key={item.id + (isPlaceholder ? "-ph" : "")}
                item={{
                  ...item,
                  disabled: disabledIds.has(item.id),
                  placeholder: isPlaceholder,
                }}
                onLabelChange={onLabelChange}
                onEnterKey={onEnterKey}
                onToggleComplete={handleCheckboxToggle}
                onDelete={onDelete}
                inputRefs={inputRefs}
                focusedId={focusedId}
                showCheckbox={!isPlaceholder}
              />
            );
          })}
        </SortableContext>
      </DndContext>
    );
  };

  function reorderFlatList(items: ItemType[]): ItemType[] {
    const idToChildren = new Map<string, ItemType[]>();

    // Initialize map with empty arrays for all parents
    for (const item of items) {
      if (item.parentId) {
        if (!idToChildren.has(item.parentId)) {
          idToChildren.set(item.parentId, []);
        }
        idToChildren.get(item.parentId)!.push(item);
      }
    }

    const result: ItemType[] = [];

    // Loop through level 0 items (parents)
    for (const parent of items.filter((i) => i.level === 0)) {
      result.push(parent);
      const children = idToChildren.get(parent.id) || [];
      result.push(...children);
    }

    return result;
  }

  return (
    <div style={{ borderRadius: 8 }}>
      <div>
        {renderItems(creationItems)}
        <div
          onClick={addMainTask}
          style={{
            cursor: "pointer",
            color: "#5f6368", // muted gray
            display: "flex",
            alignItems: "center",
            fontSize: "14px",
            padding: "4px 0",
          }}
        >
          <span style={{ fontSize: "18px", marginRight: "6px" }}>+</span>
          <span>Add item</span>
        </div>

        {completedItems.length > 0 && (
          <>
            {/* <h3 style={{ marginTop: 30 }}>Completed Items</h3> */}
            <h6>Completed Items</h6>
            {renderItems(reorderFlatList(completedItems))}
          </>
        )}
        {/* with that noteId and type checkxbox store the items with same data structure we have after all operartions in localstorage  */}
        {/* <button
          onClick={() => {
            localStorage.setItem(
              `task-tracker-${noteId}`,
              JSON.stringify(items)
            );
            alert("Tasks saved to localStorage!");
          }}
          style={{ marginTop: 20 }}
        >
          Save Task
        </button> */}
      </div>
    </div>
  );
}
