import mongoose from "mongoose";
import { IPost } from "../interfaces";
import { Post } from "../entities";
import { logger } from "../services";
import { getFullMediaUrl } from "../utils/mediaUrl";

/**
 * Helper function to transform media URLs in a post to full URLs
 */
const transformPostMediaUrls = (post: IPost | null): IPost | null => {
  if (!post) return null;

  // Create a new object to avoid modifying the original
  const postObj = post.toObject();

  // Transform media URLs if they exist
  if (postObj.media && Array.isArray(postObj.media)) {
    postObj.media = postObj.media.map((url: string) => getFullMediaUrl(url));
  }

  // Transform media URLs in retweetData if it exists
  if (postObj.retweetData && postObj.retweetData.media && Array.isArray(postObj.retweetData.media)) {
    postObj.retweetData.media = postObj.retweetData.media.map((url: string) => getFullMediaUrl(url));
  }

  // Transform media URLs in replyTo if it exists
  if (postObj.replyTo && postObj.replyTo.media && Array.isArray(postObj.replyTo.media)) {
    postObj.replyTo.media = postObj.replyTo.media.map((url: string) => getFullMediaUrl(url));
  }

  return postObj as unknown as IPost;
};

/**
 * Helper function to transform media URLs in an array of posts
 */
const transformPostsMediaUrls = (posts: IPost[]): IPost[] => {
  return posts.map(post => transformPostMediaUrls(post)).filter(Boolean) as IPost[];
};

// Get Posts with Filters
export const getPosts = async (filter: object): Promise<IPost[]> => {
  try {
    const posts = await Post.find({ isDeleted: false, ...filter })
      .populate("postedBy") // Populate the postedBy field (user data)
      .populate("retweetData")
      .populate("replyTo")
      .sort({ createdAt: -1 })
      .exec();

    // Transform media URLs to full URLs
    return transformPostsMediaUrls(posts || []);
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

    // Transform media URLs to full URLs
    return transformPostMediaUrls(post);
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
    )
    .populate("postedBy") // Populate postedBy with user data for username
    .populate("retweetData")
    .populate("replyTo");

    // Transform media URLs to full URLs
    return transformPostMediaUrls(updatedPost);
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
      // Transform media URLs in the deleted post
      return { post: transformPostMediaUrls(deletedPost), deleted: true };
    }

    const repost = await Post.create({
      postedBy: userId,
      retweetData: postId,
      retweetUsers: userId,
    });

    // Populate the repost with related data
    await repost.populate("postedBy"); // Populate postedBy to include user data
    await repost.populate("retweetData");

    // Transform media URLs in the repost
    return { post: transformPostMediaUrls(repost), deleted: false };
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

// Update a Post
export const updatePost = async (
  postId: string,
  userId: string,
  updateData: Partial<IPost>
): Promise<IPost | null> => {
  try {
    // Find the post and verify ownership
    const post = await Post.findOne({
      _id: postId,
      postedBy: userId,
      isDeleted: false
    });

    if (!post) {
      logger.error(`Post not found or user does not have permission to update`);
      return null;
    }

    // Update only allowed fields
    if (updateData.content !== undefined) {
      post.content = updateData.content;
    }

    if (updateData.media !== undefined) {
      post.media = updateData.media;
    }

    if (updateData.mediaType !== undefined) {
      post.mediaType = updateData.mediaType;
    }

    if (updateData.visibility !== undefined) {
      post.visibility = updateData.visibility;
    }

    // Save the updated post
    await post.save();

    // Return the updated post with populated fields
    const updatedPost = await Post.findById(postId)
      .populate("postedBy")
      .populate("retweetData")
      .populate("replyTo");

    // Transform media URLs to full URLs
    return transformPostMediaUrls(updatedPost);
  } catch (error) {
    logger.error(`Error updating post: ${error}`);
    return null;
  }
};
