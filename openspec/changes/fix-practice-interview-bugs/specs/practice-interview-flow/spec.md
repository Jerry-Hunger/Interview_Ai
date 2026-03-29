## MODIFIED Requirements

### Requirement: Interview answer input visibility

The system SHALL hide the answer input area after the last question has been asked, preventing users from entering additional answers beyond the intended interview length.

#### Scenario: Answer input hidden on last question
- **WHEN** user is viewing the last question of the interview
- **THEN** the answer input Textarea and submit button SHALL NOT be rendered

#### Scenario: Answer input shown during intermediate questions
- **WHEN** user is answering any question except the last
- **THEN** the answer input Textarea and submit button SHALL be rendered

### Requirement: Loading state during result generation

The system SHALL display a loading indicator when the interview concludes and feedback is being generated.

#### Scenario: Loading page shown while awaiting results
- **WHEN** user submits answer for the final question
- **THEN** a full-screen loading page SHALL be displayed
- **AND** message "正在生成面试反馈，请稍候..." SHALL be shown
- **AND** a spinner or progress animation SHALL be visible

#### Scenario: Results displayed after loading
- **WHEN** the backend returns the interview results
- **THEN** the loading page SHALL be hidden
- **AND** the results page SHALL be displayed

### Requirement: AI termination on round completion

The system SHALL notify the AI when the interview has reached its configured number of rounds and prevent further question generation.

#### Scenario: AI receives termination signal on final round
- **WHEN** user submits answer for the final configured round
- **THEN** the API call SHALL include an explicit flag indicating interview completion
- **AND** the AI SHALL NOT generate additional questions after this submission

#### Scenario: No new questions after round limit
- **WHEN** the interview has completed all configured rounds
- **THEN** the system SHALL transition directly to the loading page
- **AND** no further questions SHALL be displayed
