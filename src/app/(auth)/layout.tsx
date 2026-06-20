export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-muted/50">
      <div className="animate-fade-in w-full max-w-[400px]">
        {children}
      </div>
    </div>
  );
}
