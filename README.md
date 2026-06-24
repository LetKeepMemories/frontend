# Let's Keep Memories - Frontend

Next.js frontend for the Let's Keep Memories platform.

## Prerequisites

- Node.js 18+
- npm (or yarn/pnpm)

## Start Flow

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create a `.env.local` file in the root frontend directory configured with your backend URL.
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:8000/api"
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your-preset"
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Access the App**:
   Navigate to `http://localhost:3000` in your browser.
