from DB.updateDB_tools import *

configFileName = 'DB/database.example.ini'
conn: connection = open_conn(configFileName)

# sample_file("https://stringdb-downloads.org/download/network_schema.v12.0.sql.gz")
# print(count_rows_in_file("G:/programming/db/protein.aliases.v12.0.txt.gz"))

# verify_Table(conn, 'items.proteins', 'DB/test.txt')

# tables = {
#     'items.proteins': print_rows_factory("DB/test.txt"),
#     # 'items.proteins_names': insert_rows_copy_from_factory(conn, 'items.proteins_names'),
#     # 'items.species': insert_rows_copy_from_factory(conn, 'items.species'),
# }

# # tables = {
# #     'items.proteins': insert_rows_copy_from_factory(conn, 'items.proteins'),
# #     # 'items.proteins_names': insert_rows_copy_from_factory(conn, 'items.proteins_names'),
# #     # 'items.species': insert_rows_copy_from_factory(conn, 'items.species'),
# # }

tables = {
    'network.node_node_links': {
        'insert_function': insert_rows_copy_from_factory(conn, 'network.node_node_links'),
        'keep_columns': ['node_id_a', 'node_id_b', 'combined_score']
    },
    # 'items.proteins_names': insert_rows_copy_from_factory(conn, 'items.proteins_names'),
    # 'items.species': insert_rows_copy_from_factory(conn, 'items.species'),
}

reset_tables(conn, tables)


# proccess_dump_file(url='https://stringdb-downloads.org/download/network_schema.v12.0.sql.gz',
#                         table_insert_map=tables,
#                         batch_size=1000
#                         )

proccess_dump_file(url="http://127.0.0.1:8000/network_schema.v12.0.sql.gz",
                        table_insert_map=tables,
                        batch_size=1000
                        )

# stream_gzip_to_postgres(url='https://stringdb-downloads.org/download/items_schema.v12.0.sql.gz',
#                         table_insert_map=tables,
#                         max_test_lines=None,
#                         batch_size=10000
#                         )

# conn.close()