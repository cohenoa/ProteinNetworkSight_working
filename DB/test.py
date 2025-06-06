def get_scores(conn, ids, score_thresh) -> list:
    sql = """
        SELECT *
        FROM network.node_node_links 
        WHERE (protein1 IN %s AND protein2 IN %s) AND combined_score > %s
    """
    cur = conn.cursor()
    cur.execute(sql, (tuple(ids), tuple(ids), score_thresh))
    records = cur.fetchall()

def is_in_list(target_obj, target_list) -> bool:
    is_in = False
    for obj in target_list:
        if target_obj.__eq__(obj):
            print("found a duplicate!")
            is_in = True
            break

    return is_in

    