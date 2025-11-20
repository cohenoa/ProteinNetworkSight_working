CREATE INDEX idx_protein_names_upper_name_species ON items.proteins_names(UPPER(protein_name), species_id);
