CREATE INDEX idx_protein_names_protein_species ON items.proteins_names(protein_name, species_id);

-- Create a composite index for protein_id and species_id in the items.proteins table
CREATE INDEX idx_proteins_protein_species ON items.proteins(protein_id, species_id);

-- Create a composite index for species_id and official_name in the items.species table
CREATE INDEX idx_species_id_official_name ON items.species(species_id, official_name);