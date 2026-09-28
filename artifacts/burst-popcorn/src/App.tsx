import { Route, Switch, Router as WouterRouter, Link, useLocation } from 'wouter';
import { useEffect, useRef } from 'react';
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import NotFound from '@/pages/not-found';
import Home from '@/pages/Home';
import AdminOrders from '@/pages/AdminOrders';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true } },
});

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

function AdminCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => addListener(({ user }) => {
    const userId = user?.id ?? null;
    if (previousUserId.current !== undefined && previousUserId.current !== userId) {
      client.clear();
    }
    previousUserId.current = userId;
  }), [addListener, client]);

  return null;
}

function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const isSignIn = mode === 'sign-in';
  document.title = `${isSignIn ? 'Admin sign in' : 'Create account'} | Burst Popcorn Co.`;
  return (
    <main className="min-h-[100dvh] bg-brand-dark px-4 py-12 text-brand-cream">
      <div className="mx-auto mb-8 flex max-w-[430px] items-center justify-between">
        <Link to="/" data-testid="link-back-to-shop" className="text-sm text-brand-light-gold hover:text-white">← Back to shop</Link>
        <span className="text-xs font-bold uppercase tracking-[0.24em] text-brand-light-gold">Burst / Admin</span>
      </div>
      <div className="flex justify-center">
        {isSignIn ? (
          <SignIn
            routing="path"
            path={`${basePath}/sign-in`}
            signUpUrl={`${basePath}/sign-up`}
            forceRedirectUrl={`${basePath}/admin/orders`}
          />
        ) : (
          <SignUp
            routing="path"
            path={`${basePath}/sign-up`}
            signInUrl={`${basePath}/sign-in`}
            forceRedirectUrl={`${basePath}/admin/orders`}
          />
        )}
      </div>
    </main>
  );
}

function AdminGate() {
  return (
    <>
      <Show when="signed-in">
        <AdminOrders />
      </Show>
      <Show when="signed-out">
        <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-brand-dark px-6 text-center text-brand-cream">
          <span className="text-xs font-bold uppercase tracking-[0.28em] text-brand-gold">Burst Popcorn Co.</span>
          <h1 className="font-serif text-5xl">Shop orders</h1>
          <p className="max-w-md text-brand-light-gold">Sign in with the shop admin account to view confirmed orders and delivery details.</p>
          <Link to="/sign-in" data-testid="link-admin-sign-in" className="rounded-full bg-brand-gold px-8 py-3 font-bold text-brand-dark hover:bg-brand-light-gold">Sign in</Link>
          <Link to="/" data-testid="link-public-shop" className="text-sm underline underline-offset-4">Back to shop</Link>
        </main>
      </Show>
    </>
  );
}

function AdminClerkRoutes() {
  const [, setLocation] = useLocation();
  // The public shop also builds on Vercel, where Clerk's Replit-managed key is
  // intentionally absent. Only the Replit-hosted admin surface needs it.
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-brand-dark px-6 text-center text-brand-cream">
        <h1 className="font-serif text-4xl">Admin is available on the Replit shop</h1>
        <p className="max-w-md">Open the published Replit storefront to sign in and view orders.</p>
        <Link to="/" data-testid="link-back-to-shop" className="text-brand-gold underline">Back to shop</Link>
      </main>
    );
  }
  const clerkPubKey = publishableKeyFromHost(
    window.location.hostname,
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  );
  const clerkAppearance = {
    theme: shadcn,
    cssLayerName: 'clerk',
    options: {
      logoPlacement: 'inside' as const,
      logoLinkUrl: basePath || '/',
      logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    },
    variables: {
      colorPrimary: '#D59A3D',
      colorForeground: '#2B1F15',
      colorMutedForeground: '#5B3A1E',
      colorDanger: '#B54735',
      colorBackground: '#FAF6EE',
      colorInput: '#FFFDF8',
      colorInputForeground: '#2B1F15',
      colorNeutral: '#D7BE99',
      fontFamily: '"DM Sans", sans-serif',
      borderRadius: '12px',
    },
    elements: {
      rootBox: { width: '100%', display: 'flex', justifyContent: 'center' },
      cardBox: { width: '430px', maxWidth: '100%', backgroundColor: '#FAF6EE', borderRadius: '20px' },
      headerTitle: { color: '#2B1F15' },
      headerSubtitle: { color: '#5B3A1E' },
      formFieldLabel: { color: '#2B1F15' },
      dividerText: { color: '#5B3A1E' },
      socialButtonsBlockButton: { backgroundColor: '#FFFDF8', border: '1px solid #D7BE99' },
      socialButtonsBlockButtonText: { color: '#2B1F15', fontWeight: 600 },
      footerActionText: { color: '#5B3A1E' },
      footerActionLink: { color: '#925B11', fontWeight: 700 },
    },
  };
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to the private order desk' } },
        signUp: { start: { title: 'Create your account', subtitle: 'Sign up to access Burst Popcorn' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <AdminCacheInvalidator />
        <Switch>
          <Route path="/admin/orders" component={AdminGate} />
          <Route path="/sign-in/*?">{() => <AuthPage mode="sign-in" />}</Route>
          <Route path="/sign-up/*?">{() => <AuthPage mode="sign-up" />}</Route>
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin/orders" component={AdminClerkRoutes} />
      <Route path="/sign-in/*?" component={AdminClerkRoutes} />
      <Route path="/sign-up/*?" component={AdminClerkRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <Router />
    </WouterRouter>
  );
}

export default App;
