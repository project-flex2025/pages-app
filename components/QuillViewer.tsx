import "react-quill/dist/quill.snow.css";

export default function QuillViewer({ content }: { content: string }) {
  return (
    <div
      className="ql-editor"
      style={{
        fontSize: "14.6px",
        fontWeight: "400",
        color: "#202020",
        backgroundColor: "#fff",
        whiteSpace: "normal",
        flexGrow: 1,
        overflow: "hidden",
        maxHeight: "300px",
        overflowY: "auto",
        padding: "8px",
        borderRadius: "6px",
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    ></div>
  );
}
