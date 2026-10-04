export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-[max(2rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
