export default function PostCard({ post, onView, onDelete }) {
  const likes =
    typeof post.reactions === "object"
      ? post.reactions?.likes ?? 0
      : post.reactions ?? 0;

  return (
    <article className="post-card">
      <h3>{post.title}</h3>

      <div className="tags">
        {post.tags?.map((tag) => (
          <span key={tag} className="tag">
            #{tag}
          </span>
        ))}
      </div>

      <p className="reactions">👍 {likes}</p>

      <div className="actions">
        <button onClick={() => onView(post)}>View</button>
        <button className="danger" onClick={() => onDelete(post)}>
          Delete
        </button>
      </div>
    </article>
  );
}
