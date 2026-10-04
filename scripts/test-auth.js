const API = 'http://localhost:3001/api';

async function testAuth() {
  const r1 = await fetch(API + '/auth/signup', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({name:'T2', email:'t2@ex.com', password:'password'})
  });
  console.log('signup:', r1.status);
  
  const r2 = await fetch(API + '/auth/login', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({email:'t2@ex.com', password:'password'})
  });
  console.log('login:', r2.status);
  
  const token = (await r2.json()).token;
  
  const r3 = await fetch(API + '/tasks');
  console.log('GET /api/tasks without a token:', r3.status);
  
  const r4 = await fetch(API + '/tasks', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('GET /api/tasks with a token:', r4.status);
}

testAuth();
