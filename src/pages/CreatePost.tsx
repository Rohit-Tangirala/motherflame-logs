import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Upload, X, ArrowLeft, Eye, Sparkles } from 'lucide-react';

export const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Design');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [tagsInput, setTagsInput] = useState('');
  const [coverImage, setCoverImage] = useState('');

  const [uploading, setUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Protected route check
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('You must be signed in to create posts.');
      navigate('/login');
    }
  }, [isAuthenticated]);

  // Handle image drag over
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  // Upload file helper
  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('/api/upload', formData);
      setCoverImage(response.data.secure_url || response.data.url);
      toast.success('Cover image uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to upload image. Using fallback defaults.');
    } finally {
      setUploading(false);
    }
  };

  // Handle image drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  // Handle manual file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required.');
      return;
    }

    setSubmitting(true);
    try {
      // Split comma separated tags, trim and filter empty
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const wordCountCalc = content.split(/\s+/).filter(Boolean).length;
      const readTimeCalc = Math.max(1, Math.round(wordCountCalc / 200));

      const response = await axios.post('/api/posts', {
        title,
        content,
        category,
        status,
        tags,
        cover_image: coverImage || undefined,
        read_time: readTimeCalc,
      });

      toast.success(status === 'published' ? 'Article published live!' : 'Draft saved successfully.');
      navigate(`/post/${response.data.slug}`);
    } catch (err: any) {
      console.error('Post creation error details:', err);
      const msg = err.response?.data?.message || 'Error creating post.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="max-w-4xl mx-auto px-6 py-12" id="create-post-page">
      <div className="mb-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-neutral-900 transition-all font-sans uppercase tracking-wider mb-4">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <h1 className="font-sans font-medium tracking-tight text-neutral-900 text-3xl mb-2">
          Compose a New Story
        </h1>
        <p className="text-sm text-neutral-400 font-sans">
          Share your ideas, tutorials, or musings in Sanctuary's minimal aesthetic.
        </p>
      </div>

      <form onSubmit={handleCreatePost} className="space-y-8" id="create-post-form">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 font-sans">
            Post Title
          </label>
          <input
            type="text"
            placeholder="Give your story a meaningful headline..."
            className="w-full text-xl font-sans font-semibold border-b border-neutral-100 hover:border-neutral-300 focus:border-neutral-950 pb-2 focus:outline-none transition-all placeholder-neutral-300"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        {/* Drag-and-drop Image Uploader */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 font-sans">
            Cover Banner Image
          </label>
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full h-56 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragActive 
                ? 'border-neutral-950 bg-neutral-50' 
                : 'border-neutral-200 hover:border-neutral-950 bg-neutral-50/40'
            }`}
            id="drag-and-drop-container"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              disabled={uploading || submitting}
            />

            {uploading ? (
              <div className="text-center font-mono text-xs text-neutral-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-900 mx-auto mb-3" />
                Uploading secure media asset...
              </div>
            ) : (
              <div className="text-center p-6" id="upload-prompt">
                <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-3 animate-bounce" />
                <p className="text-sm font-semibold text-neutral-700 font-sans">
                  Drag and drop cover image here, or <span className="text-neutral-950 underline">browse computer</span>
                </p>
                <p className="text-xs text-neutral-400 mt-1 font-mono">Supports PNG, JPG, GIF up to 5MB</p>
              </div>
            )}
          </div>
          {coverImage && (
            <div className="mt-4 relative w-full h-56 rounded-lg overflow-hidden border border-neutral-200" id="image-preview-container">
              <img 
                src={coverImage} 
                alt="Cover preview" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCoverImage('');
                }}
                className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow hover:bg-white text-rose-600 transition-all cursor-pointer"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Categories, Status and Tags */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="post-meta-controls">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 font-sans">
              Category
            </label>
            <select
              className="w-full py-2 px-3 border border-neutral-200 rounded text-sm bg-white focus:border-neutral-950 focus:outline-none transition-all font-sans"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={submitting}
            >
              <option value="Design">Design</option>
              <option value="Web Dev">Web Dev</option>
              <option value="Lifestyle">Lifestyle</option>
              <option value="AI">AI / Technology</option>
              <option value="Philosophy">Philosophy</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 font-sans flex items-center justify-between">
              <span>Tags</span>
              <span className="text-[10px] text-neutral-400 font-normal italic lowercase">comma-separated</span>
            </label>
            <input
              type="text"
              placeholder="e.g. minimalist, tutorial, css"
              className="w-full py-2 px-3 border border-neutral-200 rounded text-sm bg-white focus:border-neutral-950 focus:outline-none transition-all"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* Status Draft/Published toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 font-sans">
              Publish Status
            </label>
            <div className="flex rounded-md border border-neutral-200 overflow-hidden bg-white p-0.5">
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded font-sans transition-all ${
                  status === 'draft' 
                    ? 'bg-neutral-900 text-white shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => setStatus('published')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded font-sans transition-all ${
                  status === 'published' 
                    ? 'bg-neutral-900 text-white shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Publish Live
              </button>
            </div>
          </div>
        </div>

        {/* Rich Text Editor React Quill (Large distraction-free editor) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 font-sans flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
            Story Body
          </label>
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden focus-within:border-neutral-950 transition-all" id="editor-container">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Begin typing your masterpiece..."
              className="w-full h-80 p-4 focus:outline-none"
              disabled={submitting}
            />
          </div>
          <div className="mt-2 text-xs font-mono text-neutral-400 flex justify-end gap-3">
            <span>{wordCount} words</span>
            <span>{readTime} min read</span>
          </div>
        </div>

        {/* Buttons Panel */}
        <div className="flex items-center justify-end gap-4 pt-10 border-t border-neutral-100" id="form-actions">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 text-sm font-semibold border border-neutral-200 text-neutral-600 rounded hover:bg-neutral-50 transition-all cursor-pointer"
            disabled={submitting}
          >
            Discard
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm rounded cursor-pointer transition-all shadow-md hover:shadow"
            disabled={submitting}
          >
            {submitting ? 'Creating Story...' : status === 'draft' ? 'Save as Draft' : 'Publish Story'}
          </button>
        </div>
      </form>
    </div>
  );
};
