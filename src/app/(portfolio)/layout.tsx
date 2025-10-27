import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <main className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {children}
      </main>
      <Footer />
    </>
  );
}
