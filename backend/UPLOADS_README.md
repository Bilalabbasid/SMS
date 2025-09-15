Uploads API (GridFS)

This file documents the GridFS-backed upload endpoints implemented in `src/routes/uploads.js`.

Environment
- `MONGO_URI` or `MONGODB_URI` must point to your MongoDB connection string.
- `JWT_SECRET` should be set for authentication (routes require JWT token in Authorization header).

Endpoints

- POST /api/uploads/:type
  - :type -> one of `avatar`, `homework`, `library`, `document`, `general`
  - Auth: Required (Bearer token)
  - Upload: multipart/form-data with field names:
    - `avatar` (single)
    - `files` (multiple) for `homework`
    - `file` (single) for `library` and `general`
    - `document` (single) for `document`
  - Response: JSON with uploaded file metadata including `id` and `filename` (GridFS id)

- GET /api/uploads/file/:id
  - Streams a file by its GridFS id
  - Auth: Required

- GET /api/uploads/filename/:bucket/:filename
  - Streams a file by bucket and filename
  - Auth: Required

- DELETE /api/uploads/file/:id
  - Deletes a file by its GridFS id
  - Auth: Required

Example curl (upload single avatar):

```powershell
$token = "<JWT_TOKEN>"
curl -X POST "http://localhost:5000/api/uploads/avatar" -H "Authorization: Bearer $token" -F "avatar=@C:/path/to/avatar.jpg"
```

Example curl (upload homework multiple files):
```powershell
$token = "<JWT_TOKEN>"
curl -X POST "http://localhost:5000/api/uploads/homework" -H "Authorization: Bearer $token" -F "files=@C:/path/to/file1.pdf" -F "files=@C:/path/to/file2.png"
```

Download by id:
```powershell
curl -X GET "http://localhost:5000/api/uploads/file/<FILE_ID>" -H "Authorization: Bearer $token" --output "downloaded.bin"
```

Notes
- The uploads route uses `multer-gridfs-storage` and stores files inside buckets named `avatars.files`, `homework.files`, etc.
- Make sure MongoDB user has permissions to write files to the database.
- In production, configure file size limits and content-type checks as needed.
