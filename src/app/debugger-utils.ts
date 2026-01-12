export function instrumentCode(code: string): string {
    // Simple instrumentation: Insert DEBUG_STEP(__LINE__) after semi-colons in main
    // This is a heuristic and won't be perfect for complex C++, but good for student code.

    const lines = code.split('\n');
    let instrumentedFn = "";
    let inMain = false;

    // Stack of active block scopes to handle simple nesting
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // --- 1. Detect Main ---
        if (line.includes('int main(')) {
            inMain = true;
            instrumentedFn += line + '\n';
            instrumentedFn += `    DBG_FUNC("main");\n`;
            instrumentedFn += `    DEBUG_STEP(${i + 2});\n`;
            braceCount = 1; // Assuming main() { is on this line or next. Simplified.
            continue;
        }

        // Simplified Brace Counting (very rough)
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        if (inMain) {
            // --- 2. Instrument variable declarations ---
            // Pattern: Type varName = content; OR Type varName;
            // Types: int, double, string, bool, Vector<...>, Grid<...>, etc.
            // We ignore comments //
            // We ignore strings "..." (too hard for regex, assuming simple code)

            let newline = line;

            // Regex explanation:
            // ^\s* : Start with whitespace
            // (?:[a-zA-Z0-9_<>:]+)\s+ : Type (simplified, allows Templates <>) and space
            // (?:[*&]\s*)? : Optional pointers/refs
            // ([a-zA-Z0-9_]+) : Variable Name (Group 1)
            // \s*(?:=.*|;)\s* : Assignment or semicolon
            // (?:$|//) : End of line or comment start

            const varDeclRegex = /^\s*(?:const\s+)?(?:[a-zA-Z0-9_<>:]+)\s+(?:[*&]\s*)?([a-zA-Z0-9_]+)\s*(?:=|;)/;
            const match = line.match(varDeclRegex);

            // Avoid keywords
            const keywords = ['return', 'if', 'else', 'while', 'for', 'cout', 'cin', 'endl'];

            if (match && !keywords.includes(match[1])) {
                const varName = match[1];
                // Inject tracker after the semi-colon
                // We use replace to insert specifically after the semi-colon to handle trailing comments correctly
                if (line.includes(';')) {
                    // CAUTION: This might mess up for loops: for(int i=0; i<10; i++)
                    // We should check if we are in a 'for' statement parentheses. 
                    // Simple heuristic: if line starts with 'for', skip.
                    if (!line.trim().startsWith('for') && !line.trim().startsWith('while')) {
                        const parts = line.split(';');
                        // Reconstruct line with tracking
                        // Only the first semicolon (simple decl)
                        // int x = 5; // comment -> int x = 5; DBG_TRACK(x, x); DEBUG_STEP... // comment

                        const beforeSemi = parts[0];
                        const afterSemi = parts.slice(1).join(';'); // rest

                        newline = `${beforeSemi}; DBG_TRACK(${varName}, ${varName}); DEBUG_STEP(${i + 1}); ${afterSemi}`;
                    } else {
                        // Still instrument steps for loops but don't track loop vars yet (too complex scope)
                        newline = line.replace(/;(\s*)(\/\/.*)?$/, `; DEBUG_STEP(${i + 1});$1$2`);
                    }
                }
            } else {
                // improved STEP injection: avoid injecting into "for (;;)"
                if (!line.trim().startsWith('for')) {
                    newline = line.replace(/;(\s*)(\/\/.*)?$/, `; DEBUG_STEP(${i + 1});$1$2`);
                }
            }

            instrumentedFn += newline + '\n';
        } else {
            instrumentedFn += line + '\n';
        }
    }

    return instrumentedFn;
}
