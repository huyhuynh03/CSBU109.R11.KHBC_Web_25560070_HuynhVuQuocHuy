import { useEffect, useState } from "react";
import PostCard from "../components/PostCard.jsx";
import PostForm from "../components/PostForm.jsx";
import useDebounce from "../hooks/useDebounce.js";
import {
  addPost,
  deletePost,
  getPosts,
  searchPosts,
} from "../services/postApi.js";

const PAGE_SIZE = 10;

export default function PostListPage({ onView }) {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query.trim(), 400);
  const searching = debouncedQuery !== "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Tải danh sách (phân trang hoặc tìm kiếm)
  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = searching
          ? await searchPosts(debouncedQuery)
          : await getPosts({ limit: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE });
        if (!ignore) {
          setPosts(data.posts);
          setTotal(data.total);
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [page, debouncedQuery]);

  function handleQueryChange(e) {
    setQuery(e.target.value);
    setPage(1);
  }

  // Server không lưu POST -> tự cập nhật state bằng phản hồi từ server
  async function handleAdd(newPost) {
    const created = await addPost(newPost);
    if (!searching) {
      if (page === 1) {
        setPosts((prev) => [created, ...prev].slice(0, PAGE_SIZE));
      }
      setTotal((t) => t + 1);
    }
  }

  async function handleDelete(post) {
    if (!window.confirm(`Delete "${post.title}"?`)) return;

    try {
      const result = await deletePost(post.id);
      if (result.isDeleted) {
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
        setTotal((t) => t - 1);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <PostForm onSubmit={handleAdd} />

      <input
        className="search"
        type="text"
        placeholder="Search posts..."
        value={query}
        onChange={handleQueryChange}
      />

      {loading && <p className="status">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p className="status">No posts found.</p>
      )}

      <div className="post-list">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onView={onView}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {!searching && (
        <div className="pagination">
          <button
            disabled={page === 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
