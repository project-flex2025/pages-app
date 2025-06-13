// pages/dashboard.tsx
import { getSession, signOut } from "next-auth/react";

export default function Dashboard() {
  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: "100vh",
        backgroundColor: "#121212", // Deep dark background
        color: "white",
      }}
    >
      <div
        className="card bg-dark text-white p-4 shadow rounded"
        style={{ width: "100%", maxWidth: "500px" }}
      >
        <h2 className="mb-3">Welcome to the Dashboard</h2>
        <p className="mb-4">You're successfully authenticated.</p>
        <button className="btn btn-outline-light w-100" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: any) {
  const session = await getSession(context);
  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  return { props: { session } };
}
