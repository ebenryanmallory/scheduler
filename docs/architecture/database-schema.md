# Database Schema

Since we are using **Markdown/JSON files** as the primary source of truth (backed by Git) and **IndexedDB** for client-side caching, the schema definition applies to both the JSON structure in files and the object stores in IndexedDB.

## JSON Structure (tasks.json / IndexedDB 'tasks' store)

```json
{
  "tasks": [
    {
      "id": "uuid-v4",
      "title": "Implement Dark Mode",
      "status": "todo",
      "priority": "high",
      "created_at": "2025-12-01T10:00:00Z",
      "updated_at": "2025-12-01T10:00:00Z",
      "tags": ["ui", "feature"],
      "time_tracking": {
        "estimated": 60,
        "actual": 0,
        "history": []
      }
    }
  ]
}
```

---
