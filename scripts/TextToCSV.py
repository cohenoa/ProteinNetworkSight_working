import csv

input_file = "G:/programming/db/protein.info.v12.0.txt"
output_file = "G:/programming/db/protein.info.v12.0.csv"

with open(input_file, "r", encoding="utf-8") as infile, open(output_file, "w", encoding="utf-8", newline="") as outfile:
    writer = csv.writer(outfile)
    
    for line in infile:
        if line.startswith("#"):  # Skip header if it starts with "#"
            header = line.lstrip("#").strip().split("\t")  # Extract headers
            writer.writerow(header)
        else:
            row = line.strip().split("\t")  # Split by spaces
            writer.writerow(row)