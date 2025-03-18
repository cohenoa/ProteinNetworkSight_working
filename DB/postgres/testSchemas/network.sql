-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS network;

-- Table for storing node-to-node links (protein interactions) in the network schema
CREATE TABLE network.node_node_physical_links (
    node_id_a INT,  -- Internal identifier (equivalent to protein_id)
    node_id_b INT,  -- Internal identifier (equivalent to protein_id)
    combined_score FLOAT,  -- The combined score of all the evidence scores
    evidence_score JSONB,  -- Evidence score as a JSON list of score types and their scores (e.g., {{4, 0.626}})
    PRIMARY KEY (node_id_a, node_id_b),  -- Composite primary key for unique links between two proteins
    FOREIGN KEY (node_id_a) REFERENCES items.proteins(protein_id),  -- Reference to node A (protein)
    FOREIGN KEY (node_id_b) REFERENCES items.proteins(protein_id),  -- Reference to node B (protein)
);