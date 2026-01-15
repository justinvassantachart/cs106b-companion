/**
 * Tree-sitter based C++ code instrumentation for debugging.
 * 
 * This module uses Tree-sitter's AST-based parsing to robustly instrument
 * C++ code for debugging, replacing the previous regex-based approach.
 */

import { Parser, Language, Tree, Node } from 'web-tree-sitter';

// Singleton parser instance
let parser: Parser | null = null;
let cppLanguage: Language | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the Tree-sitter parser with the C++ language grammar.
 * This should be called once before any instrumentation.
 */
export async function initTreeSitter(): Promise<void> {
    if (parser && cppLanguage) return;

    if (initPromise) {
        await initPromise;
        return;
    }

    initPromise = (async () => {
        console.log('[Debugger] Starting initialization...');

        try {
            // Fetch WASM binary manually and pass it
            console.log('[Debugger] Fetching WASM binary...');
            const wasmResponse = await fetch('/wasm/web-tree-sitter.wasm');
            if (!wasmResponse.ok) {
                throw new Error(`Failed to fetch web-tree-sitter.wasm: ${wasmResponse.status}`);
            }
            const wasmBinary = await wasmResponse.arrayBuffer();
            console.log('[Debugger] WASM binary fetched, size:', wasmBinary.byteLength);

            await Parser.init({
                locateFile: (scriptName: string) => {
                    console.log('[Debugger] locateFile called for:', scriptName);
                    return `/wasm/${scriptName}`;
                }
            });
            console.log('[Debugger] Parser.init() completed');

            parser = new Parser();
            console.log('[Debugger] Parser created, loading C++ language...');

            cppLanguage = await Language.load('/wasm/tree-sitter-cpp.wasm');
            console.log('[Debugger] C++ language loaded');

            parser.setLanguage(cppLanguage);
            console.log('[Debugger] C++ parser initialized successfully');
        } catch (error) {
            console.error('[Debugger] Initialization failed:', error);
            throw error;
        }
    })();

    await initPromise;
}

// ============================================================================
// Data Structures
// ============================================================================

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

interface CodeEdit {
    startIndex: number;
    endIndex: number;
    text: string;
    // For debugging: which line this edit applies to
    line?: number;
}

// ============================================================================
// AST Traversal Helpers
// ============================================================================

/**
 * Find a child node by field name
 */
function childByFieldName(node: Node, name: string): Node | null {
    return node.childForFieldName(name);
}

/**
 * Find all children with a specific type
 */
function childrenByType(node: Node, type: string): Node[] {
    const results: Node[] = [];
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child && child.type === type) {
            results.push(child);
        }
    }
    return results;
}

/**
 * Recursively find all nodes of given types
 */
function findAllByTypes(node: Node, types: string[]): Node[] {
    const results: Node[] = [];

    function walk(n: Node) {
        if (types.includes(n.type)) {
            results.push(n);
        }
        for (let i = 0; i < n.childCount; i++) {
            const child = n.child(i);
            if (child) walk(child);
        }
    }

    walk(node);
    return results;
}

/**
 * Get the line number (1-indexed) for a given byte offset
 */
function getLineForOffset(source: string, offset: number): number {
    let line = 1;
    for (let i = 0; i < offset && i < source.length; i++) {
        if (source[i] === '\n') line++;
    }
    return line;
}

// ============================================================================
// Struct Detection
// ============================================================================

