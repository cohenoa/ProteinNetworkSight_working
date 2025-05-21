import psycopg2
import csv
from tqdm import tqdm  # For progress bar
from configparser import ConfigParser
import os

section = "postgresql"
filename = "DB.ini"

base_dir = os.path.dirname(os.path.abspath(__file__ + "/../"))
file_path = os.path.join(base_dir, filename)

# create a parser
parser = ConfigParser(interpolation=None)
# read config file
parser.read(file_path)

# get section, default to postgresql
db = {}
if parser.has_section(section):
    params = parser.items(section)
    for param in params:
        db[param[0]] = param[1]
else:
    raise Exception('Section {0} not found in the {1} file'.format(section, filename))

# Path to your CSV file
CSV_PROTEIN_PATH = "G:/programming/db/protein.csv"
CSV_LINKS_PATH = "G:/programming/db/links.csv"

# Connect to PostgreSQL
conn = psycopg2.connect(**db)
cur = conn.cursor()

INSERT_PROTEIN_QUERY = """
    INSERT INTO items.proteins (string_protein_id, preferred_name, protein_size, annotation)
    VALUES (%s, %s, %s, %s);
"""

# SQL Insert Query
INSERT_LINK_QUERY = """
    INSERT INTO network.physical_links (protein1, protein2, combined_score)
    VALUES (%s, %s, %s);
"""

# Read CSV and Insert Row-by-Row
with open(CSV_LINKS_PATH, "r", newline="", encoding="utf-8") as file:
    reader = csv.reader(file)
    header = next(reader)  # Skip header

    BATCH_SIZE = 10000
    batch = []

    try:
        for row in tqdm(reader, desc="Inserting Data", unit="rows"):
            protein1, protein2, combined_score = row[0], row[1], int(row[2])
            # p1, p2 = sorted([protein1, protein2])
            p1, p2 = protein1, protein2
            batch.append((p1, p2, combined_score))

            if len(batch) >= BATCH_SIZE:
                cur.executemany(INSERT_LINK_QUERY, batch)
                conn.commit()  # Commit every batch
                batch = []  # Reset batch

        # Insert any remaining rows
        if batch:
            cur.executemany(INSERT_LINK_QUERY, batch)
            conn.commit()

    except Exception as e:
        print(e)
        # print(batch)

    # for row in tqdm(reader, desc="Inserting Data", unit="rows"):
        # try:
        #     curr_line = ",".join(row)
        #     curr_line += "\n"
        #     curr_line += f"{reader.line_num}\t"
        #     id, name, size, annotation = row[0], row[1], int(row[2]), row[3]

        #     # Insert into DB
        #     cur.execute(INSERT_PROTEIN_QUERY, (id, name, size, annotation))
        # except Exception as e:
        #     print(e)
        #     print(curr_line)

        # try:
        #     curr_line = ",".join(row)
        #     curr_line += "\n"
        #     curr_line += f"{reader.line_num}\t"
        #     protein1, protein2, combined_score = row[0], row[1], int(row[2])
            
        #     # Ensure correct order
        #     p1, p2 = sorted([protein1, protein2])  # Python equivalent of LEAST/GREATEST

        #     # Insert into DB
        #     cur.execute(INSERT_PROTEIN_QUERY, (p1, p2, combined_score))

# Commit & Close
conn.commit()
cur.close()
conn.close()

print("✅ Data successfully inserted!")
