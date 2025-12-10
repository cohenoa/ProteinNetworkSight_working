from src.common.configuration import close_db_conn, open_db_conn
import pandas as pd
import time
import concurrent.futures

RED = "#ff0000"
BLUE = "#0047AB"
SCORE_NOT_FOUND = "score not found"

# ========class definitions =========
class IdsPair:
    def __init__(self, a_id, b_id, score) -> None:
        self.a_id = a_id
        self.b_id = b_id
        self.score = score

    def __eq__(self, other):
        return (self.a_id == other.a_id and self.b_id == other.b_id) or (
            self.a_id == other.b_id and self.b_id == other.a_id
        )


class Link:
    def __init__(self, source, target, score) -> None:
        self.source = source
        self.target = target
        self.score = score


class Node:
    def __init__(
        self, original_name, string_name, info, color, size, drug, links, linksWeights
    ) -> None:
        self.id = original_name
        self.string_name = string_name
        self.info = info
        self.color = color
        self.size = size
        self.drug = drug
        self.links = links
        self.linksWeights = linksWeights


# ========init user info =========
def read_user_info(user_id, conn):
    sql = """ 
            SELECT *
            FROM  users.users_table
            WHERE users_table.user = '%s'
            """ % (
        user_id
    )

    usr_df = pd.read_sql_query(sql, conn)
    return usr_df


# ========making nodes functions =========
def getValueById(node_id, values_map):
    node_value = values_map[node_id]
    # print("node_id=", node_id, " matched node_value=", node_value)
    return node_value


def isValueOk(value, thresh_pos, thresh_neg):
    value = float(value)
    thresh_pos = float(thresh_pos)
    thresh_neg = float(thresh_neg)

    if value < 0:
        isOk = value < thresh_neg
    else:
        isOk = value > thresh_pos

    # print(
    #     "value=",
    #     value,
    #     "thresh_pos=",
    #     thresh_pos,
    #     "thresh_neg=",
    #     thresh_neg,
    #     "isOk=",
    #     isOk,
    # )
    return isOk


def isIdOk(value):
    value = int(value)
    return value != 0


def get_color(value):
    value = float(value)

    if value < 0:
        color = RED
    else:
        color = BLUE

    # print("value=", value, "color=", color)
    return color


def round_value(size):
    """ """
    return round(size, 2)


def findLinks(name, links_list):
    links = []

    for link in links_list:
        if link.source == name:
            links.append(link.target)
        if link.target == name:
            links.append(link.source)

    return links


def make_node_list(usr_df, links_list):
    # adding the colors column
    usr_df["colors"] = usr_df.apply(lambda row: get_color(row["values"]), axis=1)

    # adding round_values column
    usr_df["round_values"] = usr_df.apply(
        lambda row: round_value(row["values"]), axis=1
    )

    # adding links column
    usr_df["links"] = usr_df.apply(
        lambda row: findLinks(row["proteins"], links_list), axis=1
    )

     # adding linksWeights column
    usr_df["linksWeights"] = usr_df.apply(lambda row: findLinksWeights(row["proteins"], links_list), axis=1)

    nodes_list = []
    for __, row in usr_df.iterrows():
        node_obj = Node(
            row["proteins"],
            row["string_name"],
            row["info"],
            row["colors"],
            row["round_values"],
            row["drug"],
            row["links"],
            row["linksWeights"]
        )
        # print(
        #     "final node object is:",
        #     node_obj.id,
        #     node_obj.string_name,
        #     node_obj.info,
        #     node_obj.color,
        #     node_obj.size,
        #     node_obj.drug,
        #     node_obj.links,
        # )
        nodes_list.append(node_obj)

    return nodes_list


# ========making links functions =========
def is_in_list(target_obj, target_list) -> bool:
    is_in = False
    for obj in target_list:
        if target_obj.__eq__(obj):
            # print(
            #     "found a duplicate!! first_obj=",
            #     obj.a_id,
            #     obj.b_id,
            #     "second_obj=",
            #     target_obj.a_id,
            #     target_obj.b_id,
            # )
            is_in = True

    return is_in


