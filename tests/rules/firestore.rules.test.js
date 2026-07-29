/**
 * Firestore security rules tests.
 *
 * Run with:  pnpm test:rules
 * (wrapped in `firebase emulators:exec`, which sets the emulator host env vars)
 *
 * These assert the rules as written in firestore.rules. The order tests in
 * particular guard the production fix: buyers must not be able to update or
 * delete their own orders, since that would let a customer rewrite `total` or
 * self-advance `status` straight from the client SDK.
 */

const { before, after, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} = require('firebase/firestore');

const BUYER = 'buyer-uid-1';
const OTHER_BUYER = 'buyer-uid-2';
const ADMIN = 'admin-uid-1';

let testEnv;

/** A valid order payload as written by placeOrder() in context/CartContext.tsx. */
function orderPayload(overrides = {}) {
  return {
    orderId: 'PCH1234',
    userId: BUYER,
    items: [{ id: 'i1', quantity: 100, price: 245 }],
    total: 245,
    address: '1 Test St',
    gstNumber: '',
    paymentMethod: 'upi',
    createdAt: new Date().toISOString(),
    status: 'confirmed',
    ...overrides,
  };
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'shop-cart-flow-rules-test',
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
    },
  });
});

after(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  // Seed the docs the rules read, bypassing rules for setup.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', BUYER), { role: 'customer' });
    await setDoc(doc(db, 'users', OTHER_BUYER), { role: 'customer' });
    await setDoc(doc(db, 'users', ADMIN), { role: 'admin' });
    await setDoc(doc(db, 'orders', 'order-1'), orderPayload());
    await setDoc(doc(db, 'products', 'p1'), { name: 'Gold Standy' });
    await setDoc(doc(db, 'settings', 'store'), { taxRate: 18 });
  });
});

/** Buyer signed in anonymously, as the app does today. */
const buyerDb = () => testEnv.authenticatedContext(BUYER).firestore();
const otherBuyerDb = () => testEnv.authenticatedContext(OTHER_BUYER).firestore();
/** Admin identified by the custom claim — the path we want production to use. */
const adminClaimDb = () => testEnv.authenticatedContext(ADMIN, { admin: true }).firestore();
/** Admin identified only by users/{uid}.role — the migration fallback. */
const adminRoleDocDb = () => testEnv.authenticatedContext(ADMIN).firestore();
const anonDb = () => testEnv.unauthenticatedContext().firestore();

describe('orders', () => {
  it('lets a buyer create their own order', async () => {
    await assertSucceeds(setDoc(doc(buyerDb(), 'orders', 'new-1'), orderPayload()));
  });

  it('rejects an order created for someone else', async () => {
    await assertFails(
      setDoc(doc(buyerDb(), 'orders', 'new-2'), orderPayload({ userId: OTHER_BUYER }))
    );
  });

  it('rejects an order that starts at a status other than confirmed', async () => {
    await assertFails(
      setDoc(doc(buyerDb(), 'orders', 'new-3'), orderPayload({ status: 'delivered' }))
    );
  });

  it('rejects an order with a non-numeric total', async () => {
    await assertFails(setDoc(doc(buyerDb(), 'orders', 'new-4'), orderPayload({ total: '245' })));
  });

  it('rejects an order with a negative total', async () => {
    await assertFails(setDoc(doc(buyerDb(), 'orders', 'new-5'), orderPayload({ total: -1 })));
  });

  it('lets a buyer read their own order', async () => {
    await assertSucceeds(getDoc(doc(buyerDb(), 'orders', 'order-1')));
  });

  it("stops a buyer reading someone else's order", async () => {
    await assertFails(getDoc(doc(otherBuyerDb(), 'orders', 'order-1')));
  });

  // The production fix.
  it('stops a buyer rewriting the total on their own order', async () => {
    await assertFails(updateDoc(doc(buyerDb(), 'orders', 'order-1'), { total: 1 }));
  });

  it('stops a buyer advancing their own order status', async () => {
    await assertFails(updateDoc(doc(buyerDb(), 'orders', 'order-1'), { status: 'delivered' }));
  });

  it('stops a buyer deleting their own order', async () => {
    await assertFails(deleteDoc(doc(buyerDb(), 'orders', 'order-1')));
  });

  it('lets an admin with the claim read any order', async () => {
    await assertSucceeds(getDoc(doc(adminClaimDb(), 'orders', 'order-1')));
  });

  it('lets an admin with the claim update order status', async () => {
    await assertSucceeds(
      updateDoc(doc(adminClaimDb(), 'orders', 'order-1'), { status: 'dispatched' })
    );
  });

  it('lets an admin identified only by role doc update order status (migration fallback)', async () => {
    await assertSucceeds(
      updateDoc(doc(adminRoleDocDb(), 'orders', 'order-1'), { status: 'production' })
    );
  });

  it('stops even an admin deleting an order, preserving the audit trail', async () => {
    await assertFails(deleteDoc(doc(adminClaimDb(), 'orders', 'order-1')));
  });
});

