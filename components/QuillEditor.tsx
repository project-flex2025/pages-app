"use client";
import { useEffect, useRef } from "react";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

// interface QuillEditorProps {
//   quilleditor: string | null;
//   setQuillEditor: (value: string) => void;
// }

// export default function QuillEditor({
//   quilleditor,
//   setQuillEditor,
// }: QuillEditorProps) {
//   const { quill, quillRef } = useQuill({
//     modules: {
//       toolbar: {
//         container: "#toolbar",
//       },
//       history: {
//         delay: 500,
//         maxStack: 100,
//         userOnly: true,
//       },
//     },
//     theme: "snow",
//   });

//   // Set undo/redo buttons
//   useEffect(() => {
//     if (quill) {
//       const undoButton = document.getElementById("undo-button");
//       const redoButton = document.getElementById("redo-button");

//       if (undoButton) undoButton.onclick = () => quill.history.undo();
//       if (redoButton) redoButton.onclick = () => quill.history.redo();
//     }
//   }, [quill]);

//   // Sync content from editor to parent state
//   // useEffect(() => {
//   //   if (quill) {
//   //     setQuillEditor(quill.root.innerHTML);
//   //   }
//   // }, [quill, setQuillEditor]);

//   // Trigger setQuillEditor when editor content changes
//   useEffect(() => {
//     if (quill) {
//       // quill.on("text-change", () => {
//       setQuillEditor(quill.root.innerHTML);
//       // });
//     }
//   }, [quill, setQuillEditor]);

//   // useEffect(() => {
//   //   if (quill && quilleditor) {
//   //     const delta = quill.clipboard.convert({ html: quilleditor });
//   //     quill.setContents(delta, "silent");
//   //     quill.root.setAttribute("dir", "ltr"); // Optional: force left-to-right
//   //   }
//   // }, [quill, quilleditor]);

//   useEffect(() => {
//     if (quill && quilleditor) {
//       const delta = quill.clipboard.convert({ html: quilleditor });
//       quill.setContents(delta, "silent");
//     }
//   }, [quill, quilleditor]);

//   return (
//     <div>
//       <div
//         id="toolbar"
//         style={{
//           border: "1px solid #ccc",
//           display: "flex",
//           alignItems: "center",
//           padding: "8px",
//           backgroundColor: "#f9f9f9",
//           borderRadius: "6px",
//           marginBottom: "8px",
//           gap: "0px",
//           flexWrap: "wrap",
//         }}
//       >
//         <select className="ql-header" defaultValue="">
//           <option value="1">Heading 1</option>
//           <option value="2">Heading 2</option>
//           <option value="3">Heading 3</option>
//           <option value="">Normal</option>
//         </select>

//         <button className="ql-bold" />
//         <button className="ql-italic" />
//         <button className="ql-underline" />
//         <button className="ql-strike" />

//         <select className="ql-color" />
//         <select className="ql-background" />

//         <button className="ql-list" value="bullet" />
//         <button className="ql-list" value="ordered" />

//         <select className="ql-align" />

//         <button className="ql-link" />
//         <button className="ql-image" />
//         <button className="ql-video" />

//         <button id="undo-button" type="button">
//           ⤺
//         </button>
//         <button id="redo-button" type="button">
//           ⤻
//         </button>
//       </div>

//       <div
//         ref={quillRef}
//         style={{
//           background: "#fff",
//           color: "#000",
//           direction: "ltr",
//           minHeight: "80px",
//           maxHeight: "200px",
//           overflowY: "auto",
//           borderRadius: "5px",
//         }}
//       />
//     </div>
//   );
// }

// QuillEditor.tsx

// interface QuillEditorProps {
//   value: string;
//   onChange: (value: string) => void;
// }

// export default function QuillEditor({ value, onChange }: QuillEditorProps) {
//   console.log("value in quill editor....", value);

//   const { quill, quillRef } = useQuill({
//     theme: "snow",
//     modules: {
//       toolbar: {
//         container: "#toolbar",
//       },
//       history: {
//         delay: 500,
//         maxStack: 100,
//         userOnly: true,
//       },
//     },
//   });

//   // Initial set (once only)
//   // useEffect(() => {
//   //   if (quill && value) {
//   //     const delta = quill.clipboard.convert(value);
//   //     quill.setContents(delta, "silent");
//   //   }
//   // }, [quill]);

//   useEffect(() => {
//     if (quill && value) {
//       const delta = quill.clipboard.convert({ html: value });
//       quill.setContents(delta, "silent");
//     }
//   }, [quill, value]);

//   // Track user changes
//   useEffect(() => {
//     if (quill) {
//       quill.on("text-change", () => {
//         onChange(quill.root.innerHTML);
//       });
//     }
//   }, [quill]);

