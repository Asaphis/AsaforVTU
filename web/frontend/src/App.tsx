// AsaforVTU route shell: every public and authenticated customer route stays inside the Ferixas design system.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LandingPage from "./customer-pages/LandingPage";
import NotFound from "./customer-pages/NotFound";
import CustomerApp from "./customer-pages/CustomerApp";
import PublicInfo from "./customer-pages/PublicInfo";
import ServiceHub from "./customer-pages/ServiceHub";

const publicRoutes = ["/about", "/services", "/services/airtime", "/services/data", "/services/electricity", "/services/cable", "/services/exam-pins", "/how-it-works", "/pricing", "/updates", "/help", "/contact", "/privacy", "/terms", "/refund-policy"];
function Authenticated({children}:{children:React.ReactNode}) { const [,setLocation]=useLocation(); const allowed=typeof window!=="undefined"&&(sessionStorage.getItem("asaforvtu-auth")==="1"||Boolean(localStorage.getItem("access_token"))); useEffect(()=>{if(!allowed)setLocation("/login")},[allowed,setLocation]); return allowed?<>{children}</>:null; }
function MobileServicesEntry() { const [, setLocation] = useLocation(); const isPhone = typeof window !== "undefined" && window.matchMedia("(max-width: 920px)").matches; useEffect(() => { if (isPhone) setLocation("/dashboard/services"); }, [isPhone, setLocation]); return <Authenticated>{isPhone ? <ServiceHub /> : <CustomerApp />}</Authenticated>; }
function ServicePurchaseEntry() { const [, setLocation] = useLocation(); const isPhone = typeof window !== "undefined" && window.matchMedia("(max-width: 920px)").matches; return <Authenticated>{isPhone && <button className="service-back-control" onClick={() => setLocation("/dashboard/services")} aria-label="Back to all services">← <span>All services</span></button>}<CustomerApp /></Authenticated>; }
function PrivateCustomer(){return <Authenticated><CustomerApp/></Authenticated>}
function PrivateHub(){return <Authenticated><ServiceHub/></Authenticated>}
function Router() { return <Switch><Route path="/" component={LandingPage} />{publicRoutes.map(path=><Route key={path} path={path} component={PublicInfo}/>)}<Route path="/login" component={CustomerApp}/><Route path="/register" component={CustomerApp}/><Route path="/verify-email-sent" component={CustomerApp}/><Route path="/verify-email" component={CustomerApp}/><Route path="/forgot-password" component={CustomerApp}/><Route path="/reset-password" component={CustomerApp}/><Route path="/payment-complete" component={CustomerApp}/><Route path="/dashboard/services" component={PrivateHub} /><Route path="/dashboard/services/data" component={MobileServicesEntry} /><Route path="/dashboard/services/purchase/:kind" component={ServicePurchaseEntry} /><Route path="/dashboard/services/airtime" component={ServicePurchaseEntry} /><Route path="/dashboard/services/cable" component={ServicePurchaseEntry} /><Route path="/dashboard/services/electricity" component={ServicePurchaseEntry} /><Route path="/dashboard/services/exam-pins" component={ServicePurchaseEntry} /><Route path="/dashboard/transactions/:id" component={PrivateCustomer}/><Route path="/dashboard" component={PrivateCustomer}/><Route path="/dashboard/:page" component={PrivateCustomer}/><Route component={NotFound} /></Switch>; }

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-right" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
