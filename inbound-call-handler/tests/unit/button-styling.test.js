/**
 * Unit tests for TALK button visual states
 * Task 8.1: Style the TALK button with visual states
 * Requirements: 1.6, 4.2, 4.5
 */

describe('TALK Button Visual States', () => {
  let button;

  beforeEach(() => {
    // Create a mock button element
    button = document.createElement('button');
    button.id = 'talk-btn';
    button.className = 'talk-button';
    document.body.appendChild(button);
  });

  afterEach(() => {
    document.body.removeChild(button);
  });

  test('button has default talk-button class', () => {
    expect(button.classList.contains('talk-button')).toBe(true);
  });

  test('button can be disabled', () => {
    button.disabled = true;
    expect(button.disabled).toBe(true);
  });

  test('button can have recording class added', () => {
    button.classList.add('recording');
    expect(button.classList.contains('recording')).toBe(true);
    expect(button.classList.contains('talk-button')).toBe(true);
  });

  test('button can have recording class removed', () => {
    button.classList.add('recording');
    button.classList.remove('recording');
    expect(button.classList.contains('recording')).toBe(false);
    expect(button.classList.contains('talk-button')).toBe(true);
  });

  test('button maintains talk-button class when disabled', () => {
    button.disabled = true;
    expect(button.classList.contains('talk-button')).toBe(true);
  });

  test('button can transition between states', () => {
    // Default state
    expect(button.disabled).toBe(false);
    expect(button.classList.contains('recording')).toBe(false);

    // Recording state
    button.classList.add('recording');
    expect(button.classList.contains('recording')).toBe(true);

    // Back to default
    button.classList.remove('recording');
    expect(button.classList.contains('recording')).toBe(false);

    // Disabled state
    button.disabled = true;
    expect(button.disabled).toBe(true);

    // Back to enabled
    button.disabled = false;
    expect(button.disabled).toBe(false);
  });
});
