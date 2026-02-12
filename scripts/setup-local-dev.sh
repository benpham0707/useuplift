#!/bin/bash

# Setup script for local development with Clerk

echo "======================================"
echo "Uplift Local Development Setup Helper"
echo "======================================"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"

    # Check if it has the dev key
    if grep -q "pk_test_" .env.local; then
        echo "✅ Development Clerk key found in .env.local"
    else
        if grep -q "pk_live_" .env.local; then
            echo "⚠️  WARNING: Production Clerk key detected in .env.local!"
            echo "    You need to use development keys (pk_test_...) for local development."
            echo ""
            echo "    Action needed:"
            echo "    1. Go to https://dashboard.clerk.com"
            echo "    2. Create a development application"
            echo "    3. Copy the development keys"
            echo "    4. Update .env.local with pk_test_... keys"
        else
            echo "⚠️  No Clerk key found in .env.local"
            echo "    Please add VITE_CLERK_PUBLISHABLE_KEY to .env.local"
        fi
    fi
else
    echo "❌ .env.local file not found"
    echo ""
    echo "Creating .env.local from template..."

    # Copy from example if it exists
    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        echo "✅ Created .env.local from .env.local.example"
        echo ""
        echo "Next steps:"
        echo "1. Go to https://dashboard.clerk.com"
        echo "2. Create a development application"
        echo "3. Configure allowed domains (add localhost:5173)"
        echo "4. Copy your development keys"
        echo "5. Update .env.local with your keys"
        echo "6. Run 'npm run dev:full' to start both frontend and backend"
    else
        echo "❌ .env.local.example not found"
        echo "Please check that all files are present"
    fi
fi

echo ""
echo "======================================"
echo "Clerk Development App Configuration"
echo "======================================"
echo ""
echo "Make sure your Clerk development app has these settings:"
echo ""
echo "Allowed Domains:"
echo "  - localhost:5173"
echo ""
echo "Redirect URLs:"
echo "  - Home URL: http://localhost:5173"
echo "  - Sign-in URL: http://localhost:5173/auth?mode=sign-in"
echo "  - Sign-up URL: http://localhost:5173/auth?mode=sign-up"
echo "  - After sign-in URL: http://localhost:5173/portfolio-scanner"
echo "  - After sign-up URL: http://localhost:5173/portfolio-scanner"
echo ""
echo "JWT Templates:"
echo "  - Create a template named 'supabase' with these claims:"
echo '    {
      "aud": "authenticated",
      "exp": "{{timestamp}}",
      "iat": "{{timestamp}}",
      "iss": "https://{{domain}}",
      "sub": "{{user.id}}"
    }'
echo ""
echo "======================================"
echo "Ready to start developing?"
echo "======================================"
echo ""
echo "Run these commands:"
echo "  npm run dev:full    # Start both frontend and backend"
echo "  npm run dev         # Start only frontend (if backend is already running)"
echo "  npm run server      # Start only backend"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "For more details, see LOCAL_DEVELOPMENT_SETUP.md"