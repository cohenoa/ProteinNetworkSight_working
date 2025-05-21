-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS network;

-- Table for storing node-to-node links (protein interactions) in the network schema
CREATE TABLE network.node_node_physical_links (
    protein1 INT,  -- Internal identifier (equivalent to protein_id)
    protein2 INT,  -- Internal identifier (equivalent to protein_id)
    combined_score FLOAT,  -- The combined score of all the evidence scores
    PRIMARY KEY (protein1, protein2),  -- Composite primary key for unique links between two proteins
    FOREIGN KEY (protein1) REFERENCES items.proteins(protein_id),  -- Reference to node A (protein)
    FOREIGN KEY (protein2) REFERENCES items.proteins(protein_id),  -- Reference to node B (protein)
);