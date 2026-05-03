import { Navigate, Route, Routes } from 'react-router-dom';
import { MarketingLayout } from './layouts/MarketingLayout';
import { AppLayout } from './layouts/AppLayout';
import { Home } from './pages/marketing/Home';
import { Pricing } from './pages/marketing/Pricing';
import { Help } from './pages/marketing/Help';
import { HelpArticle } from './pages/marketing/HelpArticle';
import { Contact } from './pages/marketing/Contact';
import { Legal } from './pages/marketing/Legal';
import { Status } from './pages/marketing/Status';
import { Developers } from './pages/marketing/Developers';
import { SignIn } from './pages/auth/SignIn';
import { SignUp } from './pages/auth/SignUp';
import { GoogleCallback, MagicCallback } from './pages/auth/Callback';
import { StakeholderPortal } from './pages/stakeholder/StakeholderPortal';
import { CreateWorkspace } from './pages/onboarding/CreateWorkspace';
import { Dashboard } from './pages/app/Dashboard';
import { Ventures } from './pages/app/Ventures';
import { VentureNew } from './pages/app/VentureNew';
import { VentureDetail } from './pages/app/VentureDetail';
import { VentureEdit } from './pages/app/VentureEdit';
import { CycleCompare } from './pages/app/CycleCompare';
import { Activity } from './pages/app/Activity';
import { PortalLayout } from './layouts/PortalLayout';
import { Interview } from './pages/app/Interview';
import { Synthesis } from './pages/app/Synthesis';
import { CycleReports } from './pages/app/CycleReports';
import { ContentKeys } from './pages/app/ContentKeys';
import { ReportViewer } from './pages/app/ReportViewer';
import { Reports } from './pages/app/Reports';
import { Credits } from './pages/app/Credits';
import { Trash } from './pages/app/Trash';
import { Notifications } from './pages/app/Notifications';
import {
  SettingsLayout,
  SettingsAi,
  SettingsApiTokens,
  SettingsBilling,
  SettingsPrivacy,
  SettingsProfile,
  SettingsSecurity,
  SettingsTeam,
  SettingsWebhooks,
  SettingsWorkspace,
  SettingsSessions,
} from './pages/app/Settings';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminDsar } from './pages/admin/AdminDsar';
import { AdminMaintenance } from './pages/admin/AdminMaintenance';
import { AdminImpersonate } from './pages/admin/AdminImpersonate';
import {
  ForbiddenPage,
  MaintenancePage,
  NotFoundPage,
  OfflinePage,
  RateLimitedPage,
  ReadOnlyPage,
  ServerErrorPage,
} from './pages/errors/ErrorPages';

export const App = (): JSX.Element => (
  <>
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/help" element={<Help />} />
        <Route path="/help/contact" element={<Contact />} />
        <Route path="/help/:slug" element={<HelpArticle />} />
        <Route path="/legal/:slug" element={<Legal />} />
        <Route path="/status" element={<Status />} />
        <Route path="/developers/docs" element={<Developers />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/auth/callback/magic" element={<MagicCallback />} />
        <Route path="/auth/callback/google" element={<GoogleCallback />} />
        <Route path="/s/:token" element={<StakeholderPortal />} />
        <Route path="/onboarding/create-workspace" element={<CreateWorkspace />} />

        <Route path="/errors/403" element={<ForbiddenPage />} />
        <Route path="/errors/500" element={<ServerErrorPage />} />
        <Route path="/errors/429" element={<RateLimitedPage />} />
        <Route path="/errors/503" element={<MaintenancePage />} />
        <Route path="/errors/offline" element={<OfflinePage />} />
        <Route path="/errors/read-only" element={<ReadOnlyPage />} />
      </Route>

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ventures" element={<Ventures />} />
        <Route path="/ventures/new" element={<VentureNew />} />
        <Route path="/ventures/:id" element={<VentureDetail />} />
        <Route path="/ventures/:id/edit" element={<VentureEdit />} />
        <Route path="/ventures/:vid/compare" element={<CycleCompare />} />
        <Route path="/ventures/:vid/cycles/:cid/activity" element={<Activity />} />
        <Route path="/ventures/:vid/cycles/:cid/interview" element={<Interview />} />
        <Route path="/ventures/:vid/cycles/:cid/synthesis" element={<Synthesis />} />
        <Route path="/ventures/:vid/cycles/:cid/reports" element={<CycleReports />} />
        <Route path="/ventures/:vid/cycles/:cid/keys" element={<ContentKeys />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:id" element={<ReportViewer />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/trash" element={<Trash />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />
        <Route path="/settings/*" element={<SettingsLayout />}>
          <Route path="profile" element={<SettingsProfile />} />
          <Route path="workspace" element={<SettingsWorkspace />} />
          <Route path="team" element={<SettingsTeam />} />
          <Route path="billing" element={<SettingsBilling />} />
          <Route path="ai" element={<SettingsAi />} />
          <Route path="webhooks" element={<SettingsWebhooks />} />
          <Route path="api-tokens" element={<SettingsApiTokens />} />
          <Route path="sessions" element={<SettingsSessions />} />
          <Route path="security" element={<SettingsSecurity />} />
          <Route path="privacy" element={<SettingsPrivacy />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="dsar" element={<AdminDsar />} />
          <Route path="maintenance" element={<AdminMaintenance />} />
          <Route path="impersonate" element={<AdminImpersonate />} />
        </Route>
      </Route>

      <Route path="/portal" element={<PortalLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="ventures" element={<Ventures />} />
        <Route path="ventures/:id" element={<VentureDetail />} />
        <Route path="ventures/:vid/cycles/:cid/interview" element={<Interview />} />
        <Route path="ventures/:vid/cycles/:cid/synthesis" element={<Synthesis />} />
        <Route path="ventures/:vid/cycles/:cid/reports" element={<CycleReports />} />
        <Route path="reports/:id" element={<ReportViewer />} />
      </Route>

      <Route element={<MarketingLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </>
);
