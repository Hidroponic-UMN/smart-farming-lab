import { SidebarNav } from "@/components/docs/sidebar-nav";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-on-background font-body-md selection:bg-leaf-gradient-end/30 min-h-screen">
      <SidebarNav />
      
      <main className="lg:ml-sidebar-width min-h-screen">
        <div className="max-w-content-max-width mx-auto px-gutter py-section-gap">
          {children}
        </div>
      </main>
    </div>
  );
}
