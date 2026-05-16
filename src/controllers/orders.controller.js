const pool = require("../db/db");


/* =========================
CREAR PEDIDO
========================= */

exports.createOrder = async (
  req,
  res,
  next
) => {

  const client =
    await pool.connect();

  try {

    const {

      customer_name,

      customer_phone,

      customer_address,

      items

    } = req.body;

    if (
      !items ||
      items.length === 0
    ) {

      return res.status(400).json({
        error: "No hay productos"
      });

    }

    await client.query("BEGIN");


    /* =========================
    VALIDACIÓN AUTH (FIX REAL)
    ========================= */

    const store_id = req.body.store_id;

if (!store_id) {

  return res.status(400).json({
    error: "store_id requerido"
  });

}


    /* =========================
    CREAR ORDER
    ========================= */

    const orderResult =
      await client.query(
        `
        INSERT INTO orders
        (
          customer_name,
          customer_phone,
          customer_address,
          status
        )
        VALUES ($1,$2,$3,'PENDING')
        RETURNING *
        `,
        [
          customer_name,
          customer_phone,
          customer_address
        ]
      );

    const order =
      orderResult.rows[0];

    let total = 0;

    /* =========================
CUSTOMER ERP
========================= */

    let customer = null;

    const customerResult =
      await client.query(
        `
        SELECT *
        FROM customers
        WHERE phone = $1
          AND store_id = $2
        LIMIT 1
        `,
        [
          customer_phone,
          store_id
        ]
      );

    customer =
      customerResult.rows[0];


    /* =========================
    INSERTAR ITEMS
    ========================= */

    for (const item of items) {

      const variantResult =
        await client.query(
          `
          SELECT pv.*, p.name
          FROM product_variants pv
          JOIN products p
          ON p.id = pv.product_id
          WHERE pv.id = $1
          `,
          [item.variant_id]
        );

      const variant =
        variantResult.rows[0];

      if (!variant) {

        throw new Error(
          "Variante no encontrada"
        );

      }

      const subtotal =
        Number(variant.price)
        * Number(item.quantity);

      total += subtotal;

      await client.query(
        `
        INSERT INTO order_items
        (
          order_id,
          variant_id,
          product_name,
          variant_name,
          quantity,
          price,
          subtotal
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,
        [
          order.id,

          variant.id,

          variant.name,

          `${variant.color} / ${variant.size}`,

          item.quantity,

          variant.price,

          subtotal
        ]
      );

    }


    /* =========================
CUSTOMERS ERP
========================= */

    if (customer) {

      await client.query(
        `
        UPDATE customers
        SET

          total_orders =
            total_orders + 1,

          total_spent =
            total_spent + $1,

          address =
            COALESCE($2,address)

        WHERE id = $3
        `,
        [
          total,
          customer_address,
          customer.id
        ]
      );

    } else {

      await client.query(
        `
        INSERT INTO customers
        (
          store_id,
          name,
          phone,
          address,
          total_orders,
          total_spent
        )
        VALUES
        (
          $1,$2,$3,$4,$5,$6
        )
        `,
        [
          store_id,
          customer_name,
          customer_phone,
          customer_address,
          1,
          total
        ]
      );

    }


    /* =========================
    ACTUALIZAR TOTAL
    ========================= */

    await client.query(
      `
      UPDATE orders
      SET
        subtotal = $1,
        total = $1
      WHERE id = $2
      `,
      [total, order.id]
    );

    await client.query("COMMIT");

    res.json({

      success: true,

      order_id: order.id,

      status: "PENDING"

    });

  } catch (err) {

    await client.query("ROLLBACK");

    next(err);

  } finally {

    client.release();

  }

};


/* =========================
LISTAR PEDIDOS ERP
========================= */

exports.getOrders = async (
  req,
  res,
  next
) => {

  try {

    const result =
      await pool.query(
        `
        SELECT *
        FROM orders
        ORDER BY id DESC
        `
      );

    const orders =
      result.rows;


    for (const order of orders) {

      const itemsResult =
        await pool.query(
          `
          SELECT *
          FROM order_items
          WHERE order_id = $1
          `,
          [order.id]
        );

      order.items =
        itemsResult.rows;

    }

    res.json(orders);

  } catch (err) {

    next(err);

  }

};


/* =========================
ACTUALIZAR STATUS ERP
========================= */

exports.updateOrderStatus = async (
  req,
  res,
  next
) => {

  const client =
    await pool.connect();

  try {

    const orderId =
      req.params.id;

    const { status } =
      req.body;

    if (
      ![
        "PENDING",
        "PAID",
        "CANCELLED"
      ].includes(status)
    ) {

      return res.status(400).json({
        error: "Status inválido"
      });

    }

    await client.query("BEGIN");


    const orderResult =
      await client.query(
        `
        SELECT *
        FROM orders
        WHERE id = $1
        `,
        [orderId]
      );

    const order =
      orderResult.rows[0];

    if (!order) {

      throw new Error(
        "Pedido no encontrado"
      );

    }

    const currentStatus =
      order.status;


    if (currentStatus === status) {

      throw new Error(
        `Pedido ya está en estado ${status}`
      );

    }


    const itemsResult =
      await client.query(
        `
        SELECT *
        FROM order_items
        WHERE order_id = $1
        `,
        [orderId]
      );

    const items =
      itemsResult.rows;


    if (
      currentStatus !== "PAID"
      &&
      status === "PAID"
    ) {

      for (const item of items) {

        const variantResult =
          await client.query(
            `
            SELECT *
            FROM product_variants
            WHERE id = $1
            `,
            [item.variant_id]
          );

        const variant =
          variantResult.rows[0];

        if (!variant) {
          throw new Error("Variante no encontrada");
        }

        if (
          Number(variant.stock)
          < Number(item.quantity)
        ) {

          throw new Error(
            `Stock insuficiente para variante ${variant.id}`
          );

        }

        const previousStock =
          Number(variant.stock);

        const newStock =
          previousStock - Number(item.quantity);

        await client.query(
          `
          UPDATE product_variants
          SET stock = $1
          WHERE id = $2
          `,
          [newStock, variant.id]
        );

        await client.query(
          `
          INSERT INTO inventory_movements
          (
            variant_id,
            type,
            quantity,
            previous_stock,
            new_stock,
            reference_type,
            reference_id,
            notes
          )
          VALUES
          (
            $1,'SALE',$2,$3,$4,'ORDER',$5,$6
          )
          `,
          [
            variant.id,
            item.quantity,
            previousStock,
            newStock,
            order.id,
            `Venta pedido #${order.id}`
          ]
        );

      }

    }


    if (
      currentStatus === "PAID"
      &&
      status === "CANCELLED"
    ) {

      for (const item of items) {

        const variantResult =
          await client.query(
            `
            SELECT *
            FROM product_variants
            WHERE id = $1
            `,
            [item.variant_id]
          );

        const variant =
          variantResult.rows[0];

        const previousStock =
          Number(variant.stock);

        const newStock =
          previousStock + Number(item.quantity);

        await client.query(
          `
          UPDATE product_variants
          SET stock = $1
          WHERE id = $2
          `,
          [newStock, variant.id]
        );

        await client.query(
          `
          INSERT INTO inventory_movements
          (
            variant_id,
            type,
            quantity,
            previous_stock,
            new_stock,
            reference_type,
            reference_id,
            notes
          )
          VALUES
          (
            $1,'CANCELLED_ORDER',$2,$3,$4,'ORDER',$5,$6
          )
          `,
          [
            variant.id,
            item.quantity,
            previousStock,
            newStock,
            order.id,
            `Cancelación pedido #${order.id}`
          ]
        );

      }

    }


    await client.query(
      `
      UPDATE orders
      SET status = $1
      WHERE id = $2
      `,
      [status, order.id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: `Pedido actualizado a ${status}`
    });

  } catch (err) {

    await client.query("ROLLBACK");

    next(err);

  } finally {

    client.release();

  }

};


/* =========================
CANCELAR PEDIDO
========================= */

exports.cancelOrder = async (
  req,
  res,
  next
) => {

  req.body.status = "CANCELLED";

  return exports.updateOrderStatus(req, res, next);

};