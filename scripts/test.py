from DB.updateDB_tools import *

SCORE_NOT_FOUND = "score not found"
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

def get_pairs_score(score_thresh, pairs_list, conn) -> list:
    good_pairs = []
    f_score_thresh= float(score_thresh)
    # pool = concurrent.futures.ThreadPoolExecutor(max_workers=4)

    # for i in range(len(pairs_list)):
    #     obj = pairs_list[i]
    #     pool.submit(get_score_multithread,f_score_thresh, good_pairs, obj, conn)
    # pool.shutdown(wait=True)
    
    for obj in pairs_list:
        score = get_score(conn, obj.a_id, obj.b_id)
        
        if score == SCORE_NOT_FOUND:
            # print("score not found for:", obj.a_id, obj.b_id)
            continue

        f_score = float(score)
        # print(f_score, f_score_thresh, f_score > f_score_thresh )
        if f_score > f_score_thresh:
            obj.score = score
            good_pairs.append(obj)
    
    return good_pairs

class IdsPair:
    def __init__(self, a_id, b_id, score) -> None:
        self.a_id = a_id
        self.b_id = b_id
        self.score = score

    def __eq__(self, other):
        return (self.a_id == other.a_id and self.b_id == other.b_id) or (
            self.a_id == other.b_id and self.b_id == other.a_id
        )
    
    def __str__(self):
        return f"({self.a_id}, {self.b_id}, {self.score})"
    
    def __repr__(self):
        return str(self)

def get_pairs_score_optimized(threshold, ids, conn):
    # conn.autocommit = True
    
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
    cur = conn.cursor()

    cur.execute("CREATE TEMP TABLE temp_ids (id INT);")
    cur.executemany("INSERT INTO temp_ids (id) VALUES (%s)", [(i,) for i in ids])

    cur.execute(search_query, (threshold * 1000,))

    if cur.rowcount == 0:
        return SCORE_NOT_FOUND

    rows = cur.fetchall()

    cur.execute("DROP TABLE temp_ids;")
    return rows

# def go_back_to_original(usr_df, string_pairs_scores) -> list:
#     original_pairs_scores = []
#     for obj in string_pairs_scores:
#         a_matching_names = get_matchings_proteins_from_df(usr_df, obj.a_id)
#         b_matching_names = get_matchings_proteins_from_df(usr_df, obj.b_id)

#         for a_match in a_matching_names:
#             for b_match in b_matching_names:
#                 scoreObj = Link(a_match, b_match, obj.score)
#                 print(a_match, b_match, obj.score)
#                 original_pairs_scores.append(scoreObj)

#     return original_pairs_scores
    
# def make_links_list_optimized(usr_df, score_thresh, conn):
#     ids = [1, 2, 3]
#     string_pairs_scores = get_pairs_score_optimized(score_thresh, pairs_list, conn)
#     original_pairs_scores = go_back_to_original_optimized(usr_df, string_pairs_scores)


# def make_links_list(usr_df, score_thresh, conn):
#     pairs_list = [IdsPair(2, 1, 0), IdsPair(1, 3, 0), IdsPair(2, 3, 0)]
#     string_pairs_scores = get_pairs_score(score_thresh, pairs_list, conn)
#     original_pairs_scores = go_back_to_original(usr_df, string_pairs_scores)
#     return original_pairs_scores

conn = open_conn('DB/database.example.ini')

ids = [1, 2, 3]

pairs_list = [IdsPair(2, 1, 0), IdsPair(1, 3, 0), IdsPair(2, 3, 0)]

print('-------------------------------------------------')
print(get_pairs_score(0, pairs_list, conn=conn))
print('-------------------------------------------------')
print(get_pairs_score_optimized(0, ids, conn=conn))
print('-------------------------------------------------')

conn.close()