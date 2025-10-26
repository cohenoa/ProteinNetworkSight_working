import requests
import gzip
from tqdm import tqdm
import io
import psycopg2
from psycopg2.extensions import connection, cursor
from psycopg2 import sql
from configparser import ConfigParser
import os
from requests.adapters import HTTPAdapter, Retry
import zlib
import time

section_identifiers = ['links', 'species', 'proteins', 'proteins_aliases']

def get_version():
    return requests.get('https://string-db.org/api/json/version').json()[0]['string_version']

def resilient_gzip_stream(url, chunk_size=1024*64, max_retries=5, backoff=2.0):
    """
    Stream a remote .gz file line by line, resuming automatically on connection loss.

    Args:
        url (str): URL of the .gz file
        chunk_size (int): size of compressed chunks to request from server
        max_retries (int): how many times to retry on failure before giving up
        backoff (float): exponential backoff factor (seconds)

    Yields:
        (line, offset): line (decoded str), compressed byte offset (int)
    """
    offset = 0
    buffer = b""
    last_line = None
    print_flag = False
    fail_chunk = 100
    retries = 0
    decompressor = zlib.decompressobj(16 + zlib.MAX_WBITS)

    # DEBUG: uncomment for debugging - debug offset after connection crash
    # n_chunks = 0
    # last_offset = 0
    # last_decompressor = decompressor.copy()

    while True:
        # DEBUG: uncomment for debugging - debug offset after connection crash
        # offset = last_offset
        # decompressor = last_decompressor
        headers = {"Range": f"bytes={offset}-"} if offset > 0 else {}

        if (print_flag):
            print("last yielded line: ", last_line)
            print("buffer: ", buffer)

            with requests.get(url, headers=headers, stream=True, timeout=30) as r:
                r.raise_for_status()

                for chunk in r.iter_content(chunk_size):
                    offset += len(chunk)  # track compressed bytes
                    buffer += decompressor.decompress(chunk)

                    with open('chunk_before_fail.txt', 'wb') as f:
                        f.write(buffer)
                    break
            break

        try:
            with requests.get(url, headers=headers, stream=True, timeout=30) as r:
                r.raise_for_status()
                # decompressor = zlib.decompressobj(16 + zlib.MAX_WBITS)

                for chunk in r.iter_content(chunk_size):
                    # DEBUG: uncomment for debugging - debug offset after connection crash
                    # last_offset = offset
                    # last_decompressor = decompressor.copy()

                    offset += len(chunk)  # track compressed bytes
                    buffer += decompressor.decompress(chunk)

                    while b"\n" in buffer:
                        line, buffer = buffer.split(b"\n", 1)
                        yield line.decode("utf-8", errors="ignore")
                        last_line = line
                    
                    # DEBUG: uncomment for debugging - debug offset after connection crash
                    # n_chunks += 1
                    # if (n_chunks == fail_chunk):
                    #     raise requests.ConnectionError("fail")

                # If we got here, stream ended cleanly
                if buffer:
                    yield buffer.decode("utf-8", errors="ignore")
                return

        except (requests.RequestException, requests.ConnectionError) as e:
            retries += 1
            if retries > max_retries:
                raise RuntimeError(f"Max retries exceeded at offset {offset}") from e
            wait_time = backoff * retries
            print_flag = True
            print(f"⚠️ Connection lost at {offset} bytes, retrying in {wait_time:.1f}s...")
            time.sleep(wait_time)
            continue



def proccess_dump_file(url, table_insert_map, batch_size=10000):

    not_found = list(table_insert_map.keys())
    current_table = None
    buffer = io.StringIO()
    rows_in_batch = 0

    pbar = tqdm(desc="Processing lines", unit=" lines")

    for line in resilient_gzip_stream(url):
        # Detect start of COPY
        if line.startswith("COPY "):
            table_name = line.split()[1]  # e.g. items.clades_names
            print(f"Found table: {table_name}")
            if table_name in table_insert_map:
                current_table = table_name
                not_found.remove(table_name)
                buffer = io.StringIO()
                rows_in_batch = 0
            else:
                current_table = None
            continue

        # Detect end of COPY data
        if current_table and line == "\\.":
            print("emptying buffer")
            if rows_in_batch > 0:
                buffer.seek(0)
                if table_insert_map[current_table]:
                    table_insert_map[current_table](buffer)
            buffer = io.StringIO()
            rows_in_batch = 0
            current_table = None
            if len(not_found) == 0:
                break
            continue

        # Handle COPY rows
        if current_table:
            buffer.write(line + "\n")
            rows_in_batch += 1

            if rows_in_batch >= batch_size:
                buffer.seek(0)
                if table_insert_map[current_table]:
                    table_insert_map[current_table](buffer)
                buffer = io.StringIO()
                rows_in_batch = 0
        pbar.update(1)

    # Final flush if needed
    if current_table and rows_in_batch > 0:
        buffer.seek(0)
        if table_insert_map[current_table]:
                table_insert_map[current_table](buffer)
    print("Done")

