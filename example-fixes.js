/**
 * VERCEL FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE - Example Fixes
 * 
 * This file shows common problematic patterns and their fixes.
 * Copy the relevant pattern to your API route.
 */

// ============================================================================
// PATTERN 1: Returning Entire Database Collection (MOST COMMON)
// ============================================================================

// ❌ PROBLEM: Returns all items, could be 10MB+
export async function handler_bad_example_1(req, res) {
  const snapshot = await db.collection('items').get();
  const allItems = snapshot.docs.map(doc => doc.data());
  return res.status(200).json(allItems); // ERROR: Too large!
}

// ✅ FIX: Add pagination
export async function handler_good_example_1(req, res) {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * parseInt(limit);
  
  const snapshot = await db.collection('items')
    .limit(parseInt(limit))
    .offset(offset)
    .get();
  
  const items = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  return res.status(200).json({
    items,
    page: parseInt(page),
    limit: parseInt(limit),
    hasMore: snapshot.size === parseInt(limit)
  });
}

// ============================================================================
// PATTERN 2: Including Large Fields (Images, Base64, Long Text)
// ============================================================================

// ❌ PROBLEM: Base64 images can be 1-5MB each
export async function handler_bad_example_2(req, res) {
  const items = await db.collection('items').get();
  const data = items.docs.map(doc => ({
    ...doc.data(),
    image: doc.data().base64Image, // 3MB per item!
    fullDescription: doc.data().veryLongText // 500KB per item!
  }));
  return res.json(data); // ERROR: Too large!
}

// ✅ FIX: Exclude large fields, return URLs instead
export async function handler_good_example_2(req, res) {
  const { page = 1, limit = 50 } = req.query;
  const snapshot = await db.collection('items')
    .limit(parseInt(limit))
    .offset((page - 1) * parseInt(limit))
    .get();
  
  const items = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      category: data.category,
      imageUrl: data.imageUrl, // URL, not base64!
      shortDescription: data.description?.substring(0, 200), // Truncated
      // Exclude: base64Image, fullDescription, pdfData
    };
  });
  
  return res.json({ items, page: parseInt(page) });
}

// ============================================================================
// PATTERN 3: No Filtering - Returning Everything
// ============================================================================

// ❌ PROBLEM: Client only needs recent items, but gets everything
export async function handler_bad_example_3(req, res) {
  const allItems = await db.collection('items').get();
  return res.json(allItems.docs.map(doc => doc.data())); // ERROR!
}

// ✅ FIX: Filter on the server
export async function handler_good_example_3(req, res) {
  const { category, status, limit = 50 } = req.query;
  
  let query = db.collection('items')
    .where('status', '==', status || 'active')
    .orderBy('createdAt', 'desc')
    .limit(parseInt(limit));
  
  if (category) {
    query = query.where('category', '==', category);
  }
  
  const snapshot = await query.get();
  const items = snapshot.docs.map(doc => doc.data());
  
  return res.json({ items });
}

// ============================================================================
// PATTERN 4: Accumulating Large Arrays
// ============================================================================

// ❌ PROBLEM: Building up a huge array
export async function handler_bad_example_4(req, res) {
  let results = [];
  const categories = await db.collection('categories').get();
  
  for (const catDoc of categories.docs) {
    const items = await db.collection('items')
      .where('categoryId', '==', catDoc.id)
      .get();
    results.push({
      category: catDoc.data(),
      items: items.docs.map(doc => doc.data()) // Could be 1000s of items!
    });
  }
  
  return res.json(results); // ERROR: Too large!
}

// ✅ FIX: Return summaries, not full data
export async function handler_good_example_4(req, res) {
  const categories = await db.collection('categories').get();
  const results = [];
  
  for (const catDoc of categories.docs) {
    const itemsSnapshot = await db.collection('items')
      .where('categoryId', '==', catDoc.id)
      .limit(10) // Only get count or first 10
      .get();
    
    results.push({
      category: {
        id: catDoc.id,
        name: catDoc.data().name,
        // Exclude large fields
      },
      itemCount: itemsSnapshot.size,
      // Don't include all items!
    });
  }
  
  return res.json({ categories: results });
}

// ============================================================================
// PATTERN 5: Nested Data Explosion
// ============================================================================

// ❌ PROBLEM: Including all related data
export async function handler_bad_example_5(req, res) {
  const user = await db.collection('users').doc(req.query.userId).get();
  const posts = await db.collection('posts')
    .where('userId', '==', req.query.userId)
    .get();
  const comments = await db.collection('comments')
    .where('userId', '==', req.query.userId)
    .get();
  
  return res.json({
    user: user.data(),
    posts: posts.docs.map(doc => doc.data()), // Could be 1000s!
    comments: comments.docs.map(doc => doc.data()), // Could be 1000s!
  }); // ERROR: Too large!
}