function findStructs(tree: Tree): StructDef[] {
    const structs: StructDef[] = [];
    const structNodes = findAllByTypes(tree.rootNode, ['struct_specifier', 'class_specifier']);

    for (const node of structNodes) {
        // Get struct/class name
        const nameNode = childByFieldName(node, 'name');
        if (!nameNode) continue;

        const name = nameNode.text;
        const fields: FieldDef[] = [];

        // Find field_declaration_list (the body)
        const bodyNode = childByFieldName(node, 'body');
        if (!bodyNode) continue;

        // Find all field_declaration nodes
        const fieldDecls = childrenByType(bodyNode, 'field_declaration');

        for (const fieldDecl of fieldDecls) {
            // Skip if it looks like a method (has function_declarator or parameter_list somewhere)
            if (fieldDecl.text.includes('(')) continue;

            // Get the type
            const typeNode = childByFieldName(fieldDecl, 'type');
            if (!typeNode) continue;

            // Get the declarator (field name)
            const declaratorNode = childByFieldName(fieldDecl, 'declarator');
            if (!declaratorNode) continue;

            // Handle pointer declarators
            let fieldName = '';
            let isPointer = false;

            if (declaratorNode.type === 'pointer_declarator') {
                isPointer = true;
                // The actual name is nested inside
                const innerDecl = childByFieldName(declaratorNode, 'declarator');
                fieldName = innerDecl ? innerDecl.text : declaratorNode.text.replace('*', '').trim();
            } else {
                fieldName = declaratorNode.text;
            }

            // Check if type itself ends with * or is a pointer_type node
            const typeText = typeNode.text;
            if (typeText.endsWith('*') || typeNode.type === 'pointer_type') {
                isPointer = true;
            }

            fields.push({
                type: typeText.replace('*', '').trim(),
                name: fieldName,
                isPointer: isPointer,
                targetType: isPointer ? typeText.replace('*', '').trim() : undefined
            });
        }

        if (fields.length > 0) {
            structs.push({ name, fields });
        }
    }

    return structs;
}

/**
 * Generate operator<< overloads for structs to enable JSON-like printing
 */
function generateStructPrinters(structs: StructDef[]): string {
    let output = '';

    for (const s of structs) {
        output += `\n// Auto-generated JSON printer for struct ${s.name}\n`;
        output += `std::ostream& operator<<(std::ostream& os, const ${s.name}& obj) {\n`;
        output += `    os << "{";\n`;

        s.fields.forEach((field, index) => {
            if (index > 0) output += `    os << ", ";\n`;
            output += `    os << "\\" ${field.name}\\": ";\n`;

            // If pointer, trigger recursive heap update
            if (field.isPointer && field.targetType) {
                output += `    _debug_update_heap_info(obj.${field.name}, "${field.targetType}");\n`;
            }

            output += `    os << "\\"" << obj.${field.name} << "\\"";\n`;
        });

        output += `    os << "}";\n`;
        output += `    return os;\n`;
        output += `}\n`;
    }

    return output;
}

// ============================================================================
// Function Detection and Instrumentation
// ============================================================================

interface FunctionInfo {
    name: string;
    node: Node;
    bodyNode: Node;
    parameters: string[];
    startLine: number;
}

function findFunctions(tree: Tree, source: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const funcNodes = findAllByTypes(tree.rootNode, ['function_definition']);

    for (const node of funcNodes) {
        // Get the declarator which contains the function name
        const declaratorNode = childByFieldName(node, 'declarator');
        if (!declaratorNode) continue;

        // Extract function name - the declarator might be a function_declarator
        let name = '';
        let paramList: Node | null = null;

        if (declaratorNode.type === 'function_declarator') {
            const nameDecl = childByFieldName(declaratorNode, 'declarator');
            name = nameDecl ? nameDecl.text : '';
            paramList = childByFieldName(declaratorNode, 'parameters');
        } else {
            name = declaratorNode.text;
        }

        // Skip if no name or if it's a reserved keyword
        const keywords = ['if', 'while', 'for', 'switch', 'catch', 'else', 'struct', 'class'];
        if (!name || keywords.includes(name)) continue;

        // Get function body
        const bodyNode = childByFieldName(node, 'body');
        if (!bodyNode || bodyNode.type !== 'compound_statement') continue;

        // Extract parameters
        const parameters: string[] = [];
        if (paramList) {
            const paramDecls = childrenByType(paramList, 'parameter_declaration');
            for (const param of paramDecls) {
                const paramDeclarator = childByFieldName(param, 'declarator');
                if (paramDeclarator) {
                    // Handle pointer/reference declarators
                    let paramName = paramDeclarator.text;
                    if (paramDeclarator.type === 'pointer_declarator' || paramDeclarator.type === 'reference_declarator') {
                        const inner = childByFieldName(paramDeclarator, 'declarator');
                        paramName = inner ? inner.text : paramName.replace(/[*&]/g, '').trim();
                    }
                    parameters.push(paramName);
                }
            }
        }

        functions.push({
            name,
            node,
            bodyNode,
            parameters,
            startLine: getLineForOffset(source, node.startIndex)
        });
    }

    return functions;
}