def stream_gzip_to_postgres(
    url,
    table_insert_map,
    batch_size=10000,
    max_test_lines=None,
):
    """
    Stream a gzipped PostgreSQL dump file (.gz), detect COPY statements for 
    specified tables, and insert their data in batches with retries.

    Args:
        conn: psycopg2 connection
        url (str): URL to the gzipped dump file.
        table_insert_map (dict): Mapping of table_name -> True/False or insert_fn.
                                 If value is True, use COPY directly.
                                 If callable, it will be used to insert rows.
        batch_size (int): Number of rows to insert per batch.
        max_test_lines (int, optional): For testing, limit number of lines processed.
    """
    # Setup requests session with retries
    session = requests.Session()
    retries = Retry(total=5, backoff_factor=2, status_forcelist=[500, 502, 503, 504])
    session.mount("http://", HTTPAdapter(max_retries=retries))
    session.mount("https://", HTTPAdapter(max_retries=retries))

    current_table = None
    buffer = io.StringIO()
    rows_in_batch = 0
    last_line = None

    not_found = []
    for key in table_insert_map.keys():
        not_found.append(key)

    with session.get(url, stream=True) as r:
        r.raise_for_status()
        buffered = io.BufferedReader(r.raw)
        decompressor = gzip.GzipFile(fileobj=buffered, mode="rb")

        for i, raw_line in enumerate(tqdm(decompressor, desc="Processing lines", unit=" lines")):
            line = raw_line.decode("utf-8").rstrip("\n")

            if max_test_lines and i > max_test_lines:
                break

            # Detect start of COPY
            if line.startswith("COPY "):
                table_name = line.split()[1]  # e.g. items.clades_names
                if table_name in table_insert_map:
                    current_table = table_name
                    not_found.remove(table_name)
                    buffer = io.StringIO()
                    rows_in_batch = 0
                else:
                    current_table = None
                continue

            # Detect end of COPY data
            if current_table and line == "\\.":
                if rows_in_batch > 0:
                    buffer.seek(0)
                    if table_insert_map[current_table]:
                        table_insert_map[current_table](buffer)
                buffer = io.StringIO()
                rows_in_batch = 0
                current_table = None
                if len(not_found) == 0:
                    break
                continue

            # Handle COPY rows
            if current_table:
                buffer.write(line + "\n")
                rows_in_batch += 1

                if rows_in_batch >= batch_size:
                    buffer.seek(0)
                    if table_insert_map[current_table]:
                        table_insert_map[current_table](buffer)
                    buffer = io.StringIO()
                    rows_in_batch = 0

        # Final flush if needed
        if current_table and rows_in_batch > 0:
            buffer.seek(0)
            if table_insert_map[current_table]:
                    table_insert_map[current_table](buffer)

        # conn.commit()


def insert_rows_copy_from_factory(conn: connection, table_name):
    def insert_rows_copy_from(buffer):
        """
        Insert rows into a Postgres table using psycopg2.copy_from.
        rows must be a list of raw tab-delimited strings.
        """
        with conn.cursor() as cur:
            sql = f"COPY {table_name} FROM STDIN WITH (FORMAT text, DELIMITER E'\\t');"
            cur.copy_expert(sql, buffer)
        conn.commit()

    return insert_rows_copy_from

def print_rows_factory(filename=None):
    if filename is not None:
        def print_rows_file(buffer: io.StringIO):
            with open(filename, "a") as f:
                f.write(buffer.getvalue())
        return print_rows_file
    
    def print_rows(buffer: io.StringIO):
        print("Emptying buffer")
        print(buffer.getvalue())

    return print_rows

    

