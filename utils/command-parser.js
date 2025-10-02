/**
 * @fileoverview Command parser for Slack slash command arguments
 * 
 * Parses command text from Slack slash commands into structured data
 * with options/flags and positional arguments. Supports quoted strings
 * and flag-based arguments.
 * 
 * Example Usage:
 * - Input: "hello world --to es-ES --tone formal"
 * - Output: { options: { to: 'es-ES', tone: 'formal', _: ['hello', 'world'] }, ... }
 * 
 * @requires yargs-parser
 */

// utils/command-parser.js
import parser from 'yargs-parser';

/**
 * Parse Slack command text into structured arguments
 * 
 * Extracts flags, options, and positional arguments from command text.
 * Handles quoted strings and provides default values for known options.
 * 
 * @param {string} text - The raw command text from Slack (e.g., "message --to en-US --tone formal")
 * @returns {Object} Parsed command structure
 * @returns {Object} return.options - Parsed options with flags (includes _ array for positional args)
 * @returns {string} return.text - Reconstructed text from positional arguments
 * @returns {Array<string>} return.flags - Array of flag names found (excluding '_')
 * 
 * @example
 * const result = parseCommand('translate this --to es-ES --tone formal');
 * // {
 * //   options: { to: 'es-ES', tone: 'formal', _: ['translate', 'this'] },
 * //   text: 'translate this',
 * //   flags: ['to', 'tone']
 * // }
 */
const parseCommand = (text) => {
  // Split command text into argv array
  const argv = text.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

  const parsed = parser(argv, {
    string: ['to', 'tone'],
    default: {
      to: 'en-US',
      tone: 'neutral'
    }
  });

  return {
    options: parsed,
    text: parsed._.join(' '),
    flags: Object.keys(parsed).filter(k => k !== '_')
  };
}

export { parseCommand };