// ✅ FIX: Return minimal data, let client fetch details separately
export async function handler_good_example_5(req, res) {
  const user = await db.collection('users').doc(req.query.userId).get();
  
  // Only get counts or summaries
  const postsSnapshot = await db.collection('posts')
    .where('userId', '==', req.query.userId)
    .limit(10) // Or just count
    .get();
  
  return res.json({
    user: {
      id: user.id,
      name: user.data().name,
      email: user.data().email,
      // Exclude: avatar, bio, settings, etc.
    },
    posts: postsSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      createdAt: doc.data().createdAt,
      // Exclude: content, images, comments
    })),
    postCount: postsSnapshot.size,
    // Don't include all comments - client can fetch separately
  });
}

// ============================================================================
// PATTERN 6: File Data in JSON Response
// ============================================================================

// ❌ PROBLEM: Returning file as base64
export async function handler_bad_example_6(req, res) {
  const file = await fs.readFile('large-document.pdf');
  const base64 = file.toString('base64');
  return res.json({ 
    fileName: 'document.pdf',
    fileData: base64 // 5MB+ in JSON!
  }); // ERROR: Too large!
}

// ✅ FIX: Upload to storage, return URL
import { put } from '@vercel/blob';

export async function handler_good_example_6(req, res) {
  // If uploading a new file
  const blob = await put('document.pdf', fileBuffer, {
    access: 'public',
  });
  
  // Or if file already exists, just return the stored URL
  const fileUrl = await getFileUrlFromStorage('document.pdf');
  
  return res.json({
    fileName: 'document.pdf',
    fileUrl: fileUrl, // URL, not data!
    expiresIn: 3600
  });
}

// ============================================================================
// PATTERN 7: Streaming Solution (For Large Datasets That Can't Be Reduced)
// ============================================================================

// ✅ Use streaming when you MUST send large datasets
export async function handler_streaming_example(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');
  
  // Start JSON array
  res.write('[');
  
  const snapshot = await db.collection('items').get();
  let first = true;
  
  for (const doc of snapshot.docs) {
    if (!first) res.write(',');
    res.write(JSON.stringify(doc.data()));
    first = false;
  }
  
  res.write(']');
  res.end();
}

// ============================================================================
// PATTERN 8: Compression (For Compressible Data)
// ============================================================================

import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

// ✅ Compress large text/JSON responses
export async function handler_compression_example(req, res) {
  const data = await getLargeTextData(); // Could be 8MB of text
  const json = JSON.stringify(data);
  const compressed = await gzipAsync(json); // Now ~2MB
  
  res.setHeader('Content-Encoding', 'gzip');
  res.setHeader('Content-Type', 'application/json');
  return res.send(compressed);
}

// ============================================================================
// HELPER: Check Response Size (For Development)
// ============================================================================

function checkResponseSize(data) {
  const jsonString = JSON.stringify(data);
  const sizeInBytes = Buffer.byteLength(jsonString, 'utf8');
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  console.log(`Response size: ${sizeInMB.toFixed(2)} MB`);
  
  if (sizeInMB > 4.5) {
    console.warn('⚠️ WARNING: Response exceeds 4.5MB limit!');
  }
  
  return sizeInMB;
}

// Use in your handler:
export async function handler_with_size_check(req, res) {
  const data = await getData();
  checkResponseSize(data); // Log size in development
  
  return res.json(data);
}

// ============================================================================
// COMPLETE EXAMPLE: Next.js API Route with Pagination
// ============================================================================

