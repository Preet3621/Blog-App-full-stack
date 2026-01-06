import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../services/api';

export default function PostCard({ post, onDelete, onLike, onCommentAdded }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAuthor = user && post.author._id === user.id;

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await postAPI.comment(post._id, commentText);
      setCommentText('');
      onCommentAdded(); // Refresh posts to show new comment
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {post.image && (
        <img src={`http://localhost:3000${post.image}`} alt={post.title} className="w-full h-64 object-cover" />
      )}
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
        <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>
        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
          <span>By {post.author.username}</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <button onClick={() => onLike(post._id)} className="text-red-500 text-xl hover:text-red-700">
              ❤️ {post.likes.length}
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="text-blue-500 text-xl hover:text-blue-700 cursor-pointer"
            >
              💬 {post.comments.length}
            </button>
          </div>
          <Link to={`/post/${post._id}`} className="text-blue-600 hover:underline">Read More →</Link>
        </div>

        {/* Expandable Comments Section */}
        {showComments && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-4">Comments</h4>

            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !commentText.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {isSubmitting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="mb-4 text-sm text-gray-600">
                <Link to="/login" className="text-blue-600 underline">Log in</Link> to comment.
              </p>
            )}

            {/* Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {post.comments.length === 0 ? (
                <p className="text-gray-500 italic text-sm">No comments yet.</p>
              ) : (
                post.comments.map((comment) => (
                  <div key={comment._id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <strong className="text-sm">{comment.user.username}</strong>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {isAuthor && (
          <div className="mt-4 flex gap-2">
            <Link
              to={`/edit/${post._id}`}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              Edit
            </Link>
            <button
              onClick={() => onDelete(post._id)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}