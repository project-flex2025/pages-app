// pages/login.tsx
import { getCsrfToken, signIn } from "next-auth/react";
import { useState } from "react";

export default function Login({ csrfToken }: { csrfToken: string }) {
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn("credentials", {
      redirect: true,
      callbackUrl: "/dashboard",
      credential,
      password,
    });
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <h2 className="text-white mb-4">Login</h2>
      <form onSubmit={handleSubmit}>
        <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
        <div className="mb-3">
          <label className="form-label text-white">Username</label>
          <input
            type="text"
            className="form-control"
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label text-white">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary w-100" type="submit">
          Sign In
        </button>
      </form>
    </div>
  );
}

export async function getServerSideProps(context: any) {
  return {
    props: {
      csrfToken: await getCsrfToken(context),
    },
  };
}
