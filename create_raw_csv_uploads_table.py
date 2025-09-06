import mysql.connector
from mysql.connector import Error

host = 'sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com'
user = 'sgsgita_alumni_user'
password = '2FvT6j06sfI'
database = 'sgsgita_alumni'

create_table_sql = '''
CREATE TABLE IF NOT EXISTS raw_csv_uploads (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    File_name VARCHAR(255),
    Description TEXT,
    ROW_DATA JSON,
    Source VARCHAR(255),
    Category VARCHAR(255),
    Format VARCHAR(50)
);
'''

try:
    connection = mysql.connector.connect(
        host=host,
        user=user,
        password=password,
        database=database
    )
    cursor = connection.cursor()
    cursor.execute(create_table_sql)
    connection.commit()
    print('Table raw_csv_uploads created or already exists.')
    cursor.close()
except Error as e:
    print(f'Error: {e}')
finally:
    if 'connection' in locals() and connection.is_connected():
        connection.close()