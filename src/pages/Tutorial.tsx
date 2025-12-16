import { useState } from 'react';
import { Target, Building2, Users, Workflow, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const tutorialSteps = [
  {
    id: 1,
    title: 'Créez votre Ciblage',
    description: 'Définissez vos critères de prospection : secteur d\'activité, taille d\'entreprise, localisation géographique. Notre algorithme vous proposera les entreprises les plus pertinentes.',
    icon: Target,
    action: '/targeting',
    actionLabel: 'Créer un Ciblage',
  },
  {
    id: 2,
    title: 'Découvrez le Marché',
    description: 'Explorez les entreprises correspondant à vos critères. Consultez leurs informations détaillées, les signaux d\'affaires et identifiez les meilleures opportunités.',
    icon: Building2,
    action: '/marche',
    actionLabel: 'Explorer le Marché',
  },
  {
    id: 3,
    title: 'Gérez vos Prospects',
    description: 'Ajoutez les entreprises intéressantes à vos prospects. Suivez leur évolution, ajoutez des contacts et organisez votre pipeline commercial.',
    icon: Users,
    action: '/prospects',
    actionLabel: 'Voir les Prospects',
  },
  {
    id: 4,
    title: 'Automatisez vos Séquences',
    description: 'Créez des séquences d\'engagement automatisées par email et WhatsApp. Gagnez du temps et augmentez votre taux de conversion.',
    icon: Workflow,
    action: '/sequences',
    actionLabel: 'Créer une Séquence',
  },
];

const Tutorial = () => {
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (stepId: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-scale-in">
          <Target className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Bienvenue sur Yurican !</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Suivez ces étapes pour configurer votre espace de prospection et commencer à générer des opportunités commerciales.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-medium">{completedSteps.size} / {tutorialSteps.length} étapes complétées</span>
        <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(completedSteps.size / tutorialSteps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Tutorial Steps */}
      <div className="space-y-4">
        {tutorialSteps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const Icon = step.icon;
          
          return (
            <Card 
              key={step.id}
              className={`transition-all duration-300 animate-fade-in ${
                isCompleted 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'hover:shadow-md hover:border-primary/30'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Step Number / Check */}
                  <button
                    onClick={() => toggleStep(step.id)}
                    className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground hover:bg-primary/10'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <span className="text-lg font-bold">{step.id}</span>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <h3 className={`text-lg font-semibold ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      {step.description}
                    </p>
                    <Button 
                      variant={isCompleted ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => navigate(step.action)}
                      className="gap-2"
                    >
                      {step.actionLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Start Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-bold mb-2">Prêt à commencer ?</h3>
          <p className="text-muted-foreground mb-4">
            La première étape est de créer votre ciblage pour définir votre marché cible.
          </p>
          <Button onClick={() => navigate('/targeting')} size="lg" className="gap-2">
            <Target className="h-5 w-5" />
            Créer mon premier Ciblage
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tutorial;
