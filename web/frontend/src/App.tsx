// AsaforVTU route shell: every public and authenticated customer route stays inside the Ferixas design system.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import GuestLogin from "./prototype-pages/GuestLogin";
import LandingPage from "./prototype-pages/LandingPage";
import NotFound from "./prototype-pages/NotFound";
import PrototypeApp from "./prototype-pages/PrototypeApp";
import PublicInfo from "./prototype-pages/PublicInfo";
import ServiceHub from "./prototype-pages/ServiceHub";

const publicRoutes = ["/about", "/services", "/services/airtime", "/services/data", "/services/electricity", "/services/cable", "/services/exam-pins", "/how-it-works", "/pricing", "/updates", "/help", "/contact", "/privacy", "/terms", "/refund-policy"];
function Authenticated({children}:{children:React.ReactNode}) { const [,setLocation]=useLocation(); const allowed=typeof window!=="undefined"&&sessionStorage.getItem("asaforvtu-prototype-auth")==="1"; useEffect(()=>{if(!allowed)setLocation("/login")},[allowed,setLocation]); return allowed?<>{children}</>:null; }
function LoginEntry(){if(typeof window!=="undefined")sessionStorage.removeItem("asaforvtu-prototype-auth");return <GuestLogin/>}
function MobileServicesEntry() { const [, setLocation] = useLocation(); const isPhone = typeof window !== "undefined" && window.matchMedia("(max-width: 920px)").matches; useEffect(() => { if (isPhone) setLocation("/dashboard/services"); }, [isPhone, setLocation]); return <Authenticated>{isPhone ? <ServiceHub /> : <PrototypeApp />}</Authenticated>; }
function ServicePurchaseEntry() { const [, setLocation] = useLocation(); const isPhone = typeof window !== "undefined" && window.matchMedia("(max-width: 920px)").matches; return <Authenticated>{isPhone && <button className="service-back-control" onClick={() => setLocation("/dashboard/services")} aria-label="Back to all services">← <span>All services</span></button>}<PrototypeApp /></Authenticated>; }
function PrivatePrototype(){return <Authenticated><PrototypeApp/></Authenticated>}
function PrivateHub(){return <Authenticated><ServiceHub/></Authenticated>}
function Router() { return <Switch><Route path="/" component={LandingPage} />{publicRoutes.map(path=><Route key={path} path={path} component={PublicInfo}/>)}<Route path="/login" component={PrototypeApp}/><Route path="/register" component={PrototypeApp}/><Route path="/verify-email-sent" component={PrototypeApp}/><Route path="/verify-email" component={PrototypeApp}/><Route path="/forgot-password" component={PrototypeApp}/><Route path="/reset-password" component={PrototypeApp}/><Route path="/payment-complete" component={PrototypeApp}/><Route path="/dashboard/services" component={PrivateHub} /><Route path="/dashboard/services/data" component={MobileServicesEntry} /><Route path="/dashboard/services/purchase/:kind" component={ServicePurchaseEntry} /><Route path="/dashboard/services/airtime" component={ServicePurchaseEntry} /><Route path="/dashboard/services/cable" component={ServicePurchaseEntry} /><Route path="/dashboard/services/electricity" component={ServicePurchaseEntry} /><Route path="/dashboard/services/exam-pins" component={ServicePurchaseEntry} /><Route path="/dashboard/transactions/:id" component={PrivatePrototype} /><Route path="/dashboard" component={PrivatePrototype}/><Route path="/dashboard/:page" component={PrivatePrototype}/><Route component={NotFound} /></Switch>; }

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-right" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
