import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import OnboardingStep1 from '@/components/onboarding/OnboardingStep1';
import OnboardingStep2 from '@/components/onboarding/OnboardingStep2';
import OnboardingStep3 from '@/components/onboarding/OnboardingStep3';
import OnboardingStep4 from '@/components/onboarding/OnboardingStep4';
import OnboardingStep5 from '@/components/onboarding/OnboardingStep5';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');

  // Form data
  const [step1Data, setStep1Data] = useState({
    jobFunction: '',
    growthType: '',
    productDescription: '',
    peakActivityPeriod: '',
  });

  const [step2Data, setStep2Data] = useState({
    targetSectors: [] as string[],
    companySize: '',
    revenueRange: '',
    geographicZones: [] as string[],
  });

  const [step3Data, setStep3Data] = useState({
    contactType: '',
    departments: [] as string[],
    specificRole: '',
  });

  const [step4Data, setStep4Data] = useState({
    crmTool: '',
    otherTools: [] as string[],
  });

  const [step5Data, setStep5Data] = useState({
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
    if (currentStep < 5) {
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
          job_function: step1Data.jobFunction,
          growth_type: step1Data.growthType,
          product_description: step1Data.productDescription,
          peak_activity_period: step1Data.peakActivityPeriod,
          crm_tool: step4Data.crmTool,
          other_tools: step4Data.otherTools,
          tracked_events: step5Data.trackedEvents,
          onboarding_completed: true,
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // 2. Create targeting from step2Data
      const { error: targetingError } = await supabase
        .from('targetings')
        .insert({
          user_id: userId,
          name: 'Ciblage par défaut',
          sectors: step2Data.targetSectors,
          departments: step2Data.geographicZones,
          min_headcount: getHeadcountMin(step2Data.companySize),
          max_headcount: getHeadcountMax(step2Data.companySize),
          min_revenue: getRevenueMin(step2Data.revenueRange),
          max_revenue: getRevenueMax(step2Data.revenueRange),
          is_active: true,
        });

      if (targetingError) throw targetingError;

      // 3. Create personas from step3Data
      const decisionLevel = mapContactTypeToDecisionLevel(step3Data.contactType);
      
      for (const department of step3Data.departments) {
        const service = mapDepartmentToService(department);
        await supabase.from('personas').insert({
          user_id: userId,
          name: `${step3Data.specificRole || step3Data.contactType} - ${department}`,
          service: service,
          decision_level: decisionLevel,
          position: 1,
        });
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

  const mapDepartmentToService = (dept: string): 'Commerce' | 'Marketing' | 'IT' | 'RH' | 'Direction' | 'Finance' | 'Production' | 'Logistique' => {
    const mapping: { [key: string]: 'Commerce' | 'Marketing' | 'IT' | 'RH' | 'Direction' | 'Finance' | 'Production' | 'Logistique' } = {
      'Direction générale': 'Direction',
      'Commerce': 'Commerce',
      'Marketing': 'Marketing',
      'Achat': 'Finance',
      'RH': 'RH',
      'IT': 'IT',
      'Production': 'Production',
      'Logistique': 'Logistique',
    };
    return mapping[dept] || 'Direction';
  };

  const steps = [
    { number: 1, label: 'Qui vous êtes' },
    { number: 2, label: 'Votre activité' },
    { number: 3, label: "L'entreprise cible" },
    { number: 4, label: 'Le contact cible' },
    { number: 5, label: 'Vos outils' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-6 text-center">
          <p className="text-sm text-muted-foreground">
            Question {currentStep} sur 5
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-card rounded-lg shadow-xl p-8">
          {currentStep === 1 && <OnboardingStep1 data={step1Data} onChange={setStep1Data} />}
          {currentStep === 2 && <OnboardingStep2 data={step2Data} onChange={setStep2Data} />}
          {currentStep === 3 && <OnboardingStep3 data={step3Data} onChange={setStep3Data} />}
          {currentStep === 4 && <OnboardingStep4 data={step4Data} onChange={setStep4Data} />}
          {currentStep === 5 && <OnboardingStep5 data={step5Data} onChange={setStep5Data} />}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>

            {currentStep < 5 ? (
              <Button onClick={handleNext}>
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isLoading}>
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
