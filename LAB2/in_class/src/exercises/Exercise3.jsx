import { useEffect, useState } from "react";
import {
  fetchProductById,
  fetchProducts,
  PAGE_SIZE,
} from "../services/productApi.js";

export default function Exercise3() {
  // Danh sách sản phẩm
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  // Chi tiết sản phẩm
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Tải danh sách mỗi khi page thay đổi
  useEffect(() => {
    let ignore = false;
    setListLoading(true);
    setListError(null);

    fetchProducts(page)
      .then((data) => {
        if (ignore) return;
        setProducts(data.products);
        setTotal(data.total);
      })
      .catch((err) => {
        if (!ignore) setListError(err.message);
      })
      .finally(() => {
        if (!ignore) setListLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [page]);

  // Tải chi tiết khi chọn một sản phẩm
  useEffect(() => {
    if (selectedId === null) return;
    let ignore = false;
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);

    fetchProductById(selectedId)
      .then((data) => {
        if (!ignore) setDetail(data);
      })
      .catch((err) => {
        if (!ignore) setDetailError(err.message);
      })
      .finally(() => {
        if (!ignore) setDetailLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [selectedId]);

  const renderList = () => {
    if (listLoading) return <p className="status">Loading...</p>;
    if (listError) return <p className="error">Lỗi: {listError}</p>;
    return (
      <div className="grid">
        {products.map((p) => (
          <div
            key={p.id}
            className="card clickable"
            onClick={() => setSelectedId(p.id)}
          >
            <img className="thumb" src={p.thumbnail} alt={p.title} />
            <h3>{p.title}</h3>
            <p>${p.price}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderDetail = () => {
    if (selectedId === null) return null;
    return (
      <aside className="detail">
        <div className="detail-header">
          <h3>Chi tiết</h3>
          <button
            onClick={() => {
              setSelectedId(null);
              setDetail(null);
            }}
          >
            Close
          </button>
        </div>
        {detailLoading && <p className="status">Loading...</p>}
        {detailError && <p className="error">Lỗi: {detailError}</p>}
        {detail && (
          <>
            <img src={detail.thumbnail} alt={detail.title} />
            <h3>{detail.title}</h3>
            <p>{detail.description}</p>
            <p>
              <strong>Price:</strong> ${detail.price}
            </p>
            <p>
              <strong>Rating:</strong> {detail.rating} / 5
            </p>
            <p>
              <strong>Stock:</strong> {detail.stock}
            </p>
          </>
        )}
      </aside>
    );
  };

  return (
    <section>
      <h2>Products (DummyJSON)</h2>
      <div className="layout">
        <div className="main">
          {renderList()}
          {!listLoading && !listError && (
            <div className="pagination">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
        {renderDetail()}
      </div>
    </section>
  );
}
