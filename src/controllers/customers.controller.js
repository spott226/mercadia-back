const pool = require("../db/db");


/* =========================
GET CUSTOMERS ERP
========================= */

exports.getCustomers = async (
  req,
  res,
  next
) => {

  try {

    const result =
      await pool.query(
        `
        SELECT *

        FROM customers

        ORDER BY
        total_spent DESC,
        total_orders DESC,
        id DESC
        `
      );

    const customers =
      result.rows;


    /* =========================
    HISTORIAL PEDIDOS
    ========================= */

    for (const customer of customers) {

      const ordersResult =
        await pool.query(
          `
          SELECT *

          FROM orders

          WHERE
          customer_phone = $1

          ORDER BY id DESC
          `,
          [customer.phone]
        );

      customer.orders =
        ordersResult.rows;

    }


    /* =========================
    KPIS
    ========================= */

    const totalCustomers =
      customers.length;

    const totalRevenue =
      customers.reduce(
        (acc,c)=>
          acc +
          Number(
            c.total_spent || 0
          ),
        0
      );

    const frequentCustomers =
      customers.filter(
        c =>
          Number(
            c.total_orders
          ) >= 2
      ).length;


    res.json({

      success: true,

      kpis: {

        totalCustomers,

        totalRevenue,

        frequentCustomers

      },

      customers

    });

  } catch (err) {

    next(err);

  }

};