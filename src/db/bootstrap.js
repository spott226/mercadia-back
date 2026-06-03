const pool = require("./db");

let bootstrapPromise = null;

async function ensureCustomerAccountSchema(){

  if(bootstrapPromise){
    return bootstrapPromise;
  }

  bootstrapPromise =
    (async () => {
      await pool.query(
        `
        CREATE TABLE IF NOT EXISTS customer_accounts (
          id SERIAL PRIMARY KEY,
          store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
          name VARCHAR(120) NOT NULL,
          phone VARCHAR(30) NOT NULL,
          password_hash TEXT NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_login_at TIMESTAMPTZ
        )
        `
      );

      await pool.query(
        `
        CREATE UNIQUE INDEX IF NOT EXISTS
          customer_accounts_store_phone_idx
        ON customer_accounts (store_id, phone)
        `
      );

      await pool.query(
        `
        CREATE INDEX IF NOT EXISTS
          customer_accounts_customer_idx
        ON customer_accounts (customer_id)
        `
      );
    })();

  return bootstrapPromise;

}

module.exports = {
  ensureCustomerAccountSchema
};
