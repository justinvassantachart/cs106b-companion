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
            const trimmed = line.trim();

            if (trimmed.length > 0 && !trimmed.startsWith('//') && trimmed.includes(';')) {
                // Determine if we should pause BEFORE

                const stepCode = `DEBUG_STEP(${i + 1}); `;

                // Improved Regex for Logic
                // 1. Prepend Step
                // 2. Check for Var Decl to Append Track

                // Regex to capture: Type, optional ptr, Name
                // Allows: "int* p", "int *p", "int p", "Vector<int> v"
                const varDeclRegex = /^\s*(?:const\s+)?(?:.+?)\s+(?:[*&]\s*)?([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|;|\(|\{)/;
                const varMatch = line.match(varDeclRegex);

                // Keywords to ignore for variable tracking
                const varKeywords = ['return', 'if', 'else', 'while', 'for', 'cout', 'cin', 'endl', 'break', 'continue', 'case', 'switch', 'default'];

                if (varMatch && !varKeywords.includes(varMatch[1])) {
                    // It is a variable declaration!
                    const varName = varMatch[1];
                    const trackCode = ` DBG_TRACK(${varName}, ${varName});`;

                    if (!trimmed.startsWith('for')) {
                        // Standard Declaration: "int x = 5;"
                        // Result: "DEBUG_STEP(..); int x = 5; DBG_TRACK(x, x);"
                        // We assume the line ends with semicolon or has one.
                        // We append trackCode after the FIRST semicolon found (heuristic).

                        newline = stepCode + line.replace(';', ';' + trackCode);
                    } else {
                        // For loop with decl: "for (int i = 0; ...)"
                        // We prepend step (pauses before loop).
                        // We DO NOT track 'i' yet because it is scoped to loop and tricky to insert DBG_TRACK inside (?)
                        // Actually, we can't easily insert DBG_TRACK inside specific for-loop parts syntax-wise without parsing.
                        // So we SKIP tracking for-loop variables for now.
                        newline = stepCode + line;
                    }
                } else {
                    // Not a declaration, just a statement (expression, return, etc)
                    // Result: "DEBUG_STEP(..); statement;"
                    newline = stepCode + line;
                }
            }

            instrumentedFn += newline + '\n';
        } else {
            instrumentedFn += line + '\n';
        }
    }

    return instrumentedFn;
}
