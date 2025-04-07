import mongoose from "mongoose";
import { IPost } from "../interfaces";
import { Post } from "../entities";
import { logger } from "../services";

// Get Posts with Filters
export const getPosts = async (filter: object): Promise<IPost[]> => {
  try {
    const posts = await Post.find({ isDeleted: false, ...filter })
      .populate("postedBy") // Populate the postedBy field (user data)
      .populate("retweetData")
      .populate("replyTo")
      .sort({ createdAt: -1 })
      .exec();
    return posts || []; // Ensure an empty array is returned if no posts are found
  } catch (error) {
    logger.error(`Error fetching posts: ${error}`);
    return []; // Return empty array in case of error
  }
};

// Get a single Post by ID
export const getPostById = async (postId: string): Promise<IPost | null> => {
  try {
    const post = await Post.findOne({ _id: postId, isDeleted: false })
      .populate("postedBy")
      .populate("retweetData")
      .populate("replyTo")
      .exec();
    return post || null; // Ensure null is returned if post is not found
  } catch (error) {
    logger.error(`Error fetching post by ID: ${error}`);
    return null; // Return null in case of error
  }
};

// Create Post
export const createPost = async (data: Partial<IPost>): Promise<IPost> => {
  try {
    return await Post.create(data);
  } catch (error) {
    logger.error(`Error creating post: ${error}`);
    throw error;
  }
};

// Like/Unlike a Post
export const toggleLikePost = async (
  postId: string,
  userId: string
): Promise<IPost | null> => {
  try {
    const post = await Post.findById(postId);
    if (!post || post.isDeleted) return null; // If post doesn't exist or is deleted, return null

    const isLiked = post.likes.includes(new mongoose.Types.ObjectId(userId));
    const option = isLiked ? "$pull" : "$addToSet"; // Toggle like using $pull and $addToSet

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { [option]: { likes: new mongoose.Types.ObjectId(userId) } }, // Add/remove the userId
      { new: true }
    ).populate("postedBy"); // Populate postedBy with user data for username

    return updatedPost;
  } catch (error) {
    logger.error(`Error toggling like on post: ${error}`);
    return null;
  }
};

// Retweet a Post
export const retweetPost = async (
  postId: string,
  userId: string
): Promise<{ post: IPost | null; deleted?: boolean }> => {
  try {
    const deletedPost = await Post.findOneAndDelete({
      postedBy: userId,
      retweetData: postId,
    });

    if (deletedPost) {
      return { post: deletedPost, deleted: true };
    }

    const repost = await Post.create({
      postedBy: userId,
      retweetData: postId,
      retweetUsers: userId,
    });

    await repost.populate("postedBy"); // Populate postedBy to include user data

    return { post: repost, deleted: false };
  } catch (error) {
    logger.error(`Error retweeting post: ${error}`);
    return { post: null }; // Return null if there is an error
  }
};

// Soft Delete a Post
export const deletePost = async (postId: string): Promise<boolean> => {
  try {
    const post = await Post.findById(postId);
    if (!post) return false;

    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();
    return true;
  } catch (error) {
    logger.error(`Error deleting post: ${error}`);
    return false;
  }
};

// Pin/Unpin a Post
export const pinPost = async (
  postId: string,
  userId: string,
  pinned: boolean
): Promise<void> => {
  try {
    await Post.updateMany({ postedBy: userId }, { pinned: false });
    await Post.findByIdAndUpdate(postId, { pinned });
  } catch (error) {
    logger.error(`Error pinning post: ${error}`);
    return;
  }
};
