import requests
import re
import json

url = "https://rest.uniprot.org/uniprotkb/search?query=(reviewed:true)%20AND%20(organism_id:9606)"
text = requests.get(url).text
jsonObj = json.loads(text)

id = jsonObj["results"][0]["primaryAccession"]
url2 = f"https://www.uniprot.org/uniprotkb/{id}/entry"

url = "https://www.uniprot.org/uniprotkb?query=%28gene%3ATIGAR%29+AND+%28organism_id%3A9606%29+AND+%28reviewed%3Atrue%29"
print(url2)