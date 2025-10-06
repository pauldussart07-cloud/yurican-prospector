-- Supprimer tous les contacts de l'utilisateur
DELETE FROM lead_contacts WHERE user_id = '47ffed2d-36dc-42c5-99b5-9ac403652d38';

-- Supprimer tous les leads de l'utilisateur
DELETE FROM leads WHERE user_id = '47ffed2d-36dc-42c5-99b5-9ac403652d38';