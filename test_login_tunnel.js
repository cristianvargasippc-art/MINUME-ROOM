const https = require('https');

const data = JSON.stringify({
  email: 'superadmin@minume-xvii.edu.do',
  password: 'Minume2025!'
});

const options = {
  hostname: 'clever-eels-reply.loca.lt',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Status:', res.statusMessage);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      console.log('Token:', json.token ? json.token.substring(0, 50) + '...' : 'NO TOKEN');
      console.log('User:', JSON.stringify(json.user, null, 2));
    } catch(e) {
      console.log('Body:', body.substring(0, 500));
    }
  });
});

req.on('error', (e) => console.log('Error:', e.message));
req.write(data);
req.end();