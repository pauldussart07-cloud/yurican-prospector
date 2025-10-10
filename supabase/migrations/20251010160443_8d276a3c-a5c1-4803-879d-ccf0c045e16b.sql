-- Mettre à jour les crédits de tous les utilisateurs à 50000
UPDATE user_credits 
SET credits = 50000, 
    updated_at = now();