## Why

The practice interview feature has 5 critical bugs affecting user experience:
1. AI continues asking questions after reaching the set number of rounds
2. No loading indicator when transitioning from interview to results page
3. Pass/fail result in results card doesn't match the detailed feedback content
4. Markdown content (code blocks) in feedback is displayed as raw text
5. Progress indicator lacks visual distinction between rounds

## What Changes

1. **Fix AI termination logic**: Notify AI when interview rounds are complete, prevent further questions
2. **Add loading state during result generation**: Show loading page while waiting for AI feedback generation
3. **Fix pass/fail result consistency**: Ensure displayed result matches actual feedback content
4. **Render markdown in feedback**: Use react-markdown to properly display formatted feedback
5. **Improve progress indicator**: Add color-coded visual distinction for completed/active/pending rounds

## Capabilities

### New Capabilities

- `markdown-renderer`: Display feedback with proper markdown rendering (code blocks, lists, emphasis)
- `rounds-progress-indicator`: Color-coded visual indicator for interview round progress

### Modified Capabilities

- `practice-interview-flow`: Fix interview state management, AI termination, and loading states

## Impact

- **Frontend**: `Practice.tsx`, `PracticeInterview.tsx`, `PracticeResults.tsx`
- **Dependencies**: Need to add `react-markdown` and `remark-gfm` for markdown rendering
