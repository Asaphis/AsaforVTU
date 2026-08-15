import { FerixasAuthShell } from '@/components/ferixas/FerixasAuthShell';

/** Compatibility bridge for existing real auth flows; renders the Ferixas shell only. */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return <FerixasAuthShell eyebrow="ASAFORVTU ACCOUNT" title="Secure account access for top-up services.">{children}</FerixasAuthShell>;
}
