/**
 * @fileoverview Prompt template loader for dynamic prompt generation
 * 
 * This module loads markdown prompt templates and replaces placeholders
 * with actual values, enabling dynamic prompt generation for different
 * use cases (e.g., translation with different languages and tones).
 * 
 * Template Format:
 * - Templates are stored as .md files in the prompts directory
 * - Variables use {{variableName}} syntax
 * - All occurrences of a variable are replaced globally
 * 
 * @requires fs
 * @requires path
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load and process a prompt template with variable substitution
 * 
 * Reads a markdown template file and replaces all {{variable}} placeholders
 * with the corresponding values from the variables object.
 * 
 * @param {string} templateName - Name of the template file (without .md extension)
 * @param {Object} variables - Key-value pairs for variable substitution
 * @returns {string} The processed prompt with all variables replaced
 * 
 * @example
 * const prompt = loadPrompt('translate', {
 *   message: 'Hello',
 *   language: 'es-ES',
 *   tone: 'formal'
 * });
 * // Returns the template with {{message}}, {{language}}, {{tone}} replaced
 */
function loadPrompt(templateName, variables) {
    // Read the markdown file
    const templatePath = join(__dirname, `${templateName}.md`);
    let template = readFileSync(templatePath, 'utf8');

    // Replace all variables
    Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, variables[key]);
    });

    return template;
}

export { loadPrompt };
