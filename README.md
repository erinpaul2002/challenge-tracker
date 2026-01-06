This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Supabase Setup

This project uses Supabase for backend services. To set up your Supabase connection:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from the project settings
3. Create a `.env.local` file in the root directory
4. Add your Supabase credentials:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual values.

### Testing Supabase Connection

To verify your Supabase connection is working:

```bash
npm run test:supabase
```

This will test if your environment variables are set and if the Supabase client can connect successfully.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
