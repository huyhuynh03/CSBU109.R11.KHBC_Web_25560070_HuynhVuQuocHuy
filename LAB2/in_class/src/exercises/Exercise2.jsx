import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard.jsx";
import { fakeFetchProducts } from "../data/products.js";

export default function Exercise2() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]); // [{ id, name, price, quantity }]

  // Tải dữ liệu khi component mount
  useEffect(() => {
    let active = true;
    fakeFetchProducts().then((data) => {
      if (active) {
        setProducts(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Tổng số lượng sản phẩm trong giỏ -> hiển thị trên tiêu đề trang
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  useEffect(() => {
    document.title = `Cart (${cartCount})`;
  }, [cartCount]);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((p) => p.category))],
    [products]
  );

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.trim().toLowerCase()) &&
      (category === "All" || p.category === category)
  );

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (loading) {
    return <p className="status">Loading...</p>;
  }

  return (
    <section>
      <h2>Shop</h2>

      <div className="layout">
        <div className="main">
          <div className="controls">
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                name={p.name}
                price={p.price}
                inStock={p.inStock}
              >
                <button onClick={() => addToCart(p)} disabled={!p.inStock}>
                  Add to cart
                </button>
              </ProductCard>
            ))}
          </div>
          {filtered.length === 0 && <p className="status">Không có sản phẩm phù hợp.</p>}
        </div>

        <aside className="cart">
          <h3>Cart</h3>
          {cart.length === 0 && <p className="status">Giỏ hàng trống</p>}
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <span>
                {item.name} × {item.quantity}
                <br />
                {(item.price * item.quantity).toLocaleString()} USD
              </span>
              <button onClick={() => removeFromCart(item.id)}>Remove</button>
            </div>
          ))}
          <p>
            <strong>Total: {total.toLocaleString()} USD</strong>
          </p>
        </aside>
      </div>
    </section>
  );
}
