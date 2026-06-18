
const BASE_URL = 'http://localhost:3001';
const SUBDOMAIN = 'apollo';

async function run() {
  console.log('--- Starting Patient Claim Logic Verification Test ---');

  try {
    // 1. Resolve clinic subdomain
    console.log('[1] Resolving subdomain context...');
    const resolveRes = await fetch(`${BASE_URL}/auth/clinic/resolve?subdomain=${SUBDOMAIN}`);
    if (!resolveRes.ok) throw new Error('Failed to resolve subdomain');
    const clinic = await resolveRes.json() as any;
    const clinicId = clinic.id;
    console.log(`Resolved Clinic ID: ${clinicId}`);

    // 2. Login as Owner to simulate staff operations
    console.log('[2] Logging in as Owner...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-clinic-id': clinicId,
      },
      body: JSON.stringify({ email: 'owner@apollo.com', password: 'Password123' }),
    });
    if (!loginRes.ok) throw new Error('Owner login failed');
    const authData = await loginRes.json() as any;
    const token = authData.accessToken;

    // 3. Create a unique patient profile by staff
    const uniquePhone = '999' + Math.floor(1000000 + Math.random() * 9000000);
    console.log(`[3] Onboarding patient profile by staff (Phone: ${uniquePhone})...`);
    const registerPatientRes = await fetch(`${BASE_URL}/patient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-clinic-id': clinicId,
      },
      body: JSON.stringify({
        firstName: 'Claimable',
        lastName: 'Patient',
        phone: uniquePhone,
        dob: '1995-05-15',
        gender: 'FEMALE',
        address: 'Staff Registered Address',
        allergies: ['Dust'],
        chronicConditions: ['Migraine'],
      }),
    });
    if (!registerPatientRes.ok) {
      console.error(await registerPatientRes.text());
      throw new Error('Patient onboarding failed');
    }
    const staffPatient = await registerPatientRes.json() as any;
    console.log(`Patient profile created by staff. ID: ${staffPatient.id}, User ID: ${staffPatient.userId}`);
    if (staffPatient.userId !== null) {
      throw new Error('Onboarded patient profile should have null userId initially');
    }

    // 4. Register a User as a Patient using the same phone number (claiming the profile)
    console.log('[4] Registering patient user account to claim profile...');
    const claimRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-clinic-id': clinicId,
      },
      body: JSON.stringify({
        firstName: 'Claimable',
        lastName: 'Patient Updated',
        phone: uniquePhone,
        email: `claimable-${uniquePhone}@gmail.com`,
        password: 'Password123',
        role: 'PATIENT',
        dob: '1995-05-15',
        gender: 'FEMALE',
      }),
    });
    if (!claimRes.ok) {
      console.error(await claimRes.text());
      throw new Error('Patient registration/claim failed');
    }
    const registerData = await claimRes.json() as any;
    console.log(`Patient user account created. ID: ${registerData.id}`);

    // 5. Login as the newly claimed Patient User
    console.log('[5] Logging in as the registered Patient...');
    const patientLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-clinic-id': clinicId,
      },
      body: JSON.stringify({ phone: uniquePhone, password: 'Password123' }),
    });
    if (!patientLoginRes.ok) throw new Error('Patient login failed');
    const patientAuthData = await patientLoginRes.json() as any;
    const patientToken = patientAuthData.accessToken;
    const patientProfileId = patientAuthData.user.profileId;
    console.log(`Patient logged in. Profile ID: ${patientProfileId}`);

    if (patientProfileId !== staffPatient.id) {
      throw new Error(`Profile mismatch! Expected: ${staffPatient.id}, Got: ${patientProfileId}`);
    }
    console.log('✅ Success: Login returns the correct staff-created Profile ID.');

    // 6. Fetch timeline of the patient
    console.log('[6] Fetching timeline to verify data matches...');
    const timelineRes = await fetch(`${BASE_URL}/patient/${patientProfileId}/timeline`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${patientToken}`,
        'x-clinic-id': clinicId,
      },
    });
    if (!timelineRes.ok) {
      console.log(`Status Code: ${timelineRes.status}`);
      console.log(`Response Body: ${await timelineRes.text()}`);
      throw new Error('Timeline fetch failed');
    }
    const timeline = await timelineRes.json() as any;
    console.log(`Timeline details - Name: ${timeline.firstName} ${timeline.lastName}, Phone: ${timeline.phone}`);
    console.log(`Timeline allergies: ${JSON.stringify(timeline.allergies)}`);
    console.log(`Timeline chronic conditions: ${JSON.stringify(timeline.chronicConditions)}`);

    if (timeline.address !== 'Staff Registered Address') {
      throw new Error('Patient profile details got lost during claim!');
    }
    console.log('✅ Success: Patient profile details (address, allergies, conditions) were preserved.');

    console.log('\n=================================================');
    console.log('🎉 PATIENT CLAIM LOGIC TEST PASSED SUCCESSFULLY!');
    console.log('=================================================');
  } catch (err: any) {
    console.error(`❌ TEST FAILED: ${err.message}`);
    process.exit(1);
  }
}

run();
