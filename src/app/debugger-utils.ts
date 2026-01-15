export function instrumentCode(code: string): string {
    const lines = code.split('\n');
    let instrumentedFn = "";

    // --- Pass 1: Scan for Structs/Classes ---
    interface FieldDef {
        type: string;
        name: string;
        isPointer: boolean;
        targetType?: string;
    }
    interface StructDef {
        name: string;
        fields: FieldDef[];
    }
    const structs: StructDef[] = [];

    let currentStruct: StructDef | null = null;
    let structBraceLevel = 0;
    let inStruct = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // Detect Struct Start
        // struct Name {  or  struct Name{
        const structStartRegex = /^\s*(?:struct|class)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\{/;
        const startMatch = trimmed.match(structStartRegex);

        if (!inStruct && startMatch) {
            inStruct = true;
            structBraceLevel = 1; // The { in the match
            currentStruct = { name: startMatch[1], fields: [] };
            continue;
        }

        if (inStruct) {
            // Count braces to find end
            const open = (line.match(/{/g) || []).length;
            const close = (line.match(/}/g) || []).length;
            structBraceLevel += open - close;

            if (structBraceLevel <= 0) {
                if (currentStruct) structs.push(currentStruct);
                currentStruct = null;
                inStruct = false;
                continue;
            }

            // Parse Fields
            // Type name; or Type* name; or Type *name;
            // Ignore methods, checking for (
            if (!trimmed.includes('(') && !trimmed.startsWith('//')) {
                // Regex: Type (pointer) Name ;
                const fieldRegex = /^\s*(?:const\s+)?([a-zA-Z0-9_:]+(?:<[^;]+>)?)\s*(\*?)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=\s*[^;]+)?;/;
                const fMatch = trimmed.match(fieldRegex);
                if (fMatch) {
                    const rawType = fMatch[1]; // e.g. "int" or "Node"
                    const ptrStar = fMatch[2]; // "*" or empty
                    const name = fMatch[3];    // "next"

                    if (currentStruct) {
                        currentStruct.fields.push({
                            type: rawType,
                            name: name,
                            isPointer: !!ptrStar || rawType.endsWith('*'),
                            targetType: rawType.replace('*', '').trim()
                        });
                    }
                }
            }
        }
    }

    // --- Pass 1.5: Generate JSON Printers for Structs ---
    // We generate a global operator<< for each discovered struct.
    // This allows the debugger to print "{ \"val\": \"42\", \"next\": \"0x...\" }"
    let generatedPrinters = "";
    for (const s of structs) {
        generatedPrinters += `\n// Auto-generated JSON printer for struct ${s.name}\n`;
        generatedPrinters += `std::ostream& operator<<(std::ostream& os, const ${s.name}& obj) {\n`;
        generatedPrinters += `    os << "{";\n`;

        s.fields.forEach((field, index) => {
            if (index > 0) generatedPrinters += `    os << ", ";\n`;
            // Key
            generatedPrinters += `    os << "\\" ${field.name}\\": ";\n`;

            // If pointer, trigger recursive update
            if (field.isPointer && field.targetType) {
                // _debug_update_heap_info is defined in stanford.h (shim)
                generatedPrinters += `    _debug_update_heap_info(obj.${field.name}, "${field.targetType}");\n`;
            }

            // Value
            generatedPrinters += `    os << "\\"" << obj.${field.name} << "\\"";\n`;
        });

        generatedPrinters += `    os << "}";\n`;
        generatedPrinters += `    return os;\n`;
        generatedPrinters += `}\n`;
    }

    // --- Pass 2 PRE-SCAN: Inject Comma Steps into For Loops ---
    // We do this via a separate pass or just careful lookahead. 
    // Let's modify 'lines' in place before the main instrumentation loop.
    // This simplifies the main loop which just thinks it's processing normal code (with extra commas).

    const handledLoops = new Set<number>(); // Set of line numbers (1-indexed) where 'for' starts

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('for') && line.includes('(')) {
            // Attempt to parse standard for loop
            let buffer = "";
            let k = i;
            let foundEnd = false;
            let pCount = 0;
            let endCol = -1;

            // Collect header until ')' that closes the for loop
            while (k < lines.length) {
                const txt = lines[k];
                const startOff = (k === i) ? txt.indexOf('(') : 0;

                for (let c = startOff; c < txt.length; c++) {
                    if (txt[c] === '(') pCount++;
                    else if (txt[c] === ')') {
                        pCount--;
                        if (pCount === 0 && (k > i || c > txt.indexOf('('))) { // Ensure we closed the main paren
                            foundEnd = true;
                            endCol = c;
                            break;
                        }
                    }
                }

                if (foundEnd) break;
                k++;
            }

            if (foundEnd) {
                // Analyze valid range i..k
                // We construct the full header string to check for semicolons
                let fullHeader = "";
                // Re-read carefully
                for (let r = i; r <= k; r++) {
                    fullHeader += lines[r]; // Simplified, preserving newlines might be needed for char counting if we were strict
                }
                // Check semicolons in the part inside parens
                // Locate the bounding parens in `fullHeader`
                const firstParen = fullHeader.indexOf('(');
                const lastParen = fullHeader.lastIndexOf(')'); // Approximate if there are trailing chars, but we want the matching one.

                // Let's use the `k` and `endCol` to find the exact injection point in `lines[k]`.
                // Verify semicolons:
                let semiCount = 0;
                let d = 0;
                // We can't easily count semicolons across multiple lines without reconstructing correctly.
                // Let's just trust that if we found a balanced paren group starting with 'for', it's the header.
                // We need to count ';' at depth 0.

                // Re-read carefully
                let tempBuf = "";
                for (let r = i; r <= k; r++) {
                    let s = lines[r];
                    if (r === k) s = s.substring(0, endCol + 1);
                    tempBuf += s;
                }

                // Scan tempBuf
                for (const ch of tempBuf) {
                    if (ch === '(') d++;
                    else if (ch === ')') d--;
                    else if (ch === ';' && d === 1) semiCount++; // Depth 1 because we are inside `for ( ... )`
                }

                if (semiCount === 2) {
                    // Standard Loop!
                    // Inject `, DEBUG_STEP(i+1)` before the closing paren `)` at `lines[k][endCol]`.
                    const targetLine = lines[k];

                    let hasIncr = false;
                    let p2 = tempBuf.lastIndexOf(')');
                    let s2 = tempBuf.lastIndexOf(';', p2);
                    if (s2 !== -1) {
                        const incrPart = tempBuf.substring(s2 + 1, p2);
                        if (incrPart.trim().length > 0) hasIncr = true;
                    }

                    // Try to extract loop variable for better visibility during pause
                    let injection = "";
                    const loopVarRegex = /for\s*\(\s*(?:(?:const\s+)?(?:unsigned\s+)?[\w:<>,*&]+\s+)?([a-zA-Z_][\w]*)\s*[=:]/;
                    const loopVarMatch = tempBuf.match(loopVarRegex);
                    const varName = loopVarMatch ? loopVarMatch[1] : null;

                    if (varName) {
                        injection = hasIncr ? `, _debug_loop_step(${i + 1}, "${varName}", ${varName})` : `_debug_loop_step(${i + 1}, "${varName}", ${varName})`;
                    } else {
                        injection = hasIncr ? `, DEBUG_STEP(${i + 1})` : `DEBUG_STEP(${i + 1})`;
                    }

                    const before = lines[k].substring(0, endCol);
                    const after = lines[k].substring(endCol);
                    lines[k] = before + injection + after;

                    handledLoops.add(i + 1); // Mark this loop (start line) as handled
                }
            }
        }
    }


    // --- Pass 2: Main Instrumentation ---
    // (Existing logic, but using handledLoops to suppress default loopback)

    let currentFunction: string | null = null;
    let braceLevel = 0;
    let pendingVar: string | null = null;
    const controlStack: number[] = [];
    let pendingForLine: number | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // --- 1. Detect Function Start ---
        const funcStartRegex = /^\s*(?:[\w<>:&*]+)\s+([\w]+)\s*\([^)]*\)\s*\{/;
        const match = line.match(funcStartRegex);
        const keywords = ['if', 'while', 'for', 'switch', 'catch', 'else', 'struct', 'class'];
        let isFuncStart = false;

        if (braceLevel === 0 && match && !keywords.includes(match[1])) {
            const funcName = match[1];
            currentFunction = funcName;
            isFuncStart = true;
            instrumentedFn += line + '\n';
            instrumentedFn += `    DBG_FUNC(${funcName});\n`;
            instrumentedFn += `    DEBUG_STEP(${i + 1});\n`;

            // Instrument Params 
            const argsContent = line.substring(line.indexOf('(') + 1, line.lastIndexOf(')'));
            if (argsContent.trim()) {
                const args = argsContent.split(',');
                for (const arg of args) {
                    const cleanArg = arg.trim();
                    const argMatch = cleanArg.match(/(?:[*&]+\s*)?([a-zA-Z_][a-zA-Z0-9_]*)\s*$/);
                    if (argMatch) {
                        const argName = argMatch[1];
                        instrumentedFn += `    DBG_TRACK(${argName}, ${argName});\n`;
                    }
                }
            }
        }

        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;
        braceLevel += openBraces;
        braceLevel -= closeBraces;

        if (braceLevel === 0 && currentFunction) {
            currentFunction = null;
            controlStack.length = 0;
            pendingForLine = null;
        }

        if (isFuncStart) {
            continue;
        }

        if (currentFunction) {
            let newline = line;
            const trimmed = line.trim();

            if (trimmed.length > 0 && !trimmed.startsWith('//')) {
                const varDeclRegex = /^\s*(?:const\s+)?(?:[a-zA-Z_:][\w:<>, \t*&]*?)\s+(?:[*&]+\s*)?([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|;|\(|\{)/;
                const varMatch = line.match(varDeclRegex);
                const hasSemicolon = trimmed.includes(';');
                const isForLoop = trimmed.startsWith('for');

                const isControlFlow = (trimmed.startsWith('if') || trimmed.startsWith('while') || trimmed.startsWith('switch')) && !trimmed.startsWith('else');
                let shouldStep = hasSemicolon || (varMatch && !isForLoop) || isControlFlow;

                if (trimmed.startsWith('}') && !hasSemicolon) {
                    shouldStep = false;
                }

                if (pendingVar) {
                    if (hasSemicolon) {
                        const trackCode = ` DBG_TRACK(${pendingVar}, ${pendingVar});`;
                        const stepCode = `DEBUG_STEP(${i + 1}); `;
                        newline = line.replace(';', ';' + trackCode + ' ' + stepCode);
                        pendingVar = null;
                        shouldStep = false;
                    }
                }

                if (shouldStep || isForLoop) {
                    const stepCode = `DEBUG_STEP(${i + 1}); `;
                    const lineStart = trimmed.split(/[ \t(]/)[0];
                    const ignoreStarts = ['typedef', 'using', 'template', 'return', 'co_return', 'co_yield', 'delete', 'throw'];
                    const varKeywords = ['return', 'if', 'else', 'while', 'for', 'cout', 'cin', 'endl', 'break', 'continue', 'case', 'switch', 'default', 'true', 'false', 'nullptr'];

                    if (varMatch && !varKeywords.includes(varMatch[1]) && !ignoreStarts.includes(lineStart)) {
                        const varName = varMatch[1];
                        if (hasSemicolon) {
                            if (!pendingVar) {
                                const trackCode = ` DBG_TRACK(${varName}, ${varName});`;
                                newline = stepCode + line.replace(';', ';' + trackCode);
                            } else {
                                newline = stepCode + newline;
                            }
                        } else {
                            pendingVar = varName;
                            newline = stepCode + line;
                        }
                    }
                    else if (isForLoop) {
                        // Original Logic: Add TRACK for loop var
                        let loopVarName = null;
                        const forVarRegex = /for\s*\(\s*(?:const\s+)?([\w:<>,*&\s]+?)\s+([a-zA-Z_][\w]*)\s*[=:]/;
                        const forMatch = trimmed.match(forVarRegex);
                        if (forMatch) {
                            loopVarName = forMatch[2];
                        }

                        if (loopVarName && line.includes('{')) {
                            newline = stepCode + line.replace('{', `{ DBG_TRACK(${loopVarName}, ${loopVarName});`);
                        } else {
                            newline = stepCode + line;
                        }
                    }
                    else {
                        if (pendingVar && hasSemicolon) {
                            newline = stepCode + newline;
                        } else {
                            newline = stepCode + line;
                        }
                    }
                }
            }

            // Loopback Injection
            const braceRegex = /[{}]/g;
            let match;
            let processedLine = "";
            let lastIdx = 0;

            while ((match = braceRegex.exec(newline)) !== null) {
                const char = match[0];
                const idx = match.index;
                processedLine += newline.substring(lastIdx, idx);

                if (char === '{') {
                    const preceding = newline.substring(lastIdx, idx);

                    if (/\bfor\s*\(/.test(preceding)) {
                        // It matches a for loop on THIS line.
                        // Was this loop handled?
                        if (handledLoops.has(i + 1)) {
                            controlStack.push(-1); // Handled, suppress loopback
                        } else {
                            controlStack.push(i + 1);
                        }
                        pendingForLine = null;
                    } else if (pendingForLine !== null) {
                        // Brace for a previous for loop line
                        if (handledLoops.has(pendingForLine)) {
                            controlStack.push(-1);
                        } else {
                            controlStack.push(pendingForLine);
                        }
                        pendingForLine = null;
                    } else {
                        controlStack.push(-1);
                    }

                    processedLine += '{';
                } else { // '}'
                    const startLine = controlStack.pop();
                    if (startLine && startLine > 0) {
                        processedLine += ` DEBUG_STEP(${startLine}); }`;
                    } else {
                        processedLine += '}';
                    }
                }
                lastIdx = idx + 1;
            }
            processedLine += newline.substring(lastIdx);

            if (trimmed.startsWith('for') && !processedLine.includes('{')) {
                pendingForLine = i + 1;
            }

            instrumentedFn += processedLine + '\n';
        }
        else {
            instrumentedFn += line + '\n';
        }
    }

    return instrumentedFn + generatedPrinters;
}
