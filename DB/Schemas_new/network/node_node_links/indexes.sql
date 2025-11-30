CREATE INDEX idx_node_node_links_a_b ON network.node_node_links(node_id_a, node_id_b);
CREATE INDEX idx_node_node_links_b_a ON network.node_node_links(node_id_b, node_id_a);