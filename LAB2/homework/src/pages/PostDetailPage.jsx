import { useEffect, useState } from "react";
import { getPostById, getPostComments } from "../services/postApi.js";

export default function PostDetailPage({ post: initialPost, onBack }) {
  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");

      const [postRes, commentsRes] = await Promise.allSettled([
        getPostById(initialPost.id),
        getPostComments(initialPost.id),
      ]);

      if (ignore) return;

      if (postRes.status === "fulfilled") {
        setPost(postRes.value);
      } else {
        setError("Could not refresh post from server; showing local data.");
      }

      setComments(
        commentsRes.status === "fulfilled" ? commentsRes.value.comments : []
      );
      setLoading(false);
    }

    load();
    return () => {
      ignore = true;
    };
  }, [initialPost.id]);

  const likes =
    typeof post.reactions === "object"
      ? post.reactions?.likes ?? 0
      : post.reactions ?? 0;

  return (
    <section className="detail">
      <button onClick={onBack}>← Back to list</button>

      <h2>{post.title}</h2>

      <div className="tags">
        {post.tags?.map((tag) => (
          <span key={tag} className="tag">
            #{tag}
          </span>
        ))}
      </div>

      <p className="body">{post.body}</p>
      <p className="reactions">👍 {likes}</p>

      <h3>Comments ({comments.length})</h3>
      {loading && <p className="status">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && comments.length === 0 && (
        <p className="status">No comments.</p>
      )}

      <ul className="comments">
        {comments.map((c) => (
          <li key={c.id}>
            <strong>{c.user?.username}</strong>: {c.body}
          </li>
        ))}
      </ul>
    </section>
  );
}
