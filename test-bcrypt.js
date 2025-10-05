import bcrypt from 'bcrypt';

const hash = '$2b$12$cRa9GzdsitPGZ9jg.Ukjuej14LMNrWjYUUScbPWDQ.K7JlqIKMKwC';
const password = 'Admin123!';

console.log('Testing bcrypt...');

bcrypt.compare(password, hash).then(result => {
  console.log('Password valid:', result);
}).catch(error => {
  console.error('Error:', error);
});