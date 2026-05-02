import { Suspense } from "react";
import { LoginPage } from "../../src/views/LoginPage";

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0d0d]" />}>
      <LoginPage />
    </Suspense>
  );
}
