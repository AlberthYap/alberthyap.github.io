import { ToolsHeader } from "@/components/layout/ToolsHeader";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors">
      <ToolsHeader />
      <main>{children}</main>
    </div>
  );
}
