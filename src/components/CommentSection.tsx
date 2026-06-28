import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { CommentItem } from './CommentItem';
import { Image as ImageIcon, X } from 'lucide-react';
import styles from './CommentSection.module.css';

interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  body: string;
  image_url?: string;
  created_at: string | Date;
  user_name?: string;
  user_avatar?: string;
  replies?: Comment[];
  likes_count?: number;
  has_liked?: boolean;
}

interface CommentSectionProps {
  postId: number;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [newCommentImage, setNewCommentImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch comments for post
  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/comments/${postId}`);
      setComments(response.data);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are supported.');
        return;
      }
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      try {
        const response = await axios.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setNewCommentImage(response.data.url);
      } catch (err) {
        console.error(err);
        toast.error('Failed to upload image.');
      } finally {
        setUploading(false);
      }
    }
  };

  // Create Root Comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentBody.trim()) return;

    setSubmitting(true);
    try {
      const response = await axios.post('/api/comments', {
        post_id: postId,
        body: newCommentBody,
        image_url: newCommentImage || undefined,
      });
      setNewCommentBody('');
      setNewCommentImage('');
      toast.success('Comment posted successfully!');
      // Refresh list
      fetchComments();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error posting comment.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Create Nested Reply
  const handleReplySubmit = async (body: string, parentId: number, imageUrl?: string) => {
    try {
      await axios.post('/api/comments', {
        post_id: postId,
        body,
        parent_id: parentId,
        image_url: imageUrl || undefined,
      });
      toast.success('Reply posted successfully!');
      fetchComments();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error posting reply.';
      toast.error(msg);
      throw err;
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment? This will also delete any replies.')) {
      return;
    }

    try {
      await axios.delete(`/api/comments/${commentId}`);
      toast.success('Comment deleted successfully.');
      fetchComments();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error deleting comment.';
      toast.error(msg);
    }
  };

  return (
    <section className={styles.sectionContainer} id="post-comments-section">
      <h3 className={styles.sectionTitle}>Comments ({comments.length})</h3>

      {isAuthenticated ? (
        <form onSubmit={handleCommentSubmit} className={styles.form} id="new-comment-form">
          <textarea
            className={styles.textarea}
            placeholder="Write a response... Join the discussion with focus and empathy."
            value={newCommentBody}
            onChange={(e) => setNewCommentBody(e.target.value)}
            disabled={submitting || uploading}
            required
          />
          {newCommentImage && (
            <div className="relative inline-block mt-2 mb-4">
              <img src={newCommentImage} alt="Attachment preview" className="h-20 object-contain rounded-sm border border-neutral-200" />
              <button 
                type="button" 
                onClick={() => setNewCommentImage('')} 
                className="absolute -top-2 -right-2 bg-neutral-900 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <div>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="text-neutral-400 hover:text-neutral-900 p-1 rounded-sm transition-colors"
                disabled={uploading}
                title="Attach image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
            <button 
              type="submit" 
              className={styles.btnSubmit}
              disabled={submitting || uploading || !newCommentBody.trim()}
            >
              {submitting ? 'Posting...' : uploading ? 'Uploading...' : 'Respond'}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.loginPrompt} id="comment-login-prompt">
          <p className="text-neutral-600 text-sm">
            <Link to="/login" className={styles.loginLink}>Sign in</Link> to share your perspective on this article.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6 text-sm text-neutral-400 font-mono">Loading discussions...</div>
      ) : comments.length > 0 ? (
        <div className={styles.commentsList} id="comments-list-wrapper">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={user}
              isAdmin={isAdmin}
              onDelete={handleDeleteComment}
              onReply={handleReplySubmit}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-neutral-400 py-8 text-sm italic font-mono">No discussions yet. Be the first to share your thoughts.</p>
      )}
    </section>
  );
};
