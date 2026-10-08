import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logging.ts";
import { createAuthClient, createAdminClient } from "../_shared/supabase.ts";
import { requireAuth, extractUser } from "../_shared/auth.ts";
import { successResponse, errorResponse } from "../_shared/responses.ts";

const log = createLogger("ADMIN-CREATE-DEMO-USER");

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    // CRITICAL: Verify authentication
    const authResult = requireAuth(req, corsHeaders);
    if (authResult instanceof Response) {
      log("ERROR: No authorization header");
      return authResult;
    }
    const authHeader = authResult;

    // Create client with user's token to verify their identity
    const supabaseAuth = createAuthClient(authHeader);

    const userResult = await extractUser(authHeader, supabaseAuth, corsHeaders);
    if (userResult instanceof Response) {
      log("ERROR: Invalid authentication token");
      return userResult;
    }

    const requestingUserId = userResult.userId;
    log("User authenticated", { userId: requestingUserId });

    // Create admin client with service role
    const supabaseAdmin = createAdminClient();

    // CRITICAL: Verify the requesting user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUserId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      log("ERROR: User is not an admin", { userId: requestingUserId });
      return errorResponse('Forbidden - admin role required', 403, corsHeaders);
    }

    log("Admin role verified", { userId: requestingUserId });

    // Parse request body
    const { email, password, role = 'viewer' } = await req.json();

    // Validate role is allowed
    const allowedRoles = ['admin', 'editor', 'viewer'];
    if (!allowedRoles.includes(role)) {
      return errorResponse('Invalid role. Must be admin, editor, or viewer', 400, corsHeaders);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return errorResponse('Invalid email format', 400, corsHeaders);
    }

    // Validate password length (minimum 12 characters for security)
    if (!password || password.length < 12) {
      return errorResponse('Password must be at least 12 characters', 400, corsHeaders);
    }

    if (!email || !password) {
      return errorResponse('Email and password are required', 400, corsHeaders);
    }

    log(`Creating demo user: ${email} with role: ${role}`);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === email);

    if (userExists) {
      log(`User ${email} already exists`);
      return successResponse({ success: true, message: 'User already exists' }, corsHeaders);
    }

    // Create user with email confirmed
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: null, // Blank user - no name
      },
    });

    if (createError) {
      log('Error creating user', createError);
      return errorResponse(createError.message, 500, corsHeaders);
    }

    const userId = userData.user.id;
    log(`User created with ID: ${userId}`);

    // The trigger will create profile and assign default role
    // But we need to update the role if it's different from what trigger assigned
    if (role !== 'viewer') {
      // Update role to the specified one
      const { error: roleUpdateError } = await supabaseAdmin
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (roleUpdateError) {
        log('Error updating role', roleUpdateError);
      }
    }

    // Make sure NO company associations are created (should be default, but double-check)
    const { data: companies } = await supabaseAdmin
      .from('user_companies')
      .select('id')
      .eq('user_id', userId);

    if (companies && companies.length > 0) {
      // Remove any accidental company associations
      await supabaseAdmin
        .from('user_companies')
        .delete()
        .eq('user_id', userId);
      log('Removed accidental company associations');
    }

    log(`Demo user created successfully: ${email}`);

    return successResponse({
      success: true,
      message: 'Demo user created successfully',
      userId,
      email,
      role,
      hasCompanies: false
    }, corsHeaders);

  } catch (error) {
    log('Unexpected error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500, corsHeaders);
  }
});
