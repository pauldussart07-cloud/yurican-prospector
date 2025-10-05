import { createContext, useContext, useState, ReactNode } from 'react';

export interface ActionConfig {
  id: number;
  name: string;
  type: 'email' | 'meeting';
  emailSubject?: string;
  emailBody?: string;
  emailAttachment?: string;
  meetingPlatform?: 'teams' | 'google-meet';
}

interface ActionsContextType {
  actions: ActionConfig[];
  updateAction: (id: number, updates: Partial<ActionConfig>) => void;
  getActionName: (id: number) => string;
}

const ActionsContext = createContext<ActionsContextType | undefined>(undefined);

const defaultActions: ActionConfig[] = [
  { id: 1, name: 'Email de prospection', type: 'email', emailSubject: '', emailBody: '' },
  { id: 2, name: 'Email de suivi', type: 'email', emailSubject: '', emailBody: '' },
  { id: 3, name: 'Email de relance', type: 'email', emailSubject: '', emailBody: '' },
  { id: 4, name: 'RDV Teams', type: 'meeting', meetingPlatform: 'teams' },
  { id: 5, name: 'RDV Google Meet', type: 'meeting', meetingPlatform: 'google-meet' },
  { id: 6, name: 'Email personnalisé', type: 'email', emailSubject: '', emailBody: '' },
];

export const ActionsProvider = ({ children }: { children: ReactNode }) => {
  const [actions, setActions] = useState<ActionConfig[]>(defaultActions);

  const updateAction = (id: number, updates: Partial<ActionConfig>) => {
    setActions(prevActions =>
      prevActions.map(action =>
        action.id === id ? { ...action, ...updates } : action
      )
    );
  };

  const getActionName = (id: number) => {
    const action = actions.find(a => a.id === id);
    return action?.name || `Action ${id}`;
  };

  return (
    <ActionsContext.Provider value={{ actions, updateAction, getActionName }}>
      {children}
    </ActionsContext.Provider>
  );
};

export const useActions = () => {
  const context = useContext(ActionsContext);
  if (context === undefined) {
    throw new Error('useActions must be used within an ActionsProvider');
  }
  return context;
};