def init_pairs_list(usr_df) -> list:
    # print("BEFORE id=", usr_df["string_ids"].tolist(), "total is:", len(usr_df["string_ids"].tolist()))
    uniq_df = usr_df.drop(usr_df[usr_df.string_ids == ""].index, inplace=False)
    uniq_df = uniq_df.drop_duplicates(subset=["string_ids"], inplace=False)
    string_ids = uniq_df["string_ids"].tolist()
    # print("uniq string id=", string_ids, " total=", len(string_ids))

    ids_pairs_list = []
    for id1 in string_ids:
        for id2 in string_ids:
            if id1 == id2:
                continue
            pair_obj = IdsPair(id1, id2, 0)
            if not is_in_list(pair_obj, ids_pairs_list):
                ids_pairs_list.append(pair_obj)

    # print("total pairs:", len(ids_pairs_list))
    return ids_pairs_list


def get_score(conn, id1, id2) -> float:
    sql = """ 
            SELECT combined_score
            FROM network.node_node_links
            WHERE (node_id_a = %s and node_id_b = %s) or (node_id_b=%s and node_id_a=%s)
            """ % (
        id1,
        id2,
        id1,
        id2,
    )
    
    cur = conn.cursor()
    cur.execute(sql) 
    if cur.rowcount == 0:
        return SCORE_NOT_FOUND

    rows = cur.fetchall()
    result1 = rows[0][0] / 1000
    # result2 = rows[1][0] / 1000

    # if result1 != result2:
    #     print("sql is:", sql, "results are different should not happen!!!!!!!!!!!", result1, result2)

    return result1

def get_score_multithread(f_score_thresh, good_pairs, obj,conn):
    score = get_score(conn, obj.a_id, obj.b_id)
    if score == SCORE_NOT_FOUND:
        # print("score not found for:", obj.a_id, obj.b_id)
        return

    f_score = float(score)
    # print(f_score, f_score_thresh, f_score > f_score_thresh )
    if f_score > f_score_thresh:
        obj.score = score
        good_pairs.append(obj)
    return 

def get_pairs_score(score_thresh, pairs_list, conn) -> list:
    good_pairs = []
    f_score_thresh= float(score_thresh)
    start = time.time()
    
    for obj in pairs_list:
        score = get_score(conn, obj.a_id, obj.b_id)
        
        if score == SCORE_NOT_FOUND:
            continue

        f_score = float(score)
        if f_score > f_score_thresh:
            obj.score = score
            good_pairs.append(obj)
    
    end = time.time()
    print("time get_score is: ",end-start)
    return good_pairs


def get_matchings_proteins_from_df(usr_df, string_id):
    match_df = usr_df.loc[usr_df["string_ids"] == string_id]
    match_list = match_df["proteins"].tolist()
    return match_list


def go_back_to_original(usr_df, string_pairs_scores) -> list:
    original_pairs_scores = []
    for obj in string_pairs_scores:
        a_matching_names = get_matchings_proteins_from_df(usr_df, obj.a_id)
        b_matching_names = get_matchings_proteins_from_df(usr_df, obj.b_id)

        for a_match in a_matching_names:
            for b_match in b_matching_names:
                scoreObj = Link(a_match, b_match, obj.score)
                print(a_match, b_match, obj.score)
                original_pairs_scores.append(scoreObj)

    return original_pairs_scores

def findLinksWeights(name, links_list):   
    linksWeights = 0
    
    for link in links_list:
        if link.source == name or link.target == name:
            linksWeights += link.score
    
    return linksWeights

def make_links_list(usr_df, score_thresh, conn):
    pairs_list = init_pairs_list(usr_df)
    string_pairs_scores = get_pairs_score(score_thresh, pairs_list, conn)
    original_pairs_scores = go_back_to_original(usr_df, string_pairs_scores)
    return original_pairs_scores


# ========main function =========
def make_graph_data(usr_df: pd.DataFrame, values_map, thresh_pos, thresh_neg, score_thresh):
    # deleting names with no id
    mask = usr_df["string_ids"].apply(lambda v: not isIdOk(v))
    usr_df.drop(usr_df[mask].index, inplace=True)

    # applying values
    usr_df["values"] = usr_df["proteins"].apply(lambda v: getValueById(v, values_map))

    mask = usr_df["values"].apply(lambda v: not isValueOk(v, thresh_pos, thresh_neg))
    usr_df.drop(usr_df[mask].index, inplace=True)

    links_list = make_links_list(usr_df, score_thresh)
    nodes_list = make_node_list(usr_df, links_list)

    return nodes_list, links_list
