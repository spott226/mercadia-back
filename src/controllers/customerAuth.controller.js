const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/db");
const {
  JWT_SECRET
} = require("../config/auth");

const CUSTOMER_JWT_EXPIRES_IN =
  process.env.CUSTOMER_JWT_EXPIRES_IN ||
  "30d";

function sanitizeText(
  value,
  maxLength = 255
){

  return String(value || "")
    .trim()
    .slice(0, maxLength);

}

function normalizePhone(value){

  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 30);

}

function buildCustomerToken(account){

  return jwt.sign(
    {
      role: "customer",
      customer_account_id:
        account.id,
      store_id:
        account.store_id,
      phone:
        account.phone
    },
    JWT_SECRET,
    {
      expiresIn:
        CUSTOMER_JWT_EXPIRES_IN
    }
  );

}

async function findStoreById(
  client,
  storeId
){

  const result =
    await client.query(
      `
      SELECT id, name, slug
      FROM stores
      WHERE id = $1
      LIMIT 1
      `,
      [storeId]
    );

  return result.rows[0] || null;

}

async function findCustomerByPhone(
  client,
  storeId,
  phone
){

  const result =
    await client.query(
      `
      SELECT *
      FROM customers
      WHERE
        store_id = $1
        AND regexp_replace(
          COALESCE(phone, ''),
          '\\D',
          '',
          'g'
        ) = $2
      ORDER BY
        total_orders DESC,
        id DESC
      LIMIT 1
      `,
      [
        storeId,
        phone
      ]
    );

  return result.rows[0] || null;

}

async function findAccountByPhone(
  client,
  storeId,
  phone
){

  const result =
    await client.query(
      `
      SELECT *
      FROM customer_accounts
      WHERE store_id = $1
      AND phone = $2
      LIMIT 1
      `,
      [
        storeId,
        phone
      ]
    );

  return result.rows[0] || null;

}

async function getCustomerOrders(
  client,
  storeId,
  phone
){

  const ordersResult =
    await client.query(
      `
      SELECT *
      FROM orders
      WHERE
        store_id = $1
        AND regexp_replace(
          COALESCE(customer_phone, ''),
          '\\D',
          '',
          'g'
        ) = $2
      ORDER BY id DESC
      `,
      [
        storeId,
        phone
      ]
    );

  const orders =
    ordersResult.rows;

  if(orders.length === 0){
    return [];
  }

  const orderIds =
    orders.map(order => order.id);

  const itemsResult =
    await client.query(
      `
      SELECT *
      FROM order_items
      WHERE order_id = ANY($1)
      ORDER BY id ASC
      `,
      [orderIds]
    );

  const itemsByOrder =
    new Map();

  for(const item of itemsResult.rows){

    const list =
      itemsByOrder.get(item.order_id) || [];

    list.push(item);

    itemsByOrder.set(
      item.order_id,
      list
    );

  }

  return orders.map(order => ({
    ...order,
    items:
      itemsByOrder.get(order.id) || []
  }));

}

