import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";

export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.file;
    const autherId = req.id;

    if (!image) return res.status(400).json({ message: "Image required" });

    // image upload
    const optimizedImage = await sharp(image.buffer)
      .resize({ width: 800, height: 800, fit: "inside" })
      .resize("jpeg", { quality: 80 })
          .toBuffer();
      
      // buffer to data Uri

      const fileUri = `data:image/jpeg;base64,${optimizedImage.toString('base64')}`;
      const cloudResponse = await cloudinary.uploader.upload(fileUri);

      const post = await Post.create({
          caption,
          image: cloudResponse.secure_url,
          auther: autherId,
        
      })

      const user = await User.findById(autherId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }
    
    await post.populate({ path: 'author', select: '-password' })
    return res.status(201).json({
      message: "New post added",
      success: true,
      post,
    });

  } catch (error) {
    return res.status(500).json({
      message: "An error occurred during Add New Post. Please try again.",
      success: false,
    });
  }
};

// getAll Post

export const getAllPost = async (req, res) => {
    
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "auther", select: "fullName profilePicture" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: { path: "author", select: "fullName profilePicture" },
      });

    return res.status(200).json({
      message: "Posts fetched successfully",
      success: true,
      posts,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred during getting all Post. Please try again.",
      success: false,
    });
  }
}

// getUserAllPost controller

export const getUserPost = async (req, res) => {


  
  try {
    
    const authorId = req.id;
    const posts = await Post.find({ author: authorId }).sort({ createdAt: -1 }).populate({
      path: "author",
      select: 'fullName , profilePicture'
    }).populate({
      path: "comments",
      sort: { createdAt: -1 },
      populate: { path: "author", select: "fullName profilePicture" },
    })

    return res.status(200).json({
      message: "User posts fetched successfully",
      success: true,
      posts,
    });
    
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred during getting User Post. Please try again.",
      success: false,
    });
  }
}

// like Post controller

export const likePost = async (req, res) => {
  try {
    
    const likekrnewaleUserkiId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // like logic

    await post.updateOne({ $addToSet: { likes: likekrnewaleUserkiId } }).save();

    // Socket.io logic later

    return res.status(200).json({
      message: "Post liked",
      success: true,
      post
    })
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred during like the Post. Please try again.",
      success: false,
    });
  }
    
  
}



// dislike Post controller

export const dislikePost = async (req, res) => {
  try {
    
    const DislikekrnewaleUserkiId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // like logic

    await post.updateOne({ $addToSet: { likes: DislikekrnewaleUserkiId } }).save();

    // Socket.io logic later
    
    return res.status(200).json({
      message: "Post disliked",
      success: true,
      post
    })
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred during like the Post. Please try again.",
      success: false,
    });
  }
    
  
}

// comment controllers

export const addComment = async (req, res) => {
  
  try {
    
    const postId = req.params.id
    const PostCommentAuthor = req.id;
    
    const { text } = req.body;

    const post = await Post.findById(postId);
    if (!text) {
      return res.status(404).json({ message: "text is required ", success: false });
    }

    const comment = await Comment.create({
      text,
      author: PostCommentAuthor,
      post: postId,
    })

    await comment.populate({
      path: "author",
      select: "fullName profilePicture",
    })

    post.comments.push(comment._id);
    await post.save();

    return res.status(201).json({
      message: "Comment added successfully",
      success: true,
      comment,
    })
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred during Comments the Post. Please try again.",
      success: false,
    });
  }
}

export const getCommentsofPost = async (req, res) => {
  try {
    const postId = req.params.id;
    
    const comment = await Comment.find({ post: postId }).populate('author', 'fullName , profiePicture')
    if (!comment)
      return res.status(404).json({ message: "Comment not found!" });

    return res.status(200).json({
      message: "Comment fetch Successfully",
      success: true,
      comment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred during Comments in the Particular Post. Please try again.",
      success: false,
    });
  }
}

export const deletePost = async (req, res) => {
  
  try {
    const postId = req.params.id;
    const authorId = req.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // check user eligible to delete post
    if (post.author.toJSON() !== authorId) {
      return res.status(404).json({
        message: "You not Authorized",
        success: false,
      })
    }

    // delete post
    await Post.findByIdAndDelete(postId);
    // remove post from user's post list
    let user = await User.findById(authorId);

    user.posts = user.posts.filter(id => id.toString() !== postId)
    await user.save();

    await Comment.deleteMany({ post: postId });

    return res.status(200).json({
      message: "Post deleted successfully",
      success: true,
    });
  } catch (error) {
     return res.status(500).json({
       message:
         "An error occurred during Comments in the Particular Post. Please try again.",
       success: false,
     });
  }
}

export const bookmarkpost = async(req, res) => {
  try {
    const postId = req.params.id;
    const autherId = req.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const user = await User.findById(autherId);

    if (user.bookmarks.includes(post._id)) {
      // remove bookmarks

      await user.updateOne({ $pull: { bookmarks: post._id } }).save();
      return res.status(200).json({
        type:"unsaved",
        message: "Post removed from bookmarks",
        success: true,
      });
    } else {
      // add bookmarks
      await user.updateOne({ $addToSet: { bookmarks: post._id } }).save();
      return res.status(200).json({
        type :"saved",
        message: "Post added to bookmarks",
        success: true,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message:
        "An error occurred during BookMark the Post. Please try again.",
      success: false,
    });
  }
}