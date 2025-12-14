from src.common.configuration import connection
from dataclasses import dataclass
import logging
from collections import defaultdict

# import concurrent.futures

RED = "#ff0000"
BLUE = "#0047AB"
SCORE_NOT_FOUND = "score not found"
INFO_NOT_FOUND = "info not found"
DRUG_NOT_FOUND = "drug not found"

# ========class definitions =========
@dataclass
class Link:
    source: str
    target: str
    score: float

    def __init__(self, source, target, score) -> None:
        self.source = source
        self.target = target
        self.score = score

    def __repr__(self):
        return "{}({})-{}({})-{}({})\n".format(self.source, type(self.source), self.target, type(self.target), self.score, type(self.score))


@dataclass
class Node:
    def __init__(self, original_name, string_name, color, size) -> None:
        self.id = original_name
        self.string_name = string_name
        self.info = INFO_NOT_FOUND
        self.color = color
        self.size = size
        self.drug = []
        self.links = []
        self.linksWeights = 0

    def __repr__(self):
        return "{}-{}-{}\n".format(self.id, self.string_name, self.size)
    

# ======= data cleaning functions =========
def clean_data(original_names, internal_ids, string_names, values_map, thresh_pos, thresh_neg):
    clean_ids = []
    ids_to_nodes = defaultdict(list)

    for OriginalName, internal_id, string_name in zip(original_names, internal_ids, string_names):
        if not isIdOk(internal_id):
            continue
        value = float(values_map[OriginalName])
        if not isValueOk(value, thresh_pos, thresh_neg):
            continue

        color = get_color(value)
        size = get_size(value)

        clean_ids.append(internal_id)
        ids_to_nodes[internal_id].append(Node(OriginalName, string_name, color, size))

    return clean_ids, ids_to_nodes

# ======== making nodes functions =========
def isValueOk(value, thresh_pos, thresh_neg):
    thresh_pos = float(thresh_pos)
    thresh_neg = float(thresh_neg)

    if value < 0:
        isOk = value < thresh_neg
    else:
        isOk = value > thresh_pos
    return isOk


def isIdOk(value: str):
    return int(value) != 0

def get_color(value):
    return BLUE if value > 0 else RED

def get_size(value):
    return round(value, 2)

def add_info_optimized(con: connection, ids_to_nodes: dict[str, list[Node]]):
    with con.cursor() as cur:
        sql = """ 
            SELECT t.id, p.annotation
            FROM temp_ids t
            LEFT JOIN items.proteins p ON p.protein_id = t.id
        """
        cur.execute(sql)

        rows = cur.fetchall()

        for id, info in rows:
            nodes = ids_to_nodes[id]
            for node in nodes:
                node.info = info

def add_drugs_optimized(con: connection, ids_to_nodes: dict[str, list[Node]]):
    with con.cursor() as cur:
        sql = """ 
            SELECT t.id, d.drug_name, d.drugBankID
            FROM items.drugs d
            LEFT JOIN temp_ids t ON d.protein_id = t.id
        """
        cur.execute(sql)

        rows = cur.fetchall()

        for id, drugName, drugBankID in rows:
            nodes = ids_to_nodes[id]
            for node in nodes:
                node.drug.append({"drugName": drugName, "drugBankID": drugBankID})

def make_nodes_list_optimized(id_to_nodes: dict[str, list[Node]]):
    nodes_list = []

    for nodes in id_to_nodes.values():
        nodes_list.extend(nodes)

    return nodes_list


# ======== making links functions =========
def get_pairs_score_optimized(con: connection, threshold) -> list[tuple]:
    search_query = """
        SELECT 
            LEAST(l.node_id_a, l.node_id_b) AS id1,
            GREATEST(l.node_id_a, l.node_id_b) AS id2,
            l.combined_score::float / 1000.0 AS score
        FROM network.node_node_links l
        JOIN temp_ids a ON l.node_id_a = a.id
        JOIN temp_ids b ON l.node_id_b = b.id
        WHERE l.combined_score >= %s
        GROUP BY id1, id2, score;
    """

    with con.cursor() as cur:
        cur.execute(search_query, (int(float(threshold) * 1000),))
        rows = cur.fetchall()

    return rows

def go_back_to_original_optimized(id_to_nodes: dict[str, list[Node]], string_pairs_scores) -> list[Link]:
    original_pairs_scores = []

    for sid_a, sid_b, score in string_pairs_scores:
        a_match_list = id_to_nodes.get(sid_a, [])
        b_match_list = id_to_nodes.get(sid_b, [])

        for a in a_match_list:
            for b in b_match_list:
                scoreObj = Link(a.id, b.id, score)
                original_pairs_scores.append(scoreObj)
                
                a.links.append(b.id)
                a.linksWeights += score

                b.links.append(a.id)
                b.linksWeights += score

    return original_pairs_scores

def make_links_list_optimized(con: connection, score_thresh, id_to_nodes):
    string_pairs_scores = get_pairs_score_optimized(con, score_thresh)
    return go_back_to_original_optimized(id_to_nodes, string_pairs_scores)


# ======== main function =========

def build_Network(con, ids_to_nodes, score_thresh):
    add_info_optimized(con, ids_to_nodes)
    add_drugs_optimized(con, ids_to_nodes)

    links_list = make_links_list_optimized(con, score_thresh, ids_to_nodes)
    nodes_list = make_nodes_list_optimized(ids_to_nodes)

    return nodes_list, links_list
