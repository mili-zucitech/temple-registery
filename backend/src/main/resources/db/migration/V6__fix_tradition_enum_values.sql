-- Fix legacy tradition values in temples table to match current ReligiousTradition enum constants.
-- Old values were Pascal/mixed-case; enum constants are UPPER_CASE with renamed values.

UPDATE temples SET tradition = 'SHAIVITE'   WHERE tradition IN ('Shaiva',   'SHAIVA',   'shaiva');
UPDATE temples SET tradition = 'VAISHNAVITE' WHERE tradition IN ('Vaishnava','VAISHNAVA','vaishnava','Vaishnavite','vaishnavite');
UPDATE temples SET tradition = 'SHAKTA'     WHERE tradition IN ('Shakta',   'shakta');
UPDATE temples SET tradition = 'JAIN'       WHERE tradition IN ('Jain',     'jain');
UPDATE temples SET tradition = 'BUDDHIST'   WHERE tradition IN ('Buddhist', 'buddhist');
UPDATE temples SET tradition = 'OTHER'      WHERE tradition IN ('Other',    'other');
