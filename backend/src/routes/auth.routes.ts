import { Router, Request, Response } from 'express';
import passport from 'passport';

import {
  demoLogin,
  ldapLogin
} from '../controllers/auth.controller.js';
import { generateAccessToken } from '../services/auth.service.js';
import { samlStrategy } from '../services/saml.service.js';

const router = Router();

// Existing demo login
router.post('/demo', demoLogin);

// LDAP login
router.post('/ldap', ldapLogin);

// Start SAML login
router.get(
  '/saml',
  passport.authenticate('saml', { session: false })
);

// Handle SAML callback
router.post(
  '/saml/callback',
  passport.authenticate('saml', {
    session: false,
    failureRedirect: '/api/auth/saml/failed'
  }),
  (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'SAML authentication failed.'
      });
      return;
    }

    const token = generateAccessToken(req.user);

    res.status(200).json({
      success: true,
      message: 'SAML authentication successful.',
      token,
      user: req.user
    });
  }
);

// SAML authentication failure
router.get('/saml/failed', (_req, res) => {
  res.status(401).json({
    success: false,
    message: 'SAML authentication failed.'
  });
});

router.get('/saml/metadata', (_req, res) => {
  if (!samlStrategy) {
    res.status(503).json({
      success: false,
      message: 'SAML authentication is not configured.'
    });
    return;
  }

  const metadata = samlStrategy.generateServiceProviderMetadata(
    null,
    null
  );

  res.type('application/xml').send(metadata);
});

export default router;
