import { getSession } from "next-auth/react";

export default function Dashboard() {
  return (
    <div className="container mt-5 text-white bg-dark">
      <h1>Welcome to the Dashboard</h1>
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
