from DB.updateDB_tools import *

configFileName = 'DB/database.example.ini'

conn: connection = open_conn(configFileName)

proteins = {
    "FASN": 6216362,
    "TFRC": 6223899,
    "GAPDH": 6224452,
    "EPPK1": 6229587,
    "IGFBP2": 6212129,
    "BRD4": 6213694,
    "RBM15": 6221365,
    "SMAD1": 6216456,
    "BCL2": 6224607,
    "TIGAR": 6211291,
    "INPP4B": 6226961,
    "MYH11": 6224384,
    "RICTOR": 6215685,
    "PDCD4": 6214749,
    "DUSP4": 6212273,
    "BRAF": 6226751,
    "ACACA": 6229493,
    "BCL2A1": 6214215,
    "BMS1": 6222345,
    "EIF4G1": 6226569,
    "HSPA4": 6216226,
    "STK11": 6217905,
    "FN1": 6219727,
    "AKT1": 6228101,
    "ERBB2": 6214308,
    "ERBB3": 6214165,
    "PXN": 6214175,
    "IFI27": 6229508,
    "ZNRD2": 6217029,
    "PAK2": 6217156,
    "DCTN6": 6211684,
    "RNF19A": 6227221,
    "CRK": 6216006,
    "AHSA1": 6211515,
    "POLDIP2": 6228897,
    "DIABLO-2": 6225796,
    "DIABLO": 6230697,
    "SRC": 6222162,
    "SERPINE1": 6211804,
}

with conn.cursor() as cur:
    cur.execute("SELECT")

