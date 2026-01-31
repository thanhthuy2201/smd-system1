# Shadcn Admin Dashboard

Admin Dashboard UI crafted with Shadcn and Vite. Built with responsiveness and accessibility in mind.

![alt text](public/images/shadcn-admin.png)

I've been creating dashboard UIs at work and for my personal projects. I always wanted to make a reusable collection of dashboard UI for future projects; and here it is now. While I've created a few custom components, some of the code is directly adapted from ShadcnUI examples.

> This is not a starter project (template) though. I'll probably make one in the future.

## Features

- Light/dark mode
- Responsive
- Accessible
- With built-in Sidebar component
- Global search command
- 10+ pages
- Extra custom components
- RTL support

<details>
<summary>Customized Components (click to expand)</summary>

This project uses Shadcn UI components, but some have been slightly modified for better RTL (Right-to-Left) support and other improvements. These customized components differ from the original Shadcn UI versions.

If you want to update components using the Shadcn CLI (e.g., `npx shadcn@latest add <component>`), it's generally safe for non-customized components. For the listed customized ones, you may need to manually merge changes to preserve the project's modifications and avoid overwriting RTL support or other updates.

> If you don't require RTL support, you can safely update the 'RTL Updated Components' via the Shadcn CLI, as these changes are primarily for RTL compatibility. The 'Modified Components' may have other customizations to consider.

### Modified Components

- scroll-area
- sonner
- separator

### RTL Updated Components

- alert-dialog
- calendar
- command
- dialog
- dropdown-menu
- select
- table
- sheet
- sidebar
- switch

**Notes:**

- **Modified Components**: These have general updates, potentially including RTL adjustments.
- **RTL Updated Components**: These have specific changes for RTL language support (e.g., layout, positioning).
- For implementation details, check the source files in `src/components/ui/`.
- All other Shadcn UI components in the project are standard and can be safely updated via the CLI.

</details>

## Tech Stack

**UI:** [ShadcnUI](https://ui.shadcn.com) (TailwindCSS + RadixUI)

**Build Tool:** [Vite](https://vitejs.dev/)

**Routing:** [TanStack Router](https://tanstack.com/router/latest)

**Type Checking:** [TypeScript](https://www.typescriptlang.org/)

**Linting/Formatting:** [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/)

**Icons:** [Lucide Icons](https://lucide.dev/icons/), [Tabler Icons](https://tabler.io/icons) (Brand icons only)

**Authentication:** [Firebase Authentication](https://firebase.google.com/docs/auth)

**State Management:** [Zustand](https://zustand-demo.pmnd.rs/) (global state), [TanStack Query](https://tanstack.com/query/latest) (server state)

## Firebase Setup

This project uses Firebase Authentication for user authentication. Follow these steps to set up Firebase for your project.

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project
4. Once created, you'll be redirected to your project dashboard

### 2. Register Your Web App

1. In your Firebase project dashboard, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to the "Your apps" section
4. Click the web icon (`</>`) to add a web app
5. Register your app with a nickname (e.g., "Shadcn Admin")
6. You'll see a Firebase configuration object - keep this handy for the next step

### 3. Enable Authentication Methods

1. In the Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"
3. (Optional) Enable **Google** sign-in:
   - Click on "Google"
   - Toggle "Enable" to ON
   - Select a support email
   - Click "Save"

### 4. Configure Environment Variables

1. Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase credentials from step 2:

   ```env
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

3. **Important:** Never commit your `.env` file to version control. It's already included in `.gitignore`.

### 5. Configure Authorized Domains (for Production)

When deploying to production:

1. Go to **Authentication** > **Settings** > **Authorized domains**
2. Click "Add domain"
3. Add your production domain (e.g., `yourdomain.com`)
4. Note: `localhost` is automatically authorized for development

### 6. Email Verification Settings (Optional)

To customize email verification templates:

1. Go to **Authentication** > **Templates**
2. Select "Email address verification"
3. Customize the email template as needed
4. You can also customize password reset and email change templates here

## Authentication

This project includes a complete authentication system with the following features:

### Authentication Flows

- **Sign Up**: Create a new account with email and password
  - Automatic email verification sent upon registration
  - Password strength validation (minimum 8 characters)
  - Redirects to sign-in page after successful registration

- **Sign In**: Authenticate with email and password
  - Email format validation
  - Error handling for invalid credentials
  - Automatic redirect to dashboard or originally requested page
  - Email verification status check

- **Password Reset**: Recover account access via email
  - Send password reset link to registered email
  - Secure token-based password update
  - Redirects to sign-in after successful reset

- **Email Verification**: Confirm email ownership
  - Automatic verification email on sign-up
  - Resend verification option
  - Verification status displayed on sign-in

- **Google Sign-In** (Optional): One-click authentication with Google account
  - OAuth 2.0 flow
  - Automatic account creation or sign-in
  - No password required

### Protected Routes

The following routes require authentication:

- Dashboard (`/`)
- Tasks (`/tasks`)
- Users (`/users`)
- Settings (`/settings/*`)
- Chats (`/chats`)
- Apps (`/apps`)

Unauthenticated users attempting to access protected routes will be redirected to the sign-in page. After successful authentication, users are redirected back to their originally requested page.

### Session Management

- **Persistent Sessions**: Authentication state persists across browser sessions using local storage
- **Automatic Token Refresh**: Firebase automatically refreshes expired tokens
- **Secure Sign-Out**: Clears all authentication state and redirects to sign-in page

### Security Features

- Client-side form validation before API calls
- User-friendly error messages (no technical jargon exposed)
- Rate limiting protection via Firebase
- Secure token storage in HTTP-only cookies
- CSRF protection through Firebase SDK

## Run Locally

Clone the project

```bash
  git clone https://github.com/satnaing/shadcn-admin.git
```

Go to the project directory

```bash
  cd shadcn-admin
```

Install dependencies

```bash
  bun install
```

Set up environment variables

```bash
  # Copy the example env file
  cp .env.example .env

  # Edit .env and add your Firebase credentials
  # See "Firebase Setup" section above for detailed instructions
```

Start the development server

```bash
  bun run dev
```

The application will be available at `http://localhost:5173`

## Sponsoring this project ❤️

If you find this project helpful or use this in your own work, consider [sponsoring me](https://github.com/sponsors/satnaing) to support development and maintenance. You can [buy me a coffee](https://buymeacoffee.com/satnaing) as well. Don’t worry, every penny helps. Thank you! 🙏

For questions or sponsorship inquiries, feel free to reach out at [satnaingdev@gmail.com](mailto:satnaingdev@gmail.com).

## Author

Crafted with 🤍 by [@satnaing](https://github.com/satnaing)

## License

Licensed under the [MIT License](https://choosealicense.com/licenses/mit/)
