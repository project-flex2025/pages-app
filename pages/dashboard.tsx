// pages/dashboard.tsx
import { getSession, signOut } from "next-auth/react";

export default function Dashboard() {
  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "600px" }}>
      <div className="card bg-dark text-white p-4 shadow-lg rounded">
        <h2 className="mb-4">Welcome to the Dashboard</h2>
        <p className="mb-4">
          You're now logged in and can securely access this page.
        </p>
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
