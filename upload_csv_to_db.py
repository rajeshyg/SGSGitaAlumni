import mysql.connector
from mysql.connector import Error
import csv
import json
import os
from datetime import datetime

host = 'sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com'
user = 'sgsgita_alumni_user'
password = '2FvT6j06sfI'
database = 'sgsgita_alumni'

csv_path = r'C:\React-Projects\SGSGitaAlumni\Data\SGSGitaAlumni_US_International_2024.csv'
file_name = os.path.basename(csv_path)
description = 'US and International Alumni Data from Batch 1 till Batch 10'
source = "Ramakrisha Rallapalli, Malathi and Shankari"
category = 'Alumni Students Data'
file_format = 'csv'

try:
    connection = mysql.connector.connect(
        host=host,
        user=user,
        password=password,
        database=database
    )
    cursor = connection.cursor()
    with open(csv_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            row_json = json.dumps(row)
            insert_sql = '''
                INSERT INTO raw_csv_uploads (File_name, Description, ROW_DATA, Source, Category, Format)
                VALUES (%s, %s, %s, %s, %s, %s)
            '''
            cursor.execute(insert_sql, (file_name, description, row_json, source, category, file_format))
    connection.commit()
    print('CSV data uploaded successfully.')
    cursor.close()
except Error as e:
    print(f'Error: {e}')
finally:
    if 'connection' in locals() and connection.is_connected():
        connection.close()
        print('Connection closed')
