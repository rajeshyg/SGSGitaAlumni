import fetch from 'node-fetch';

const userId = 10025;
const url = `http://localhost:3000/api/postings/matched/${userId}`;

console.log(`Calling: ${url}\n`);

try {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    console.error(`HTTP ${response.status}: ${response.statusText}`);
    const text = await response.text();
    console.error(text);
    process.exit(1);
  }

  const data = await response.json();
  
  console.log(`SUCCESS: ${data.matchedDomains} domains matched`);
  console.log(`POSTINGS: ${data.postings.length} returned\n`);

  if (data.postings.length === 0) {
    console.log('❌ NO POSTINGS RETURNED');
  } else {
    data.postings.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title}`);
      console.log(`   ID: ${p.id}`);
      if (p.domains && p.domains.length > 0) {
        console.log(`   Domains: ${p.domains.map(d => d.name).join(', ')}`);
      }
      console.log('');
    });
  }

} catch (err) {
  console.error('ERROR:', err.message);
  process.exit(1);
}