// ============================================================================
// Loop Detection
// ============================================================================

interface LoopInfo {
    type: 'for' | 'for_range' | 'while';
    node: Node;
    bodyNode: Node | null;
    startLine: number;
    loopVar?: string;
    // For standard for loops, we inject into the incrementor
    hasIncrement?: boolean;
    incrementEndIndex?: number;
    closingParenIndex?: number;
}

function findLoops(tree: Tree, source: string): LoopInfo[] {
    const loops: LoopInfo[] = [];
    const loopNodes = findAllByTypes(tree.rootNode, ['for_statement', 'for_range_loop', 'while_statement']);

    for (const node of loopNodes) {
        const startLine = getLineForOffset(source, node.startIndex);
        const bodyNode = childByFieldName(node, 'body');

        if (node.type === 'for_statement') {
            // Standard for loop: for (init; condition; update) body
            // We want to inject into the update section

            // Find the closing paren of the for header
            let closingParen: Node | null = null;
            for (let i = 0; i < node.childCount; i++) {
                const child = node.child(i);
                if (child && child.type === ')') {
                    closingParen = child;
                    break;
                }
            }

            // Find the update expression
            const updateNode = childByFieldName(node, 'update');

            // Extract loop variable from initializer
            let loopVar: string | undefined;
            const initNode = childByFieldName(node, 'initializer');
            if (initNode) {
                // Look for declaration or assignment in init
                const declNodes = findAllByTypes(initNode, ['init_declarator', 'identifier']);
                for (const d of declNodes) {
                    if (d.type === 'init_declarator') {
                        const declr = childByFieldName(d, 'declarator');
                        if (declr) {
                            loopVar = declr.text;
                            break;
                        }
                    } else if (d.type === 'identifier' && !loopVar) {
                        loopVar = d.text;
                    }
                }
            }

            loops.push({
                type: 'for',
                node,
                bodyNode,
                startLine,
                loopVar,
                hasIncrement: !!updateNode && updateNode.text.trim().length > 0,
                incrementEndIndex: updateNode ? updateNode.endIndex : undefined,
                closingParenIndex: closingParen ? closingParen.startIndex : undefined
            });

        } else if (node.type === 'for_range_loop') {
            // Range-based for: for (decl : range) body
            // Extract the loop variable
            let loopVar: string | undefined;
            const declNode = childByFieldName(node, 'declarator');
            if (declNode) {
                if (declNode.type === 'reference_declarator') {
                    const inner = childByFieldName(declNode, 'declarator');
                    loopVar = inner ? inner.text : declNode.text.replace('&', '').trim();
                } else {
                    loopVar = declNode.text;
                }
            }

            loops.push({
                type: 'for_range',
                node,
                bodyNode,
                startLine,
                loopVar
            });

        } else if (node.type === 'while_statement') {
            loops.push({
                type: 'while',
                node,
                bodyNode,
                startLine
            });
        }
    }

    return loops;
}

// ============================================================================
// Variable Declaration Detection
// ============================================================================

interface VarDeclInfo {
    name: string;
    node: Node;
    line: number;
    insertAfterIndex: number;  // Where to insert tracking code
}

