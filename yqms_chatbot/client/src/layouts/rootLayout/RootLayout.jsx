import { Link, Outlet } from 'react-router-dom'
import {  SignedIn, UserButton,ClerkProvider } from '@clerk/clerk-react'
import './rootLayout.css'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

const queryClient = new QueryClient()


const RootLayout = () => {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
       <QueryClientProvider client={queryClient}>
    <div className='rootLayout'>
        <header>
            <Link to="/" className='logo'>
                <img src ="/logo2.png" alt="" />
                <span>YAI-Bot</span>
            </Link>
            <div className="user">
            {/* <SignedOut>
                <SignInButton />
            </SignedOut> */}
            <SignedIn>
                <UserButton />
            </SignedIn>
            </div>
        </header>
        <main>
            <Outlet />
        </main>
    </div>
    </QueryClientProvider>
    </ClerkProvider>
  )
}

export default RootLayout