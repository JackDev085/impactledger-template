
const API_URL = 'http://localhost:5000/api';

async function test() {
  console.log('=== Starting E2E API Workflows Validation ===');

  // Helper to print step results
  const logStep = (name, passed, details = '') => {
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name} ${details ? `(${details})` : ''}`);
    if (!passed) process.exit(1);
  };

  try {
    // 1. Register Admin
    const adminRegRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Admin Authority',
        email: 'admin@skillchain.org',
        password: 'adminpassword',
        role: 'institution',
        walletAddress: '0x3302beC705ef21e65566e2E841D7A0204fF1820b'
      })
    });
    const adminRegData = await adminRegRes.json();
    logStep('Register Admin Account', adminRegRes.status === 201 || adminRegData.message.includes('already registered'), adminRegData.message);

    // 2. Register Institution
    const instRegRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'MIT University',
        email: 'mit@edu.org',
        password: 'mitpassword',
        role: 'institution',
        walletAddress: '0x1111222233334444555566667777888899990000'
      })
    });
    const instRegData = await instRegRes.json();
    logStep('Register Institution Account', instRegRes.status === 201 || instRegData.message.includes('already registered'), instRegData.message);

    // 3. Register Student
    const studentRegRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'John Doe',
        email: 'john@doe.com',
        password: 'johnpassword',
        role: 'student'
      })
    });
    const studentRegData = await studentRegRes.json();
    logStep('Register Student Account', studentRegRes.status === 201 || studentRegData.message.includes('already registered'), studentRegData.message);

    // 4. Log in as Admin
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@skillchain.org',
        password: 'adminpassword'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    logStep('Log in as Admin', adminLoginRes.status === 200, adminLoginData.message);
    const adminToken = adminLoginData.token;

    // 5. Admin fetches registered institutions to get the MIT institution ID
    const instListRes = await fetch(`${API_URL}/admin/institutions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const instListData = await instListRes.json();
    logStep('Fetch Institutions as Admin', instListRes.status === 200, `${instListData.length} institutions found`);

    const mitUser = instListData.find(i => i.email === 'mit@edu.org');
    if (!mitUser) {
      throw new Error('MIT Institution not found in list');
    }

    // 6. Admin approves MIT Institution
    const approveRes = await fetch(`${API_URL}/admin/institutions/${mitUser.id}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const approveData = await approveRes.json();
    logStep('Approve Institution as Admin', approveRes.status === 200, approveData.message);

    // 7. Log in as approved Institution (MIT)
    const mitLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'mit@edu.org',
        password: 'mitpassword'
      })
    });
    const mitLoginData = await mitLoginRes.json();
    logStep('Log in as approved Institution', mitLoginRes.status === 200, mitLoginData.message);
    const mitToken = mitLoginData.token;

    // 8. Create a new Course
    const courseRes = await fetch(`${API_URL}/institution/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mitToken}`
      },
      body: JSON.stringify({
        title: 'Solidity Development Masterclass',
        description: 'Complete hands-on Ethereum development course.',
        workloadHours: 40
      })
    });
    const courseData = await courseRes.json();
    logStep('Register Course offering', courseRes.status === 201, courseData.course ? `Course ID: ${courseData.course.id}` : courseData.message);
    const courseId = courseData.course.id;

    // 9. Issue Certificate to Student (John Doe)
    const issueRes = await fetch(`${API_URL}/institution/certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mitToken}`
      },
      body: JSON.stringify({
        studentEmail: 'john@doe.com',
        studentName: 'John Doe',
        courseId: courseId,
        certificateHash: 'QmXoypizjW3WknFixtdKLw6yS47n3kX488C9Z235bX798f',
        transactionHash: '0x3219aa2e537e2ab77112009ef327e5c70ba9db32192138eb12ab34d7ef8109bf'
      })
    });
    const issueData = await issueRes.json();
    logStep('Issue Certificate to Student', issueRes.status === 201, issueData.certificate ? `Cert ID: ${issueData.certificate.id}` : issueData.message);
    const certId = issueData.certificate.id;

    // 10. Log in as Student
    const studentLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'john@doe.com',
        password: 'johnpassword'
      })
    });
    const studentLoginData = await studentLoginRes.json();
    logStep('Log in as Student', studentLoginRes.status === 200, studentLoginData.message);
    const studentToken = studentLoginData.token;

    // 11. Fetch Student Dashboard Portfolio
    const studentDashRes = await fetch(`${API_URL}/student/dashboard`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const studentDashData = await studentDashRes.json();
    logStep('Fetch Student Portfolio Dashboard', studentDashRes.status === 200, 
      `Certificates: ${studentDashData.summary.totalCertificates}, Completed workload: ${studentDashData.summary.totalHoursCompleted} hrs`
    );

    // 12. Public Verification Check
    const verifyRes = await fetch(`${API_URL}/verify/${certId}`);
    const verifyData = await verifyRes.json();
    logStep('Validate Certificate via Public Gateway', verifyRes.status === 200 && verifyData.exists === true, 
      `Valid: ${verifyData.isValid}, Student: ${verifyData.certificate.studentName}, Issuer: ${verifyData.certificate.issuerName}`
    );

    console.log('=== All E2E API Workflows Verified Successfully ===');

  } catch (err) {
    console.error('Error during validation script:', err);
    process.exit(1);
  }
}

test();
