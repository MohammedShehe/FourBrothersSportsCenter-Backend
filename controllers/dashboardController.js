const db = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Total customers
    const [customers] = await db.query(
      "SELECT COUNT(*) AS total_customers FROM customers"
    );

    // Total products
    const [products] = await db.query(
      "SELECT COUNT(*) AS total_products FROM products"
    );

    // Total income from received orders
    const [income] = await db.query(
      "SELECT IFNULL(SUM(total_price),0) AS total_income FROM orders WHERE status = 'Imepokelewa' AND YEAR(created_at)=?",
      [currentYear]
    );

    // Total quantity of ordered products (sum of order_items for received orders)
    const [orderedProducts] = await db.query(
      `SELECT IFNULL(SUM(oi.quantity),0) AS total_ordered_products
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status = 'Imepokelewa'`
    );

    // Monthly income for the current year
    const [monthlyIncome] = await db.query(
      `SELECT MONTH(created_at) AS month, IFNULL(SUM(total_price),0) AS income
       FROM orders
       WHERE status = 'Imepokelewa' AND YEAR(created_at) = ?
       GROUP BY MONTH(created_at)
       ORDER BY MONTH(created_at)`,
      [currentYear]
    );

    // Map month numbers to names
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const formattedProgress = monthNames.map((name, index) => {
      const found = monthlyIncome.find(m => m.month === index + 1);
      return { month: name, income: found ? Number(found.income) : 0 };
    });

    res.json({
      total_customers: customers[0].total_customers,
      total_products: products[0].total_products,
      total_income: Number(income[0].total_income),
      total_ordered_products: orderedProducts[0].total_ordered_products,
      monthly_income: formattedProgress
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ message: "Hitilafu ya seva" });
  }
};