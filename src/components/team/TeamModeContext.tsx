import { createContext, useContext, ReactNode } from "react";

const TeamModeContext = createContext<boolean>(false);

export function TeamModeProvider({ children }: { children: ReactNode }) {
  return <TeamModeContext.Provider value={true}>{children}</TeamModeContext.Provider>;
}

export function useTeamMode(): boolean {
  return useContext(TeamModeContext);
}
