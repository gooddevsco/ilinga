import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
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
import { Dashboard } from './pages/app/Dashboard';
import { Ventures } from './pages/app/Ventures';
import { VentureNew } from './pages/app/VentureNew';
import { VentureDetail } from './pages/app/VentureDetail';
import { Interview } from './pages/app/Interview';
import { Reports } from './pages/app/Reports';
import { Credits } from './pages/app/Credits';
import {
  SettingsLayout,
  SettingsAi,
  SettingsBilling,
  SettingsPrivacy,
  SettingsProfile,
  SettingsSecurity,
  SettingsTeam,
} from './pages/app/Settings';
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
  <BrowserRouter>
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
        <Route path="/ventures/:vid/cycles/:cid/interview" element={<Interview />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />
        <Route path="/settings/*" element={<SettingsLayout />}>
          <Route path="profile" element={<SettingsProfile />} />
          <Route path="team" element={<SettingsTeam />} />
          <Route path="billing" element={<SettingsBilling />} />
          <Route path="ai" element={<SettingsAi />} />
          <Route path="security" element={<SettingsSecurity />} />
          <Route path="privacy" element={<SettingsPrivacy />} />
        </Route>
      </Route>

      <Route element={<MarketingLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
