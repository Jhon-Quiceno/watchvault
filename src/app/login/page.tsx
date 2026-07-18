import { LoginView } from "@/features/auth/components/login-view";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  return <LoginView from={from} />;
}
