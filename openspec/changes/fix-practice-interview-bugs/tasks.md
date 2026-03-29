## 1. Fix AI Termination and Input Visibility Bugs

- [x] 1.1 Review `PracticeInterview.tsx` line 380-454 to understand current conditional rendering
- [x] 1.2 Fix the `isLastQuestion` calculation logic in `PracticeInterview.tsx`
- [x] 1.3 Add explicit "interview complete" flag when submitting final round answer
- [x] 1.4 Test that answer input is hidden when on last question
- [x] 1.5 Test that AI does not generate new questions after final round

## 2. Add Loading Page for Results Transition

- [x] 2.1 Create LoadingPage component with spinner and message
- [x] 2.2 Add `isLoading` state variable to `Practice.tsx`
- [x] 2.3 Set `isLoading: true` before calling `/interview/conclude` API
- [x] 2.4 Set `isLoading: false` after receiving response
- [x] 2.5 Display LoadingPage component when `isLoading` is true

## 3. Fix Pass/Fail Result Consistency

- [x] 3.1 Check backend logic in `server/src/controllers/interviewController.js` for how `result` field is set
- [x] 3.2 Verify frontend display matches backend determination
- [x] 3.3 Test with sample interviews to confirm consistency

## 4. Add Markdown Rendering for Feedback

- [x] 4.1 Install `react-markdown` and `remark-gfm` dependencies
- [x] 4.2 Import `ReactMarkdown` in `PracticeResults.tsx`
- [x] 4.3 Replace plain text rendering with `<ReactMarkdown>` component
- [x] 4.4 Add necessary CSS styles for code blocks and other markdown elements
- [x] 4.5 Test that code blocks and lists render correctly

## 5. Improve Rounds Progress Indicator

- [x] 5.1 Review current progress display in `PracticeInterview.tsx`
- [x] 5.2 Create color-coded round indicators (green=completed, indigo=active, gray=pending)
- [x] 5.3 Add visual feedback for completed vs pending vs active rounds
- [x] 5.4 Test progress indicator updates correctly as interview progresses
