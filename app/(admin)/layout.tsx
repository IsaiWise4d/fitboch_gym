import { AdminSidebar } from "@/components/shared/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-background">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 pt-[4.5rem] pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pt-20 lg:ml-64 lg:overflow-x-visible lg:pt-6">
        {children}
      </main>
    </div>
  );
}
