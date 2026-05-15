const pool = require("../db/db");


// =========================
// CREAR PEDIDO
// =========================

exports.createOrder = async (req, res, next) => {
  const client = await pool.connect();

  try {

    const {
      customer_name,
      customer_phone,
      customer_address,
      items
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        error: "No hay productos"
      });
    }

    await client.query("BEGIN");

    // =========================
    // CREAR ORDER
    // =========================

    const orderResult = await client.query(
      `
      INSERT INTO orders (
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

    const order = orderResult.rows[0];

    let total = 0;

    // =========================
    // INSERTAR ITEMS
    // =========================

    for (const item of items) {

      const variantResult = await client.query(
        `
        SELECT pv.*, p.name
        FROM product_variants pv
        JOIN products p ON p.id = pv.product_id
        WHERE pv.id = $1
        `,
        [item.variant_id]
      );

      const variant = variantResult.rows[0];

      if (!variant) {
        throw new Error("Variante no encontrada");
      }

      const subtotal =
        Number(variant.price) * Number(item.quantity);

      total += subtotal;

      await client.query(
        `
        INSERT INTO order_items (
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

    // =========================
    // ACTUALIZAR TOTAL
    // =========================

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
      order_id: order.id
    });

  } catch (err) {

    await client.query("ROLLBACK");
    next(err);

  } finally {

    client.release();

  }
};


// =========================
// CONFIRMAR PEDIDO
// =========================

exports.confirmOrder = async (req, res, next) => {

  const client = await pool.connect();

  try {

    const orderId = req.params.id;

    await client.query("BEGIN");

    // =========================
    // OBTENER PEDIDO
    // =========================

    const orderResult = await client.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1
      `,
      [orderId]
    );

    const order = orderResult.rows[0];

    if (!order) {
      throw new Error("Pedido no encontrado");
    }

    if (order.status === "CONFIRMED") {
      throw new Error("Pedido ya confirmado");
    }

    // =========================
    // OBTENER ITEMS
    // =========================

    const itemsResult = await client.query(
      `
      SELECT *
      FROM order_items
      WHERE order_id = $1
      `,
      [orderId]
    );

    const items = itemsResult.rows;

    // =========================
    // VALIDAR STOCK
    // =========================

    for (const item of items) {

      const variantResult = await client.query(
        `
        SELECT *
        FROM product_variants
        WHERE id = $1
        `,
        [item.variant_id]
      );

      const variant = variantResult.rows[0];

      if (variant.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para variante ${variant.id}`
        );
      }

      const previousStock = variant.stock;
      const newStock =
        previousStock - item.quantity;

      // =========================
      // DESCONTAR STOCK
      // =========================

      await client.query(
        `
        UPDATE product_variants
        SET stock = $1
        WHERE id = $2
        `,
        [newStock, variant.id]
      );

      // =========================
      // MOVIMIENTO INVENTARIO
      // =========================

      await client.query(
        `
        INSERT INTO inventory_movements (
          variant_id,
          type,
          quantity,
          previous_stock,
          new_stock,
          reference_type,
          reference_id,
          notes
        )
        VALUES (
          $1,
          'SALE',
          $2,
          $3,
          $4,
          'ORDER',
          $5,
          $6
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

    // =========================
    // CONFIRMAR PEDIDO
    // =========================

    await client.query(
      `
      UPDATE orders
      SET status = 'CONFIRMED'
      WHERE id = $1
      `,
      [order.id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Pedido confirmado"
    });

  } catch (err) {

    await client.query("ROLLBACK");
    next(err);

  } finally {

    client.release();

  }
};