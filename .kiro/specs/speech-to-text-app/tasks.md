# Implementation Plan: Speech-to-Text Web Application

## Overview

This implementation plan breaks down the speech-to-text web application into discrete coding tasks. The application will be built using vanilla JavaScript, HTML, and CSS, with three main components: AudioRecorder, TranscriptionService, and UIController. Tasks are organized to build incrementally, starting with project structure, then core components, integration, and testing.

## Tasks

- [x] 1. Set up project structure and HTML foundation
  - Create index.html with the complete DOM structure as specified in design
  - Create styles.css for basic styling
  - Create main.js as the application entry point
  - Set up directory structure for components (js/components/)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 2. Implement AudioRecorder component
  - [x] 2.1 Create AudioRecorder class with core recording functionality
    - Implement constructor, start(), stop(), and getState() methods
    - Use MediaRecorder API to capture audio chunks
    - Handle microphone permission requests with getUserMedia()
    - Return audio Blob when recording stops
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1_
  
  - [x] 2.2 Add browser support detection
    - Implement static isSupported() method
    - Check for MediaRecorder and getUserMedia availability
    - _Requirements: 1.1_
  
  - [ ]* 2.3 Write property test for AudioRecorder
    - **Property 2: Recording Stop Produces Audio Blob**
    - **Validates: Requirements 1.4**
    - Verify that stopped recordings return valid Blob with supported MIME type and non-zero size

- [x] 3. Implement TranscriptionService component
  - [x] 3.1 Create TranscriptionService class with API communication
    - Implement constructor with apiKey parameter
    - Implement transcribe() method using fetch API
    - Build FormData with audio file and model parameters
    - Send POST request to Groq API endpoint
    - Parse JSON response and return transcribed text
    - Handle HTTP error responses (401, 429, 500+)
    - _Requirements: 2.1, 2.3, 3.1, 5.2, 5.3_
  
  - [x] 3.2 Add API key management
    - Implement setApiKey() method
    - _Requirements: 3.1_
  
  - [ ]* 3.3 Write property test for TranscriptionService
    - **Property 4: Transcription Service Sends Audio to API**
    - **Validates: Requirements 2.1**
    - Verify API requests include correct endpoint, method, and FormData structure
  
  - [ ]* 3.4 Write property test for API headers
    - **Property 10: API Requests Include Required Headers**
    - **Validates: Requirements 5.2, 5.3**
    - Verify Authorization and Content-Type headers are present in all requests

- [x] 4. Checkpoint - Ensure core components work independently
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement UIController component
  - [x] 5.1 Create UIController class with initialization
    - Implement constructor and init() method
    - Get references to all DOM elements
    - Initialize AudioRecorder and TranscriptionService instances
    - Load API key from localStorage on startup
    - Set up event listeners for all UI interactions
    - _Requirements: 3.2, 4.1, 4.2, 4.3, 4.4_
  
  - [x] 5.2 Implement recording control handlers
    - Implement handleTalkButtonPress() for mousedown/touchstart events
    - Implement handleTalkButtonRelease() for mouseup/touchend events
    - Call AudioRecorder.start() on press, AudioRecorder.stop() on release
    - Update UI state during recording
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_
  
  - [x] 5.3 Implement API key management handlers
    - Implement handleApiKeySubmit() method
    - Validate API key is not empty or whitespace-only
    - Save valid API key to localStorage
    - Update TranscriptionService with new key
    - Enable/disable TALK button based on API key presence
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 5.4 Implement UI state management methods
    - Implement updateStatus() to handle all states (ready, recording, processing, error)
    - Implement displayTranscription() to show transcribed text
    - Implement displayError() to show error messages
    - Update button appearance based on state
    - Show/hide loading indicators
    - _Requirements: 1.6, 2.2, 2.4, 4.2, 4.4, 4.5_
  
  - [ ]* 5.5 Write property test for UI state consistency
    - **Property 3: UI Reflects Application State**
    - **Validates: Requirements 1.6, 4.4, 4.5**
    - Verify UI displays correct status and button appearance for all application states

