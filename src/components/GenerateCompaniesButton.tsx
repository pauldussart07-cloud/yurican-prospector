import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateAndInsertCompanies } from '@/utils/generateCompanies';
import { Loader2 } from 'lucide-react';

export function GenerateCompaniesButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const results = await generateAndInsertCompanies(40, 30);
      toast({
        title: 'Entreprises générées',
        description: `${results.length} entreprises ont été ajoutées avec succès.`,
      });
      // Recharger la page pour voir les nouvelles données
      window.location.reload();
    } catch (error) {
      console.error('Error generating companies:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la génération des entreprises.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={isGenerating}
      variant="outline"
      size="sm"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Génération...
        </>
      ) : (
        'Générer 40 entreprises (30 signaux)'
      )}
    </Button>
  );
}
