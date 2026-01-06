import Post from '../models/Post.js';
import path from 'path';
import fs from 'fs';

class PostController {
  async createPost(req, res) {
    const { title, content } = req.body;
    const author = req.user.id;
    let image = null;

    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    try {
      const post = new Post({ title, content, image, author });
      await post.save();
      res.json(post);
    } catch (err) {
      res.status(500).json({ msg: 'Server error' });
    }
  }

  async getPosts(req, res) {
    try {
      // Extract query parameters with defaults
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Build search query
      const searchQuery = search
        ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } }
          ]
        }
        : {};

      // Get total count for pagination metadata
      const totalPosts = await Post.countDocuments(searchQuery);
      const totalPages = Math.ceil(totalPosts / limit);

      // Fetch posts with pagination
      const posts = await Post.find(searchQuery)
        .populate('author', 'username email')
        .populate('comments.user', 'username')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(); // Use lean() for better performance

      // Return response with pagination metadata
      res.json({
        success: true,
        data: posts,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts,
          postsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    } catch (err) {
      console.error('❌ Get Posts Error:', err);
      res.status(500).json({
        success: false,
        msg: 'Server error',
        error: err.message
      });
    }
  }
  async getPostById(req, res) {
    try {
      const post = await Post.findById(req.params.id).populate('author', 'username').populate('comments.user', 'username');
      if (!post) return res.status(404).json({ msg: 'Post not found' });
      res.json(post);
    } catch (err) {
      res.status(500).json({ msg: 'Server error' });
    }
  }

  async updatePost(req, res) {
    const { title, content } = req.body;
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ msg: 'Post not found' });
      if (post.author.toString() !== req.user.id) return res.status(401).json({ msg: 'Unauthorized' });

      post.title = title || post.title;
      post.content = content || post.content;

      if (req.file) {
        // Delete old image if exists
        if (post.image) {
          fs.unlinkSync(path.join(process.cwd(), post.image));
        }
        post.image = `/uploads/${req.file.filename}`;
      }

      await post.save();
      res.json(post);
    } catch (err) {
      res.status(500).json({ msg: 'Server error' });
    }
  }

  async deletePost(req, res) {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ msg: 'Post not found' });
      if (post.author.toString() !== req.user.id) return res.status(401).json({ msg: 'Unauthorized' });

      if (post.image) {
        fs.unlinkSync(path.join(process.cwd(), post.image));
      }

      await post.deleteOne();
      return res.json({ msg: 'Post deleted' });
    } catch (err) {
      res.status(500).json({ msg: 'Server error' });
    }
  }

  async likePost(req, res) {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ msg: 'Post not found' });

      if (post.likes.includes(req.user.id)) {
        post.likes = post.likes.filter(id => id.toString() !== req.user.id);
      } else {
        post.likes.push(req.user.id);
      }

      await post.save();
      res.json({ likes: post.likes.length });
    } catch (err) {
      res.status(500).json({ msg: 'Server error' });
    }
  }

  async commentOnPost(req, res) {
    const { text } = req.body;
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ msg: 'Post not found' });

      post.comments.push({ user: req.user.id, text });
      await post.save();

      const updatedPost = await Post.findById(req.params.id).populate('comments.user', 'username');
      res.json(updatedPost.comments);
    } catch (err) {
      res.status(500).json({ msg: 'Server error' });
    }
  }
}

export default new PostController();