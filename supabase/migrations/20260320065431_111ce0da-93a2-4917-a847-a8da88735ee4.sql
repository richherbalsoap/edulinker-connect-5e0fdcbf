
CREATE OR REPLACE FUNCTION public.generate_secret_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id text;
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i int;
  part1 text;
  part2 text;
BEGIN
  -- Only auto-generate if secret_id is NULL, empty, or 'TEMP'
  IF NEW.secret_id IS NOT NULL AND NEW.secret_id != '' AND NEW.secret_id != 'TEMP' THEN
    RETURN NEW;
  END IF;

  LOOP
    part1 := '';
    part2 := '';
    FOR i IN 1..5 LOOP
      part1 := part1 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    FOR i IN 1..5 LOOP
      part2 := part2 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    new_id := 'EDU-' || part1 || '-' || part2;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.students WHERE secret_id = new_id);
  END LOOP;
  NEW.secret_id := new_id;
  RETURN NEW;
END;
$function$;