//   return (
//     <div>
//       <div
//         id="toolbar"
//         style={{
//           border: "1px solid #ccc",
//           display: "flex",
//           alignItems: "center",
//           padding: "8px",
//           backgroundColor: "#f9f9f9",
//           borderRadius: "6px",
//           marginBottom: "8px",
//           gap: "0px",
//           flexWrap: "wrap",
//         }}
//       >
//         <select className="ql-header" defaultValue="">
//           <option value="1">Heading 1</option>
//           <option value="2">Heading 2</option>
//           <option value="3">Heading 3</option>
//           <option value="">Normal</option>
//         </select>
//         <button className="ql-bold" />
//         <button className="ql-italic" />
//         <button className="ql-underline" />
//         <button className="ql-strike" />
//         <select className="ql-color" />
//         <select className="ql-background" />
//         <button className="ql-list" value="bullet" />
//         <button className="ql-list" value="ordered" />
//         <select className="ql-align" />
//         <button className="ql-link" />
//         <button className="ql-image" />
//         <button className="ql-video" />
//       </div>

//       <div
//         ref={quillRef}
//         style={{
//           background: "#fff",
//           color: "#000",
//           direction: "ltr",
//           minHeight: "100px",
//           maxHeight: "250px",
//           overflowY: "auto",
//           borderRadius: "6px",
//           padding: "8px",
//           border: "1px solid #ccc",
//         }}
//       />
//     </div>
//   );
// }

interface QuillEditorProps {
  value: string;
  onChange: (val: string) => void;
}

// export default function QuillEditor({ value, onChange }: QuillEditorProps) {
//   console.log("value in quill editor....", value);

//   const { quill, quillRef } = useQuill({
//     theme: "snow",
//     modules: {
//       toolbar: {
//         container: "#toolbar",
//       },
//       history: {
//         delay: 500,
//         maxStack: 100,
//         userOnly: true,
//       },
//     },
//   });

//   const initializedRef = useRef(false);

//   useEffect(() => {
//     if (quill && value && !initializedRef.current) {
//       const delta = quill.clipboard.convert({ html: value });
//       quill.setContents(delta, "silent");
//       initializedRef.current = true;
//     }
//   }, [quill, value]);

//   // Track user changes
//   useEffect(() => {
//     if (quill) {
//       const handler = () => {
//         const html = quill.root.innerHTML;
//         onChange(html);
//       };
//       quill.on("text-change", handler);

//       return () => {
//         quill.off("text-change", handler);
//       };
//     }
//   }, [quill, onChange]);

//   return (
//     <div>
//       <div
//         id="toolbar"
//         style={{
//           border: "1px solid #ccc",
//           display: "flex",
//           alignItems: "center",
//           padding: "8px",
//           backgroundColor: "#f9f9f9",
//           borderRadius: "6px",
//           marginBottom: "8px",
//           gap: "0px",
//           flexWrap: "wrap",
//         }}
//       >
//         <select className="ql-header" defaultValue="">
//           <option value="1">Heading 1</option>
//           <option value="2">Heading 2</option>
//           <option value="3">Heading 3</option>
//           <option value="">Normal</option>
//         </select>
//         <button className="ql-bold" />
//         <button className="ql-italic" />
//         <button className="ql-underline" />
//         <button className="ql-strike" />
//         <select className="ql-color" />
//         <select className="ql-background" />
//         <button className="ql-list" value="bullet" />
//         <button className="ql-list" value="ordered" />
//         <select className="ql-align" />
//         <button className="ql-link" />
//         <button className="ql-image" />
//         <button className="ql-video" />
//         {/* undoButton */}

//       </div>

//       <div
//         ref={quillRef}
//         style={{
//           background: "#fff",
//           color: "#000",
//           direction: "ltr",
//           minHeight: "100px",
//           maxHeight: "250px",
//           overflowY: "auto",
//           borderRadius: "6px",
//           padding: "8px",
//           border: "1px solid #ccc",
//         }}
//       />
//     </div>
//   );
// }

// export default function QuillEditor({ value, onChange }: QuillEditorProps) {
//   const { quill, quillRef } = useQuill({
//     theme: "snow",
//     modules: {
//       toolbar: {
//         container: "#toolbar",
//       },
//       history: {
//         delay: 500,
//         maxStack: 100,
//         userOnly: true,
//       },
//     },
//   });

//   useEffect(() => {
//     if (
//       quillRef.current &&
//       quillRef.current.root.innerHTML !== value &&
//       value !== ""
//     ) {
//       quillRef.current.root.innerHTML = value;
//     }
//   }, [value]);

//   const initializedRef = useRef(false);
//   const undoButtonRef = useRef<HTMLButtonElement | null>(null);
//   const redoButtonRef = useRef<HTMLButtonElement | null>(null);

