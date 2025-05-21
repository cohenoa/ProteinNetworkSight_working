import os
import json

base_dir = "G:/programming/Work/proteinNetworkSight/for work/code/proteinnetworksight/DB/postgres/testSchemas"
file_name = "test_config_10000.json"
file_path = os.path.join(base_dir, file_name)

with open(file_path, "r") as file:
    config_json = json.load(file)


prev_obj = config_json["statistics"]
print(prev_obj)
del prev_obj["full_batch"]

new_obj = {
    "average_batches": {
        "average_time": -1,
        "max_time": -1,
        "average_res_size": -1,
        "max_res_size": -1
    },
    "cached_batches": {
        "average_time": -1,
        "max_time": -1,
        "average_res_size": -1,
        "max_res_size": -1
    },
}


config_json["statistics"] = {
    "neo4j": {**prev_obj}, 
    "postgres": {**new_obj},
}

with open(file_path, "w") as file:
    json.dump(config_json, file, indent=4)