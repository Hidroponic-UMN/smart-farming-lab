import { SidebarNav } from "@/components/docs/sidebar-nav";
import { Search, Bell } from "lucide-react";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-on-background font-body-md selection:bg-leaf-gradient-end/30 min-h-screen">
      <SidebarNav />
      
      <main className="lg:ml-sidebar-width min-h-screen">
        <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-surface/80 border-b border-outline-variant/30 h-16 flex justify-between items-center px-gutter max-w-full">
          <div className="flex items-center gap-8">
            <span className="font-headline-md text-headline-md text-doc-primary">Documentation</span>
            <nav className="hidden md:flex items-center gap-6">
              <a className="text-doc-primary font-bold border-b-2 border-doc-primary py-4" href="#">Guides</a>
              <a className="text-on-surface-variant hover:text-doc-primary transition-opacity py-4" href="#">Examples</a>
              <a className="text-on-surface-variant hover:text-doc-primary transition-opacity py-4" href="#">Support</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group hidden sm:block">
              <input className="bg-surface-container-low border-none rounded-full py-2 px-10 text-sm focus:ring-2 focus:ring-leaf-gradient-end/50 w-64" placeholder="Search docs..." type="text" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-on-surface-variant hover:bg-surface-container transition-colors rounded-full relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-doc-error rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-content-max-width mx-auto px-gutter py-section-gap">
          {children}
        </div>
      </main>
    </div>
  );
}
