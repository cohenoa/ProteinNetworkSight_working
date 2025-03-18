-- Create the items schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS items;

-- Table for storing species (taxonomy) information
CREATE TABLE items.species (
    species_id INT PRIMARY KEY,  -- Taxonomy identifier (e.g., "9606" for human)
    official_name VARCHAR(255),  -- Scientific name of the organism
    compact_name VARCHAR(255),  -- Other name, shortened version of the scientific name
    kingdom VARCHAR(255),  -- Kingdom to which the organism belongs
    type VARCHAR(50) CHECK (type IN ('core', 'periphery'))  -- Core or periphery species
);

-- Table for storing protein information
CREATE TABLE items.proteins (
    protein_id INT PRIMARY KEY,  -- Internal protein identifier
    protein_external_id VARCHAR(255) UNIQUE,  -- Taxonomy identifier and protein name concatenated
    species_id INT,  -- Taxonomy identifier
    protein_checksum VARCHAR(255),  -- Checksum of the protein sequence
    protein_size INT,  -- Length of the protein in amino acids
    annotation TEXT,  -- Description of the functionality of the protein
    preferred_name VARCHAR(255),  -- Preferred name (e.g., "amiF")
    annotation_word_vectors TSVECTOR,  -- For internal use: full-text search
    FOREIGN KEY (species_id) REFERENCES items.species(species_id)
);

-- Table for storing protein names
CREATE TABLE items.proteins_names (
    protein_name VARCHAR(255),  -- A name of the protein (e.g., "amiF", "spr1703", "AE008535", etc.)
    protein_id INT,  -- Internal protein identifier
    species_id INT,  -- Taxonomy identifier
    source VARCHAR(255),  -- The origin of the name (e.g., "Ensembl")
    is_preferred_name BOOLEAN,  -- "True" if the name is the preferred string name
    PRIMARY KEY (protein_name, protein_id),  -- Composite key to ensure unique names per protein
    FOREIGN KEY (protein_id) REFERENCES items.proteins(protein_id),  -- Reference to items.proteins
    FOREIGN KEY (species_id) REFERENCES items.species(species_id)  -- Reference to items.species
);