def insert_rows_by_insert(conn: connection, table_name, rows):
    with conn.cursor() as cur:
        cur.executemany(f"INSERT INTO {table_name} VALUES %s", rows) # needs work
    conn.commit()
    
def open_conn(config_file_name) -> connection:
    parser = ConfigParser(interpolation=None)
    # read config file
    print(os.path.abspath(config_file_name))
    parser.read(config_file_name)
    section = 'postgresql'

    # get section, default to postgresql
    db = {}
    if parser.has_section(section):
        params = parser.items(section)
        for param in params:
            db[param[0]] = param[1]
    else:
        raise Exception('Section {0} not found in the {1} file'.format(section, config_file_name))
    conn = psycopg2.connect(**db)
    conn.autocommit = True
    return conn

import os
from psycopg2 import sql

SCHEMA_DIR = "DB/Schemas_new"

def process_tables(conn, tables, insert_func):
    """
    Loop over tables and apply the update process:
    1. Truncate & drop indexes if table exists, otherwise run config.sql
    2. Insert data via user-provided function
    3. Apply indexes from indexes.sql

    Parameters
    ----------
    conn : psycopg2 connection
        An open PostgreSQL connection.
    tables : dict
        Dictionary of { "schema.table": None, ... }
    insert_func : callable
        Function with signature insert_func(conn, full_table_name).
        Should perform the insert step for the table.
    """
    SCHEMA_DIR = "DB/Schemas_new"
    for full_table_name in tables.keys():
        schema, table = full_table_name.split(".")
        table_dir = os.path.join(SCHEMA_DIR, f"{schema}.{table}")
        config_path = os.path.join(table_dir, "config.sql")
        index_path = os.path.join(table_dir, "indexes.sql")

        with conn.cursor() as cur:
            # --- Step 1: Reset / Init ---
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = %s
                    AND table_name = %s
                );
            """, (schema, table))
            exists = cur.fetchone()[0]

            if exists:
                print(f"[{full_table_name}] exists → truncating and dropping indexes...")
                cur.execute(sql.SQL("TRUNCATE {}.{} CASCADE;").format(
                    sql.Identifier(schema), sql.Identifier(table)
                ))

                # Drop indexes
                cur.execute("""
                    SELECT i.indexname
                    FROM pg_indexes i
                    LEFT JOIN pg_constraint c
                    ON c.conname = i.indexname
                    WHERE i.schemaname = %s
                    AND i.tablename = %s
                    AND (c.contype IS NULL OR c.contype NOT IN ('p','u'));
                """, (schema, table))
                for (idx,) in cur.fetchall():
                    print(f"    Dropping index {idx}...")
                    cur.execute(sql.SQL("DROP INDEX IF EXISTS {};").format(sql.Identifier(idx)))
            else:
                print(f"[{full_table_name}] does not exist → creating from {config_path}")
                with open(config_path, "r") as f:
                    cur.execute(f.read())

        # # --- Step 2: Insert data ---
        # print(f"[{full_table_name}] inserting data...")
        # insert_func(conn, full_table_name)

        # # --- Step 3: Apply indexes ---
        # if os.path.exists(index_path):
        #     print(f"[{full_table_name}] applying indexes from {index_path}...")
        #     with open(index_path, "r") as f:
        #         index_sql = f.read()
        #     with conn.cursor() as cur:
        #         cur.execute(index_sql)
        # else:
        #     print(f"[{full_table_name}] no index file found.")

def count_rows_in_file(path):
    count = 0
    with gzip.open(path, mode='rt', encoding='utf-8') as f:  # 'rt' = read text mode
        for _ in tqdm(f, desc=f"Counting rows", unit=" rows"):
            count += 1
    return count - 1

def verify_Table(conn, table_name):
    count = 0
    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cur.fetchone()[0]
    
    return count

def sample_file(url, n_lines = 1000):

    buffer = io.StringIO()
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        buffered = io.BufferedReader(r.raw)
        decompressor = gzip.GzipFile(fileobj=buffered, mode="rb")

        for i, raw_line in enumerate(tqdm(decompressor, desc="Processing lines", unit=" lines")):
            line = raw_line.decode("utf-8").rstrip("\n")
            buffer.write(line + "\n")

            if i == n_lines:
                with open("sample_network.txt", "w") as f:
                    f.write(buffer.getvalue())
                break

    
            