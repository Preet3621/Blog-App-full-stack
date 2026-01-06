import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function EditPost() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [currentImage, setCurrentImage] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();
    const { id } = useParams();

    // Fetch existing post data
    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await postAPI.getById(id);
                const post = res.data;

                // Check if user is the author
                if (user.id !== post.author._id) {
                    setError('You are not authorized to edit this post');
                    setTimeout(() => navigate('/'), 2000);
                    return;
                }

                setTitle(post.title);
                setContent(post.content);
                setCurrentImage(post.image || '');
            } catch (err) {
                setError('Failed to load post');
                setTimeout(() => navigate('/'), 2000);
            } finally {
                setFetchLoading(false);
            }
        };

        if (user) {
            fetchPost();
        } else {
            navigate('/login');
        }
    }, [id, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        if (image) formData.append('image', image);

        try {
            await postAPI.update(id, formData);
            navigate(`/post/${id}`);
        } catch (err) {
            setError('Failed to update post');
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return <p className="text-center mt-20 text-xl">Loading post...</p>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-4xl font-bold mb-8">Edit Post</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-6">
                <input
                    type="text"
                    placeholder="Post Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-4 border rounded-lg text-xl"
                    required
                />
                <textarea
                    placeholder="Write your content here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows="10"
                    className="w-full p-4 border rounded-lg"
                    required
                />

                {/* Show current image if exists */}
                {currentImage && !image && (
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Current Image:</p>
                        <img
                            src={`http://localhost:3000${currentImage}`}
                            alt="Current post"
                            className="max-h-48 rounded-lg object-cover"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm text-gray-700 mb-2">
                        {currentImage ? 'Upload new image (optional)' : 'Upload image (optional)'}
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files[0])}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Updating...' : 'Update Post'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/post/${id}`)}
                        className="bg-gray-500 text-white py-3 px-8 rounded-lg hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditPost;
