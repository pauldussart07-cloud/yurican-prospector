-- Create a trigger to automatically create user credits when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (new.id, 500000);
  RETURN new;
END;
$$;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_credits();

-- Insert credits for existing users who don't have a record
INSERT INTO public.user_credits (user_id, credits)
SELECT id, 500000
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_credits WHERE user_id IS NOT NULL)
ON CONFLICT DO NOTHING;