function findVariableDeclarations(bodyNode: Node, source: string): VarDeclInfo[] {
    const vars: VarDeclInfo[] = [];

    // We look for declaration nodes inside the function body
    const declNodes = findAllByTypes(bodyNode, ['declaration']);

    for (const node of declNodes) {
        // Skip if this is inside a for loop header
        let parent = node.parent;
        let skipNode = false;
        while (parent) {
            if (parent.type === 'for_statement') {
                // Check if this declaration is the initializer
                const initNode = childByFieldName(parent, 'initializer');
                if (initNode && node.startIndex >= initNode.startIndex && node.endIndex <= initNode.endIndex) {
                    skipNode = true;
                    break;
                }
            }
            parent = parent.parent;
        }
        if (skipNode) continue;

        // Find the declarator to get variable name
        const initDecls = findAllByTypes(node, ['init_declarator']);
        for (const initDecl of initDecls) {
            const declaratorNode = childByFieldName(initDecl, 'declarator');
            if (declaratorNode) {
                let varName = declaratorNode.text;
                // Handle pointer/reference declarators
                if (declaratorNode.type === 'pointer_declarator' || declaratorNode.type === 'reference_declarator') {
                    const inner = childByFieldName(declaratorNode, 'declarator');
                    varName = inner ? inner.text : varName.replace(/[*&]/g, '').trim();
                }

                vars.push({
                    name: varName,
                    node,
                    line: getLineForOffset(source, node.startIndex),
                    insertAfterIndex: node.endIndex
                });
            }
        }

        // Also handle simple declarations without initialization
        if (initDecls.length === 0) {
            const declaratorNode = childByFieldName(node, 'declarator');
            if (declaratorNode) {
                let varName = declaratorNode.text;
                if (declaratorNode.type === 'pointer_declarator' || declaratorNode.type === 'reference_declarator') {
                    const inner = childByFieldName(declaratorNode, 'declarator');
                    varName = inner ? inner.text : varName.replace(/[*&]/g, '').trim();
                }

                vars.push({
                    name: varName,
                    node,
                    line: getLineForOffset(source, node.startIndex),
                    insertAfterIndex: node.endIndex
                });
            }
        }
    }

    return vars;
}

// ============================================================================
// Statement Line Detection (for DEBUG_STEP) - Recursive
// ============================================================================

/**
 * Recursively find all statements that need DEBUG_STEP instrumentation,
 * including statements inside control flow bodies (if, for, while, switch).
 */
function findStatementsToInstrument(bodyNode: Node, source: string): { line: number; insertIndex: number }[] {
    const statements: { line: number; insertIndex: number }[] = [];
    collectStatementsRecursively(bodyNode, source, statements);
    return statements;
}

/**
 * Helper to recursively collect statements from a compound_statement or single statement.
 */
function collectStatementsRecursively(
    node: Node,
    source: string,
    statements: { line: number; insertIndex: number }[]
): void {
    // If this is a compound_statement (block with braces), process its children
    if (node.type === 'compound_statement') {
        for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            if (!child) continue;

            // Skip braces
            if (child.type === '{' || child.type === '}') continue;

            processStatement(child, source, statements);
        }
    } else {
        // Single statement (no braces) - process it directly
        processStatement(node, source, statements);
    }
}

/**
 * Process a single statement node - add DEBUG_STEP and recurse into control flow bodies.
 */
