## ADDED Requirements

### Requirement: Perfunctory Answer Detection
The system SHALL evaluate whether a user's interview answer is perfunctory (敷衍) before proceeding to the next question.

#### Scenario: Short Acknowledgment Detected as 敷衍
- **WHEN** user submits an answer with fewer than 20 characters that contains only acknowledgments ("好的", "是的", "OK", "嗯", "I see")
- **THEN** the system SHALL prompt the user to expand their answer with a message like "请详细说明一下你的想法"

#### Scenario: Off-topic Answer Detected as 敷衍
- **WHEN** user submits an answer that does not address the question asked
- **THEN** the system SHALL prompt the user to answer the specific question

#### Scenario: Substantive Answer Proceeds
- **WHEN** user submits a substantive answer (>= 20 characters for non-knowledge questions or direct answer to factual question)
- **THEN** the system SHALL proceed to the next question

### Requirement: Re-prompt for 敷衍 Answers
When an answer is evaluated as 敷衍, the system SHALL ask the user to provide a more detailed response instead of advancing.

#### Scenario: User Provides Expanded Answer After Re-prompt
- **WHEN** system prompts for expansion and user provides a longer answer
- **THEN** the system SHALL evaluate the new answer and proceed if substantive

#### Scenario: User Skips Re-prompt
- **WHEN** user indicates they want to skip the re-prompt
- **THEN** the system SHALL proceed to the next question (allow skip)

### Requirement: No Output Irrelevant to Interview
The system SHALL NOT output any content unrelated to the interview process.

#### Scenario: No Greetings or Farewells in Chat
- **WHEN** interview is in progress
- **THEN** the system SHALL only output questions, re-prompts for 敷衍, and interview-related content
