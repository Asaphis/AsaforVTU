const axios = require('../backend/node_modules/axios').default || require('../backend/node_modules/axios');
require('../backend/node_modules/dotenv').config({ path: '../backend/.env' });

const BASE_URL = process.env.VTU_PROVIDER_URL || 'https://iacafe.com.ng/devapi/v1';
const API_KEY = process.env.VTU_PROVIDER_API_KEY;

console.log('Testing Provider API...');
console.log('URL:', BASE_URL);
console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 5)}...` : 'MISSING');

if (!API_KEY) {
    console.error('ERROR: VTU_PROVIDER_API_KEY is not set in backend/.env');
    process.exit(1);
}

const getHeaders = () => ({
    'Authorization': `Bearer ${API_KEY.trim()}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Asafor-VTU/1.0'
});

async function testAirtime() {
    console.log('\n--- Testing Airtime Purchase (Dry Run / Invalid Phone) ---');
    try {
        const payload = {
            request_id: `TEST-AIR-${Date.now()}`,
            phone: '00000000000', // Invalid phone to avoid actual charge if validation works
            service_id: 'mtn',
            amount: 100
        };

        console.log('Sending Payload:', payload);

        const response = await axios.post(`${BASE_URL}/airtime`, payload, {
            headers: getHeaders()
        });

        console.log('Airtime Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Airtime Request Failed:', error.response ? error.response.data : error.message);
    }
}

async function testBudgetDataPlans() {
    console.log('\n--- Testing Budget Data Plans (MTN) ---');
    try {
        // GET /budget-data/plans?network_id=1
        const response = await axios.get(`${BASE_URL}/budget-data/plans?network_id=1`, {
            headers: {
                'Authorization': `Bearer ${API_KEY.trim()}`
            }
        });
        
        console.log('Data Plans Response Status:', response.status);
        // console.log('Data Plans:', JSON.stringify(response.data, null, 2));
        
        const data = response.data;
        if (data && (data.data || Array.isArray(data))) {
            const plans = data.data || data;
            console.log(`Found ${plans.length} plans.`);
            if (plans.length > 0) {
                console.log('Sample Plan:', plans[0]);
                return plans[0].id || plans[0].data_plan || plans[0].variation_id; // Try to find ID
            }
        } else {
            console.log('Unexpected response structure:', data);
        }
        return null;
    } catch (error) {
        console.error('Data Plans Request Failed:', error.response ? error.response.data : error.message);
        return null;
    }
}

async function testBudgetDataPurchase(planId) {
    if (!planId) {
        console.log('\nSkipping Budget Data Purchase (No Plan ID found)');
        return;
    }
    
    console.log(`\n--- Testing Budget Data Purchase (Plan: ${planId}) ---`);
    try {
        const payload = {
            request_id: `TEST-DATA-${Date.now()}`,
            phone: '00000000000',
            network_id: 1, // MTN
            data_plan: Number(planId)
        };

        console.log('Sending Payload:', payload);

        const response = await axios.post(`${BASE_URL}/budget-data`, payload, {
            headers: getHeaders()
        });

        console.log('Budget Data Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Budget Data Request Failed:', error.response ? error.response.data : error.message);
    }
}

async function runTests() {
    await testAirtime();
    const planId = await testBudgetDataPlans();
    // Use a hardcoded plan ID if fetch fails or just to test specific case from docs
    // User docs example: data_plan: 5001
    await testBudgetDataPurchase(planId || 5001);
}

runTests();