function processStatement(
    child: Node,
    source: string,
    statements: { line: number; insertIndex: number }[]
): void {
    const line = getLineForOffset(source, child.startIndex);

    // Statement types that need DEBUG_STEP
    const instrumentableTypes = [
        'expression_statement',
        'declaration',
        'return_statement',
        'if_statement',
        'for_statement',
        'for_range_loop',
        'while_statement',
        'do_statement',
        'switch_statement',
        'break_statement',
        'continue_statement',
    ];

    if (instrumentableTypes.includes(child.type)) {
        statements.push({
            line,
            insertIndex: child.startIndex
        });
    }

    // Recursively process bodies of control flow statements
    if (child.type === 'if_statement') {
        // Process the "then" branch (consequence)
        const consequence = childByFieldName(child, 'consequence');
        if (consequence) {
            collectStatementsRecursively(consequence, source, statements);
        }

        // Process the "else" branch (alternative) if it exists
        const alternative = childByFieldName(child, 'alternative');
        if (alternative) {
            // The alternative might be another if_statement (else if) or a compound_statement
            if (alternative.type === 'if_statement') {
                // else if - process as a statement (will add DEBUG_STEP) and recurse
                processStatement(alternative, source, statements);
            } else {
                collectStatementsRecursively(alternative, source, statements);
            }
        }
    } else if (child.type === 'for_statement' || child.type === 'for_range_loop' || child.type === 'while_statement' || child.type === 'do_statement') {
        const body = childByFieldName(child, 'body');
        if (body) {
            collectStatementsRecursively(body, source, statements);
        }
    } else if (child.type === 'switch_statement') {
        const body = childByFieldName(child, 'body');
        if (body) {
            // Switch body contains case_statement nodes
            for (let i = 0; i < body.childCount; i++) {
                const caseNode = body.child(i);
                if (!caseNode) continue;

                if (caseNode.type === 'case_statement') {
                    // Process statements inside the case (skip the case label itself)
                    for (let j = 0; j < caseNode.childCount; j++) {
                        const caseChild = caseNode.child(j);
                        if (!caseChild) continue;

                        // Skip the case label (e.g., "case 1:" or "default:")
                        if (caseChild.type === 'case' || caseChild.type === 'default' || caseChild.type === ':') continue;

                        // Skip the condition value after 'case'
                        if (caseChild.previousSibling?.type === 'case') continue;

                        processStatement(caseChild, source, statements);
                    }
                }
            }
        }
    }
}

// ============================================================================
// Main Instrumentation Function
// ============================================================================