exports.register = async (
  req,
  res,
  next
) => {

  const client =
    await pool.connect();

  try {

    const storeId =
      Number(req.body.store_id);

    const name =
      sanitizeText(
        req.body.name,
        120
      );

    const phone =
      normalizePhone(
        req.body.phone
      );

    const password =
      String(
        req.body.password || ""
      );

    if(!Number.isInteger(storeId)){
      return res.status(400).json({
        success: false,
        error: "store_id requerido"
      });
    }

    if(!name || !phone || !password){
      return res.status(400).json({
        success: false,
        error:
          "name, phone y password son requeridos"
      });
    }

    if(phone.length < 8){
      return res.status(400).json({
        success: false,
        error:
          "telefono invalido"
      });
    }

    if(password.length < 6){
      return res.status(400).json({
        success: false,
        error:
          "la password debe tener al menos 6 caracteres"
      });
    }

    const store =
      await findStoreById(
        client,
        storeId
      );

    if(!store){
      return res.status(404).json({
        success: false,
        error: "store not found"
      });
    }

    const existingAccount =
      await findAccountByPhone(
        client,
        storeId,
        phone
      );

    if(existingAccount){
      return res.status(409).json({
        success: false,
        error:
          "ya existe una cuenta con ese telefono"
      });
    }

    await client.query("BEGIN");

    let customer =
      await findCustomerByPhone(
        client,
        storeId,
        phone
      );

    if(customer){
      await client.query(
        `
        UPDATE customers
        SET name = $1
        WHERE id = $2
        `,
        [
          name,
          customer.id
        ]
      );
    }else{
      const customerInsert =
        await client.query(
          `
          INSERT INTO customers
          (
            store_id,
            name,
            phone,
            total_orders,
            total_spent
          )
          VALUES ($1,$2,$3,0,0)
          RETURNING *
          `,
          [
            storeId,
            name,
            phone
          ]
        );

      customer =
        customerInsert.rows[0];
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        10
      );

    const accountResult =
      await client.query(
        `
        INSERT INTO customer_accounts
        (
          store_id,
          customer_id,
          name,
          phone,
          password_hash
        )
        VALUES ($1,$2,$3,$4,$5)
        RETURNING
          id,
          store_id,
          customer_id,
          name,
          phone,
          created_at
        `,
        [
          storeId,
          customer.id,
          name,
          phone,
          passwordHash
        ]
      );

    await client.query("COMMIT");

    const account =
      accountResult.rows[0];

    const token =
      buildCustomerToken(
        account
      );

    res.status(201).json({
      success: true,
      token,
      customer: {
        ...account,
        store
      }
    });

  } catch (error) {

    await client.query("ROLLBACK");
    next(error);

  } finally {

    client.release();

  }

};

exports.login = async (
  req,
  res,
  next
) => {

  const client =
    await pool.connect();

  try {

    const storeId =
      Number(req.body.store_id);

    const phone =
      normalizePhone(
        req.body.phone
      );

    const password =
      String(
        req.body.password || ""
      );

    if(!Number.isInteger(storeId)){
      return res.status(400).json({
        success: false,
        error: "store_id requerido"
      });
    }

    if(!phone || !password){
      return res.status(400).json({
        success: false,
        error:
          "phone y password son requeridos"
      });
    }

    const account =
      await findAccountByPhone(
        client,
        storeId,
        phone
      );

    if(!account || !account.is_active){
      return res.status(401).json({
        success: false,
        error:
          "credenciales invalidas"
      });
    }

    const valid =
      await bcrypt.compare(
        password,
        account.password_hash
      );

    if(!valid){
      return res.status(401).json({
        success: false,
        error:
          "credenciales invalidas"
      });
    }

    await client.query(
      `
      UPDATE customer_accounts
      SET
        last_login_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `,
      [account.id]
    );

    const store =
      await findStoreById(
        client,
        storeId
      );

    const token =
      buildCustomerToken(
        account
      );

    res.json({
      success: true,
      token,
      customer: {
        id: account.id,
        store_id:
          account.store_id,
        customer_id:
          account.customer_id,
        name: account.name,
        phone: account.phone,
        store
      }
    });

  } catch (error) {

    next(error);

  } finally {

    client.release();

  }

};

exports.me = async (
  req,
  res,
  next
) => {

  const client =
    await pool.connect();

  try {

    const accountResult =
      await client.query(
        `
        SELECT
          ca.id,
          ca.store_id,
          ca.customer_id,
          ca.name,
          ca.phone,
          ca.created_at,
          ca.last_login_at,
          c.address,
          c.total_orders,
          c.total_spent
        FROM customer_accounts ca
        LEFT JOIN customers c
          ON c.id = ca.customer_id
        WHERE
          ca.id = $1
          AND ca.store_id = $2
        LIMIT 1
        `,
        [
          req.user.customer_account_id,
          req.user.store_id
        ]
      );

    const account =
      accountResult.rows[0];

    if(!account){
      return res.status(404).json({
        success: false,
        error:
          "cuenta no encontrada"
      });
    }

    const store =
      await findStoreById(
        client,
        req.user.store_id
      );

    res.json({
      success: true,
      customer: {
        ...account,
        store
      }
    });

  } catch (error) {

    next(error);

  } finally {

    client.release();

  }

};

exports.getMyOrders = async (
  req,
  res,
  next
) => {

  const client =
    await pool.connect();

  try {

    const orders =
      await getCustomerOrders(
        client,
        req.user.store_id,
        req.user.phone
      );

    res.json({
      success: true,
      orders
    });

  } catch (error) {

    next(error);

  } finally {

    client.release();

  }

};
