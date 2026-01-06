import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { postAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PostDetail() {
  const { id } = useParams(); // Get post ID from URL
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch the post when component mounts
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await postAPI.getById(id);
        setPost(res.data);
      } catch (err) {
        setError('Post not found or failed to load');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // Handle Like
  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await postAPI.like(id);
      setPost(prev => ({
        ...prev,
        likes: prev.likes.includes(user.id)
          ? prev.likes.filter(l => l !== user.id)
          : [...prev.likes, user.id]
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Comment
  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!commentText.trim()) return;

    setCommentLoading(true);
    try {
      await postAPI.comment(id, commentText);
      // Refresh post to get updated comments
      const res = await postAPI.getById(id);
      setPost(res.data);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  // Handle Delete (only for author)
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await postAPI.delete(id);
      navigate('/');
    } catch (err) {
      alert('Failed to delete post');
    }
  };

  if (loading) return <p className="text-center mt-20 text-xl">Loading post...</p>;
  if (error) return <p className="text-center mt-20 text-red-600 text-xl">{error}</p>;
  if (!post) return null;

  const isAuthor = user && post.author._id === user.id;
  const hasLiked = user && post.likes.includes(user.id);

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8">
      {/* Post Image */}
      {post.image && (
        <img
          src={`http://localhost:3000${post.image}`}
          alt={post.title}
          className="w-full rounded-lg shadow-lg mb-8 object-cover max-h-96"
        />
      )}

      {/* Title & Metadata */}
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      <div className="flex items-center justify-between text-gray-600 mb-8">
        <div className="flex items-center gap-4">
          <span>By <strong>{post.author.username}</strong></span>
          <span>•</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        {isAuthor && (
          <div className="flex gap-3">
            <Link
              to={`/edit/${post._id}`}
              className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition font-medium"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition font-medium"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="prose max-w-none mb-12 text-lg leading-relaxed text-gray-800">
        <p>{post.content}</p>
      </div>

      {/* Likes */}
      <div className="flex items-center gap-4 mb-12 pb-8 border-b">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition ${hasLiked
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
        >
          ❤️ {post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}
        </button>
      </div>

      {/* Comments Section */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold mb-6">
          Comments ({post.comments.length})
        </h3>

        {/* Add Comment Form */}
        {user ? (
          <form onSubmit={handleComment} className="mb-10 flex gap-4">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={commentLoading}
            />
            <button
              type="submit"
              disabled={commentLoading || !commentText.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {commentLoading ? 'Posting...' : 'Post'}
            </button>
          </form>
        ) : (
          <p className="mb-8 text-gray-600">
            <Link to="/login" className="text-blue-600 underline">Log in</Link> to comment.
          </p>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {post.comments.length === 0 ? (
            <p className="text-gray-500 italic">No comments yet. Be the first!</p>
          ) : (
            post.comments.map((comment) => (
              <div key={comment._id} className="bg-gray-50 p-5 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <strong>{comment.user.username}</strong>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p>{comment.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}