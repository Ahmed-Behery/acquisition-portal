// Simple persistent JSON store (no native deps). Last-write-wins on shared state.
// Ported verbatim from the Express app; only the module system changed.
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import * as seed from './seed';

const DATA_FILE = path.join(process.cwd(), 'data', 'store.json');
const DEFAULT_PASSWORD = 'Contact@123'; // applies to all pre-seeded demo accounts

// The dev server re-evaluates modules on hot reload — keep the store on globalThis
// so an edit never silently drops in-memory state.
const globalRef = globalThis;
globalRef.__cgStore = globalRef.__cgStore || { store: null };

function ensureDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function freshStore() {
  const hash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  return {
    users: seed.USERS.map((u) => ({ ...u, passHash: hash })),
    data: {
      companies: seed.COMPANIES,
      products: seed.PRODUCTS,
      bundles: seed.BUNDLES,
      clients: seed.CLIENTS,
      pipeline: seed.PIPELINE,
      notifications: seed.NOTIFICATIONS,
      industries: seed.INDUSTRIES,
      egyptCompanies: seed.EGYPT_COMPANIES,
      recipients: seed.RECIPIENTS,
      amlWatchlist: seed.AML_WATCHLIST,
      governorates: seed.EGYPT_GOVERNORATES,
      companySizes: seed.COMPANY_SIZES,
      companySizeDefs: seed.COMPANY_SIZE_DEFS,
      referrals: seed.REFERRALS,
    },
  };
}

function load() {
  ensureDir();
  if (fs.existsSync(DATA_FILE)) {
    try {
      globalRef.__cgStore.store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return;
    } catch (e) {
      console.error('Corrupt store, reseeding:', e.message);
    }
  }
  globalRef.__cgStore.store = freshStore();
  save();
}

export function save() {
  ensureDir();
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(globalRef.__cgStore.store, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

export function getStore() {
  if (!globalRef.__cgStore.store) load();
  return globalRef.__cgStore.store;
}

// Public projection of a user (no secrets).
export function publicUser(u) {
  if (!u) return null;
  const { passHash, ...rest } = u;
  return rest;
}

export { bcrypt, DEFAULT_PASSWORD };
