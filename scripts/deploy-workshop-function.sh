#!/bin/bash

# Deploy workshop-analysis edge function with calibrated scoring
#
# This script deploys the updated edge function with more lenient scoring calibration
#
# Usage: ./deploy-workshop-function.sh
#
# Make sure you're logged in first with: supabase login

echo "🚀 Deploying workshop-analysis edge function..."
echo ""
echo "Score Calibration Applied:"
echo "  - Dimension scores: +0.5 points (1-8 range)"
echo "  - Typical essays: target ~50/100 NQI"
echo "  - Preserves 9-10 ceiling for exceptional work"
echo ""

# Deploy the function
supabase functions deploy workshop-analysis --project-ref zclaplpkuvxkrdwsgrul

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "The calibrated scoring is now live:"
    echo "  - Raw Claude scores are adjusted post-processing"
    echo "  - Original prompts and analysis quality unchanged"
    echo "  - Console logs show: 'Score calibration: X -> Y'"
else
    echo ""
    echo "❌ Deployment failed"
    echo "Make sure you're logged in: supabase login"
fi
