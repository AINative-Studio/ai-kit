#!/bin/bash

gh issue create --title "[AIKIT-21] Semantic search in conversation history" --body "**Story Points:** 8" --label "epic:state-management,story-points:8,phase:3-advanced"
gh issue create --title "[AIKIT-22] Automatic context truncation" --body "**Story Points:** 8" --label "epic:state-management,story-points:8,phase:3-advanced"
gh issue create --title "[AIKIT-23] Conversation summarization" --body "**Story Points:** 8" --label "epic:state-management,story-points:8,phase:3-advanced"
gh issue create --title "[AIKIT-24] Persistent user memory" --body "**Story Points:** 13" --label "epic:state-management,story-points:13,phase:3-advanced"
gh issue create --title "[AIKIT-25] React useConversation hook" --body "**Story Points:** 5" --label "epic:state-management,story-points:5,phase:1-mvp"
gh issue create --title "[AIKIT-26] Automatic usage tracking" --body "**Story Points:** 8" --label "epic:cost-observability,story-points:8,phase:1-mvp"
gh issue create --title "[AIKIT-27] Usage reports" --body "**Story Points:** 8" --label "epic:cost-observability,story-points:8,phase:1-mvp"
gh issue create --title "[AIKIT-28] Automatic instrumentation" --body "**Story Points:** 8" --label "epic:cost-observability,story-points:8,phase:3-advanced"
gh issue create --title "[AIKIT-29] Query monitoring events" --body "**Story Points:** 5" --label "epic:cost-observability,story-points:5,phase:3-advanced"
gh issue create --title "[AIKIT-30] Cost threshold alerts" --body "**Story Points:** 5" --label "epic:cost-observability,story-points:5,phase:3-advanced"

echo "Created issues 21-30!"
