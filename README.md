# 📦 Custom Logger for Next.js (with Axiom Support)

This is a lightweight, extensible logger for Next.js applications, built around a singleton pattern and designed for compatibility with the [Axiom](https://axiom.co) logging API — but easily adaptable to any logging service.

It automatically includes a `request.id` (if available) to help trace logs across an entire request lifecycle, making debugging and observability much smoother in full-stack Next.js apps.

---

## ✨ Features

- ✅ **Singleton Logger** – keeps a single logger instance across the app
- 🔗 **Request ID Propagation** – auto-includes `x-request-id` for tracing
- 🧠 **Axiom Integration** – logs are sent to Axiom by default
- 🛠️ **Pluggable Design** – logic is centralized and adaptable to other APIs
- 📅 **Unified Timestamp** – ISO string format to match Axios `_time` convention
- 🔐 **Secure** – no log loss on error, catches logging failures silently

---

## 🛠️ Usage

### 1. Install Dependencies

This logger relies on `next/headers` (available in server components and route handlers). No additional dependencies are required for Axiom.

> **Note:** Ensure you have a `.env.local || .env` file with:

```env
AXIOM_TOKEN=your-token
AXIOM_DATASET=your-dataset
```

### 2. Set Request ID in Middleware

To enable request tracing, use a **Next.js Middleware** to generate or pass through a `x-request-id` header:

```ts
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export function middleware(request: NextRequest) {
	const requestId = uuidv4()

	const requestHeaders = new Headers(request.headers)
	requestHeaders.set('x-request-id', requestId)

	const forwardedFor = request.headers.get('x-forwarded-for')
	const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : null

    // Example usage to log client request headers on every incoming request
	log.info({
		type: 'http',
		request: {
			id: requestId,
			path: request.nextUrl.pathname,
			method: request.method,
			useragent: request.headers.get('user-agent'),
			ip: clientIp,
		},
	})

	return NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	})
}

export const config = {
	matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
```

## 3. Examples:

### ✅ Step 1 – Incoming Client Request

```ts
log.info({
	type: 'http',
	request: {
		id: '3f5d2b1c-87a9-42a4-b42e-34e650ec1d73', // does not need to be set in the log, will be dynamically added by Logger class
		path: '/api/users',
		method: 'GET',
		useragent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0)',
		ip: '192.168.1.22',
	},
})
```

### 📦 Step 2 – Internal Function (e.g. Database)

```ts
log.info({
	requestId: '3f5d2b1c-87a9-42a4-b42e-34e650ec1d73',
	action: 'getUsers',
	type: 'db',
	duration: 200,
})
```

**By linking all function calls during a request's lifecycle to the original `request.id`, this logger enables seamless debugging, prevents silent errors, and allows for easy traceability by querying your logging API of choice with the `request.id`, making tracing and troubleshooting effortless.**





