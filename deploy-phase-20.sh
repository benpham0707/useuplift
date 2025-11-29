#!/bin/bash

# Deploy suggestion-rationales edge function (Phase 20)
#
# This script deploys the Phase 20 function with --no-verify-jwt
# to fix the 403 Forbidden error and ensure reliable access.
#
# Usage: ./deploy-phase-20.sh

echo "🚀 Deploying suggestion-rationales edge function..."
echo "Target: Phase 20 (Suggestion Rationales)"
echo "Configuration: --no-verify-jwt (Public access allowed)"
echo ""

# Deploy the function with --no-verify-jwt
# This prevents 403 errors when called from the client
supabase functions deploy suggestion-rationales --no-verify-jwt --project-ref zclaplpkuvxkrdwsgrul

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Phase 20 Deployment successful!"
    echo ""
    echo "The suggestion-rationales function is now live and accessible."
    echo "The 403 Forbidden error should be resolved."
else
    echo ""
    echo "❌ Deployment failed"
    echo "Make sure you're logged in: supabase login"
fi

