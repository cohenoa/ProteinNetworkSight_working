from src.common.configuration import pgdb
from src.clean_uid import clean_id

ID_NOT_FOUND = "id not found"
NAME_NOT_FOUND = "name not found"

class ProteinNames:
    def __init__(self, original_name, clean_name) -> None:
        self.original_name = original_name
        self.clean_name = clean_name
        self.suggested_names = {}

    def __str__(self) -> str:
        toPrint = "original name:" + self.original_name + "\n"
        toPrint += "clean name:" + self.clean_name + "\n"
        toPrint += "suggested_names:" + str(self.suggested_names) + "\n"
        return toPrint
    
    def __repr__(self):
        str(self)


def init_suggestions_list(org_names) -> list:
    sug_list = []

    for org_name in org_names:
        clean_name = clean_id(org_name)
        obj = ProteinNames(org_name, clean_name)
        sug_list.append(obj)

    return sug_list


def get_match_ids(name, organism) -> list:
    with pgdb.get_cursor() as cur:
        sql = """ 
                SELECT DISTINCT protein_id
                FROM items.proteins_names
                WHERE UPPER(protein_name) = %s and species_id = %s
                LIMIT 4
                """
        cur.execute(sql, (name, organism))

        if cur.rowcount == 0:
            return [ID_NOT_FOUND]

        matches = []
        rows = cur.fetchall()

    for row in rows:
        matches.append(row[0])

    return matches


def get_name_by_id(id, organism) -> str:
    with pgdb.get_cursor() as cur:
        sql = """ 
                SELECT DISTINCT preferred_name
                FROM items.proteins
                WHERE protein_id = %s and species_id = %s
                LIMIT 1
                """

        if id == ID_NOT_FOUND:
            return NAME_NOT_FOUND
        
        cur.execute(sql, (id, organism))

        if cur.rowcount == 0:
            return NAME_NOT_FOUND

        rows = cur.fetchall()
    return rows[0][0]


def get_suggestions(clean_name, organism) -> dict:
    """Connect to the PostgreSQL database server"""
    string_suggestions = {}

    ids = get_match_ids(clean_name, organism)
    for id in ids:
        name = get_name_by_id(id, organism)
        string_suggestions[name] = id

    return string_suggestions


def init_statistics(sug_list):
    perfect_match = {}
    alternative_match = {}
    no_match = []
    for sug_obj in sug_list:
        org_name = sug_obj.original_name
        sug_names_list = sug_obj.suggested_names.keys()

        if org_name in sug_names_list:
            perfect_match[org_name] = sug_obj.suggested_names[org_name]

        elif NAME_NOT_FOUND in sug_names_list:
            no_match.append(org_name)

        else:
            alternative_match[org_name] = sug_obj.suggested_names

    return {"perfect_match":perfect_match,
            "alternative_match":alternative_match,
            "no_match":no_match}

            
def cal_string_suggestions(org_names, organism) -> list:
    sug_list = init_suggestions_list(org_names)

    for sug_obj in sug_list:
        sug_dict = get_suggestions(sug_obj.clean_name, organism)
        sug_obj.suggested_names = sug_dict

    stat_list = init_statistics(sug_list)

    return stat_list
