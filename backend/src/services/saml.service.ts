import passport from 'passport';
import {
  Strategy as SamlStrategy,
  type Profile,
  type VerifyWithoutRequest
} from '@node-saml/passport-saml';

import { ValidateInResponseTo } from '@node-saml/node-saml';

import { findUserByEmail } from './auth.service.js';

const extractEmail = (profile: Profile): string | null => {
  const emailAttribute = process.env.SAML_EMAIL_ATTRIBUTE || 'email';

  const rawEmail =
    profile[emailAttribute] ??
    profile.email ??
    profile.mail;

  if (typeof rawEmail === 'string' && rawEmail.trim()) {
    return rawEmail.trim();
  }

  if (Array.isArray(rawEmail) && typeof rawEmail[0] === 'string') {
    return rawEmail[0].trim() || null;
  }

  return null;
};

const verifySamlUser: VerifyWithoutRequest = async (profile, done) => {
  try {
    if (!profile) {
      return done(null, undefined);
    }

    const email = extractEmail(profile);

    if (!email) {
      return done(null, undefined);
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return done(null, undefined);
    }

    return done(null, { ...user });
  } catch (error) {
    return done(error as Error);
  }
};

export let samlStrategy: SamlStrategy | null = null;

export const configureSaml = (): SamlStrategy | null => {
  if (process.env.AUTH_PROVIDER !== 'saml') {
    return null;
  }

  const entryPoint = process.env.SAML_ENTRY_POINT;
  const issuer = process.env.SAML_ISSUER;
  const callbackUrl = process.env.SAML_CALLBACK_URL;
  const idpCert = process.env.SAML_CERT;

  if (!entryPoint || !issuer || !callbackUrl || !idpCert) {
    throw new Error('SAML configuration is incomplete.');
  }

  const strategy = new SamlStrategy(
    {
      entryPoint,
      issuer,
      callbackUrl,
      idpCert,
      validateInResponseTo: ValidateInResponseTo.always,
      requestIdExpirationPeriodMs: 5 * 60 * 1000
    },
    verifySamlUser,
    verifySamlUser
  );

  passport.use(
  'saml',
  strategy as unknown as Parameters<typeof passport.use>[1]
);

samlStrategy = strategy;

return strategy;
};
