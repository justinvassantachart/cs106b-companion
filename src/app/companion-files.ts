

export interface CompanionFile {
    id: string;
    title: string;
    description: string;
    srcPath?: string;
    starterCode?: string;
    group?: string;
}

export const FILES: CompanionFile[] = [
    {
        id: 'references-available-upon-request',
        title: 'References Available Upon Request',
        group: 'Section 1',
        description: 'References available upon request.',
        srcPath: 'assets/problems/references-available-upon-request.cpp'
    },
    {
        id: 'grid-traversal',
        title: 'Grid Traversal',
        group: 'Getting Started',
        description: 'Create a 3x3 Grid and fill it with values.',
        srcPath: 'assets/problems/grid-traversal.cpp'
    },
    {
        id: 'program-analysis',
        title: 'Program analysis: C++isms you should know',
        group: 'Section 1',
        description: 'Convert a string to Pig Latin.',
        srcPath: 'assets/problems/program-analysis.cpp'
    },
    {
        id: 'pig-latin',
        title: 'Pig Latin',
        group: 'Section 1',
        description: 'Convert a string to Pig Latin.',
        srcPath: 'assets/problems/pig-latin.cpp'
    },
    {
        id: 'debugging-deduplicating',
        title: 'Debugging Deduplicating',
        group: 'Section 1',
        description: 'Convert a string to Pig Latin.',
        srcPath: 'assets/problems/debugging-deduplicating.cpp'
    },
    {
        id: 'heap-visualizer',
        title: 'Heap Visualizer',
        group: 'Getting Started',
        description: 'Learn how to use the Stanford Vector class. Add elements and print them.',
        srcPath: 'assets/problems/heap-visualizer.cpp'
    },
    {
        id: 'map-frequency',
        title: 'Map Frequency',
        group: 'Getting Started',
        description: 'Count the frequency of characters in a string.',
        srcPath: 'assets/problems/map-frequency.cpp'
    },
    {
        id: 'testing-framework',
        title: 'Testing Framework',
        group: 'Getting Started',
        description: 'Learn how to use EXPECT_EQUAL to write simple tests.',
        srcPath: 'assets/problems/testing-framework.cpp'
    },
    {
        id: 'strlib-test',
        title: 'String Library Test',
        group: 'Getting Started',
        description: 'Verify Stanford String Library functions.',
        srcPath: 'assets/problems/strlib-test.cpp'
    },
    {
        id: 'recursion-test',
        title: 'Recursion Test',
        group: 'Getting Started',
        description: 'Simple recursion example to test debugger.',
        srcPath: 'assets/problems/recursion-test.cpp'
    },
    {
        id: 'control-flow-test',
        title: 'Control Flow Test',
        group: 'Getting Started',
        description: 'Test debugger stepping in for loops, if/else, while, and switch.',
        srcPath: 'assets/problems/control-flow-test.cpp'
    }
];

export const SECTION_2_FILES: CompanionFile[] = [
    {
        id: 'grid-basics',
        title: 'Grid Basics',
        group: 'Section 2',
        description: 'Practice with Grids: maxRow and avgNeighborhood.',
        srcPath: 'assets/problems/grid-basics.cpp'
    },
    {
        id: 'friends',
        title: 'Friends',
        group: 'Section 2',
        description: 'Practice with Maps and Sets: building a friend list and finding mutual friends.',
        srcPath: 'assets/problems/friends.cpp'
    },
    {
        id: 'twice',
        title: 'Twice',
        group: 'Section 2',
        description: 'Practice with Sets: find numbers that appear exactly twice.',
        srcPath: 'assets/problems/twice.cpp'
    },
    {
        id: 'check-balance',
        title: 'Check Balance',
        group: 'Section 2',
        description: 'Practice with Stacks: check for balanced parentheses/braces.',
        srcPath: 'assets/problems/check-balance.cpp'
    },
    {
        id: 'oh-no-big-o',
        title: 'Oh No, Big-O',
        group: 'Section 2',
        description: 'Give a tight bound of the nearest runtime complexity class for each code fragment.',
        srcPath: 'assets/problems/oh-no-big-o.cpp'
    },
    {
        id: 'more-big-o',
        title: 'More Big O',
        group: 'Section 2',
        description: 'Determine the big-O runtime of each function.',
        srcPath: 'assets/problems/more-big-o.cpp'
    },
    {
        id: 'recursion-mystery',
        title: 'Recursion Mystery',
        group: 'Section 2',
        description: 'Topic: recursive function calls, return value tracing',
        srcPath: 'assets/problems/recursion-mystery.cpp'
    },
    {
        id: 'recursion-tracing',
        title: 'Recursion Tracing',
        group: 'Section 2',
        description: 'Topic: Recursion, strings, recursion tracing',
        srcPath: 'assets/problems/recursion-tracing.cpp'
    }
];

// Append to the main FILES array
FILES.push(...SECTION_2_FILES);
