import pandas as pd
import json

# path to xlsx file

src_path = 'C:/Users/omrin/OneDrive/Desktop/Work/proteinNetworkSight/for work/example_data/example_short1.xlsx'
dest_path = 'C:/Users/omrin/OneDrive/Desktop/Work/proteinNetworkSight/for work/code/proteinnetworksight/frontend/src/assets/DefualtFile.tsx'

df = pd.read_excel(src_path)

headersArr = list(df.columns)

jsonArr = []

# add xlsx content to json array
for row in df.iterrows():
    rowArr = []
    jsonArr.append(row[1].values.tolist())


# create tsx file and dump json to it with in readable format
with open(dest_path, 'w') as outfile:

    # write headers to tsx file
    outfile.write('export const headers = [\n')
    for header in headersArr:
        outfile.write('\t\"' + str(header) + '\",\n')
    outfile.write('];\n\n')

    # write json data to tsx file
    outfile.write('export const json = [\n')
    for row in jsonArr:
        outfile.write('\t[\"' + str(row[0]) + '\",\n')
        for i in range(1, len(row)):  
            outfile.write('\t\t' + str(row[i]) + ',\n')
        outfile.write('\t],\n')
    outfile.write('];')




# for simple json dump
# json.dump(jsonArr, open(dest_path, 'w'))
