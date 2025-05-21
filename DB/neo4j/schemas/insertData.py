from neo4j import GraphDatabase
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed, Future
import csv
import time
from copy import deepcopy

# URI examples: "neo4j://localhost", "neo4j+s://xxx.databases.neo4j.io"
URI = "neo4j://localhost"
AUTH = ("neo4j", "12345678")
PATH = "G:/programming/db/neo4j/data/relate-data/dbmss/dbms-23235d9f-2887-4264-a2f9-34fa83b24a1b/import/peek.csv"

def create_links_batch(session, batch):
    """Executes a Cypher batch query in Neo4j using tuples."""
    session.run("""
        UNWIND $batch AS row
        MATCH (p1:Protein {string_protein_id: row[0]})
        MATCH (p2:Protein {string_protein_id: row[1]})
        MERGE (p1)-[:PHYSICAL_LINK {score: toInteger(row[2])}]->(p2);
    """, batch=batch)

def delete_links_batch(session, batch):
    session.run("""
        UNWIND $batch AS row
        MATCH (p1:Protein {string_protein_id: row[0]})
        MATCH (p2:Protein {string_protein_id: row[1]})
        DELETE (p1)-[r:PHYSICAL_LINK]->(p2);
    """, batch=batch)

def create_protein_links_batch_parallel(session, file_path, batch_size=2, max_workers=5, max_queue_size=10):
    with open(file_path, "r") as file:
        reader = csv.DictReader(file)
        total_rows = sum(1 for _ in open(file_path)) - 1  # Get total rows (minus header)
        
        futures: list[Future] = []
        batch = []
        file.seek(0)

        with tqdm(total=total_rows, desc="Processing Links", unit=" rows") as pbar, ThreadPoolExecutor(max_workers=max_workers) as executor:
            for row in reader:
                batch.append((row["protein1"], row["protein2"], int(row["combined_score"])))


                if len(batch) >= batch_size:
                    batch_copy = deepcopy(batch)
                    
                    # Wait if too many jobs are pending
                    while len(futures) >= max_queue_size:
                        done_futures = [f for f in futures if f.done()]
                        for f in done_futures:
                            futures.remove(f)
                            try:
                                f.result()  # Ensure exceptions are handled
                            except Exception as e:
                                print(e)
                            pbar.update(batch_size)
                        time.sleep(0.1)  # Prevents busy-waiting

                    # Submit batch for execution
                    future = executor.submit(create_links_batch, session, batch_copy)
                    futures.append(future)
                    batch = []  # Reset batch safely

            # Submit any remaining batch
            if batch:
                batch_copy = deepcopy(batch)
                future = executor.submit(create_links_batch, session, batch_copy)
                futures.append(future)

            # Wait for all remaining jobs to complete
            for f in as_completed(futures):
                try:
                    f.result()  # Ensure exceptions are handled
                    pbar.update(batch_size)
                except TimeoutError as e:
                    print("Timeout error:")
                    print(e)
                except Exception as e:
                    print(e)

def create_protein_links_batch_linear(session, file_path, batch_size=1000):
    with open(file_path, "r") as file:
        reader = csv.DictReader(file)
        total_rows = sum(1 for _ in open(file_path)) - 1  # Get total rows (minus header)
        
        # batches = []
        batch = []
        file.seek(0)

        with tqdm(total=total_rows, desc="Processing Links", unit=" rows") as pbar:
            file.seek(0)  # Reset file pointer after counting lines

            for row in reader:
                batch.append((row["protein1"], row["protein2"], int(row["combined_score"])))

                if len(batch) >= batch_size:
                    create_links_batch(session, batch)
                    pbar.update(batch_size)  # Update progress bar
                    batch = []  # Reset batch

            # Insert any remaining data
            if batch:
                create_links_batch(session, batch)
                pbar.update(len(batch))  # Final update for remaining rows

if __name__ == "__main__":
    driver = GraphDatabase.driver(URI, auth=AUTH)
    driver.verify_connectivity()
    session = driver.session(database="neo4j")

    create_protein_links_batch_linear(session, PATH)

    session.close()
    driver.close()