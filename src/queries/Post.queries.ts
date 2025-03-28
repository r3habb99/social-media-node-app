import mongoose from "mongoose";
import { IPost } from "../interfaces";
import { Post } from "../entities";
import { logger } from "../services";

// Get Posts with Filters
export const getPosts = async (filter: object): Promise<IPost[]> => {
  try {
    return await Post.find({ isDeleted: false, ...filter })
      .populate("postedBy")
      .populate("retweetData")
      .populate("replyTo")
      .sort({ createdAt: -1 })
      .exec();
  } catch (error) {
    logger.error(`Error fetching posts: ${error}`);
    return [];
  }
};

// Get a single Post by ID
export const getPostById = async (postId: string): Promise<IPost | null> => {
  try {
    return await Post.findOne({ _id: postId, isDeleted: false })
      .populate("postedBy")
      .populate("replyTo")
      .populate("retweetData")
      .exec();
  } catch (error) {
    logger.error(`Error fetching post by ID: ${error}`);
    return null;
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
    if (!post || post.isDeleted) return null;

    const isLiked = post.likes.includes(new mongoose.Types.ObjectId(userId));
    const option = isLiked ? "$pull" : "$addToSet";

    return await Post.findByIdAndUpdate(
      postId,
      { [option]: { likes: userId } },
      { new: true }
    );
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

    const repost = await Post.create({ postedBy: userId, retweetData: postId });
    return { post: repost, deleted: false };
  } catch (error) {
    logger.error(`Error retweeting post: ${error}`);
    return { post: null };
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
