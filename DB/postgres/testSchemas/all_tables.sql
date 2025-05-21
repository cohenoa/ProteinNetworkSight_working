-- Create the items schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS items;
CREATE SCHEMA IF NOT EXISTS network;

CREATE TABLE items.proteins (
    string_protein_id VARCHAR(255) PRIMARY KEY,
    preferred_name VARCHAR(255),
    protein_size INT,
    annotation TEXT
);

CREATE INDEX idx_protein_id ON proteins(string_protein_id);


CREATE TABLE network.physical_links (
    protein1 VARCHAR(255) REFERENCES items.proteins(string_protein_id),
    protein2 VARCHAR(255) REFERENCES items.proteins(string_protein_id),
    combined_score INT,
    PRIMARY KEY (protein1, protein2)
);

CREATE INDEX idx_physical_links_composite ON network.physical_links (protein1, protein2);
