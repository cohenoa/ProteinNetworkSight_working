from common.configuration import pgdb

def truncate_Table():
    with pgdb.get_cursor() as cur:    
        sql = """ 
                    TRUNCATE users.users_table
            """

        cur.execute(sql)

if __name__ == "__main__":
    truncate_Table()