import { signOut } from "next-auth/react";

export default function Dashboard() {
  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

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

// --- SSR: Fetch session directly from the correct host ---
export async function getServerSideProps(context: any) {
  const host = context.req.headers.host;
  const proto = context.req.headers["x-forwarded-proto"] || "https";
  const baseUrl = `${proto}://${host}`;

  // Fetch session directly
  const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      cookie: context.req.headers.cookie || "",
    },
  });
  const sessionJson = await sessionRes.json();
  const isAuthenticated = !!(sessionJson && sessionJson.user);

  if (!isAuthenticated) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  return { props: { session: sessionJson } };
}
