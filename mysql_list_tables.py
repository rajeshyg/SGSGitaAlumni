import mysql.connector
from mysql.connector import Error

# Replace with your credentials
host = 'sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com'
user = 'sgsgita_alumni_user'
password = '2FvT6j06sfI'
database = 'sgsgita_alumni'

try:
    # Connect to MySQL specifying the database
    connection = mysql.connector.connect(
        host=host,
        user=user,
        password=password,
        database=database
    )
    if connection.is_connected():
        print(f'Connected to MySQL database: {database}')
        cursor = connection.cursor()
        cursor.execute('SHOW TABLES;')
        print('Accessible tables:')
        for table in cursor:
            print(table[0])
        cursor.close()
    else:
        print('Connection failed')
except Error as e:
    print(f'Error: {e}')
finally:
    if 'connection' in locals() and connection.is_connected():
        connection.close()
        print('Connection closed')
