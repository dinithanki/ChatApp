# ChatApp Production Hosting & Deployment Guide

This guide explains how to properly configure your frontend (on **Vercel**) and backend (on **Render**) so that the **email service**, **CORS**, and **WebSocket connections** work flawlessly.

---

## 🛑 The Core Problem: Why did SMTP fail on Render?

Traditional email services (like Gmail, Outlook, Yahoo) send emails using **SMTP** (Simple Mail Transfer Protocol) over ports **25, 465, or 587**.

However, **Render blocks all outgoing SMTP ports (25, 465, 587) on their Free Tier** to prevent spam and network abuse. Therefore, when your backend runs on Render, any SMTP-based `nodemailer` connection will time out or be refused immediately, even though it works perfectly on your local machine.

---

## 🚀 The Solution: HTTP-Based Email API

To bypass this restriction, the backend has been updated to support **HTTP-Based Email APIs** (via port **443**, which is standard HTTPS and **never blocked**).

You can use **Resend** (recommended) or **SendGrid**. They offer generous free plans:
*   **Resend:** 3,000 free emails/month (no credit card required to start).
*   **SendGrid:** 100 free emails/day.

### How to set it up:
1.  Sign up for a free account at [resend.com](https://resend.com).
2.  Go to your API Keys page and create a new key.
3.  Add `RESEND_API_KEY` to your environment variables on Render (see the Render section below).
4.  *(Optional)* By default, it will use `onboarding@resend.dev` as the sender. Once you add your custom domain to Resend, you can configure your own sender email using the `EMAIL_FROM` variable.

---

## 1. Frontend Configuration on **Vercel**

When deploying your Vite + React frontend on Vercel, you must set the following **Environment Variables** under your Vercel Project Settings > Environment Variables:

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://chatapp-backend.onrender.com` | **CRITICAL:** The full URL of your Render backend. Without this, API requests will loop back to Vercel and fail with 404s. |
| `VITE_SOCKET_RECONNECT_DELAY` | `1000` | Optional. Delay in milliseconds before attempting to reconnect a socket. |
| `VITE_SOCKET_RECONNECT_ATTEMPTS` | `5` | Optional. Number of reconnect attempts. |

### Build Command Settings on Vercel:
*   **Framework Preset:** Vite
*   **Build Command:** `npm run build`
*   **Output Directory:** `dist`

---

## 2. Backend Configuration on **Render**

When deploying your Node.js + Express backend on Render, you must configure these **Environment Variables** in the **Environment** tab of your Render Web Service dashboard:

### Core Variables:
| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3001` | The port the backend server runs on (Render assigns this automatically, but setting `3001` is standard). |
| `NODE_ENV` | `production` | Set to `production` for security, optimized performance, and correct secure cookies. |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Connection String. |
| `JWT_SECRET` | `your_long_secure_jwt_secret` | A secure key to sign authentication tokens. |
| `FRONTEND_URL` | `https://chatapp-frontend.vercel.app` | **CRITICAL:** The live URL of your deployed Vercel frontend. This is required for **CORS** permission and generating the correct Password Reset links in emails. |

### Email Service Variables (Choose ONE):

#### Option A: Using Resend HTTP API (Recommended)
| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `RESEND_API_KEY` | `re_123456789...` | Your Resend API key. Automatically activates the HTTP-based email sender. |
| `EMAIL_FROM` | `ChatApp <no-reply@yourdomain.com>` | Optional. Defaults to `onboarding@resend.dev` (requires domain validation on Resend to change). |

#### Option B: Using SendGrid HTTP API
| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `SENDGRID_API_KEY` | `SG.123456789...` | Your SendGrid API key. Automatically activates the SendGrid HTTP-based email sender. |
| `EMAIL_FROM` | `no-reply@yourdomain.com` | The verified sender email in your SendGrid dashboard. |

#### Option C: Fallback to Local SMTP (Only if you upgraded Render to a Paid tier)
| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `EMAIL_USER` | `dinithpamunuwatte@gmail.com` | Your Gmail address. |
| `EMAIL_PASSWORD` | `vknx mjum bews dkxw` | Your 16-character Gmail App Password. |

---

## 🔍 Verification Checklist

To verify your hosted deployment:

1.  **Check API requests:** Open your browser's Developer Tools (Network tab) on the Vercel site. Verify that calls like `POST /api/auth/signup` are being sent to your Render backend domain (`https://chatapp-backend.onrender.com/api/auth/signup`) instead of the Vercel domain.
2.  **Verify CORS:** Ensure there are no console errors saying `Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy`. If there are, double-check that `FRONTEND_URL` is set correctly in your Render dashboard environment variables.
3.  **Check Socket.io:** Verify in the network tab or console that socket connections establish and you can see online user changes.
