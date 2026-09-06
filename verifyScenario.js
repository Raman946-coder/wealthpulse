const http = require('http');

function api(method, path, body, cookies = '') {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    if (cookies) headers.Cookie = cookies;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: raw,
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  const email = 'scenario_live_' + Date.now() + '@example.com';
  const password = 'pass123';

  const register = await api('POST', '/api/auth/register', {
    name: 'Scenario User',
    email,
    password,
    role: 'user',
  });
  console.log('REGISTER', register.status, register.body);

  const login = await api('POST', '/api/auth/login', {
    email,
    password,
  });
  console.log('LOGIN', login.status, login.body);

  const cookies = (login.headers['set-cookie'] || []).map((v) => v.split(';')[0]).join('; ');

  const transactions = [
    { description: 'Salary', amount: 100000, type: 'income', category: 'Salary', date: '2026-08-30' },
    { description: 'Groceries', amount: 15000, type: 'expense', category: 'Food', date: '2026-08-30' },
    { description: 'Goal Deposit', amount: 10000, type: 'expense', category: 'Savings', date: '2026-08-30' },
  ];

  for (const tx of transactions) {
    const res = await api('POST', '/api/transactions', tx, cookies);
    console.log('CREATE', tx.description, res.status, res.body);
  }

  const before = await api('GET', '/api/transactions', null, cookies);
  console.log('BEFORE_DELETE', before.status, before.body);

  const parsedBefore = JSON.parse(before.body);
  const goalTx = parsedBefore.find((tx) => tx.description === 'Goal Deposit');
  const targetId = goalTx ? (goalTx._id || goalTx.id) : null;
  console.log('GOAL_TX_FOUND', !!goalTx, targetId);

  if (targetId) {
    const del = await api('DELETE', `/api/transactions/${targetId}`, null, cookies);
    console.log('DELETE', del.status, del.body);
  }

  const after = await api('GET', '/api/transactions', null, cookies);
  console.log('AFTER_DELETE', after.status, after.body);

  const summary = await api('GET', '/api/transactions/summary', null, cookies);
  console.log('SUMMARY', summary.status, summary.body);
})();