-- Mettre à jour la fonction pour donner 50000 crédits aux nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (new.id, 50000);
  RETURN new;
END;
$function$;