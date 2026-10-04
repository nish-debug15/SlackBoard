const tokenReq = await fetch('http://localhost:3001/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Bob', email: 'bob2@example.com', password: 'password123' })
});
const tokenRes = await tokenReq.json();
const token = tokenRes.token;

const res = await fetch('http://localhost:3001/api/tasks/research', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({ title: 'Market Research', duration: 3, dependsOn: ['design'], column: 'todo' })
});

const body = await res.json();
console.log(JSON.stringify(body, null, 2));
