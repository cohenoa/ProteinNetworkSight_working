
-------------------------------------------------------------------
---------------------- items.proteins -----------------------------
-------------------------------------------------------------------
-- lookup preferred_name by protein_id & species_id
SELECT preferred_name
FROM items.proteins
WHERE string_protein_id = %s;

-- lookup annotation by protein_id
SELECT annotation
FROM items.proteins
WHERE string_protein_id = %s;

-- lookup protein_id by preferred_name + species_id
SELECT string_protein_id
FROM items.proteins
WHERE preferred_name = %s AND string_protein_id LIKE %s || '.%';


-------------------------------------------------------------------
---------------------- items.proteins_names -----------------------
-------------------------------------------------------------------
SELECT DISTINCT string_protein_id
FROM items.proteins_names
WHERE UPPER(alias) = %s AND string_protein_id LIKE %s || '.%'
LIMIT 4;


-------------------------------------------------------------------
---------------------- items.species ------------------------------
-------------------------------------------------------------------
SELECT taxon_id, official_name_ncbi
FROM items.species;

