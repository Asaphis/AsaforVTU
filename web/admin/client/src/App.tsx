import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import UsersPage from "@/pages/Users";
import WalletPage from "@/pages/Wallet";
import TransactionsPage from "@/pages/Transactions";
import TransactionDetailsPage from "@/pages/TransactionDetails";
import ServicesPage from "@/pages/Services";
import ApiSettingsPage from "@/pages/Settings";
import ProfilePage from "@/pages/Profile";
import LogsPage from "@/pages/Logs";
import SupportPage from "@/pages/Support";
import UserProfilePage from "@/pages/UserProfile";
import FinancePage from "@/pages/Finance";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/login">
            <Login />
          </Route>
          <Route path="/">
            <DashboardLayout>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/users" component={UsersPage} />
                <Route path="/users/:uid" component={UserProfilePage} />
                <Route path="/wallet" component={WalletPage} />
                <Route path="/transactions" component={TransactionsPage} />
                <Route path="/transactions/:id" component={TransactionDetailsPage} />
                <Route path="/services" component={ServicesPage} />
                <Route path="/finance" component={FinancePage} />
                <Route path="/settings/api" component={ApiSettingsPage} />
                <Route path="/profile" component={ProfilePage} />
                <Route path="/support" component={SupportPage} />
                <Route path="/logs" component={LogsPage} />
                <Route component={NotFound} />
              </Switch>
            </DashboardLayout>
          </Route>
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
