import React, { useState } from 'react';
import { MessageSquare, Trash2, Heart, Maximize2, X, Image as ImageIcon } from 'lucide-react';
import styles from './CommentSection.module.css';
import axios from 'axios';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  role: 'user' | 'admin';
}

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

interface CommentItemProps {
  comment: Comment;
  currentUser: User | null;
  isAdmin: boolean;
  onDelete: (id: number) => void;
  onReply: (body: string, parentId: number, imageUrl?: string) => Promise<void>;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  isAdmin,
  onDelete,
  onReply,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(comment.has_liked || false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [replyImage, setReplyImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const replyFileInputRef = React.useRef<HTMLInputElement>(null);

  const formattedDate = new Date(comment.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleReplyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setReplyImage(response.data.url);
      } catch (err) {
        console.error(err);
        toast.error('Failed to upload image.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;

    setSubmitting(true);
    try {
      await onReply(replyBody, comment.id, replyImage);
      setReplyBody('');
      setReplyImage('');
      setIsReplying(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    try {
      if (!currentUser) {
        toast.error('Please log in to like comments.');
        return;
      }
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/comments/${comment.id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch (err) {
      console.error(err);
      toast.error('Failed to toggle like.');
    }
  };

  const isOwner = currentUser?.id === comment.user_id;
  const canDelete = isOwner || isAdmin;

  return (
    <div className={styles.commentItem} id={`comment-${comment.id}`}>
      <div className={styles.commentHeader}>
        <div className={styles.commenterInfo}>
          <img 
            src={comment.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'} 
            alt={comment.user_name} 
            className={styles.avatar}
            referrerPolicy="no-referrer"
          />
          <div>
            <span className={styles.name}>{comment.user_name}</span>
            <div className={styles.date}>{formattedDate}</div>
          </div>
        </div>
      </div>

      <div className={styles.body}>{comment.body}</div>

      {comment.image_url && (
        <div className="mt-3 mb-2 relative inline-block group">
          <img 
            src={comment.image_url} 
            alt="Comment attachment" 
            className="rounded-sm border border-neutral-200 max-h-[200px] object-contain bg-neutral-50 cursor-zoom-in transition-opacity hover:opacity-90"
            onClick={() => setIsLightboxOpen(true)}
            referrerPolicy="no-referrer"
          />
          <button 
            className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsLightboxOpen(true)}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isLightboxOpen && comment.image_url && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsLightboxOpen(false)}>
          <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
            <X className="w-8 h-8" />
          </button>
          <img 
            src={comment.image_url} 
            alt="Comment attachment expanded" 
            className="max-w-full max-h-[90vh] object-contain rounded-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      <div className={styles.commentActions}>
        <button 
          className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-all mr-2 ${liked ? 'text-orange-600' : 'text-neutral-400 hover:text-neutral-600'}`}
          onClick={handleLike}
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-orange-600' : ''}`} />
          <span>{likesCount}</span>
        </button>

        {currentUser && (
          <button 
            className={styles.actionBtn} 
            onClick={() => setIsReplying(!isReplying)}
            id={`reply-btn-${comment.id}`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>
        )}

        {canDelete && (
          <button 
            className={`${styles.actionBtn} ${styles.deleteBtn}`} 
            onClick={() => onDelete(comment.id)}
            id={`delete-btn-${comment.id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        )}
      </div>

      {isReplying && (
        <form onSubmit={handleReplySubmit} className={styles.replyForm} id={`reply-form-${comment.id}`}>
          <textarea
            className={styles.replyTextarea}
            placeholder={`Reply to ${comment.user_name}...`}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            disabled={submitting || uploading}
            required
          />
          {replyImage && (
            <div className="relative inline-block mt-2 mb-4">
              <img src={replyImage} alt="Attachment preview" className="h-20 object-contain rounded-sm border border-neutral-200" />
              <button 
                type="button" 
                onClick={() => setReplyImage('')} 
                className="absolute -top-2 -right-2 bg-neutral-900 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <div>
              <input type="file" accept="image/*" className="hidden" ref={replyFileInputRef} onChange={handleReplyImageUpload} />
              <button 
                type="button" 
                onClick={() => replyFileInputRef.current?.click()}
                className="text-neutral-400 hover:text-neutral-900 p-1 rounded-sm transition-colors"
                disabled={uploading}
                title="Attach image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
            <div className={styles.replyButtons}>
              <button 
                type="button" 
                className={styles.btnCancel} 
                onClick={() => { setIsReplying(false); setReplyBody(''); setReplyImage(''); }}
                disabled={submitting || uploading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={styles.btnSubmit}
                disabled={submitting || uploading || !replyBody.trim()}
              >
                {submitting ? 'Posting...' : uploading ? 'Uploading...' : 'Post Reply'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Recursive nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              isAdmin={isAdmin}
              onDelete={onDelete}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};