export function instrumentCode(code: string): string {
    if (!parser || !cppLanguage) {
        console.error('[Debugger] Parser not initialized. Call initTreeSitter() first.');
        // Fall back to returning the code as-is (or could throw)
        return code;
    }

    const tree = parser.parse(code);
    if (!tree) {
        console.error('[Debugger] Failed to parse code.');
        return code;
    }

    const edits: CodeEdit[] = [];

    // 1. Find and process structs
    const structs = findStructs(tree);

    // 2. Find functions
    const functions = findFunctions(tree, code);

    // 3. For each function, instrument it
    for (const func of functions) {
        const bodyNode = func.bodyNode;

        // Insert DBG_FUNC at the start of function body
        const openBrace = bodyNode.child(0);
        if (openBrace && openBrace.type === '{') {
            let injection = ` DBG_FUNC(${func.name}); DEBUG_STEP(${func.startLine});`;

            // Add parameter tracking
            for (const param of func.parameters) {
                injection += ` DBG_TRACK(${param}, ${param});`;
            }

            edits.push({
                startIndex: openBrace.endIndex,
                endIndex: openBrace.endIndex,
                text: injection,
                line: func.startLine
            });
        }

        // Find all loops in this function and instrument them
        const loops = findLoops(tree, code).filter(l =>
            l.node.startIndex >= bodyNode.startIndex &&
            l.node.endIndex <= bodyNode.endIndex
        );

        for (const loop of loops) {
            // Inject DEBUG_STEP before the loop
            edits.push({
                startIndex: loop.node.startIndex,
                endIndex: loop.node.startIndex,
                text: `DEBUG_STEP(${loop.startLine}); `,
                line: loop.startLine
            });

            // For standard for loops, inject step into the incrementor
            if (loop.type === 'for' && loop.closingParenIndex !== undefined) {
                const injection = loop.loopVar
                    ? (loop.hasIncrement
                        ? `, _debug_loop_step(${loop.startLine}, "${loop.loopVar}", ${loop.loopVar})`
                        : `_debug_loop_step(${loop.startLine}, "${loop.loopVar}", ${loop.loopVar})`)
                    : (loop.hasIncrement
                        ? `, DEBUG_STEP(${loop.startLine})`
                        : `DEBUG_STEP(${loop.startLine})`);

                edits.push({
                    startIndex: loop.closingParenIndex,
                    endIndex: loop.closingParenIndex,
                    text: injection,
                    line: loop.startLine
                });
            }

            // For loop body: inject tracking for loop variable and loopback
            if (loop.bodyNode) {
                if (loop.bodyNode.type === 'compound_statement') {
                    // Has braces
                    const openBrace = loop.bodyNode.child(0);
                    if (openBrace && openBrace.type === '{') {
                        let bodyInjection = '';
                        if (loop.loopVar && (loop.type === 'for_range' || loop.type === 'for')) {
                            bodyInjection += ` DBG_TRACK(${loop.loopVar}, ${loop.loopVar});`;
                        }

                        if (bodyInjection) {
                            edits.push({
                                startIndex: openBrace.endIndex,
                                endIndex: openBrace.endIndex,
                                text: bodyInjection,
                                line: loop.startLine
                            });
                        }
                    }

                    // Add loopback step before closing brace (for range-based and while)
                    if (loop.type !== 'for') { // Standard for loops handle this in incrementor
                        const closeBrace = loop.bodyNode.child(loop.bodyNode.childCount - 1);
                        if (closeBrace && closeBrace.type === '}') {
                            edits.push({
                                startIndex: closeBrace.startIndex,
                                endIndex: closeBrace.startIndex,
                                text: ` DEBUG_STEP(${loop.startLine}); `,
                                line: loop.startLine
                            });
                        }
                    }
                } else {
                    // Single statement body - wrap with braces
                    const bodyStart = loop.bodyNode.startIndex;
                    const bodyEnd = loop.bodyNode.endIndex;

                    let prefix = '{ ';
                    if (loop.loopVar) {
                        prefix += `DBG_TRACK(${loop.loopVar}, ${loop.loopVar}); `;
                    }

                    edits.push({
                        startIndex: bodyStart,
                        endIndex: bodyStart,
                        text: prefix,
                        line: loop.startLine
                    });

                    let suffix = '';
                    if (loop.type !== 'for') {
                        suffix = ` DEBUG_STEP(${loop.startLine});`;
                    }
                    suffix += ' }';

                    edits.push({
                        startIndex: bodyEnd,
                        endIndex: bodyEnd,
                        text: suffix,
                        line: loop.startLine
                    });
                }
            }
        }

        // Find variable declarations and add tracking
        const varDecls = findVariableDeclarations(bodyNode, code);
        for (const varDecl of varDecls) {
            // Check if this var is already handled by a loop
            const isLoopVar = loops.some(l => l.loopVar === varDecl.name);
            if (!isLoopVar) {
                edits.push({
                    startIndex: varDecl.insertAfterIndex,
                    endIndex: varDecl.insertAfterIndex,
                    text: ` DBG_TRACK(${varDecl.name}, ${varDecl.name});`,
                    line: varDecl.line
                });
            }
        }

        // Find statements that need DEBUG_STEP
        const statements = findStatementsToInstrument(bodyNode, code);
        for (const stmt of statements) {
            // Check if we already have an edit for this location (from loops etc)
            const hasExistingEdit = edits.some(e =>
                Math.abs(e.startIndex - stmt.insertIndex) < 5 && e.text.includes('DEBUG_STEP')
            );

            if (!hasExistingEdit) {
                edits.push({
                    startIndex: stmt.insertIndex,
                    endIndex: stmt.insertIndex,
                    text: `DEBUG_STEP(${stmt.line}); `,
                    line: stmt.line
                });
            }
        }
    }

    // Apply edits in reverse order to preserve offsets
    edits.sort((a, b) => b.startIndex - a.startIndex);

    let result = code;
    for (const edit of edits) {
        result = result.slice(0, edit.startIndex) + edit.text + result.slice(edit.endIndex);
    }

    // Append struct printers at the end
    result += generateStructPrinters(structs);

    return result;
}

/**
 * Check if Tree-sitter has been initialized
 */
export function isTreeSitterReady(): boolean {
    return parser !== null && cppLanguage !== null;
}
