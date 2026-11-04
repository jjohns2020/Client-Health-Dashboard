import { createContext, useContext, type ReactNode } from 'react';

export interface RoiFrame {
  lockClient: boolean;
  organization?: string;
}

const Ctx = createContext<RoiFrame>({ lockClient: false });

export function RoiFrameProvider({ value, children }: { value: RoiFrame; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRoiFrame(): RoiFrame {
  return useContext(Ctx);
}