// pages/api/items.js or app/api/items/route.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { 
      page = 1, 
      limit = 50, 
      category,
      status = 'active',
      search 
    } = req.query;
    
    // Build query with filters
    let query = db.collection('items')
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit));
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    // Execute query
    const snapshot = await query.get();
    
    // Map to response format (exclude large fields)
    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        category: data.category,
        location: data.location,
        createdAt: data.createdAt,
        imageUrl: data.imageUrl, // URL, not base64
        // Exclude: base64Image, fullDescription, pdfData, etc.
      };
    });
    
    // Optional: Get total count for pagination info
    const totalSnapshot = await db.collection('items')
      .where('status', '==', status)
      .get();
    
    return res.status(200).json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalSnapshot.size,
        totalPages: Math.ceil(totalSnapshot.size / parseInt(limit)),
        hasMore: parseInt(page) * parseInt(limit) < totalSnapshot.size
      }
    });
    
  } catch (error) {
    console.error('Error fetching items:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================================================
// BODY_NOT_A_STRING_FROM_FUNCTION - Example Fixes
// ============================================================================

// ============================================================================
// PATTERN 1: Direct Object Return (MOST COMMON)
// ============================================================================

// ❌ PROBLEM: Returning object directly
export async function handler_bad_body_string_1(req, res) {
  const data = { message: 'Hello', items: [1, 2, 3] };
  return data; // ERROR: Not a string!
}

// ✅ FIX: Use res.json()
export async function handler_good_body_string_1(req, res) {
  const data = { message: 'Hello', items: [1, 2, 3] };
  return res.json(data); // ✅ Correctly serializes to JSON string
}

// ============================================================================
// PATTERN 2: Next.js App Router Returning Object
// ============================================================================

// ❌ PROBLEM: App Router returning object directly
// app/api/items/route.js
export async function GET_bad_example() {
  const data = await getData();
  return data; // ERROR: Must return Response object!
}

// ✅ FIX: Return Response.json()
// app/api/items/route.js
export async function GET_good_example() {
  const data = await getData();
  return Response.json(data); // ✅ Returns proper Response object
}

// ============================================================================
// PATTERN 3: Unawaited Promise
// ============================================================================

// ❌ PROBLEM: Not awaiting async operation
export async function handler_bad_body_string_2(req, res) {
  const data = fetchData(); // Returns Promise, not data!
  return res.json(data); // ERROR: data is a Promise object
}

// ✅ FIX: Await async operations
export async function handler_good_body_string_2(req, res) {
  const data = await fetchData(); // ✅ Wait for Promise to resolve
  return res.json(data); // Now data is the actual value
}

// ============================================================================
// PATTERN 4: Inconsistent Return Types
// ============================================================================

// ❌ PROBLEM: Some paths return non-string
export async function handler_bad_body_string_3(req, res) {
  if (req.method === 'GET') {
    return res.json({ data: 'ok' }); // ✅ Good
  } else if (req.method === 'POST') {
    const result = await processData();
    return result; // ❌ ERROR: Returns object, not string!
  }
}

// ✅ FIX: All paths return properly
export async function handler_good_body_string_3(req, res) {
  if (req.method === 'GET') {
    return res.json({ data: 'ok' });
  } else if (req.method === 'POST') {
    const result = await processData();
    return res.json(result); // ✅ Always use res.json()
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// ============================================================================
// PATTERN 5: Error Object Returned
// ============================================================================

// ❌ PROBLEM: Error handler returns error object
export async function handler_bad_body_string_4(req, res) {
  try {
    const data = await getData();
    return res.json(data);
  } catch (error) {
    return error; // ❌ ERROR: Error object is not a string!
  }
}

// ✅ FIX: Always return proper response
export async function handler_good_body_string_4(req, res) {
  try {
    const data = await getData();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ 
      error: error.message // ✅ Serialize error to JSON
    });
  }
}

// ============================================================================
// PATTERN 6: Missing Return Statement
// ============================================================================

// ❌ PROBLEM: No return, function returns undefined
export async function handler_bad_body_string_5(req, res) {
  const data = await getData();
  res.json(data); // Missing return! Function returns undefined
}

// ✅ FIX: Add return statement
export async function handler_good_body_string_5(req, res) {
  const data = await getData();
  return res.json(data); // ✅ Explicit return
}

// ============================================================================
// PATTERN 7: Array of Promises (Common Async Mistake)
// ============================================================================

// ❌ PROBLEM: Array of Promises, not awaited
export async function handler_bad_body_string_6(req, res) {
  const items = data.map(item => processItem(item)); // Array of Promises!
  return res.json({ items }); // ERROR: items contains Promise objects
}

// ✅ FIX: Await all promises
export async function handler_good_body_string_6(req, res) {
  const items = await Promise.all(
    data.map(item => processItem(item))
  ); // ✅ Wait for all promises
  return res.json({ items });
}

// ============================================================================
// PATTERN 8: Next.js App Router Complete Example
// ============================================================================

// app/api/items/route.js
// ✅ GOOD: Complete App Router example
export async function GET() {
  try {
    const data = await getData();
    return Response.json({ items: data });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await createItem(body);
    return Response.json({ item: result }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

// ============================================================================
// PATTERN 9: Pages Router Complete Example
// ============================================================================

// pages/api/items.js
// ✅ GOOD: Complete Pages Router example
export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const data = await getData();
      return res.json({ items: data });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const result = await createItem(req.body);
      return res.status(201).json({ item: result });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

// ============================================================================
// PATTERN 10: Using res.send() with JSON.stringify()
// ============================================================================

// ✅ ALTERNATIVE: Explicit serialization
export async function handler_alternative_1(req, res) {
  const data = await getData();
  res.setHeader('Content-Type', 'application/json');
  return res.send(JSON.stringify(data)); // ✅ Explicitly convert to string
}

// ============================================================================
// PATTERN 11: App Router with new Response()
// ============================================================================

// ✅ ALTERNATIVE: Manual Response creation
export async function GET_alternative() {
  const data = await getData();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  }); // ✅ Explicit Response object
}

// ============================================================================
// HELPER: Debug Function Return Type
// ============================================================================

function debugReturnType(value, label = 'Value') {
  console.log(`${label} type:`, typeof value);
  console.log(`${label} is object:`, typeof value === 'object');
  console.log(`${label} is string:`, typeof value === 'string');
  console.log(`${label} is Promise:`, value instanceof Promise);
  console.log(`${label} value:`, value);
}

// Use in your handler:
export async function handler_with_debug(req, res) {
  const data = await getData();
  debugReturnType(data, 'Data'); // Check what you're returning
  
  const response = res.json(data);
  debugReturnType(response, 'Response'); // Check response object
  
  return response;
}
