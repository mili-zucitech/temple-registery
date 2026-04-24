# Google Maps API Setup Guide

## Quick Fix

The error "This page didn't load Google Maps correctly" means you need to add a Google Maps API key. Follow these steps:

### Step 1: Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **Library**
4. Enable these 3 APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
5. Go to **APIs & Services** → **Credentials**
6. Click **Create Credentials** → **API Key**
7. Copy the generated API key

### Step 2: Add API Key to Your Project

Open `frontend/.env` file and add your API key:

```env
VITE_API_BASE_URL=/api/v1
VITE_BASE_URL=http://localhost:5173

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Replace `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` with your actual API key.

### Step 3: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart it
cd frontend
npm run dev
```

### Step 4: Test the Map

1. Go to the registration page
2. Navigate to "Temple Details" step
3. You should now see the interactive map

---

## Detailed Setup Instructions

### Creating a Google Cloud Project

1. **Sign in to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click the project dropdown at the top
   - Click "New Project"
   - Enter project name: "Temple Registry"
   - Click "Create"

3. **Enable Billing** (Required for Maps API)
   - Go to **Billing** in the left menu
   - Link a billing account (Google provides $200 free credit monthly)
   - Note: The free tier is usually sufficient for development

### Enabling Required APIs

1. **Go to APIs & Services**
   - Click the hamburger menu (☰)
   - Navigate to **APIs & Services** → **Library**

2. **Enable Maps JavaScript API**
   - Search for "Maps JavaScript API"
   - Click on it
   - Click "Enable"

3. **Enable Places API**
   - Search for "Places API"
   - Click on it
   - Click "Enable"

4. **Enable Geocoding API**
   - Search for "Geocoding API"
   - Click on it
   - Click "Enable"

### Creating and Securing Your API Key

1. **Create API Key**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **API Key**
   - Copy the generated key immediately

2. **Restrict Your API Key** (Recommended for Security)
   
   **Application Restrictions:**
   - Click on your API key to edit it
   - Under "Application restrictions", select "HTTP referrers (websites)"
   - Add these referrers:
     ```
     http://localhost:*
     http://localhost:5173/*
     https://yourdomain.com/*
     ```

   **API Restrictions:**
   - Under "API restrictions", select "Restrict key"
   - Select only these APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
   - Click "Save"

### Cost Management

**Free Tier Limits:**
- Maps JavaScript API: $200 free credit/month
- Places API: $200 free credit/month
- Geocoding API: $200 free credit/month

**Typical Usage for Development:**
- ~100-500 map loads per day = ~$0.50-$2.50/month
- Well within free tier limits

**Set Up Budget Alerts:**
1. Go to **Billing** → **Budgets & alerts**
2. Create a budget alert for $10/month
3. You'll be notified if costs exceed this

---

## Troubleshooting

### Error: "This page didn't load Google Maps correctly"

**Possible Causes:**

1. **Missing API Key**
   - Check if `VITE_GOOGLE_MAPS_API_KEY` is in your `.env` file
   - Make sure there are no spaces around the `=` sign

2. **Invalid API Key**
   - Verify the key is copied correctly
   - Check if the key is enabled in Google Cloud Console

3. **APIs Not Enabled**
   - Ensure all 3 APIs are enabled (Maps JavaScript, Places, Geocoding)

4. **Billing Not Enabled**
   - Google Maps requires a billing account (even for free tier)
   - Enable billing in Google Cloud Console

5. **API Key Restrictions Too Strict**
   - If you set HTTP referrer restrictions, make sure `localhost:5173` is included
   - Temporarily remove restrictions to test

6. **Server Not Restarted**
   - Environment variables are loaded at startup
   - Restart your dev server after adding the API key

### Error: "RefererNotAllowedMapError"

**Solution:**
- Your API key has HTTP referrer restrictions
- Add `http://localhost:5173/*` to allowed referrers
- Or temporarily remove restrictions for development

### Map Shows But Search Doesn't Work

**Solution:**
- Check if Places API is enabled
- Check browser console for specific error messages

### Reverse Geocoding Not Working

**Solution:**
- Check if Geocoding API is enabled
- Verify API key has permission for Geocoding API

---

## Alternative: Use Without Google Maps

If you don't want to set up Google Maps, the form will still work:

1. The map section will show an error message with instructions
2. Users can still use the "Detect My Current Location" button
3. Users can manually enter coordinates in the collapsible section
4. All other form functionality remains intact

---

## Environment Variables Reference

```env
# Required for API calls
VITE_API_BASE_URL=/api/v1
VITE_BASE_URL=http://localhost:5173

# Required for Google Maps location picker
# Get from: https://console.cloud.google.com/google/maps-apis
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

---

## Security Best Practices

1. **Never commit API keys to Git**
   - `.env` file is already in `.gitignore`
   - Use `.env.example` for documentation

2. **Use different keys for dev/prod**
   - Create separate API keys for development and production
   - Apply stricter restrictions on production keys

3. **Monitor usage regularly**
   - Check Google Cloud Console for usage statistics
   - Set up budget alerts

4. **Rotate keys periodically**
   - Generate new keys every few months
   - Delete old unused keys

---

## Support

If you continue to have issues:

1. Check the browser console (F12) for detailed error messages
2. Verify all 3 APIs are enabled in Google Cloud Console
3. Ensure billing is enabled (required even for free tier)
4. Try creating a new API key
5. Test with API restrictions temporarily disabled

For more help, visit:
- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Google Cloud Console](https://console.cloud.google.com/)
