import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import OnboardingStep2 from '@/components/onboarding/OnboardingStep2';
import OnboardingStep3 from '@/components/onboarding/OnboardingStep3';
import OnboardingStep5 from '@/components/onboarding/OnboardingStep5';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');

  // Form data
  const [step1Data, setStep1Data] = useState({
    targetSectors: [] as string[],
    companySize: '',
    revenueRange: '',
    geographicZones: [] as string[],
  });

  const [step2Data, setStep2Data] = useState({
    services: [] as string[],
    decisionLevel: '',
    jobTitles: [] as string[],
  });

  const [step3Data, setStep3Data] = useState({
    trackedEvents: [] as string[],
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setUserId(user.id);

    // Check if onboarding is already completed
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single();

    if (profile?.onboarding_completed) {
      navigate('/');
    }
  };

  const handleNext = () => {
    // Validate step 2: require services and decision level
    if (currentStep === 2) {
      if (step2Data.services.length === 0) {
        toast.error('Veuillez sélectionner au moins un service');
        return;
      }
      if (!step2Data.decisionLevel) {
        toast.error('Veuillez sélectionner un niveau de décision');
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // 1. Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          tracked_events: step3Data.trackedEvents,
          onboarding_completed: true,
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // 2. Create targeting from step1Data
      const { error: targetingError } = await supabase
        .from('targetings')
        .insert({
          user_id: userId,
          name: 'Ciblage par défaut',
          sectors: step1Data.targetSectors,
          departments: step1Data.geographicZones,
          min_headcount: getHeadcountMin(step1Data.companySize),
          max_headcount: getHeadcountMax(step1Data.companySize),
          min_revenue: getRevenueMin(step1Data.revenueRange),
          max_revenue: getRevenueMax(step1Data.revenueRange),
          is_active: true,
        });

      if (targetingError) throw targetingError;

      // 3. Create personas from step2Data
      // Map decision level to database values
      const mapDecisionLevel = (level: string): 'Décisionnaire' | 'Influenceur' | 'Utilisateur' => {
        if (level === 'Dirigeant') return 'Décisionnaire';
        if (level === 'Directeur / Responsable') return 'Influenceur';
        return 'Utilisateur';
      };

      // If specific job titles are provided, create personas for each
      if (step2Data.jobTitles.length > 0) {
        for (let i = 0; i < step2Data.jobTitles.length; i++) {
          const { error: personaError } = await supabase.from('personas').insert({
            user_id: userId,
            name: step2Data.jobTitles[i],
            service: mapServiceToDatabase(step2Data.services[0] || 'Direction'),
            decision_level: mapDecisionLevel(step2Data.decisionLevel),
            position: i + 1,
          });
          if (personaError) throw personaError;
        }
      } else {
        // Otherwise, create a default persona based on services and decision level
        for (let i = 0; i < step2Data.services.length; i++) {
          const { error: personaError } = await supabase.from('personas').insert({
            user_id: userId,
            name: `${step2Data.decisionLevel} - ${step2Data.services[i]}`,
            service: mapServiceToDatabase(step2Data.services[i]),
            decision_level: mapDecisionLevel(step2Data.decisionLevel),
            position: i + 1,
          });
          if (personaError) throw personaError;
        }
      }

      toast.success('Onboarding terminé !');
      navigate('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions to map form data to database values
  const getHeadcountMin = (size: string): number => {
    const mapping: { [key: string]: number } = {
      'TPE': 0,
      'PME': 10,
      'ETI': 250,
      'GE': 5000,
    };
    return mapping[size] || 0;
  };

  const getHeadcountMax = (size: string): number => {
    const mapping: { [key: string]: number } = {
      'TPE': 9,
      'PME': 249,
      'ETI': 4999,
      'GE': 999999,
    };
    return mapping[size] || 999999;
  };

  const getRevenueMin = (range: string): number => {
    // Parse range like "0-1M" or "1M-10M"
    const parts = range.split('-');
    if (parts[0] === '0') return 0;
    return parseFloat(parts[0].replace('M', '')) * 1000000;
  };

  const getRevenueMax = (range: string): number => {
    const parts = range.split('-');
    if (parts[1] === '+') return 999999999999;
    return parseFloat(parts[1].replace('M', '')) * 1000000;
  };

  const mapContactTypeToDecisionLevel = (type: string): 'Décisionnaire' | 'Influenceur' | 'Utilisateur' => {
    const mapping: { [key: string]: 'Décisionnaire' | 'Influenceur' | 'Utilisateur' } = {
      'Le Dirigeant': 'Décisionnaire',
      'Des directeurs': 'Influenceur',
      'Des collaborateurs': 'Utilisateur',
    };
    return mapping[type] || 'Utilisateur';
  };

  const mapServiceToDatabase = (service: string): 'Commerce' | 'Marketing' | 'IT' | 'RH' | 'Direction' | 'Finance' | 'Production' | 'Logistique' => {
    if (service === 'Comptabilité / Finance') return 'Finance';
    if (service === 'Juridique') return 'Direction';
    if (service === 'R&D') return 'IT';
    return service as 'Commerce' | 'Marketing' | 'IT' | 'RH' | 'Direction' | 'Finance' | 'Production' | 'Logistique';
  };

  const steps = [
    { number: 1, label: 'Votre activité' },
    { number: 2, label: "L'entreprise cible" },
    { number: 3, label: 'Vos outils' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-6 text-center">
          <p className="text-sm text-muted-foreground">
            Question {currentStep} sur 3
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-card rounded-lg shadow-xl p-8">
          {currentStep === 1 && <OnboardingStep2 data={step1Data} onChange={setStep1Data} />}
          {currentStep === 2 && <OnboardingStep3 data={step2Data} onChange={setStep2Data} />}
          {currentStep === 3 && <OnboardingStep5 data={step3Data} onChange={setStep3Data} />}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>

            {currentStep < 3 ? (
              <Button type="button" onClick={handleNext}>
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleComplete} disabled={isLoading}>
                <Check className="w-4 h-4 mr-2" />
                Terminer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
