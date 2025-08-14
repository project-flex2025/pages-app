import Link from "next/link";
import { GetServerSideProps } from "next";

type HomeProps = {
  isAuthenticated: boolean;
};

export default function Home({ isAuthenticated }: HomeProps) {
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const host = context.req.headers.host;
  const proto = context.req.headers["x-forwarded-proto"] || "https";
  const baseUrl = `${proto}://${host}`;

  // Fetch session
  const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      cookie: context.req.headers.cookie || "",
    },
  });
  const sessionJson = await sessionRes.json();
  const isAuthenticated = !!(sessionJson && sessionJson.user);

  // Redirect if NOT authenticated
  if (!isAuthenticated) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: { isAuthenticated },
  };
};
