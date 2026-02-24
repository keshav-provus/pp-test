// These must be set before any module that reads process.env at import time
// (the route.ts file calls createClient() at module level)
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
process.env.NEXTAUTH_SECRET = "test-nextauth-secret";
process.env.NEXTAUTH_URL = "http://localhost:3000";