- [x] 6. Implement error handling across all components
  - [x] 6.1 Add microphone permission error handling
    - Catch getUserMedia() errors in AudioRecorder
    - Display appropriate error messages for permission denied
    - Handle MediaRecorder not supported scenario
    - _Requirements: 1.5_
  
  - [x] 6.2 Add API error handling in TranscriptionService
    - Handle network failures with try-catch
    - Check response status codes (401, 429, 500+)
    - Parse error responses from Groq API
    - Throw descriptive errors for each failure type
    - _Requirements: 2.3_
  
  - [x] 6.3 Wire error handling to UIController
    - Catch errors from AudioRecorder and TranscriptionService
    - Display user-friendly error messages via displayError()
    - Set status to 'error' appropriately
    - _Requirements: 1.5, 2.3_

- [x] 7. Implement complete recording-to-transcription flow
  - [x] 7.1 Wire AudioRecorder to TranscriptionService in UIController
    - On button release, get audio Blob from AudioRecorder
    - Pass Blob to TranscriptionService.transcribe()
    - Update status to 'processing' during API call
    - Display transcription result on success
    - Handle errors and display error messages
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [ ]* 7.2 Write property test for successful transcription flow
    - **Property 5: Successful Transcription Display**
    - **Validates: Requirements 2.2**
    - Verify transcribed text is displayed in output area for any successful API response
  
  - [ ]* 7.3 Write property test for processing state
    - **Property 6: Processing State Shows Loading Indicator**
    - **Validates: Requirements 2.4**
    - Verify loading indicator appears during transcription requests

- [x] 8. Add CSS styling for complete user experience
  - [x] 8.1 Style the TALK button with visual states
    - Style default, hover, active (held down), disabled, and recording states
    - Add visual indicator for recording state
    - _Requirements: 1.6, 4.2, 4.5_
  
  - [x] 8.2 Style remaining UI components
    - Style API key input section
    - Style status display and error messages
    - Style transcription output textarea
    - Add responsive layout for mobile devices
    - _Requirements: 4.1, 4.3, 4.4_

- [x] 9. Implement localStorage functionality
  - [x] 9.1 Add API key persistence
    - Save API key to localStorage on submit
    - Load API key from localStorage on page load
    - Handle missing or invalid stored keys
    - _Requirements: 3.2_
  
  - [ ]* 9.2 Write property test for API key storage
    - **Property 7: API Key Storage Round Trip**
    - **Validates: Requirements 3.2**
    - Verify stored API keys can be retrieved correctly
  
  - [ ]* 9.3 Write property test for empty API key validation
    - **Property 8: Empty API Key Validation**
    - **Validates: Requirements 3.3**
    - Verify empty or whitespace-only keys are rejected

- [x] 10. Add audio format validation
  - [x] 10.1 Verify audio format compatibility
    - Check MediaRecorder MIME type support on initialization
    - Ensure produced Blobs have Groq-compatible MIME types
    - Add fallback format selection if needed
    - _Requirements: 5.1_
  
  - [ ]* 10.2 Write property test for audio format
    - **Property 9: Audio Format Compatibility**
    - **Validates: Requirements 5.1**
    - Verify all produced audio Blobs have supported MIME types

- [ ] 11. Final integration and testing
  - [-] 11.1 Test complete user flow end-to-end
    - Test API key configuration flow
    - Test recording and transcription flow
    - Test all error scenarios
    - Test on multiple browsers (Chrome, Firefox, Safari)
    - _Requirements: All_
  
  - [ ]* 11.2 Write unit tests for edge cases
    - Test microphone permission denied
    - Test API failures (401, 429, 500)
    - Test empty recordings
    - Test concurrent recording attempts
    - Test special characters in transcription
  
  - [ ]* 11.3 Write integration tests
    - Test AudioRecorder to UIController communication
    - Test TranscriptionService to UIController communication
    - Test localStorage persistence across page reloads

- [ ] 12. Final checkpoint - Verify complete application
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The application uses vanilla JavaScript with no external frameworks
- All browser APIs (MediaRecorder, getUserMedia, fetch, localStorage) should be mocked for testing
- Focus on incremental progress - each task should result in working, testable code
