from DB.updateDB_tools import *

configFileName = 'DB/database.example.ini'
conn: connection = open_conn(configFileName)

tables = {
    # 'items.proteins': insert_rows_copy_from_factory(conn, 'items.proteins'),
    # 'items.proteins_names': insert_rows_copy_from_factory(conn, 'items.proteins_names'),
    'items.species': insert_rows_copy_from_factory(conn, 'items.species'),
}

process_tables(conn, tables, None)

stream_gzip_to_postgres(url='https://stringdb-downloads.org/download/items_schema.v12.0.sql.gz',
                        table_insert_map=tables,
                        max_test_lines=None,
                        batch_size=10000
                        )

conn.close()