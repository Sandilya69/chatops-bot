const REQUIRED = [
    'DISCORD_TOKEN', 'CLIENT_ID', 'MONGODB_URI',
    'GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'
];

export function validateEnv() {
    const missing = REQUIRED.filter(k => !process.env[k] && !process.env[k.replace('MONGODB_', 'MONGO_')]);
    if (missing.length > 0) {
        console.error('❌ MISSING ENV VARS:', missing);
        process.exit(1);
    }
    console.log('✅ Environment variables validated');
}

