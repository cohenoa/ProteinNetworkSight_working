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

-- from STRING
CREATE TABLE items.species (
    species_id integer,
    official_name character varying(100),
    compact_name character varying(100),
    kingdom character varying(15),
    type character varying(10),
    protein_count integer
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

-- from STRING
CREATE TABLE items.proteins (
    protein_id integer,
    protein_external_id character varying(50),
    species_id integer,
    protein_checksum character varying(16),
    protein_size integer,
    annotation character varying(600),
    preferred_name character varying(50),
    annotation_word_vectors tsvector
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

-- from STRING
CREATE TABLE items.proteins_names (
    protein_name character varying(100),
    protein_id integer,
    species_id integer,
    source character varying(100),
    is_preferred_name boolean
);


CREATE INDEX idx_protein_names_protein_species ON items.proteins_names(protein_name, species_id);

-- Create a composite index for protein_id and species_id in the items.proteins table
CREATE INDEX idx_proteins_protein_species ON items.proteins(protein_id, species_id);

-- Create a composite index for species_id and official_name in the items.species table
CREATE INDEX idx_species_id_official_name ON items.species(species_id, official_name);


