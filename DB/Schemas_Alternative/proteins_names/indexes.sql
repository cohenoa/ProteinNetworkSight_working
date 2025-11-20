-- Functional index for case-insensitive alias lookups
CREATE INDEX idx_protein_names_upper_alias ON items.proteins_names(UPPER(alias));