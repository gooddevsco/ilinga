/**
 * Phase 17 i18n scaffold. en-GB at GA; copy externalised so we can swap in
 * future locales without code edits. Replace with a real i18n lib (FormatJS
 * / lingui) when more than two locales ship.
 */

import { createContext, useContext, type ReactNode, createElement } from 'react';

type Locale = 'en-GB';

const messages: Record<Locale, Record<string, string>> = {
  'en-GB': {
    'app.signOut': 'Sign out',
    'app.help': 'Help',
    'app.dashboard': 'Dashboard',
    'app.ventures': 'Ventures',
    'app.reports': 'Reports',
    'app.credits': 'Credits',
    'app.settings': 'Settings',
    'auth.signIn.title': 'Sign in to Ilinga',
    'auth.signIn.cta': 'Email me a sign-in link',
    'auth.signUp.title': 'Create your Ilinga account',
    'errors.404.title': 'Page not found',
    'errors.500.title': 'Something went wrong',
  },
};

const ctx = createContext<Locale>('en-GB');

export const I18nProvider = ({
  locale = 'en-GB',
  children,
}: {
  locale?: Locale;
  children: ReactNode;
}) => createElement(ctx.Provider, { value: locale }, children);

export const t = (locale: Locale, key: string): string => messages[locale][key] ?? key;

export const useT = () => {
  const locale = useContext(ctx);
  return (key: string) => t(locale, key);
};
