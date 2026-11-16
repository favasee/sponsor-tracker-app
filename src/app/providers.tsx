'use client';

import React from 'react';
import { RoleProvider } from '@/context/RoleContext';
import { AuthProvider } from '@/context/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RoleProvider>{children}</RoleProvider>
    </AuthProvider>
  );
}
