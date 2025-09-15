const http = require('http');

async function testLoginAndMe() {
  console.log('🧪 Testing complete login flow...\n');
  
  // Step 1: Login and get token
  const loginResult = await new Promise((resolve) => {
    const postData = JSON.stringify({
      email: 'admin@school.com',
      password: 'Admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('1️⃣ Testing login...');
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Login successful!');
            console.log(`   Token preview: ${response.data.token.substring(0, 50)}...`);
            console.log(`   User: ${response.data.user.firstName} ${response.data.user.lastName}`);
            resolve({ success: true, token: response.data.token, user: response.data.user });
          } else {
            console.log('❌ Login failed:', response.message);
            resolve({ success: false });
          }
        } catch (e) {
          console.log('❌ Invalid JSON response:', data);
          resolve({ success: false });
        }
      });
    });

    req.on('error', (err) => {
      console.error('🚨 Login request error:', err.message);
      resolve({ success: false });
    });

    req.write(postData);
    req.end();
  });

  if (!loginResult.success) {
    console.log('\n❌ Cannot proceed without successful login');
    return;
  }

  // Step 2: Test /auth/me with the token
  await new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginResult.token}`,
        'Content-Type': 'application/json'
      }
    };

    console.log('\n2️⃣ Testing /api/auth/me with token...');
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Auth check successful!');
            console.log(`   User: ${response.data.user.firstName} ${response.data.user.lastName}`);
            console.log(`   Role: ${response.data.user.role}`);
          } else {
            console.log('❌ Auth check failed:', response.message);
            console.log('   This explains why admin dashboard shows blank page!');
          }
        } catch (e) {
          console.log('❌ Invalid JSON response:', data);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error('🚨 Auth check request error:', err.message);
      resolve();
    });

    req.end();
  });
}

testLoginAndMe();