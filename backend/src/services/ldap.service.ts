import { Client } from 'ldapts';
import {
  findUserByEmail,
  type AuthUser
} from './auth.service.js';

export const authenticateLdapUser = async (
  email: string,
  password: string
): Promise<AuthUser | null> => {
  if (process.env.AUTH_PROVIDER !== 'ldap') {
    throw new Error('LDAP authentication is not enabled.');
  }

  const ldapUrl = process.env.LDAP_URL;
  const userDnTemplate = process.env.LDAP_USER_DN_TEMPLATE;

  if (!ldapUrl || !userDnTemplate) {
    throw new Error('LDAP configuration is incomplete.');
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !password
  ) {
    return null;
  }

  const userDn = userDnTemplate.replace('{username}', email);

  const client = new Client({
    url: ldapUrl,
    timeout: 5000,
    connectTimeout: 5000
  });

  try {
    // Authenticate against the LDAP directory
    try {
      await client.bind(userDn, password);
    } catch {
      return null;
    }

    // Find the corresponding InfraFlow account
    return await findUserByEmail(email);
  } finally {
    await client.unbind().catch(() => undefined);
  }
};
