// ============================================================
// VISION ERP - Global client providers
// app/providers.tsx
// ------------------------------------------------------------
// SessionProvider (NextAuth) + QueryClientProvider (TanStack)
// + the toast viewport. Wraps the entire app in the root layout.
// ============================================================

"use client";

import { useState, type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";
import { Toaster } from "@/components/ui/toast";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Never retry auth/permission failures.
              if (error instanceof ApiError && [401, 403, 404, 422].includes(error.status)) {
                return false;
              }
              return failureCount < 2;
            },
          },
          mutations: { retry: false },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}