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
          <Route path="/users/:uid">
            <DashboardLayout>
              <UserProfilePage />
            </DashboardLayout>
          </Route>
          <Route path="/users">
            <DashboardLayout>
              <UsersPage />
            </DashboardLayout>
          </Route>
          <Route path="/wallet">
            <DashboardLayout>
              <WalletPage />
            </DashboardLayout>
          </Route>
          <Route path="/transactions/:id">
            <DashboardLayout>
              <TransactionDetailsPage />
            </DashboardLayout>
          </Route>
          <Route path="/transactions">
            <DashboardLayout>
              <TransactionsPage />
            </DashboardLayout>
          </Route>
          <Route path="/services">
            <DashboardLayout>
              <ServicesPage />
            </DashboardLayout>
          </Route>
          <Route path="/finance">
            <DashboardLayout>
              <FinancePage />
            </DashboardLayout>
          </Route>
          <Route path="/settings/api">
            <DashboardLayout>
              <ApiSettingsPage />
            </DashboardLayout>
          </Route>
          <Route path="/profile">
            <DashboardLayout>
              <ProfilePage />
            </DashboardLayout>
          </Route>
          <Route path="/support">
            <DashboardLayout>
              <SupportPage />
            </DashboardLayout>
          </Route>
          <Route path="/logs">
            <DashboardLayout>
              <LogsPage />
            </DashboardLayout>
          </Route>
          <Route path="/dashboard">
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </Route>
          <Route path="/dashboard">
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </Route>
          <Route path="/">
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
