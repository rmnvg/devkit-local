export function ErrorBox({ error }: { error: string | null | undefined }) {
  if (!error) return null;
  return (
    <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
      {error}
    </div>
  );
}

export function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div role="note" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      {children}
    </div>
  );
}
