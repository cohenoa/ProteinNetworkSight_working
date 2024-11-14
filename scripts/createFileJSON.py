import pandas as pd
import json

# path to xlsx file

src_path = 'C:/Users/omrin/Downloads/example.xlsx'
dest_path = 'C:/Users/omrin/Downloads/example.tsx'

df = pd.read_excel(src_path)

# for uid in df['UID']:

jsonArr = []

for row in df.iterrows():
    rowArr = []
    jsonArr.append(row[1].values.tolist())

print(jsonArr)
with open(dest_path, 'w') as outfile:
    outfile.write('export const data = [\n')
    for row in jsonArr:
        outfile.write('\t[\"' + str(row[0]) + '\",\n')
        for i in range(1, len(row)):  
            outfile.write('\t\t' + str(row[i]) + ',\n')
        outfile.write('\t],\n')
    outfile.write('];')



# json.dump(jsonArr, open(dest_path, 'w'))
