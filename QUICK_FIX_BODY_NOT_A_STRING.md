# Quick Fix Checklist for BODY_NOT_A_STRING_FROM_FUNCTION

## Step 1: Find Your Problematic Function

Check these locations for API routes:

- [ ] `pages/api/**/*.js` or `pages/api/**/*.ts` (Next.js Pages Router)
- [ ] `app/api/**/*.js` or `app/api/**/*.ts` (Next.js App Router)
- [ ] `api/**/*.js` or `api/**/*.ts` (Standalone Vercel functions)
- [ ] Check Vercel error logs for the exact function name

## Step 2: Identify the Problem Pattern

Look for these code smells in your function:

### 🚨 Red Flag #1: Direct object return
```javascript
// BAD - Returning object directly
export default async function handler(req, res) {
  return { message: 'Hello' }; // ❌ ERROR!
}
```

**Fix:** Use `res.json()`
```javascript
return res.json({ message: 'Hello' }); // ✅
```

### 🚨 Red Flag #2: App Router returning object
```javascript
// BAD - App Router returning object
export async function GET() {
  return { data: 'test' }; // ❌ ERROR!
}
```

**Fix:** Use `Response.json()`
```javascript
return Response.json({ data: 'test' }); // ✅
```

### 🚨 Red Flag #3: Unawaited Promise
```javascript
// BAD - Promise not awaited
export default async function handler(req, res) {
  const data = fetchData(); // Missing await!
  return res.json(data); // ❌ Returns Promise object
}
```

**Fix:** Add `await`
```javascript
const data = await fetchData(); // ✅
return res.json(data);
```

### 🚨 Red Flag #4: Inconsistent return types
```javascript
// BAD - Different return types
if (condition) {
  return res.json({ ok: true }); // ✅ String
}
return { error: 'bad' }; // ❌ Object
```

**Fix:** Always use res.json()
```javascript
if (condition) {
  return res.json({ ok: true });
}
return res.status(400).json({ error: 'bad' }); // ✅
```

### 🚨 Red Flag #5: Error object returned
```javascript
// BAD - Returning error object
catch (error) {
  return error; // ❌ ERROR!
}
```

**Fix:** Serialize error
```javascript
catch (error) {
  return res.status(500).json({ error: error.message }); // ✅
}
```

### 🚨 Red Flag #6: Missing return statement
```javascript
// BAD - No return, function returns undefined
export default async function handler(req, res) {
  res.json({ data: 'test' }); // Missing return!
}
```

**Fix:** Add return
```javascript
return res.json({ data: 'test' }); // ✅
```

## Step 3: Apply the Fix

### Most Common Fix: Add res.json() or Response.json()

**Pages Router - Before:**
```javascript
export default async function handler(req, res) {
  const data = await getData();
  return data; // ❌
}
```

**Pages Router - After:**
```javascript
export default async function handler(req, res) {
  const data = await getData();
  return res.json(data); // ✅
}
```

**App Router - Before:**
```javascript
export async function GET() {
  const data = await getData();
  return data; // ❌
}
```

**App Router - After:**
```javascript
export async function GET() {
  const data = await getData();
  return Response.json(data); // ✅
}
```

### Second Most Common: Add await

**Before:**
```javascript
export default async function handler(req, res) {
  const data = fetchData(); // Missing await
  return res.json(data);
}
```

**After:**
```javascript
export default async function handler(req, res) {
  const data = await fetchData(); // ✅ Added await
  return res.json(data);
}
```

### Third Most Common: Fix Error Handling

**Before:**
```javascript
export default async function handler(req, res) {
  try {
    const data = await getData();
    return res.json(data);
  } catch (error) {
    return error; // ❌
  }
}
```

**After:**
```javascript
export default async function handler(req, res) {
  try {
    const data = await getData();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message }); // ✅
  }
}
```

## Step 4: Framework-Specific Quick Fixes

