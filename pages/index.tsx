import Link from "next/link";

export default function Home() {
  return (
    <div className="container text-center mt-5">
      <h1>Welcome</h1>
      <Link href="/login" className="btn btn-dark mt-3">
        Go to Login
      </Link>
    </div>
  );
}
