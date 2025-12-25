from src.common.configuration import pgdb

ID_NOT_FOUND = "id not found"

def get_id_by_name(name, organism) -> str:
    with pgdb.get_cursor() as cur:
        sql = """ 
                SELECT protein_id 
                FROM items.proteins
                WHERE preferred_name = %s and species_id =  %s
                """
        
        cur.execute(sql, (name, organism))

        if cur.rowcount == 0:
            return ID_NOT_FOUND

        rows = cur.fetchall()
    return rows[0][0]


def cal_string_id(name, organism):

    id =  get_id_by_name(name, organism)

    return {"match_id" : id}