import 'dotenv/config';

const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('--- Starting End-to-End API Integration Test ---');

  try {
    // 1. Health check
    console.log('\n[1] Testing Health Check /health...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json() as any;
    console.log('Health check response:', health);
    if (health.status !== 'up') throw new Error('Health check failed');

    // 2. Resolve Clinic
    console.log('\n[2] Testing Subdomain Resolution for "apollo"...');
    const resolveRes = await fetch(`${BASE_URL}/auth/clinic/resolve?subdomain=apollo`);
    const clinic = await resolveRes.json() as any;
    console.log('Resolved clinic:', clinic);
    const clinicId = clinic.id;
    if (!clinicId) throw new Error('Clinic resolution failed');

    // 3. Login Owner
    console.log('\n[3] Logging in as Owner (owner@apollo.com)...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-clinic-id': clinicId,
      },
      body: JSON.stringify({
        email: 'owner@apollo.com',
        password: 'Password123',
      }),
    });
    const authData = await loginRes.json() as any;
    const token = authData.accessToken;
    console.log('Owner logged in successfully. Token length:', token?.length);
    if (!token) throw new Error('Owner login failed');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-clinic-id': clinicId,
    };

    // 4. List Doctors
    console.log('\n[4] Listing Doctors...');
    const doctorsRes = await fetch(`${BASE_URL}/doctor`, { headers });
    const doctors = await doctorsRes.json() as any;
    console.log(`Found ${doctors.length} doctors.`);
    const docProfileId = doctors[0]?.id;
    if (!docProfileId) throw new Error('No doctor profile found in list');

    // 5. Register a New Test Patient
    console.log('\n[5] Registering a new patient (Test Patient)...');
    const phone = '99999' + Math.floor(10000 + Math.random() * 90000);
    const patientRes = await fetch(`${BASE_URL}/patient`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Patient',
        phone,
        dob: '1995-12-01T00:00:00.000Z',
        gender: 'FEMALE',
        address: 'Test Street, City',
        allergies: ['Dust'],
        chronicConditions: [],
      }),
    });
    const patient = await patientRes.json() as any;
    console.log('Patient registered successfully. ID:', patient.id);
    const patientId = patient.id;
    if (!patientId) throw new Error('Patient registration failed');

    // 6. Search Patient
    console.log('\n[6] Searching for registered patient...');
    const searchRes = await fetch(`${BASE_URL}/patient/search?q=Test`, { headers });
    const searchResults = await searchRes.json() as any;
    console.log(`Search returned ${searchResults.length} results.`);

    // 7. Book Walk-in Appointment
    console.log('\n[7] Booking walk-in appointment...');
    const apptRes = await fetch(`${BASE_URL}/appointment`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        patientId,
        doctorId: docProfileId,
        type: 'WALK_IN',
        isFollowUp: false,
        notes: 'API integration test walk-in',
      }),
    });
    const appt = await apptRes.json() as any;
    console.log('Appointment booked. Queue number:', appt.queueNumber);
    const appointmentId = appt.id;
    if (!appointmentId) throw new Error('Appointment booking failed');

    // 8. List Appointments
    const todayStr = new Date().toISOString().split('T')[0];
    console.log(`\n[8] Listing today's appointments for Doctor...`);
    const apptsRes = await fetch(`${BASE_URL}/appointment?doctorId=${docProfileId}&date=${todayStr}`, { headers });
    const appts = await apptsRes.json() as any;
    console.log(`Found ${appts.length} appointments for today.`);

    // 8.5 Login Doctor
    console.log('\n[8.5] Logging in as Doctor (doctor@apollo.com)...');
    const docLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-clinic-id': clinicId,
      },
      body: JSON.stringify({
        email: 'doctor@apollo.com',
        password: 'Password123',
      }),
    });
    const docAuthData = await docLoginRes.json() as any;
    const docToken = docAuthData.accessToken;
    const docHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${docToken}`,
      'x-clinic-id': clinicId,
    };
    if (!docToken) throw new Error('Doctor login failed');

    // 8.6 Fetch seeded medicines
    console.log('\n[8.6] Fetching clinic medicine catalog...');
    const medsRes = await fetch(`${BASE_URL}/medicine`, { headers: docHeaders });
    const meds = await medsRes.json() as any;
    const medicineId = meds[0]?.id;
    console.log(`Found ${meds.length} medicines. Using medicine ID: ${medicineId}`);
    if (!medicineId) throw new Error('No medicines found in catalog');

    // 9. Start Consultation & Create Encounter
    console.log('\n[9] Recording Clinical Encounter & Prescription...');
    const encounterRes = await fetch(`${BASE_URL}/encounter`, {
      method: 'POST',
      headers: docHeaders,
      body: JSON.stringify({
        patientId,
        appointmentId,
        complaint: 'Mild fever and body pain',
        diagnosis: 'Viral Fever',
        clinicalNotes: 'Rest and fluid intake advised.',
        testsRequired: ['CBC Test'],
        vitals: { bp: '120/80', pulse: '76', temp: '99', weight: '65', height: '170' },
        prescriptionItems: [
          {
            medicineId,
            dosage: '1-0-1',
            instructions: 'After food',
            durationDays: 5,
          },
        ],
      }),
    });
    const encounter = await encounterRes.json() as any;
    console.log('Encounter Response:', encounter);
    console.log('Encounter created successfully. ID:', encounter.id);
    if (!encounter.id) throw new Error('Encounter creation failed');

    // 10. Generate Invoice
    console.log('\n[10] Generating Invoice for patient visit...');
    const invoiceRes = await fetch(`${BASE_URL}/billing/invoice`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        patientId,
        appointmentId,
        items: [
          { description: 'Consultation Fee', quantity: 1, amount: 500.0 },
          { description: 'CBC Diagnostic Test', quantity: 1, amount: 350.0 },
        ],
        discount: 50.0,
        tax: 45.0,
      }),
    });
    const invoice = await invoiceRes.json() as any;
    console.log('Invoice generated. Invoice Number:', invoice.invoiceNumber, 'Total:', invoice.total);
    const invoiceId = invoice.id;
    if (!invoiceId) throw new Error('Invoice generation failed');

    // 11. Process split/partial payment
    console.log('\n[11] Collecting split payment (Cash + UPI)...');
    const pay1Res = await fetch(`${BASE_URL}/billing/payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        invoiceId,
        amount: 300.0,
        method: 'CASH',
        notes: 'Paid cash at counter',
      }),
    });
    const pay1 = await pay1Res.json() as any;
    console.log('Payment 1 registered. Invoice Status:', pay1.invoice.status, 'Amount Collected:', pay1.payment.amount);

    const pay2Res = await fetch(`${BASE_URL}/billing/payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        invoiceId,
        amount: 545.0, // Pay remaining
        method: 'UPI',
        notes: 'UPI Scanner transaction',
      }),
    });
    const pay2 = await pay2Res.json() as any;
    const finalInvoice = pay2.invoice;
    console.log('Payment 2 registered. Invoice status:', finalInvoice.status);
    if (finalInvoice.status !== 'PAID') throw new Error('Invoice not fully paid');

    // 12. Owner Stats
    console.log('\n[12] Fetching Owner Statistics Reports...');
    const statsRes = await fetch(`${BASE_URL}/admin/stats`, { headers });
    const stats = await statsRes.json() as any;
    console.log('Today Visits:', stats.visitsCount, 'Today Revenue:', stats.todayRevenue, 'Payment Split:', stats.paymentSplit);

    // 13. System Audit Logs
    console.log('\n[13] Fetching System Audit Logs...');
    const logsRes = await fetch(`${BASE_URL}/admin/audit-logs`, { headers });
    const logs = await logsRes.json() as any;
    console.log(`Retrieved ${logs.length} audit trail logs.`);
    console.log('Last action in audit log:', logs[0]?.action, 'on entity:', logs[0]?.entityName);

    console.log('\n=================================================');
    console.log('✅ ALL API TESTS COMPLETED SUCCESSFULLY WITH ZERO ERRORS!');
    console.log('=================================================');

  } catch (err: any) {
    console.error('\n❌ TEST FAILED WITH ERROR:', err.message);
    process.exit(1);
  }
}

runTests();
