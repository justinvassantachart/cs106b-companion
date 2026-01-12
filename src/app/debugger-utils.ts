export function instrumentCode(code: string): string {
    // Simple instrumentation: Insert DEBUG_STEP(__LINE__) after semi-colons in main
    // This is a heuristic and won't be perfect for complex C++, but good for student code.

    const lines = code.split('\n');
    let instrumentedFn = "";
    let inMain = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detect start of main
        if (line.includes('int main(')) {
            inMain = true;
            instrumentedFn += line + '\n';
            // Add step at start of main
            instrumentedFn += `    DEBUG_STEP(${i + 2});\n`;
            continue;
        }

        // Detect end of main (simple brace count or assume end of file for now?)
        // For simplicity, we just instrument everything inside braces if we are 'inMain'
        // A better parser would track braces. Let's do a simple bracing count.

        if (inMain) {
            // Find semi-colons that are not inside strings/comments (simplified)
            // We'll just replace ';' with '; DEBUG_STEP(__LINE__);' 
            // We use __LINE__ so the C++ compiler fills in the right line number roughly

            // This regex looks for a semicolon at the end of a line (ignoring comments)
            const instrumentedLine = line.replace(/;(\s*)(\/\/.*)?$/, `; DEBUG_STEP(${i + 1});$1$2`);
            instrumentedFn += instrumentedLine + '\n';
        } else {
            instrumentedFn += line + '\n';
        }
    }

    return instrumentedFn;
}
