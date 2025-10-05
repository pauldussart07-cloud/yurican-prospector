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
  deductCredits: (amount: number) => Promise<void>;
}

const TargetingContext = createContext<TargetingContextType | undefined>(undefined);

export const TargetingProvider = ({ children }: { children: ReactNode }) => {
  const [activeTargeting, setActiveTargeting] = useState<Targeting | null>(null);
  const [credits, setCredits] = useState(500000);

  const refreshCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Mode maquette : utiliser 500000 crédits par défaut
      setCredits(500000);
      return;
    }

    const { data } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setCredits(data.credits);
    } else {
      // Create initial credits entry with 500000
      const { data: newCredits } = await supabase
        .from('user_credits')
        .insert({ user_id: user.id, credits: 500000 })
        .select('credits')
        .single();
      
      if (newCredits) {
        setCredits(newCredits.credits);
      } else {
        setCredits(500000);
      }
    }
  };

  const deductCredits = async (amount: number) => {
    const newCredits = credits - amount;
    setCredits(newCredits);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Si connecté, mettre à jour la base de données
      await supabase
        .from('user_credits')
        .update({ credits: newCredits })
        .eq('user_id', user.id);
    }
  };

  useEffect(() => {
    const loadActiveTargeting = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user logged in');
          return;
        }

        const { data } = await supabase
          .from('targetings')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (data) {
          setActiveTargeting(data as Targeting);
        }
      } catch (error) {
        console.error('Error loading targeting:', error);
      }
    };

    const loadCredits = async () => {
      try {
        await refreshCredits();
      } catch (error) {
        console.error('Error loading credits:', error);
      }
    };

    loadActiveTargeting();
    loadCredits();
  }, []);

  return (
    <TargetingContext.Provider value={{ activeTargeting, setActiveTargeting, credits, refreshCredits, deductCredits }}>
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
