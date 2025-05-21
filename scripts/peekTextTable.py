# PATH = "G:/programming/db/neo4j/data/relate-data/dbmss/dbms-23235d9f-2887-4264-a2f9-34fa83b24a1b/import"
PATH = "G:/programming/db"
file_name = "links.csv"

full_path = PATH + "/" + file_name

with open(full_path, "r", encoding="utf-8") as file:
    first_lines = ''.join(file.readline() for _ in range(5))

with open(full_path, "r", encoding="utf-8") as file:
    total_lines = sum(1 for line in file)

# print(repr(first_lines))
print(total_lines)

# write_path = PATH + "/peek.csv"
# with open(write_path, "w", encoding="utf-8") as file:
#     file.write(first_lines)