//   // Set initial value
//   useEffect(() => {
//     if (quill && value && !initializedRef.current) {
//       const delta = quill.clipboard.convert({ html: value });
//       quill.setContents(delta, "silent");
//       quill.setSelection(quill.getLength(), 0, "silent");
//       initializedRef.current = true;
//     }
//   }, [quill, value]);

//   // Handle text change
//   useEffect(() => {
//     if (quill) {
//       const handler = () => {
//         const html = quill.root.innerHTML;
//         onChange(html);
//       };
//       quill.on("text-change", handler);
//       return () => {
//         quill.off("text-change", handler);
//       };
//     }
//   }, [quill, onChange]);

//   useEffect(() => {
//     if (quill && undoButtonRef.current && redoButtonRef.current) {
//       undoButtonRef.current.onclick = () => {
//         quill.history.undo();
//       };
//       redoButtonRef.current.onclick = () => {
//         quill.history.redo();
//       };
//     }
//   }, [quill]);

//   return (
//     <div>
//       <div
//         id="toolbar"
//         style={{
//           border: "1px solid #ccc",
//           display: "flex",
//           alignItems: "center",
//           padding: "8px",
//           backgroundColor: "#f9f9f9",
//           borderRadius: "6px",
//           marginBottom: "8px",
//           gap: "0px",
//           flexWrap: "wrap",
//         }}
//       >
//         <select className="ql-header" defaultValue="">
//           <option value="1">Heading 1</option>
//           <option value="2">Heading 2</option>
//           <option value="3">Heading 3</option>
//           <option value="">Normal</option>
//         </select>
//         <button className="ql-bold" />
//         <button className="ql-italic" />
//         <button className="ql-underline" />
//         <button className="ql-strike" />
//         <select className="ql-color" />
//         <select className="ql-background" />
//         <button className="ql-list" value="bullet" />
//         <button className="ql-list" value="ordered" />
//         <select className="ql-align" />
//         <button className="ql-link" />
//         <button className="ql-image" />
//         <button className="ql-video" />
//         <button ref={undoButtonRef} title="Undo" type="button">
//           ↺
//         </button>
//         <button ref={redoButtonRef} title="Redo" type="button">
//           ↻
//         </button>
//       </div>

//       <div
//         ref={quillRef}
//         style={{
//           background: "#fff",
//           color: "#000",
//           direction: "ltr",
//           minHeight: "100px",
//           maxHeight: "250px",
//           overflowY: "auto",
//           borderRadius: "6px",
//           padding: "8px",
//           border: "1px solid #ccc",
//         }}
//       />
//     </div>
//   );
// }

// interface QuillEditorProps {
//   value: string;
//   onChange: (value: string) => void;
// }

// export default function QuillEditor({ value, onChange }: QuillEditorProps) {
//   const { quill, quillRef } = useQuill({
//     theme: "snow",
//     modules: {
//       toolbar: {
//         container: "#toolbar",
//       },
//       history: {
//         delay: 500,
//         maxStack: 100,
//         userOnly: true,
//       },
//     },
//   });

//   const initializedRef = useRef(false);
//   const undoButtonRef = useRef<HTMLButtonElement | null>(null);
//   const redoButtonRef = useRef<HTMLButtonElement | null>(null);

//   useEffect(() => {
//     if (quill && !initializedRef.current) {
//       quill.root.innerHTML = value || "";
//       initializedRef.current = true;
//     }
//   }, [quill, value]);

//   useEffect(() => {
//     if (quill && quill.root.innerHTML !== value) {
//       quill.root.innerHTML = value || "";
//     }
//   }, [value, quill]);

//   useEffect(() => {
//     if (quill && quill.getText().trim() !== value.trim()) {
//       quill.setText(value || "");
//     }
//   }, [value]);

//   useEffect(() => {
//     if (quill) {
//       const handler = () => {
//         const html = quill.root.innerHTML;
//         onChange(html);
//       };
//       quill.on("text-change", handler);
//       return () => {
//         quill.off("text-change", handler);
//       };
//     }
//   }, [quill, onChange]);

//   useEffect(() => {
//     if (quill && undoButtonRef.current && redoButtonRef.current) {
//       undoButtonRef.current.onclick = () => quill.history.undo();
//       redoButtonRef.current.onclick = () => quill.history.redo();
//     }
//   }, [quill]);

