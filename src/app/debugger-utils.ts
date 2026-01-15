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

                    // If ptrStar is empty, type might be "Node*" in rawType?
                    // But simplified regex assumes space before * or around name.
                    // Let's refine: "Node* next" -> rawType="Node", ptrStar="*", name="next" ?
                    // Actually my regex is: ([type]) \s* (\*?) \s* ([name])
                    // "Node* next" -> "Node" "*" "next"
                    // "Node *next" -> "Node" "*" "next"
                    // "Node next"  -> "Node" ""  "next"

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
        // Avoid re-definition if multiple structs have same name (unlikely in valid code but possible)
        // Also check for conflict with existing operators? We assume student code doesn't have them if we are doing this.
        // We use 'inline' or 'static' or just standard? Standard is fine for single file.

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
                // We pass the pointer and the type name
                generatedPrinters += `    _debug_update_heap_info(obj.${field.name}, "${field.targetType}");\n`;
            }

            // Value: We wrap in quotes to ensure valid JSON string values for simplicity
            // This avoids issues with unquoted hex or complex types
            generatedPrinters += `    os << "\\"" << obj.${field.name} << "\\"";\n`;
        });

        generatedPrinters += `    os << "}";\n`;
        generatedPrinters += `    return os;\n`;
        generatedPrinters += `}\n`;
    }

    // --- Pass 2: Instrument Function Bodies (Existing Logic) ---
    // Track if we are inside a function body
    let currentFunction: string | null = null;
    let braceLevel = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // --- 1. Detect Function Start ---
        // Only look for function start if we are at top level (braceLevel 0)
        // Regex: ReturnType Name(Args) {
        // Exclude kqdws: if, while, for, switch, catch
        // We match simplified pattern
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
            instrumentedFn += `    DEBUG_STEP(${i + 1});\n`; // Stop at function signature to show frame init

            // --- Instrument Parameters ---
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

        // Track braces
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;

        braceLevel += openBraces;
        braceLevel -= closeBraces;

        if (braceLevel === 0 && currentFunction) {
            currentFunction = null;
        }

        if (isFuncStart) {
            continue;
        }

        if (currentFunction) {
            // --- 2. Instrument variable declarations & Steps in function Body ---

            let newline = line;
            const trimmed = line.trim();

            if (trimmed.length > 0 && !trimmed.startsWith('//') && trimmed.includes(';')) {
                const stepCode = `DEBUG_STEP(${i + 1}); `;

                const varDeclRegex = /^\s*(?:const\s+)?(?:[a-zA-Z_:][\w:<>\s*&]*?)\s+(?:[*&]+\s*)?([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|;|\(|\{)/;
                const varMatch = line.match(varDeclRegex);

                const lineStart = trimmed.split(' ')[0];
                const ignoreStarts = ['typedef', 'using', 'template', 'return', 'co_return', 'co_yield', 'delete', 'throw'];
                const varKeywords = ['return', 'if', 'else', 'while', 'for', 'cout', 'cin', 'endl', 'break', 'continue', 'case', 'switch', 'default', 'true', 'false', 'nullptr'];

                if (varMatch && !varKeywords.includes(varMatch[1]) && !ignoreStarts.includes(lineStart)) {
                    const varName = varMatch[1];
                    const trackCode = ` DBG_TRACK(${varName}, ${varName});`;

                    if (!trimmed.startsWith('for')) {
                        newline = stepCode + line.replace(';', ';' + trackCode);
                    } else {
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

    return instrumentedFn + generatedPrinters;
}
