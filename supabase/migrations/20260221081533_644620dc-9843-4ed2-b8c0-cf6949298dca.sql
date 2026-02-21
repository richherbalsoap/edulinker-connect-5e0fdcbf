
-- Fix existing students with known created_by
UPDATE students 
SET school_id = s.id 
FROM schools s 
WHERE students.created_by = s.owner_user_id 
AND students.school_id IS NULL;

-- Fix students with NULL created_by - assign to first available school
UPDATE students 
SET school_id = (SELECT id FROM schools LIMIT 1)
WHERE school_id IS NULL;

-- Also fix any homework, complaints, results, announcements with NULL school_id
UPDATE homework 
SET school_id = s.id 
FROM schools s 
WHERE homework.created_by = s.owner_user_id 
AND homework.school_id IS NULL;

UPDATE complaints 
SET school_id = s.id 
FROM schools s 
WHERE complaints.created_by = s.owner_user_id 
AND complaints.school_id IS NULL;

UPDATE results 
SET school_id = s.id 
FROM schools s 
WHERE results.created_by = s.owner_user_id 
AND results.school_id IS NULL;

UPDATE announcements 
SET school_id = s.id 
FROM schools s 
WHERE announcements.created_by = s.owner_user_id 
AND announcements.school_id IS NULL;
