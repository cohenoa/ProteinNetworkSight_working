from DB.updateDB_tools import *
import csv

configFileName = 'DB/database.example.ini'

conn: connection = open_conn(configFileName)

def write_csv_file(
    rows: list[tuple],
    output_path: str,
    headers: list[str] | None = None
):
    """
    Writes DB rows to a CSV file safely.

    Args:
        rows: List of tuples (DB rows)
        output_path: Where to save the CSV file
        headers: Optional list of column names
    """

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(
            f,
            delimiter=",",
            quotechar='"',
            quoting=csv.QUOTE_MINIMAL
        )

        # ✅ Optional header row
        if headers:
            writer.writerow(headers)

        # ✅ Data rows
        for row in rows:
            writer.writerow([
                "" if value is None else value for value in row
            ])

    print(f"✅ CSV written to: {os.path.abspath(output_path)}")

proteins = {
    "FASN": 6216362,
    "TFRC": 6223899,
    "GAPDH": 6224452,
    "EPPK1": 6229587,
    "IGFBP2": 6212129,
    "BRD4": 6213694,
    "RBM15": 6221365,
    "SMAD1": 6216456,
    "BCL2": 6224607,
    "TIGAR": 6211291,
    "INPP4B": 6226961,
    "MYH11": 6224384,
    "RICTOR": 6215685,
    "PDCD4": 6214749,
    "DUSP4": 6212273,
    "BRAF": 6226751,
    "ACACA": 6229493,
    "BCL2A1": 6214215,
    "BMS1": 6222345,
    "EIF4G1": 6226569,
    "HSPA4": 6216226,
    "STK11": 6217905,
    "FN1": 6219727,
    "AKT1": 6228101,
    "ERBB2": 6214308,
    "ERBB3": 6214165,
    "PXN": 6214175,
    "IFI27": 6229508,
    "ZNRD2": 6217029,
    "PAK2": 6217156,
    "DCTN6": 6211684,
    "RNF19A": 6227221,
    "CRK": 6216006,
    "AHSA1": 6211515,
    "POLDIP2": 6228897,
    "DIABLO-2": 6225796,
    "DIABLO": 6230697,
    "SRC": 6222162,
    "SERPINE1": 6211804,
}

species_rows = [(9606, "Homo sapiens", "Homo sapiens", "eukaryota", "core", 19699)]

with conn.cursor() as cur:
    cur.execute("CREATE TEMP TABLE temp_ids (id INT);")
    ids = list(proteins.values())
    cur.executemany("INSERT INTO temp_ids (id) VALUES (%s)", [(i,) for i in ids])

    # ------------- PROTEINS ---------------
    cur.execute("SELECT * FROM items.proteins WHERE protein_id IN (SELECT id FROM temp_ids);")
    rows = cur.fetchall()

    write_csv_file(rows, "DB/Schemas_new/items/proteins/dev_data.csv", headers=[
            "protein_id",
            "protein_external_id",
            "species_id",
            "protein_checksum",
            "protein_size",
            "annotation",
            "preferred_name",
            "annotation_word_vectors"
        ])
    
    # ------------- PROTEINS NAMES ---------------
    cur.execute("SELECT * FROM items.proteins_names WHERE protein_id IN (SELECT id FROM temp_ids);")
    rows = cur.fetchall()

    write_csv_file(rows, "DB/Schemas_new/items/proteins_names/dev_data.csv", headers=[
            "protein_name",
            "protein_id",
            "species_id",
            "source",
            "is_preferred_name"
        ])
    
    # ------------- SPECIES ---------------
    write_csv_file(species_rows, "DB/Schemas_new/items/species/dev_data.csv", headers=[
            "species_id",
            "official_name",
            "compact_name",
            "kingdom",
            "type",
            "protein_count"
        ])
    
    # ------------- NODE NODE LINKS ---------------
    cur.execute("SELECT * FROM network.node_node_links WHERE node_id_a IN (SELECT id FROM temp_ids) AND node_id_b IN (SELECT id FROM temp_ids);")
    rows = cur.fetchall()

    write_csv_file(rows, "DB/Schemas_new/network/node_node_links/dev_data.csv", headers=[
            "node_id_a",
            "node_id_b",
            "combined_score"
        ])

