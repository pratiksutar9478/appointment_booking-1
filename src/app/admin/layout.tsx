import AdminSidebar from "@/components/AdminSidebar";

export const metadata = {
  title: "Admin — AppointCare",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-gray-50 overflow-auto">{children}</main>
    </div>
  );
}
