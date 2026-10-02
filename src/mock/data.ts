// Thin barrel kept so existing imports (`./data`) keep working while seed data lives in
// ./seed/*. `currentUser` is a temporary shim until the login flow replaces the old
// "Viewing as" persona switcher (it is removed in the authentication step).
import { users } from './seed';

export * from './seed';

export const currentUser = users[0];
