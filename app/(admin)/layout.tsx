import { AdminSidebar } from "@/components/shared/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden p-6 pt-20 lg:overflow-x-visible lg:pt-6 lg:ml-64">
        {children}
      </main>
    </div>
  );
}
