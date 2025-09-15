const http = require('http');

async function testLoginThroughProxy() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      email: 'admin@school.com',
      password: 'Admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 3000, // Test through frontend proxy
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('🧪 Testing admin login through frontend proxy...');

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        try { 
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Login successful!');
            console.log(`👤 User: ${response.data.user.firstName} ${response.data.user.lastName}`);
            console.log(`🎭 Role: ${response.data.user.role}`);
            console.log(`🔑 Token received: ${response.data.token ? 'Yes' : 'No'}`);
          } else {
            console.log('❌ Login failed:', response.message);
          }
        } catch (e) { 
          console.log('📄 Raw response:', data); 
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error('🚨 Request error:', err.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

testLoginThroughProxy();