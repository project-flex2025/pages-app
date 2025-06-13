import Link from "next/link";

export default function Home() {
  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: "100vh",
        backgroundColor: "#121212",
        color: "white",
      }}
    >
      <div
        className="card bg-dark text-white p-4 shadow rounded text-center"
        style={{ maxWidth: "500px", width: "100%" }}
      >
        <h1 className="mb-4">Welcome</h1>
        <Link href="/login" className="btn btn-outline-light w-100">
          Go to Login
        </Link>
      </div>
    </div>
  );
}
