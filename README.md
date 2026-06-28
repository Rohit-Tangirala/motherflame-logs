# Sanctuary — Blog Platform

> A full-stack blogging platform with rich post creation, nested comments, likes, share, newsletter, and an admin content management system — backed by MySQL on Aiven and deployed on Render.

---

## Tech Stack

**Frontend**
- React (Vite)
- CSS Modules
- React Router v6
- Axios
- react-hot-toast
- react-quill — rich text editor

**Backend**
- Express.js
- jsonwebtoken
- bcryptjs
- mysql2
- multer + cloudinary — cover image and comment image uploads
- resend — comment notifications + newsletter
- cors, dotenv, nodemon

**Storage**
- Cloudinary — post cover images, comment attachments

**Database**
- MySQL — Aiven (cloud-hosted)

**Deployment**
- Render

---

## Features

- JWT-based user authentication (register + login)
- Role-based access control (Admin / User)
- Rich text post editor (react-quill) with bold, italic, headings, lists, blockquote, inline code
- Cover image upload per post via Cloudinary
- Draft / Published post status
- Slug-based URLs — /blog/my-post-title
- Read time auto-calculated from word count
- Category filter tabs on homepage
- Tag system with post_tags join table
- Hero post section — latest published post shown full-bleed
- Magazine-style 2-column post grid with author byline, category badge, read time
- Post likes — toggle like/unlike, live count, no page reload
- Comment likes — heart icon with count on each comment
- Nested comments — replies indented under parent comments
- Comment image attachments via Cloudinary
- Share button — copy link, Twitter/X, WhatsApp
- Email notification to post author on new comment via Resend
- Newsletter — subscribe form on homepage, admin broadcast to all subscribers via Resend
- Author profile page — avatar, all published posts by that author
- Admin dashboard — manage posts, manage comments, newsletter panel
- 25 seeded articles across 8 categories with Unsplash cover images
- Skeleton loaders while posts fetch
- Toast notifications for all key actions
- Fully responsive — hamburger menu on mobile, grid on desktop

---

## Project Structure

```
blog-platform/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── PostCard.jsx
│   │   │   ├── HeroPost.jsx
│   │   │   ├── CommentSection.jsx
│   │   │   ├── CommentItem.jsx
│   │   │   └── SkeletonCard.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── PostDetail.jsx
│   │   │   ├── CreatePost.jsx
│   │   │   ├── EditPost.jsx
│   │   │   ├── AuthorProfile.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx
│   │   │       └── ManagePosts.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
├── server/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── comments.js
│   │   ├── newsletter.js
│   │   └── upload.js
│   ├── middleware/
│   │   ├── verifyToken.js
│   │   └── isAdmin.js
│   ├── utils/
│   │   ├── sendEmail.js
│   │   └── slugify.js
│   ├── seed.js
│   └── index.js
├── .env
└── package.json
```

---

## API Routes

| Method | Route | Auth | Role | Action |
|--------|-------|------|------|--------|
| POST | `/api/auth/register` | ✗ | — | Register user |
| POST | `/api/auth/login` | ✗ | — | Return JWT |
| GET | `/api/posts` | ✗ | — | Get all published posts |
| GET | `/api/posts/my` | ✓ | User | Get own posts |
| GET | `/api/posts/:slug` | ✗ | — | Get single post |
| POST | `/api/posts` | ✓ | User | Create post |
| PUT | `/api/posts/:slug` | ✓ | Owner/Admin | Update post |
| DELETE | `/api/posts/:slug` | ✓ | Owner/Admin | Delete post |
| POST | `/api/posts/:slug/like` | ✓ | User | Toggle like |
| GET | `/api/comments/:post_id` | ✗ | — | Get comments |
| POST | `/api/comments` | ✓ | User | Add comment |
| POST | `/api/comments/:id/like` | ✓ | User | Toggle comment like |
| DELETE | `/api/comments/:id` | ✓ | Owner/Admin | Delete comment |
| POST | `/api/upload` | ✓ | User | Upload image to Cloudinary |
| POST | `/api/newsletter/subscribe` | ✗ | — | Subscribe email |
| POST | `/api/newsletter/send` | ✓ | Admin | Broadcast newsletter |
| GET | `/api/newsletter/subscribers` | ✓ | Admin | Get subscriber count |

---



## Deployment

- Frontend builds to `client/dist` via `npm run build`
- Express serves the React build as static files in production
- Hosted on **Render** (single service, one port)
- Database hosted on **Aiven** (MySQL 8.0)
- Images hosted on **Cloudinary**

---


## Made by Rohit