### Next.js Pages Router
```javascript
// ✅ Always use res.json()
export default async function handler(req, res) {
  return res.json({ data: 'test' });
}

// ✅ Or res.send() with JSON.stringify()
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  return res.send(JSON.stringify({ data: 'test' }));
}
```

### Next.js App Router
```javascript
// ✅ Always use Response.json()
export async function GET() {
  return Response.json({ data: 'test' });
}

// ✅ Or new Response()
export async function GET() {
  return new Response(JSON.stringify({ data: 'test' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Standalone Vercel Function
```javascript
// ✅ Same as Pages Router
export default async function handler(req, res) {
  return res.json({ data: 'test' });
}
```

## Step 5: Test Your Fix

1. **Check return type:**
   ```javascript
   // Add this temporarily to verify
   const result = res.json(data);
   console.log('Return type:', typeof result);
   // Should be 'object' (res.json returns res), but response body is string
   ```

2. **Test all code paths:**
   - Test success path
   - Test error path
   - Test edge cases (empty data, null, etc.)

3. **Verify in Vercel:**
   - Deploy to Vercel
   - Test the endpoint
   - Check Vercel function logs
   - Verify error is resolved

## Step 6: Common Patterns to Check

### Pattern 1: Conditional Returns
```javascript
// ❌ BAD
if (req.method === 'GET') {
  return res.json({ data: 'ok' });
}
return { error: 'bad' }; // Inconsistent!

// ✅ GOOD
if (req.method === 'GET') {
  return res.json({ data: 'ok' });
}
return res.status(405).json({ error: 'Method not allowed' });
```

### Pattern 2: Early Returns
```javascript
// ❌ BAD
if (!authorized) {
  return { error: 'Unauthorized' };
}

// ✅ GOOD
if (!authorized) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### Pattern 3: Multiple Async Operations
```javascript
// ❌ BAD
const user = getUser();
const posts = getPosts();
return res.json({ user, posts }); // Both are Promises!

// ✅ GOOD
const user = await getUser();
const posts = await getPosts();
return res.json({ user, posts });
```

### Pattern 4: Array Operations
```javascript
// ❌ BAD
const items = data.map(item => processItem(item)); // Array of Promises!
return res.json({ items });

// ✅ GOOD
const items = await Promise.all(data.map(item => processItem(item)));
return res.json({ items });
```

## Step 7: Debugging Checklist

- [ ] Check Vercel logs for exact error message
- [ ] Verify which function is failing
- [ ] Check if you're using Pages Router or App Router
- [ ] Ensure all `async` functions have `await`
- [ ] Verify all code paths return properly
- [ ] Test with different request methods (GET, POST, etc.)
- [ ] Check error handling paths
- [ ] Verify no direct object/array returns

## Still Having Issues?

1. **Check the exact error in Vercel logs** - it will tell you which function failed and what type was returned
2. **Add console.log** to see what you're actually returning:
   ```javascript
   const data = await getData();
   console.log('Type:', typeof data);
   console.log('Value:', data);
   return res.json(data);
   ```
3. **Verify framework** - Are you using Pages Router or App Router?
4. **Check all return statements** - Use search to find all `return` statements in your function
5. **Review the full guide** in `VERCEL_BODY_NOT_A_STRING_GUIDE.md`

## Quick Reference: Correct Patterns

### Pages Router
```javascript
// ✅ Correct patterns
return res.json(data);
return res.status(404).json({ error: 'Not found' });
return res.send(JSON.stringify(data));

// ❌ Wrong patterns
return data;
return { data };
return res;
```

### App Router
```javascript
// ✅ Correct patterns
return Response.json(data);
return Response.json({ error: 'Not found' }, { status: 404 });
return new Response(JSON.stringify(data), {
  headers: { 'Content-Type': 'application/json' }
});

// ❌ Wrong patterns
return data;
return { data };
return Response;
```

## Remember

- **HTTP responses are strings** - Always serialize objects
- **Pages Router:** Use `res.json()` or `res.send()`
- **App Router:** Use `Response.json()` or `new Response()`
- **Always await:** `await` all async operations
- **Consistent returns:** All paths should return the same type