describe('users', () => {
  it('lets a buyer read their own profile', async () => {
    await assertSucceeds(getDoc(doc(buyerDb(), 'users', BUYER)));
  });

  it("stops a buyer reading another buyer's profile", async () => {
    await assertFails(getDoc(doc(buyerDb(), 'users', OTHER_BUYER)));
  });

  it('stops a buyer promoting themselves to admin', async () => {
    await assertFails(updateDoc(doc(buyerDb(), 'users', BUYER), { role: 'admin' }));
  });

  it('lets a buyer update their own non-role fields', async () => {
    await assertSucceeds(
      setDoc(doc(buyerDb(), 'users', BUYER), { role: 'customer', phone: '9876543210' })
    );
  });

  it('lets an admin read any profile', async () => {
    await assertSucceeds(getDoc(doc(adminClaimDb(), 'users', BUYER)));
  });
});

/**
 * An admin holds two grants on their own users/{uid} doc: the owner rules and
 * the isAdmin() rules. These assert the admin branch can no longer be used to
 * rewrite the admin's *own* role, while every Customer Management operation on
 * *other* users still works.
 */
describe('users — admin cannot change their own role', () => {
  it('lets an admin edit their own profile except for role', async () => {
    await assertSucceeds(
      setDoc(doc(adminClaimDb(), 'users', ADMIN), { name: 'Ops Lead', phone: '9876500000' }, { merge: true })
    );
  });

  it('lets an admin rewrite their own profile while restating the same role', async () => {
    await assertSucceeds(
      setDoc(doc(adminClaimDb(), 'users', ADMIN), { role: 'admin', phone: '9876500001' })
    );
  });

  it('stops an admin demoting themselves to customer', async () => {
    await assertFails(updateDoc(doc(adminClaimDb(), 'users', ADMIN), { role: 'customer' }));
  });

  it('stops an admin demoting themselves via a full-document overwrite', async () => {
    await assertFails(setDoc(doc(adminClaimDb(), 'users', ADMIN), { role: 'customer' }));
  });

  it('stops an admin identified only by role doc demoting themselves (migration fallback)', async () => {
    await assertFails(updateDoc(doc(adminRoleDocDb(), 'users', ADMIN), { role: 'customer' }));
  });

  it('stops an admin changing their own role to an arbitrary value', async () => {
    await assertFails(updateDoc(doc(adminClaimDb(), 'users', ADMIN), { role: 'superadmin' }));
  });
});

describe('users — Customer Management module', () => {
  it('lets an admin list all customers', async () => {
    await assertSucceeds(getDocs(collection(adminClaimDb(), 'users')));
  });

  it('lets an admin promote another user to admin', async () => {
    await assertSucceeds(
      updateDoc(doc(adminClaimDb(), 'users', BUYER), { role: 'admin', updatedAt: new Date().toISOString() })
    );
  });

  it("lets an admin revoke another user's admin role", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', OTHER_BUYER), { role: 'admin' });
    });
    await assertSucceeds(
      updateDoc(doc(adminClaimDb(), 'users', OTHER_BUYER), { role: 'customer', updatedAt: new Date().toISOString() })
    );
  });

  it('lets an admin identified only by role doc promote another user (migration fallback)', async () => {
    await assertSucceeds(updateDoc(doc(adminRoleDocDb(), 'users', BUYER), { role: 'admin' }));
  });

  it("lets an admin edit another user's non-role fields", async () => {
    await assertSucceeds(updateDoc(doc(adminClaimDb(), 'users', BUYER), { phone: '9000000000' }));
  });

  it('lets an admin promote a legacy profile that has no role field', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', OTHER_BUYER), { phone: '9111111111' });
    });
    await assertSucceeds(updateDoc(doc(adminClaimDb(), 'users', OTHER_BUYER), { role: 'admin' }));
  });

  it('still lets a buyer merge-update their own profile (role preserved)', async () => {
    await assertSucceeds(
      setDoc(doc(buyerDb(), 'users', BUYER), { addresses: [] }, { merge: true })
    );
  });

  it('still stops a buyer editing another profile', async () => {
    await assertFails(updateDoc(doc(buyerDb(), 'users', OTHER_BUYER), { phone: '9222222222' }));
  });
});

describe('carts', () => {
  it('lets a buyer write their own cart', async () => {
    await assertSucceeds(setDoc(doc(buyerDb(), 'carts', BUYER), { items: [] }));
  });

  it("stops a buyer writing another buyer's cart", async () => {
    await assertFails(setDoc(doc(buyerDb(), 'carts', OTHER_BUYER), { items: [] }));
  });
});

describe('products and settings', () => {
  it('allows public catalog reads while signed out', async () => {
    await assertSucceeds(getDoc(doc(anonDb(), 'products', 'p1')));
  });

  it('stops a buyer writing the catalog', async () => {
    await assertFails(setDoc(doc(buyerDb(), 'products', 'p1'), { name: 'hacked' }));
  });

  it('lets an admin write the catalog', async () => {
    await assertSucceeds(setDoc(doc(adminClaimDb(), 'products', 'p1'), { name: 'Updated' }));
  });

  it('allows public settings reads', async () => {
    await assertSucceeds(getDoc(doc(anonDb(), 'settings', 'store')));
  });

  it('stops a buyer writing settings', async () => {
    await assertFails(setDoc(doc(buyerDb(), 'settings', 'store'), { taxRate: 0 }));
  });
});
