from neo4j import GraphDatabase

URI = "neo4j://localhost"
AUTH = ("neo4j", "12345678")
PATH = "G:/programming/db/neo4j/data/relate-data/dbmss/dbms-23235d9f-2887-4264-a2f9-34fa83b24a1b/import/links.csv"

if __name__ == "__main__":
    driver = GraphDatabase.driver(URI, auth=AUTH)
    driver.verify_connectivity()
    session = driver.session(database="neo4j")

    # test_query = 

    result = session.run("""
        START t=node(*) 
        MATCH (a)-[:LEADS_TO]->(t) 
        RETURN a
        SKIP {randomoffset} LIMIT {randomcount} 
    """, randomcount=10)
    records = []
    for record in result:
        records.append(record)
    
    print(len(records))
    print(records)

    session.close()
    driver.close()