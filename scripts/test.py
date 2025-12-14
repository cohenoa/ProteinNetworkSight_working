import pandas as pd
from collections import defaultdict
from dataclasses import dataclass
import json

@dataclass
class Link:
    def __init__(self, source, target, score) -> None:
        self.source = source
        self.target = target
        self.score = score


@dataclass
class Node:
    def __init__(self, original_name, string_name, color, size) -> None:
        self.id = original_name
        self.string_name = string_name
        self.info = None
        self.color = color
        self.size = size
        self.drug = []
        self.links = []
        self.linksWeights = 0

nodes_list = [Node("orgName", "stringName", "color", "size")]

jsonObj = json.dumps(
    {
        "links": [ob.__dict__ for ob in nodes_list],
    }
)

print(jsonObj)





# def get_pairs_score_optimized(con: connection, threshold) -> list[tuple]:
#     search_query = """
#         SELECT 
#             LEAST(l.node_id_a, l.node_id_b) AS id1,
#             GREATEST(l.node_id_a, l.node_id_b) AS id2,
#             l.combined_score::float / 1000.0 AS score
#         FROM network.node_node_links l
#         JOIN temp_ids a ON l.node_id_a = a.id
#         JOIN temp_ids b ON l.node_id_b = b.id
#         WHERE l.combined_score >= %s
#         GROUP BY id1, id2, score;
#     """

#     with con.cursor() as cur:
#         cur.execute(search_query, (int(float(threshold) * 1000),))
#         rows = cur.fetchall()

#     return rows

# def go_back_to_original_optimized(id_to_nodes: dict[str, list[Node]], string_pairs_scores) -> list[Link]:
#     original_pairs_scores = []

#     for sid_a, sid_b, score in string_pairs_scores:
#         a_match_list = id_to_nodes.get(sid_a, [])
#         b_match_list = id_to_nodes.get(sid_b, [])

#         for a in a_match_list:
#             for b in b_match_list:
#                 scoreObj = Link(a.id, b.id, score)
#                 original_pairs_scores.append(scoreObj)
                
#                 a.links.append(scoreObj)
#                 a.linksWeights += score

#                 b.links.append(scoreObj)
#                 b.linksWeights += score

#     return original_pairs_scores

# def make_links_list_optimized(con: connection, score_thresh, id_to_nodes):
#     string_pairs_scores = get_pairs_score_optimized(con, score_thresh)
#     original_pairs_scores = go_back_to_original_optimized(id_to_nodes, string_pairs_scores)
#     return original_pairs_scores

# def get_info_list_optimized(con: connection, ids_to_nodes: dict[str, list[Node]]):
#     with con.cursor() as cur:
#         sql = """ 
#             SELECT t.id, p.annotation
#             FROM temp_ids t
#             LEFT JOIN items.proteins p ON p.protein_id = t.id
#         """
#         cur.execute(sql)

#         rows = cur.fetchall()

#         for id, info in rows:
#             nodes = ids_to_nodes[id]
#             for node in nodes:
#                 node.info = info

# def get_drug_list_optimized(con: connection, ids_to_nodes: dict[str, list[Node]]):
#     with con.cursor() as cur:
#         sql = """ 
#             SELECT t.id, d.drug_name, d.drugBankID
#             FROM items.drugs d
#             LEFT JOIN temp_ids t ON d.protein_id = t.id
#         """
#         cur.execute(sql)

#         rows = cur.fetchall()

#         for id, drugName, drugBankID in rows:
#             nodes = ids_to_nodes[id]
#             for node in nodes:
#                 node.drug.append({"drugName": drugName, "drugBankID": drugBankID})

# def make_node_list_optimized(id_to_nodes: dict[str, list[Node]]):
#     nodes_list = []

#     for nodes in id_to_nodes.values():
#         nodes_list.extend(nodes)

#     return nodes_list

# def build_Network(con, ids_to_nodes, score_thresh):
#     get_info_list_optimized(con, ids_to_nodes)
#     get_drug_list_optimized(con, ids_to_nodes)

#     # for (info, drugs) in zip(info_map, drug_list):
#     #     ids_to_nodes

#     links_list = make_links_list_optimized(con, score_thresh, ids_to_nodes)
#     nodes_list = make_node_list_optimized(ids_to_nodes)

#     return nodes_list, links_list