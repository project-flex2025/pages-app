import { getCsrfToken, getSession, signIn } from "next-auth/react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState } from "react";

type LoginProps = {
  csrfToken: string;
};

export default function Login({ csrfToken }: LoginProps) {
  const router = useRouter();
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const result = await signIn("credentials", {
      redirect: false,
      credential,
      password,
      callbackUrl: "/dashboard",
    });

    setIsLoading(false);

    if (result?.ok && result?.url) {
      router.push(result.url);
    } else {
      setErrorMsg("Invalid username or password.");
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center min-vh-100"
      style={{ backgroundColor: "#121212" }}
    >
      <div
        className="card bg-dark text-white p-4 shadow-lg"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        <h2 className="text-center mb-4">Sign In</h2>
        <form onSubmit={handleSubmit}>
          <input name="csrfToken" type="hidden" defaultValue={csrfToken} />

          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="form-control bg-dark text-white border-secondary"
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-control bg-dark text-white border-secondary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {errorMsg && (
            <div className="alert alert-danger py-2 text-center">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-outline-light w-100"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  if (session) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  const csrfToken = await getCsrfToken(context);
  return {
    props: {
      csrfToken: csrfToken || "",
    },
  };
};
