PATH = "G:/programming/db/neo4j/data/relate-data/dbmss/dbms-23235d9f-2887-4264-a2f9-34fa83b24a1b/import"
file_name = "links.csv"

full_path = PATH + "/" + file_name

with open(full_path, "r", encoding="utf-8") as file:
    first_10_lines = ''.join(file.readline() for _ in range(100))

print(repr(first_10_lines))
write_path = PATH + "/peek.csv"
with open(write_path, "w", encoding="utf-8") as file:
    file.write(first_10_lines)