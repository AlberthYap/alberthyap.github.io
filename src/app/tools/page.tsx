import Link from "next/link";

export default function ToolsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Developer Tools</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Collection of useful web-based tools for developers
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Delim Tool Card */}
        <Link
          href="/tools/delim"
          className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:shadow-xl"
        >
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            Delim.X
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Join or split text with custom delimiters, quotes, and formatting
            options
          </p>
          <div className="mt-4 flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
            Open tool
            <svg
              className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>

        {/* Lorem Tool Card */}
        <Link
          href="/tools/lorem"
          className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-xl"
        >
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-xl font-bold mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            Lorem Ipsum Generator
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Generate placeholder text for your designs with customizable options
          </p>
          <div className="mt-4 flex items-center text-purple-600 dark:text-purple-400 font-semibold">
            Open tool
            <svg
              className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>

        {/* Placeholder for future tools */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 opacity-50">
          <div className="text-4xl mb-4">🔜</div>
          <h3 className="text-xl font-bold mb-2">JSON Formatter</h3>
          <p className="text-slate-600 dark:text-slate-400">Coming soon...</p>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 opacity-50">
          <div className="text-4xl mb-4">🔜</div>
          <h3 className="text-xl font-bold mb-2">Base64 Encoder</h3>
          <p className="text-slate-600 dark:text-slate-400">Coming soon...</p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          ← Back to Portfolio
        </Link>
      </div>
    </div>
  );
}
