import { GET, POST } from '../app/api/super-user/data-engineering/route';
import { NextRequest } from 'next/server';

async function testSuperUserApi() {
  console.log('🧪 Testing Superadmin Data Engineering API Endpoint...');

  // Test POST action=snapshot
  const postReq = new NextRequest('http://localhost:3000/api/super-user/data-engineering', {
    method: 'POST',
    body: JSON.stringify({ action: 'snapshot' }),
  });

  const postRes = await POST(postReq);
  const postData = await postRes.json();

  console.log('\n✅ Superadmin POST Response:');
  console.log('Role:', postData.role);
  console.log('Message:', postData.message);
  console.log('Snapshots Count:', postData.snapshots?.length);

  // Test GET action=recover
  const getReq = new NextRequest('http://localhost:3000/api/super-user/data-engineering?action=recover&table=Question');
  const getRes = await GET(getReq);
  const getData = await getRes.json();

  console.log('\n✅ Superadmin GET Time-Travel Response:');
  console.log('Role:', getData.role);
  console.log('Table:', getData.table);
  console.log('Records Count:', getData.recordsCount);

  console.log('\n🎉 Superadmin Data Engineering API Test Succeeded!');
}

testSuperUserApi().catch((err) => {
  console.error('❌ Superadmin API Test Failed:', err);
  process.exit(1);
});
