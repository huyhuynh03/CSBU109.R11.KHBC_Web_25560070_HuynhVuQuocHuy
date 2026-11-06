// =====================================================================
// Quick check for the Exercise 1 API endpoints.
// Usage:  node test-endpoints.js        (run from the lab1-backend folder,
//                                         with the server already started)
// =====================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

const ROUTES = ['/', '/api/health', '/api/greeting', '/api/not-found'];

async function check(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  const body = await res.json();
  console.log(`\nGET ${path} -> ${res.status}`);
  console.log(JSON.stringify(body, null, 2));
}

(async () => {
  for (const route of ROUTES) {
    try {
      await check(route);
    } catch (err) {
      console.error(`\nGET ${route} failed: ${err.message}`);
      console.error('Is the server running? Start it with: npm start');
      process.exitCode = 1;
      return;
    }
  }
  console.log('\nAll endpoints responded.');
})();
