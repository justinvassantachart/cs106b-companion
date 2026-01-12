export function instrumentCode(code: string): string {
    const lines = code.split('\n');
    let instrumentedFn = "";

    // Track if we are inside a function body
    let currentFunction: string | null = null;
    let braceLevel = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // --- 1. Detect Function Start ---
        // Only look for function start if we are at top level (braceLevel 0)
        // Regex: ReturnType Name(Args) {
        // Exclude kqdws: if, while, for, switch, catch
        const funcStartRegex = /^\s*(?:[\w<>:&*]+)\s+([\w]+)\s*\([^)]*\)\s*\{/;
        const match = line.match(funcStartRegex);

        const keywords = ['if', 'while', 'for', 'switch', 'catch', 'else'];

        let isFuncStart = false;

        if (braceLevel === 0 && match && !keywords.includes(match[1])) {
            const funcName = match[1];
            currentFunction = funcName;
            isFuncStart = true;
            instrumentedFn += line + '\n';
            instrumentedFn += `    DBG_FUNC(${funcName});\n`;
            instrumentedFn += `    DEBUG_STEP(${i + 2});\n`; // Step at start of function
        }

        // Track braces
        // We do this AFTER processing function start line output to avoid messing up the injection order?
        // Actually, if we just output the line above, we are good.
        // Check braces in the current line
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;

        braceLevel += openBraces;
        braceLevel -= closeBraces;

        if (braceLevel === 0 && currentFunction) {
            // We just exited the function
            currentFunction = null;
        }

        if (isFuncStart) {
            continue; // Already handled
        }

        if (currentFunction) {
            // --- 2. Instrument variable declarations & Steps in function Body ---

            let newline = line;

            const varDeclRegex = /^\s*(?:const\s+)?(?:[a-zA-Z0-9_<>:]+)\s+(?:[*&]\s*)?([a-zA-Z0-9_]+)\s*(?:=|;)/;
            const varMatch = line.match(varDeclRegex);

            // Avoid keywords for vars
            const varKeywords = ['return', 'if', 'else', 'while', 'for', 'cout', 'cin', 'endl', 'break', 'continue', 'case'];

            if (varMatch && !varKeywords.includes(varMatch[1])) {
                const varName = varMatch[1];
                if (line.includes(';')) {
                    if (!line.trim().startsWith('for') && !line.trim().startsWith('while')) {
                        const parts = line.split(';');
                        const beforeSemi = parts[0];
                        const afterSemi = parts.slice(1).join(';');
                        // Preserve whitespace?
                        newline = `${beforeSemi}; DBG_TRACK(${varName}, ${varName}); DEBUG_STEP(${i + 1}); ${afterSemi}`;
                    } else {
                        newline = line.replace(/;(\s*)(\/\/.*)?$/, `; DEBUG_STEP(${i + 1});$1$2`);
                    }
                }
            } else {
                if (!line.trim().startsWith('for') && line.trim().length > 0 && !line.trim().startsWith('//')) {
                    // Only instrument lines with semicolons (statements)
                    if (line.includes(';')) {
                        newline = line.replace(/;(\s*)(\/\/.*)?$/, `; DEBUG_STEP(${i + 1});$1$2`);
                    }
                }
            }

            instrumentedFn += newline + '\n';
        } else {
            instrumentedFn += line + '\n';
        }
    }

    return instrumentedFn;
}