//   return (
//     <div>
//       <div
//         id="toolbar"
//         style={{
//           border: "1px solid #ccc",
//           display: "flex",
//           alignItems: "center",
//           padding: "8px",
//           backgroundColor: "#f9f9f9",
//           borderRadius: "6px",
//           marginBottom: "8px",
//         }}
//       >
//         <select className="ql-header" defaultValue="">
//           <option value="1">Heading 1</option>
//           <option value="2">Heading 2</option>
//           <option value="3">Heading 3</option>
//           <option value="">Normal</option>
//         </select>
//         <button className="ql-bold" />
//         <button className="ql-italic" />
//         <button className="ql-underline" />
//         <button className="ql-strike" />
//         <select className="ql-color" />
//         <select className="ql-background" />
//         <button className="ql-list" value="bullet" />
//         <button className="ql-list" value="ordered" />
//         <select className="ql-align" />
//         <button className="ql-link" />
//         <button className="ql-image" />
//         <button className="ql-video" />
//         <button ref={undoButtonRef} title="Undo" type="button">
//           ↺
//         </button>
//         <button ref={redoButtonRef} title="Redo" type="button">
//           ↻
//         </button>
//       </div>

//       <div
//         ref={quillRef}
//         style={{
//           background: "#fff",
//           minHeight: `120px`,
//           maxHeight: `500px`,
//           overflowY: "auto",
//           padding: "8px",
//           border: "1px solid #ccc",
//           borderRadius: "6px",

//           // Force consistent appearance
//           fontSize: "16px",
//           lineHeight: "1.5",
//           boxSizing: "border-box",
//         }}
//       />
//     </div>
//   );
// }

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function QuillEditor({ value, onChange }: QuillEditorProps) {
  const { quill, quillRef } = useQuill({
    theme: "snow",
    modules: {
      toolbar: {
        container: "#toolbar",
      },
      history: {
        delay: 500,
        maxStack: 100,
        userOnly: true,
      },
      clipboard: {
        matchVisual: false, // Prevent visual matching that can cause double formatting
      },
    },
    formats: [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "color",
      "background",
      "list",
      "bullet",
      "ordered",
      "align",
      "link",
      "image",
      "video",
    ],
  });

  const initializedRef = useRef(false);
  const undoButtonRef = useRef<HTMLButtonElement | null>(null);
  const redoButtonRef = useRef<HTMLButtonElement | null>(null);

  // Set initial HTML content only once after init
  useEffect(() => {
    if (quill && !initializedRef.current) {
      quill.root.innerHTML = value || "";
      initializedRef.current = true;
    }
  }, [quill, value]);

  // Update when parent `value` changes (if different)
  useEffect(() => {
    if (quill && quill.root.innerHTML !== value && initializedRef.current) {
      quill.root.innerHTML = value || "";
    }
  }, [value, quill]);

  // Emit HTML on content change
  useEffect(() => {
    if (quill) {
      const handler = () => {
        const html = quill.root.innerHTML;
        onChange(html);
      };
      quill.on("text-change", handler);
      return () => {
        quill.off("text-change", handler);
      };
    }
  }, [quill, onChange]);

  // Hook up undo/redo
  useEffect(() => {
    if (quill && undoButtonRef.current && redoButtonRef.current) {
      undoButtonRef.current.onclick = () => quill.history.undo();
      redoButtonRef.current.onclick = () => quill.history.redo();
    }
  }, [quill]);

  // Prevent double list formatting
  useEffect(() => {
    if (quill) {
      // Add clipboard matcher to clean up list formatting
      quill.clipboard.addMatcher(Node.TEXT_NODE, (node, delta) => {
        delta.ops = delta.ops?.map((op) => {
          if (typeof op.insert === "string") {
            // Remove any existing list formatting from pasted text
            op.insert = op.insert.replace(/^(\d+\.\s+|\*\s+|\-\s+)/gm, "");
          }
          return op;
        });
        return delta;
      });
    }
  }, [quill]);

  return (
    <div>
      <div
        id="toolbar"
        style={{
          border: "1px solid #ccc",
          display: "flex",
          alignItems: "center",
          padding: "8px",
          backgroundColor: "#f9f9f9",
          borderRadius: "6px",
          marginBottom: "8px",
        }}
      >
        <select className="ql-header" defaultValue="">
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="">Normal</option>
        </select>
        <button className="ql-bold" />
        <button className="ql-italic" />
        <button className="ql-underline" />
        <button className="ql-strike" />
        <select className="ql-color" />
        <select className="ql-background" />
        <button className="ql-list" value="bullet" />
        <button className="ql-list" value="ordered" />
        <select className="ql-align" />
        <button className="ql-link" />
        <button className="ql-image" />
        <button className="ql-video" />
        <button ref={undoButtonRef} title="Undo" type="button">
          ↺
        </button>
        <button ref={redoButtonRef} title="Redo" type="button">
          ↻
        </button>
      </div>

      <div
        ref={quillRef}
        style={{
          background: "#fff",
          minHeight: "120px",
          maxHeight: "500px",
          overflowY: "auto",
          padding: "8px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          fontSize: "16px",
          lineHeight: "1.5",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
