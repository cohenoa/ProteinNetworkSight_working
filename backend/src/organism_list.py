from src.common.configuration import pgdb


class Organism:
    def __init__(self, name, id) -> None:
        self.label = name
        self.value = id
    
    def __str__(self) -> str:
        toPrint = "name:" + self.label + "\n"
        toPrint += "id:" + str(self.value) + "\n"
        return toPrint


def get_organism() -> str:
    with pgdb.get_cursor() as cur:
        sql = """ 
            SELECT species_id, official_name
            FROM items.species
            """
        cur.execute(sql)
        rows = cur.fetchall()
    return rows


def get_organism_list():
    organism_list = []

    rows = get_organism()
    for row in rows:
        obj = Organism(row[1], row[0])
        organism_list.append(obj)   

    return organism_list
