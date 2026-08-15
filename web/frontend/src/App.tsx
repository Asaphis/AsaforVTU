// AsaforVTU route shell: every public and authenticated customer route stays inside the Ferixas design system.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import LiveAuthScreen from "./components/LiveAuthScreen";
import LiveDashboard from "./components/LiveDashboard";
import LiveSupportWorkspace from "./components/LiveSupportWorkspace";
import WhatsAppContact from "./components/WhatsAppContact";
import { LiveAuthProvider, useLiveAuth } from "./contexts/LiveAuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import LandingPage from "./prototype-pages/LandingPage";
import NotFound from "./prototype-pages/NotFound";
import PublicInfo from "./prototype-pages/PublicInfo";

const publicRoutes = ["/about", "/services", "/services/airtime", "/services/data", "/services/electricity", "/services/cable", "/services/exam-pins", "/how-it-works", "/pricing", "/updates", "/help", "/contact", "/privacy", "/terms", "/refund-policy"];
function Authenticated({children}:{children:React.ReactNode}) { const [,setLocation]=useLocation(); const { user, loading } = useLiveAuth(); useEffect(()=>{if(!loading&&!user)setLocation("/login")},[loading,user,setLocation]); if (loading) return <main className="public-shell"><div className="auth-loading">Checking your account…</div></main>; return user?<>{children}</>:null; }
function PrivateDashboard(){return <Authenticated><LiveDashboard/></Authenticated>}
function PrivateSupport(){return <Authenticated><LiveSupportWorkspace/></Authenticated>}
function Router() { return <Switch><Route path="/" component={LandingPage} />{publicRoutes.map(path=><Route key={path} path={path} component={PublicInfo}/>)}<Route path="/login">{()=><LiveAuthScreen mode="login"/>}</Route><Route path="/register">{()=><LiveAuthScreen mode="register"/>}</Route><Route path="/verify-email-sent">{()=><LiveAuthScreen mode="verify"/>}</Route><Route path="/verify-email">{()=><LiveAuthScreen mode="verify"/>}</Route><Route path="/forgot-password">{()=><LiveAuthScreen mode="forgot"/>}</Route><Route path="/reset-password">{()=><LiveAuthScreen mode="reset"/>}</Route><Route path="/payment-complete" component={PrivateDashboard}/><Route path="/dashboard/support" component={PrivateSupport}/><Route path="/dashboard/services/purchase/:kind" component={PrivateDashboard}/><Route path="/dashboard/services/:service" component={PrivateDashboard}/><Route path="/dashboard/services" component={PrivateDashboard}/><Route path="/dashboard/transactions/:id" component={PrivateDashboard}/><Route path="/dashboard" component={PrivateDashboard}/><Route path="/dashboard/:page" component={PrivateDashboard}/><Route component={NotFound} /></Switch>; }

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><LiveAuthProvider><TooltipProvider><Toaster richColors position="top-right" /><Router /><WhatsAppContact /></TooltipProvider></LiveAuthProvider></ThemeProvider></ErrorBoundary>; }
