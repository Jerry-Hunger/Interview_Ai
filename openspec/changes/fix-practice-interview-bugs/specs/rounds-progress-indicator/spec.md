## ADDED Requirements

### Requirement: Color-coded rounds progress indicator

The system SHALL display a visual progress indicator for interview rounds with distinct colors to help users understand their progress.

#### Scenario: Completed round indicator
- **WHEN** a round has been completed
- **THEN** the indicator SHALL display green color
- **AND** show a checkmark or completed state

#### Scenario: Current active round indicator
- **WHEN** a round is currently in progress
- **THEN** the indicator SHALL display indigo/blue color
- **AND** pulse or highlight animation SHALL be visible

#### Scenario: Pending round indicator
- **WHEN** a round has not yet started
- **THEN** the indicator SHALL display gray color
- **AND** show the round number without completion state
