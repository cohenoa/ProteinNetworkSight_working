-- Create the items schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS items;

-- Table for storing protein information
CREATE TABLE items.proteins (
    string_protein_id VARCHAR(255) PRIMARY KEY,  -- Internal protein identifier
    preferred_name VARCHAR(255),  -- Preferred name (e.g., "amiF")
    protein_size INT,  -- Length of the protein in amino acids
    annotation TEXT  -- Description of the functionality of the protein
);