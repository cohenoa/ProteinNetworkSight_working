from src.common.configuration import pgdb
import pandas as pd

from src.names import NAME_NOT_FOUND

INFO_NOT_FOUND = "info not found"
DRUG_NOT_FOUND = "drug not found"


def get_match_info(cur, id):
    sql = """ 
                SELECT annotation
                FROM items.proteins
                WHERE protein_id = %s
                LIMIT 1
                """

    if id == "":
        return INFO_NOT_FOUND

    cur.execute(sql, (id,))

    if cur.rowcount == 0:
        return INFO_NOT_FOUND

    rows = cur.fetchall()
    return rows[0][0]


def get_info_list(ids):
    with pgdb.get_cursor() as cur:
        info_list = []
        for id in ids:
            info = get_match_info(cur, id)
            info = info.replace("'", "''")
            info_list.append(info)

    return info_list


def get_drug_list(med_df, string_names):
    drug_list = []
    
    targets = med_df["Targets"].str.split('; ').apply(lambda x: x if type(x) != float else [])
    for name in string_names:
        if name == NAME_NOT_FOUND:
            drug_list.append(DRUG_NOT_FOUND)
            continue
        
        match_df = med_df[targets.apply(lambda x: True if name.upper() in x else False)]

        match_products = match_df["Product"].tolist()
        if match_products:
            drug_list.append(", ".join(match_products))

        else:
            drug_list.append(DRUG_NOT_FOUND)

    return drug_list


def insert(df):
    with pgdb.get_cursor() as cur:
        for __, row in df.iterrows():
            cur.execute(
                "INSERT INTO users.users_table VALUES('%s','%s','%s','%s',N'%s','%s')"
                % (
                    row["user"],
                    row["proteins"],
                    row["string_name"],
                    row["string_ids"],
                    row["info"],
                    row["drug"],
                )
            )


def register_user(proteins, ids, user_id, string_names):
    med_df = pd.read_csv("/python-docker/src/common/cancerdrugsdb.txt", delimiter="\t")

    info_list = get_info_list(ids)
    drugs_list = get_drug_list(med_df, string_names)
    dup_user = [user_id for __ in proteins]

    df = pd.DataFrame(
        zip(dup_user, proteins, string_names, ids, info_list, drugs_list),
        columns=["user", "proteins", "string_name", "string_ids", "info", "drug"],
    )

    insert(df)
