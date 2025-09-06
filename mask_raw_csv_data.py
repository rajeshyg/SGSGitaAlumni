import csv

input_path = r'C:\React-Projects\SGSGitaAlumni\Data\SGSGitaAlumni_US_International_2024.csv'
output_path = r'C:\React-Projects\SGSGitaAlumni\Data\SGSGitaAlumni_US_International_2024_masked.csv'
unmasked_email = 'datta.rajesh@gmail.com'

def mask_email(email):
    if email.strip().lower() == unmasked_email:
        return email
    return '***@***.com'

def mask_phone(phone):
    return '*' * len(phone.strip()) if phone.strip() else phone

with open(input_path, newline='', encoding='utf-8') as infile, \
     open(output_path, 'w', newline='', encoding='utf-8') as outfile:
    reader = csv.DictReader(infile)
    fieldnames = reader.fieldnames
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    writer.writeheader()
    for row in reader:
        row['Email'] = mask_email(row['Email'])
        row['Phone'] = mask_phone(row['Phone'])
        writer.writerow(row)

print('Masked CSV created:', output_path)