CREATE INDEX idx_proteins_protein_species ON items.proteins(protein_id, species_id);
CREATE INDEX idx_proteins_name_species ON items.proteins(preferred_name, species_id);
CREATE INDEX idx_proteins_protein_id ON items.proteins(protein_id);