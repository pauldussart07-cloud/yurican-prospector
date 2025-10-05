import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Targeting {
  id: string;
  name: string;
  departments: string[];
  sectors: string[];
  min_headcount: number | null;
  max_headcount: number | null;
  min_revenue: number | null;
  max_revenue: number | null;
  is_active: boolean;
}

interface TargetingContextType {
  activeTargeting: Targeting | null;
  setActiveTargeting: (targeting: Targeting | null) => void;
  credits: number;
  refreshCredits: () => Promise<void>;
}

const TargetingContext = createContext<TargetingContextType | undefined>(undefined);

export const TargetingProvider = ({ children }: { children: ReactNode }) => {
  const [activeTargeting, setActiveTargeting] = useState<Targeting | null>(null);
  const [credits, setCredits] = useState(0);

  const refreshCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setCredits(data.credits);
    } else {
      // Create initial credits entry
      const { data: newCredits } = await supabase
        .from('user_credits')
        .insert({ user_id: user.id, credits: 100 })
        .select('credits')
        .single();
      
      if (newCredits) {
        setCredits(newCredits.credits);
      }
    }
  };

  useEffect(() => {
    const loadActiveTargeting = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('targetings')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setActiveTargeting(data as Targeting);
      }
    };

    loadActiveTargeting();
    refreshCredits();
  }, []);

  return (
    <TargetingContext.Provider value={{ activeTargeting, setActiveTargeting, credits, refreshCredits }}>
      {children}
    </TargetingContext.Provider>
  );
};

export const useTargeting = () => {
  const context = useContext(TargetingContext);
  if (context === undefined) {
    throw new Error('useTargeting must be used within a TargetingProvider');
  }
  return context;
};
