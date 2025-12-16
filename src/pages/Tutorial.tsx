import { useState } from 'react';
import { Target, Building2, Users, Workflow, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const tutorialSteps = [
  {
    id: 1,
    title: 'Créez votre Ciblage',
    description: 'Définissez vos critères de prospection : secteur d\'activité, taille d\'entreprise, localisation géographique. Notre algorithme vous proposera les entreprises les plus pertinentes.',
    longDescription: 'Le ciblage est la première étape essentielle de votre prospection. En définissant précisément votre marché cible, vous maximisez vos chances de succès. Sélectionnez les secteurs d\'activité qui vous intéressent, la taille des entreprises (effectif et chiffre d\'affaires) et les zones géographiques que vous souhaitez couvrir.',
    icon: Target,
    action: '/targeting',
    actionLabel: 'Créer un Ciblage',
  },
  {
    id: 2,
    title: 'Découvrez le Marché',
    description: 'Explorez les entreprises correspondant à vos critères. Consultez leurs informations détaillées, les signaux d\'affaires et identifiez les meilleures opportunités.',
    longDescription: 'Une fois votre ciblage créé, accédez à la liste des entreprises qui correspondent à vos critères. Chaque entreprise dispose d\'une fiche détaillée avec ses coordonnées, son activité, et les signaux d\'affaires récents. Utilisez les filtres pour affiner votre recherche et identifier les prospects les plus prometteurs.',
    icon: Building2,
    action: '/marche',
    actionLabel: 'Explorer le Marché',
  },
  {
    id: 3,
    title: 'Gérez vos Prospects',
    description: 'Ajoutez les entreprises intéressantes à vos prospects. Suivez leur évolution, ajoutez des contacts et organisez votre pipeline commercial.',
    longDescription: 'Transformez les entreprises identifiées en prospects qualifiés. Ajoutez des contacts, suivez l\'historique de vos interactions et organisez votre pipeline commercial. Visualisez vos prospects en mode Kanban ou liste pour une gestion optimale de votre activité commerciale.',
    icon: Users,
    action: '/prospects',
    actionLabel: 'Voir les Prospects',
  },
  {
    id: 4,
    title: 'Automatisez vos Séquences',
    description: 'Créez des séquences d\'engagement automatisées par email et WhatsApp. Gagnez du temps et augmentez votre taux de conversion.',
    longDescription: 'Automatisez votre prospection avec des séquences d\'emails et de messages WhatsApp personnalisés. Définissez les délais entre chaque étape, personnalisez vos messages avec des variables dynamiques et suivez les performances de vos campagnes en temps réel.',
    icon: Workflow,
    action: '/sequences',
    actionLabel: 'Créer une Séquence',
  },
];

const Tutorial = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleNext = () => {
    // Mark current step as completed
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep);
    setCompletedSteps(newCompleted);
    
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleFinish = () => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep);
    setCompletedSteps(newCompleted);
    navigate('/');
  };

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="relative">
        {/* Line connecting steps */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-muted mx-12">
          <div 
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${(completedSteps.size / (tutorialSteps.length - 1)) * 100}%` }}
          />
        </div>
        
        {/* Step circles */}
        <div className="relative flex justify-between">
          {tutorialSteps.map((s, index) => {
            const StepIcon = s.icon;
            const isCompleted = completedSteps.has(index);
            const isCurrent = currentStep === index;
            
            return (
              <button
                key={s.id}
                onClick={() => handleGoToStep(index)}
                className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                  index <= currentStep || isCompleted ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div 
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 border-4 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isCurrent 
                        ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg' 
                        : 'bg-muted border-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span className={`text-xs font-medium text-center max-w-[80px] ${
                  isCurrent ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  {s.title.split(' ').slice(0, 2).join(' ')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <Card className="animate-fade-in" key={currentStep}>
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto transition-all duration-500 ${
              completedSteps.has(currentStep) ? 'bg-green-100' : 'bg-primary/10'
            }`}>
              <Icon className={`h-12 w-12 transition-colors duration-500 ${
                completedSteps.has(currentStep) ? 'text-green-600' : 'text-primary'
              }`} />
            </div>

            {/* Title */}
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Étape {currentStep + 1} sur {tutorialSteps.length}
              </span>
              <h2 className="text-2xl font-bold mt-1">{step.title}</h2>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {step.description}
            </p>

            {/* Long Description */}
            <div className="bg-muted/50 rounded-lg p-6 text-left">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.longDescription}
              </p>
            </div>

            {/* Action Button */}
            <Button 
              variant="outline" 
              onClick={() => navigate(step.action)}
              className="gap-2"
            >
              {step.actionLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Précédent
        </Button>

        <div className="flex items-center gap-2">
          {tutorialSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => handleGoToStep(index)}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                currentStep === index 
                  ? 'bg-primary w-6' 
                  : completedSteps.has(index) 
                    ? 'bg-green-500' 
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {isLastStep ? (
          <Button onClick={handleFinish} className="gap-2">
            Terminer
            <Check className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleNext} className="gap-2">
            Suivant
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Tutorial;
