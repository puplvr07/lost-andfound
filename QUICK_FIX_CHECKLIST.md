# Quick Fix Checklist for FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE

## Step 1: Find Your Problematic Function

Check these locations for API routes:

- [ ] `pages/api/**/*.js` or `pages/api/**/*.ts` (Next.js Pages Router)
- [ ] `app/api/**/*.js` or `app/api/**/*.ts` (Next.js App Router)
- [ ] `api/**/*.js` or `api/**/*.ts` (Standalone Vercel functions)
- [ ] Check Vercel error logs for the exact function name

## Step 2: Identify the Problem Pattern

Look for these code smells in your function:

### 🚨 Red Flag #1: No `.limit()` on database queries
```javascript
// BAD - No limit
const all = await db.collection('items').get();
return res.json(all.docs.map(doc => doc.data()));
```

**Fix:** Add `.limit(50)` and pagination

### 🚨 Red Flag #2: Returning entire objects with all fields
```javascript
// BAD - Includes everything
return res.json(items.map(item => item.data()));
```

**Fix:** Select only needed fields, exclude large ones

### 🚨 Red Flag #3: Base64 images or files in JSON
```javascript
// BAD - Base64 in response
return res.json({ image: base64Image });
```

**Fix:** Use storage service, return URL instead

### 🚨 Red Flag #4: No pagination parameters
```javascript
// BAD - No page/limit in query
export default async function handler(req, res) {
  const data = await getAllData();
  return res.json(data);
}
```

**Fix:** Add `?page=1&limit=50` parameters

### 🚨 Red Flag #5: Accumulating large arrays
```javascript
// BAD - Building huge array
let results = [];
for (const item of manyItems) {
  results.push(await processItem(item));
}
return res.json(results);
```

**Fix:** Process in batches or return summaries

## Step 3: Apply the Fix

### Most Common Fix: Add Pagination

**Before:**
```javascript
export default async function handler(req, res) {
  const all = await db.collection('items').get();
  return res.json(all.docs.map(doc => doc.data()));
}
```

**After:**
```javascript
export default async function handler(req, res) {
  const { page = 1, limit = 50 } = req.query;
  const snapshot = await db.collection('items')
    .limit(parseInt(limit))
    .offset((parseInt(page) - 1) * parseInt(limit))
    .get();
  
  return res.json({
    items: snapshot.docs.map(doc => doc.data()),
    page: parseInt(page)
  });
}
```

### Second Most Common: Exclude Large Fields

**Before:**
```javascript
return res.json(items.map(item => ({
  ...item.data(),
  base64Image: item.data().image, // 3MB!
  fullDescription: item.data().description // 500KB!
})));
```

**After:**
```javascript
return res.json(items.map(item => ({
  id: item.id,
  name: item.data().name,
  imageUrl: item.data().imageUrl, // URL, not base64
  shortDescription: item.data().description?.substring(0, 200)
  // Exclude large fields
})));
```

## Step 4: Test Your Fix

1. **Check response size in development:**
   ```javascript
   const json = JSON.stringify(data);
   const sizeMB = Buffer.byteLength(json) / (1024 * 1024);
   console.log(`Response size: ${sizeMB.toFixed(2)} MB`);
   ```

2. **Test with realistic data:**
   - Don't test with just 10 items
   - Test with 100+ items to catch the issue

3. **Verify pagination works:**
   - Test `?page=1&limit=50`
   - Test `?page=2&limit=50`
   - Verify responses are under 4.5MB

## Step 5: Deploy and Monitor

- [ ] Deploy to Vercel
- [ ] Test the endpoint
- [ ] Check Vercel function logs
- [ ] Verify error is resolved

## Common Database-Specific Fixes

### Firestore
```javascript
// Add limit
.limit(50)

// Add pagination
.offset((page - 1) * limit)

// Filter before fetching
.where('status', '==', 'active')
```

### MongoDB
```javascript
// Add limit and skip
.find({ status: 'active' })
.limit(50)
.skip((page - 1) * 50)
```

### Prisma
```javascript
// Add pagination
.findMany({
  take: 50,
  skip: (page - 1) * 50,
  where: { status: 'active' }
})
```

### Supabase
```javascript
// Add limit and range
.select('*')
.range((page - 1) * limit, page * limit - 1)
.limit(50)
```

## Still Having Issues?

1. **Check the exact error in Vercel logs** - it will tell you which function failed
2. **Add size logging** to see how big your response actually is
3. **Consider streaming** if data truly can't be reduced
4. **Use external storage** for files/images
5. **Review the full guide** in `VERCEL_PAYLOAD_ERROR_GUIDE.md`

## Quick Reference: Size Limits

- ✅ **Safe:** < 1MB
- ⚠️ **Warning:** 1-3MB (monitor closely)
- 🚨 **Error:** > 4.5MB (will fail)

**Remember:** The 4.5MB limit includes the entire JSON response body, not just individual fields.
