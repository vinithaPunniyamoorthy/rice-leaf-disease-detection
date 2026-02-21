const https = require('https');

const PROJECT_ID = '5cb2a1e1-c02a-42b0-a896-379d49155c0b';
const ENVIRONMENT_ID = '3f2d29ef-6e12-46db-8d86-f5752365d143';

const STATIC_ENV_VARS = {
    JWT_SECRET: 'cropshield_secret_key_2024_secure',
    GMAIL_USER: 'pvinitha224@gmail.com',
    GMAIL_PASS: 'mdefvsszeaguaybg',
};

function graphql(token, query, variables = {}) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ query, variables });
        const options = {
            hostname: 'backboard.railway.com',
            path: '/graphql/v2',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Length': Buffer.byteLength(data),
            },
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (json.errors) {
                        reject(new Error(JSON.stringify(json.errors, null, 2)));
                    } else {
                        resolve(json.data);
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${body}`));
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    const token = process.argv[2];
    if (!token) {
        console.log('\n========================================');
        console.log('  RAILWAY AUTO-SETUP SCRIPT');
        console.log('========================================\n');
        console.log('You need a Railway API token to run this script.\n');
        console.log('HOW TO GET YOUR TOKEN (takes 30 seconds):');
        console.log('─────────────────────────────────────────');
        console.log('1. Go to: https://railway.com/account/tokens');
        console.log('2. Log in to Railway if needed');
        console.log('3. Click "+ New Token" button');
        console.log('4. Name it: deploy-setup');
        console.log('5. Click "Create"');
        console.log('6. Copy the token (long string of characters)\n');
        console.log('Then run:');
        console.log('  node railway_setup.js YOUR_TOKEN_HERE\n');
        
        // Try to open the page
        try {
            const { exec } = require('child_process');
            exec('start https://railway.com/account/tokens');
            console.log('(Opening the tokens page in your browser...)\n');
        } catch (e) {}
        
        process.exit(1);
    }

    console.log('\n🚀 Starting Railway Auto-Setup...\n');

    // Step 1: Get project info and services
    console.log('📡 Step 1: Fetching project services...');
    const projectData = await graphql(token, `
        query ($projectId: String!) {
            project(id: $projectId) {
                id
                name
                services {
                    edges {
                        node {
                            id
                            name
                            icon
                        }
                    }
                }
            }
        }
    `, { projectId: PROJECT_ID });

    const services = projectData.project.services.edges.map(e => e.node);
    console.log(`   Found ${services.length} services:`);
    services.forEach(s => console.log(`   - ${s.name} (${s.id}) ${s.icon || ''}`));

    // Find MySQL and backend services
    const mysqlService = services.find(s =>
        s.name.toLowerCase().includes('mysql') ||
        s.icon === 'mysql' ||
        s.name.toLowerCase().includes('database')
    );
    const backendService = services.find(s =>
        !s.name.toLowerCase().includes('mysql') &&
        !s.name.toLowerCase().includes('database') &&
        s.icon !== 'mysql'
    );

    if (!mysqlService) {
        console.log('\n❌ No MySQL service found in your project!');
        console.log('   Please add a MySQL database to your Railway project first:');
        console.log('   1. Open your Railway project');
        console.log('   2. Click "+ New" → "Database" → "MySQL"');
        console.log('   3. Wait for it to be available');
        console.log('   4. Run this script again\n');
        process.exit(1);
    }

    if (!backendService) {
        console.log('\n❌ Could not identify the backend service!');
        console.log('   Services found:', services.map(s => s.name).join(', '));
        process.exit(1);
    }

    console.log(`\n   ✅ MySQL service: ${mysqlService.name} (${mysqlService.id})`);
    console.log(`   ✅ Backend service: ${backendService.name} (${backendService.id})`);

    // Step 2: Get MySQL variables
    console.log('\n📡 Step 2: Reading MySQL credentials...');
    const mysqlVarsData = await graphql(token, `
        query ($projectId: String!, $environmentId: String!, $serviceId: String!) {
            variables(
                projectId: $projectId
                environmentId: $environmentId
                serviceId: $serviceId
            )
        }
    `, {
        projectId: PROJECT_ID,
        environmentId: ENVIRONMENT_ID,
        serviceId: mysqlService.id,
    });

    const mysqlVars = mysqlVarsData.variables;
    console.log('   MySQL variables found:');
    const dbVars = {};
    for (const [key, value] of Object.entries(mysqlVars)) {
        if (key.startsWith('MYSQL')) {
            // Mask password for display
            const display = key === 'MYSQLPASSWORD' ? '***' : value;
            console.log(`   - ${key}: ${display}`);
            dbVars[key] = value;
        }
    }

    if (!dbVars.MYSQLHOST) {
        console.log('\n❌ MYSQLHOST not found in MySQL service variables!');
        console.log('   Available variables:', Object.keys(mysqlVars).join(', '));
        process.exit(1);
    }

    // Step 3: Get the backend's public domain for BASE_URL
    console.log('\n📡 Step 3: Getting backend domain...');
    let backendDomain = '';
    try {
        const domainData = await graphql(token, `
            query ($projectId: String!, $environmentId: String!, $serviceId: String!) {
                domains(
                    projectId: $projectId
                    environmentId: $environmentId
                    serviceId: $serviceId
                ) {
                    serviceDomains {
                        domain
                    }
                    customDomains {
                        domain
                    }
                }
            }
        `, {
            projectId: PROJECT_ID,
            environmentId: ENVIRONMENT_ID,
            serviceId: backendService.id,
        });

        const serviceDomains = domainData.domains?.serviceDomains || [];
        const customDomains = domainData.domains?.customDomains || [];

        if (customDomains.length > 0) {
            backendDomain = customDomains[0].domain;
        } else if (serviceDomains.length > 0) {
            backendDomain = serviceDomains[0].domain;
        }
    } catch (e) {
        console.log('   ⚠️  Could not fetch domains:', e.message);
    }

    if (!backendDomain) {
        // Generate a domain if none exists
        console.log('   No public domain found. Generating one...');
        try {
            const genDomain = await graphql(token, `
                mutation ($input: ServiceDomainCreateInput!) {
                    serviceDomainCreate(input: $input) {
                        domain
                    }
                }
            `, {
                input: {
                    serviceId: backendService.id,
                    environmentId: ENVIRONMENT_ID,
                },
            });
            backendDomain = genDomain.serviceDomainCreate.domain;
        } catch (e) {
            console.log('   ⚠️  Could not generate domain:', e.message);
            backendDomain = 'rice-leaf-disease-detection-production.up.railway.app';
            console.log(`   Using fallback: ${backendDomain}`);
        }
    }

    const baseUrl = `https://${backendDomain}`;
    console.log(`   ✅ Backend URL: ${baseUrl}`);

    // Step 4: Set all environment variables on the backend service
    console.log('\n📡 Step 4: Setting environment variables on backend service...');

    const allVars = {
        ...dbVars,
        ...STATIC_ENV_VARS,
        BASE_URL: baseUrl,
        FRONTEND_VERIFY_URL: `${baseUrl}/api/auth/verify-email`,
    };

    console.log('\n   Variables to set:');
    for (const [key, value] of Object.entries(allVars)) {
        const display = ['MYSQLPASSWORD', 'GMAIL_PASS', 'JWT_SECRET'].includes(key) 
            ? '***' 
            : value;
        console.log(`   - ${key}: ${display}`);
    }

    await graphql(token, `
        mutation ($input: VariableCollectionUpsertInput!) {
            variableCollectionUpsert(input: $input)
        }
    `, {
        input: {
            projectId: PROJECT_ID,
            environmentId: ENVIRONMENT_ID,
            serviceId: backendService.id,
            variables: allVars,
        },
    });

    console.log('\n   ✅ All environment variables set successfully!');

    // Step 5: Trigger redeployment
    console.log('\n📡 Step 5: Triggering redeployment...');
    try {
        // Get the latest deployment to redeploy
        const deploymentsData = await graphql(token, `
            query ($projectId: String!, $environmentId: String!, $serviceId: String!) {
                deployments(
                    first: 1
                    input: {
                        projectId: $projectId
                        environmentId: $environmentId
                        serviceId: $serviceId
                    }
                ) {
                    edges {
                        node {
                            id
                            status
                        }
                    }
                }
            }
        `, {
            projectId: PROJECT_ID,
            environmentId: ENVIRONMENT_ID,
            serviceId: backendService.id,
        });

        const latestDeployment = deploymentsData.deployments?.edges?.[0]?.node;
        if (latestDeployment) {
            console.log(`   Latest deployment: ${latestDeployment.id} (${latestDeployment.status})`);
            
            await graphql(token, `
                mutation ($serviceId: String!, $environmentId: String!) {
                    serviceInstanceRedeploy(
                        serviceId: $serviceId
                        environmentId: $environmentId
                    )
                }
            `, {
                serviceId: backendService.id,
                environmentId: ENVIRONMENT_ID,
            });
            console.log('   ✅ Redeployment triggered!');
        }
    } catch (e) {
        console.log(`   ⚠️  Could not auto-redeploy: ${e.message}`);
        console.log('   Please go to Railway dashboard and click "Redeploy" manually.');
    }

    // Summary
    console.log('\n========================================');
    console.log('  ✅ SETUP COMPLETE!');
    console.log('========================================\n');
    console.log('Your backend is now configured with:');
    console.log(`  Database: ${dbVars.MYSQLHOST}:${dbVars.MYSQLPORT}`);
    console.log(`  DB Name:  ${dbVars.MYSQLDATABASE}`);
    console.log(`  Base URL: ${baseUrl}`);
    console.log(`  Email:    ${STATIC_ENV_VARS.GMAIL_USER}`);
    console.log('\nNext steps:');
    console.log('  1. Wait 1-2 minutes for the deployment to complete');
    console.log(`  2. Test: curl ${baseUrl}/`);
    console.log('  3. Check Railway logs for "✅ All tables verified/created"');
    console.log(`  4. Test API: curl ${baseUrl}/api/auth/login\n`);
}

main().catch((err) => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
});
