import mysql.connector
from mysql.connector import Error

# Replace with your credentials
host = 'sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com'
user = 'sgsgita_alumni_user'
password = '2FvT6j06sfI'

try:
    # Connect to MySQL without specifying a database
    connection = mysql.connector.connect(
        host=host,
        user=user,
        password=password
    )
    if connection.is_connected():
        print('Connected to MySQL server')
        cursor = connection.cursor()
        cursor.execute('SHOW DATABASES;')
        print('Accessible databases:')
        for db in cursor:
            print(db[0])
        cursor.close()
    else:
        print('Connection failed')
except Error as e:
    print(f'Error: {e}')
finally:
    if 'connection' in locals() and connection.is_connected():
        connection.close()
        print('Connection closed')
