import os
from neo4j import GraphDatabase
from configparser import ConfigParser
import csv
import random
import time
import json
import tqdm


PATH = "G:/programming/db/neo4j/data/relate-data/dbmss/dbms-23235d9f-2887-4264-a2f9-34fa83b24a1b/import/protein.csv"

def getAllProteins():
    data = []
    with open(PATH, "r") as file:
        reader = csv.DictReader(file)
        total_rows = sum(1 for _ in open(PATH)) - 1  # Get total rows (minus header)
        
        file.seek(0)  # Reset file pointer to the beginning
        for current_row, row in enumerate(reader):
            data.append(row["string_protein_id"])

    return data

def getRandomProteinsIds(random_set_size):
    with open(PATH, "r") as file:
        reader = csv.DictReader(file)
        total_rows = sum(1 for _ in file) - 1  # Get total rows (minus header)
        print(total_rows)
        
        random_rows = random.sample(range(total_rows), random_set_size)
        random_set = []
        
        file.seek(0)  # Reset file pointer to the beginning
        i = 0
        for row in reader:
            if i in random_rows:
                random_set.append(row)
                random_set_size -= 1
            if random_set_size == 0:
                break
            i += 1

    random_data = []
    for row in random_set:
        random_data.append(row["string_protein_id"])

    return random_data

def create_test_json(dir_path):

    batch_size = 40
    n_batches = 10

    tests_config_json = {
        "meta": {
            "batch_size": batch_size,
            "n_batches": n_batches
        },
        "statistics": {
            "neo4j": {
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
            },
            "postgres": {
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
            },
        },
        "data": {
            "batches": [],
            "full_batch": []
        },
    }

    for i in range(n_batches):
        random_p_ids = getRandomProteinsIds(batch_size)

        tests_config_json["data"]["batches"].append({
            "ids": random_p_ids,
            "time": -1,
            "res_size": -1
        })
        print("batch ", i,  " created")

    # tests_config_json["data"]["full_batch"] = getAllProteins()
    
    file_path = os.path.join(dir_path, "test_config.json")
    with open(file_path, "w") as json_file:
        json.dump(tests_config_json, json_file, indent=4)

def run_tests(session, dir_path):
    config_json_path = os.path.join(dir_path, "test_config.json")
    with open(config_json_path, "r") as file:
        config_json = json.load(file)
    
    total_time = 0
    max_time = 0
    total_res_size = 0
    max_size = 0
    with tqdm.tqdm(total=len(config_json["data"]["batches"]), desc="Processing Batches", unit=" batches") as pbar:
        for batch in config_json["data"]["batches"]:
            t, l = time_test(session, batch["ids"])
            total_time += t
            max_time = max(max_time, t)
            batch["time"] = t

            total_res_size += l
            max_size = max(max_size, l)
            batch["res_size"] = l
            pbar.update(1)

    config_json["statistics"]["neo4j"]["average_batches"]["average_time"] = total_time / len(config_json["data"]["batches"])
    config_json["statistics"]["neo4j"]["average_batches"]["max_time"] = max_time
    config_json["statistics"]["neo4j"]["average_batches"]["average_res_size"] = total_res_size / len(config_json["data"]["batches"])
    config_json["statistics"]["neo4j"]["average_batches"]["max_res_size"] = max_size

    total_time = 0
    max_time = 0
    total_res_size = 0
    max_size = 0
    with tqdm.tqdm(total=len(config_json["data"]["batches"]), desc="Processing Cache Batches", unit=" batches") as pbar:
        for batch in config_json["data"]["batches"]:
            t, l = time_test(session, batch["ids"])
            total_time += t
            max_time = max(max_time, t)
            batch["time"] = t

            total_res_size += l
            max_size = max(max_size, l)
            batch["res_size"] = l
            pbar.update(1)

        
    config_json["statistics"]["neo4j"]["cached_batches"]["average_time"] = total_time / len(config_json["data"]["batches"])
    config_json["statistics"]["neo4j"]["cached_batches"]["max_time"] = max_time
    config_json["statistics"]["neo4j"]["cached_batches"]["average_res_size"] = total_res_size / len(config_json["data"]["batches"])
    config_json["statistics"]["neo4j"]["cached_batches"]["max_res_size"] = max_size

    file_path = os.path.join(dir_path, "test_config.json")
    with open(file_path, "w") as json_file:
        json.dump(config_json, json_file, indent=4)

def time_test(session, ids):
    start_time = time.time()
    result = session.run("""
        MATCH (a:Protein)
        WHERE a.string_protein_id IN $ids
        WITH collect(a) AS subsetNodes
        UNWIND subsetNodes AS a
        MATCH (a)-[r:PHYSICAL_LINK]-(b)
        WHERE b IN subsetNodes
        RETURN a, r, b
    """, ids=ids)

    records = []
    for record in result:
        records.append(record)

    end_time = time.time()
    return (end_time - start_time), len(records)


if __name__ == "__main__":

    section = "neo4j"
    filename = "DB.ini"

    base_dir = os.path.dirname(os.path.abspath(__file__ + "/../"))
    file_path = os.path.join(base_dir, filename)

    create_test_json(base_dir)

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
    
    db["AUTH"] = (db['user'], db['password'])
    print(db)

    driver = GraphDatabase.driver(db['uri'], auth=db['AUTH'])
    driver.verify_connectivity()
    session = driver.session(database="neo4j")

    run_tests(session, base_dir)

    session.close()
    driver.close()