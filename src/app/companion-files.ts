export interface CompanionFile {
    id: string;
    title: string;
    description: string;
    starterCode: string;
    group?: string;
}

export const FILES: CompanionFile[] = [
    {
        id: 'references-available-upon-request',
        title: 'References Available Upon Request',
        group: 'Section 1',
        description: 'References available upon request.',
        starterCode: `#include "stanford.h"

void maui(string s) {
    for (int i = 0; i < s.length(); i++) {
        s[i] += 2;
    }
}

void sina(string& s) {
    for (int i = 0; i < s.length(); i++) {
        s[i] += 2;
    }
}

void moana(string& s) {
    for (char ch : s) {
        ch += 2;
    }
}

void heihei(string& s) {
    for (char& ch : s) {
        ch += 2;
    }
}

string teFiti(string& s) {
    string result;
    for (char ch : s) {
        result += (ch + 2);
    }   
    return result;
}

int main() {
    string s = "umm";

    maui(s);
    cout << s << endl;

    sina(s);
    cout << s << endl;

    moana(s);
    cout << s << endl;

    heihei(s);
    cout << s << endl;

    teFiti(s);
    cout << s << endl;

    return 0;
}

`
    },
    {
        id: 'grid-traversal',
        title: 'Grid Traversal',
        group: 'Data Structures',
        description: 'Create a 3x3 Grid and fill it with values.',
        starterCode: `#include "stanford.h"

int main() {
    cout << "--- Grid Traversal ---" << endl;
    Grid<int> grid(3, 3);
    
    // TODO: Fill the grid with values 1 to 9
    
    cout << "Grid: " << endl << grid << endl;
    return 0;
}
`
    },
    {
        id: 'program-analysis',
        title: 'Program analysis: C++isms you should know',
        group: 'Section 1',
        description: 'Convert a string to Pig Latin.',
        starterCode: `#include "stanford.h"

/*
   @param input: input string whose last names will be filtered
   @param suffix: the substring which we will filter last names by
   Functionality: this function filters the input string and returns last names
        that end with 'suffix'
*/
Vector<string> filter(string input, string suffix)
{
    Vector<string> filteredNames;
    Vector<string> names = stringSplit(input, ',');

    for (string name: names) {
        // convert to lowercase so we can easily compare the strings
        if (endsWith(toLowerCase(name), toLowerCase(suffix))) {
            filteredNames.add(name);
        }
    }
    return filteredNames;
}

int main() {
    Vector<string> results = filter("Zelenski,Szumlanski,Alonso", "Ski");
    Vector<string> expected1 = {"Zelenski","Szumlanski"};
    EXPECT_EQUAL(results, expected1);

    results = filter("AmbaTi,Szumlanski,Tadimeti", "TI");
    Vector<string> expected = {"AmbaTi", "Tadimeti"};
    EXPECT_EQUAL(results, expected);

    results = filter("Zelenski,Szumlanski,Alonso", "nso");
    Vector<string> expected2 = {"Alonso"};
    EXPECT_EQUAL(results, expected2);

    results = filter("Szumlanski,Coronado", "AaS");
    Vector<string> expected4 = {};
    EXPECT_EQUAL(results, expected4);

    // what other tests can you add?

    return 0;
}


`
    },

    {
        id: 'pig-latin',
        title: 'Pig Latin',
        group: 'Section 1',
        description: 'Convert a string to Pig Latin.',
        starterCode: `#include "stanford.h"

string pigLatinReturn(string name) {
    return "";
}

void pigLatinReference(string name) {

}

int main() {
    string name = "yasmine";
    string str1 = pigLatinReturn(name);
    cout << str1 << endl; // prints "asmineyay"
    cout << name << endl; // still prints "yasmine"

    EXPECT_EQUAL(str1, "asmineyay");

    pigLatinReference(name);
    cout << name << endl; // now prints "asmineyay", since name is passed by reference here

    EXPECT_EQUAL(name, "asmineyay");
    return 0;
}




`
    },


    {
        id: 'debugging-deduplicating',
        title: 'Debugging Deduplicating',
        group: 'Section 1',
        description: 'Convert a string to Pig Latin.',
        starterCode: `#include "stanford.h"

void deduplicate(Vector<string>& vec) {
    for (int i = 0; i < vec.size() - 1; ) {
        if (vec[i] == vec[i + 1]) {
            vec.remove(i);
        } else {
            i++;
        }
    }
}

// Alternate solution
// void deduplicate(Vector<string>& vec) {
//     for (int i = vec.size() - 1; i > 0; i--) {
//         if (vec[i] == vec[i - 1]) {
//             vec.remove(i);
//         }
//     }
// }

int main() {
    Vector<string> hiddenFigures = {
        "Katherine Johnson",
        "Katherine Johnson",
        "Katherine Johnson",
        "Mary Jackson",
        "Dorothy Vaughan",
        "Dorothy Vaughan"
        };

    deduplicate(hiddenFigures);

    Vector<string> correctSolution = {
        "Katherine Johnson",
        "Mary Jackson",
        "Dorothy Vaughan"
        };
    EXPECT_EQUAL(hiddenFigures, correctSolution);    
    return 0;
}




`
    },
    {
        id: 'grid-traversal',
        title: 'Grid Traversal',
        group: 'Data Structures',
        description: 'Create a 3x3 Grid and fill it with values.',
        starterCode: `#include "stanford.h"

int main() {
    cout << "--- Grid Traversal ---" << endl;
    Grid<int> grid(3, 3);
    
    // TODO: Fill the grid with values 1 to 9
    
    cout << "Grid: " << endl << grid << endl;
    return 0;
}
`
    },
    {
        id: 'heap-visualizer',
        title: 'Heap Visualizer',
        group: 'Dynamic Memory',
        description: 'Learn how to use the Stanford Vector class. Add elements and print them.',
        starterCode: `#include "stanford.h"

struct Node {
    int val;
    Node* next;
};

int notSoHelpfulHelper() {
    int* p = new int(42);
    // p goes out of scope, but heap object should persist in the visualizer as a memory leak
    return 1;
}

int main() {    
    notSoHelpfulHelper();
    
    Node* list = new Node;
    list->val = 1;
    list->next = new Node;
    list->next->val = 2;
    list->next->next = nullptr;
    
    cout << "Check Heap Visualization" << endl;
    
    return 0;
}

`
    },
    {
        id: 'grid-traversal',
        title: 'Grid Traversal',
        group: 'Data Structures',
        description: 'Create a 3x3 Grid and fill it with values.',
        starterCode: `#include "stanford.h"

int main() {
    cout << "--- Grid Traversal ---" << endl;
    Grid<int> grid(3, 3);
    
    // TODO: Fill the grid with values 1 to 9
    
    cout << "Grid: " << endl << grid << endl;
    return 0;
}
`
    },
    {
        id: 'map-frequency',
        title: 'Map Frequency',
        group: 'Data Structures',
        description: 'Count the frequency of characters in a string.',
        starterCode: `#include "stanford.h"

int main() {
    cout << "--- Map Frequency ---" << endl;
    string text = "banana";
    Map<char, int> counts;
    
    // TODO: Count character frequencies
    
    cout << "Frequencies: " << counts << endl;
    return 0;
}
`
    },
    {
        id: 'testing-framework',
        title: 'Testing Framework',
        group: 'Getting Started',
        description: 'Learn how to use EXPECT_EQUAL to write simple tests.',
        starterCode: `#include "stanford.h"

int main() {
    cout << "--- Testing Framework ---" << endl;
    
    // Pass cases
    EXPECT_EQUAL(1 + 1, 2);
    
    Vector<int> v;
    v.add(10);
    EXPECT_EQUAL(v.size(), 1);
    EXPECT_EQUAL(v[0], 10);
    
    // Fail case (demonstration)
    cout << "Demonstrating failure:" << endl;
    EXPECT_EQUAL(v.size(), 0);
    
    return 0;
}
`
    },
    {
        id: 'strlib-test',
        title: 'String Library Test',
        group: 'Testing',
        description: 'Verify Stanford String Library functions.',
        starterCode: `#include "stanford.h"

int main() {
    cout << "--- Strlib Test ---" << endl;
    
    EXPECT_EQUAL(integerToString(123), "123");
    EXPECT_EQUAL(realToString(3.14), "3.14");
    EXPECT_EQUAL(stringToInteger("42"), 42);
    EXPECT_EQUAL(boolToString(true), "true");
    
    string s = "  hello  ";
    EXPECT_EQUAL(trim(s), "hello");
    EXPECT_EQUAL(toUpperCase("abc"), "ABC");
    
    Vector<string> v = stringSplit("a,b,c", ",");
    EXPECT_EQUAL(v.size(), 3);
    EXPECT_EQUAL(v[0], "a");
    
    EXPECT_EQUAL(stringJoin(v, "-"), "a-b-c");
    
    return 0;
}
`
    },
    {
        id: 'recursion-test',
        title: 'Recursion Test',
        group: 'Getting Started',
        description: 'Simple recursion example to test debugger.',
        starterCode: `#include "stanford.h"

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    cout << "--- Recursion Test ---" << endl;
    int result = factorial(5);
    EXPECT_EQUAL(result, 120);
    cout << "Factorial of 5 is: " << result << endl;
    return 0;
}
`
    },
    {
        id: 'control-flow-test',
        title: 'Control Flow Test',
        group: 'Testing',
        description: 'Test debugger stepping in for loops, if/else, while, and switch.',
        starterCode: `#include "stanford.h"

void testFor(string s) {
    for (int i = 0; i < s.length(); i++) {
        s[i] += 2;
    }
}

void testIf(int x) {
    if (x > 0) {
        x = x + 1;
    } else {
        x = x - 1;
    }
}

void testWhile(int n) {
    while (n > 0) {
        n--;
    }
}

void testSwitch(int x) {
    switch (x) {
        case 1:
            x = 10;
            break;
        case 2:
            x = 20;
            break;
        default:
            x = 0;
    }
}

int main() {
    testFor("abc");
    testIf(5);
    testWhile(3);
    testSwitch(1);
    return 0;
}
`
    }
];

export const SECTION_2_FILES: CompanionFile[] = [
    {
        id: 'grid-basics',
        title: 'Grid Basics',
        group: 'Section 2',
        description: 'Practice with Grids: maxRow and avgNeighborhood.',
        starterCode: `#include "stanford.h"

/*
 * Function: maxRow
 * ----------------
 * Takes a grid of non-negative integers and an in-bounds grid location
 * and returns the maximum value in the row of that grid location.
 */
int maxRow(Grid<int>& grid, GridLocation loc) {
    // TODO: Implement this function
    return 0;
}

/*
 * Function: avgNeighborhood
 * -------------------------
 * Takes a grid and a grid location and returns the average of all the
 * values in the neighborhood of the grid location (N, S, E, W).
 * If the average is not an integer, return a truncated average.
 */
int avgNeighborhood(Grid<int>& grid, GridLocation loc) {
    // TODO: Implement this function
    return 0;
}

int main() {
    // Test maxRow
    Grid<int> g = { {1, 2, 3}, {4, 5, 6}, {7, 8, 9} };
    GridLocation loc1(1, 1);
    EXPECT_EQUAL(maxRow(g, loc1), 6); // Row 1 is {4, 5, 6}, max is 6
    
    GridLocation loc2(0, 0);
    EXPECT_EQUAL(maxRow(g, loc2), 3); // Row 0 is {1, 2, 3}, max is 3
    
    GridLocation loc3(2, 0);
    EXPECT_EQUAL(maxRow(g, loc3), 9); // Row 2 is {7, 8, 9}, max is 9

    // Test avgNeighborhood
    // Neighbors of (1, 1) are N(0,1)=2, S(2,1)=8, W(1,0)=4, E(1,2)=6
    // Sum = 20, Count = 4, Avg = 5
    EXPECT_EQUAL(avgNeighborhood(g, loc1), 5);
    
    // Neighbors of (0, 0) are S(1,0)=4, E(0,1)=2 (only 2 neighbors)
    // Sum = 6, Count = 2, Avg = 3
    EXPECT_EQUAL(avgNeighborhood(g, loc2), 3);
    
    // Neighbors of (1, 0) are N(0,0)=1, S(2,0)=7, E(1,1)=5 (only 3 neighbors)
    // Sum = 13, Count = 3, Avg = 4 (truncated)
    GridLocation loc4(1, 0);
    EXPECT_EQUAL(avgNeighborhood(g, loc4), 4);

    return 0;
}
`
    },
    {
        id: 'friends',
        title: 'Friends',
        group: 'Section 2',
        description: 'Practice with Maps and Sets: building a friend list and finding mutual friends.',
        starterCode: `#include "stanford.h"

// Helper function to simulate file reading (for browser environment)
// In a real Qt Creator environment, you would use:
// ifstream in;
// Vector<string> lines;
// if (openFile(in, filename)) {
//     lines = readLines(in);
// }
Vector<string> readFileLines(string filename) {
    // Simulated file content for testing
    if (filename == "buddies.txt") {
        return {"Ngoc Emily", "Emily Kavel"};
    }
    return {};
}

/*
 * Function: friendList
 * --------------------
 * Reads friend relationships from a file and writes them to a Map.
 * Friendships are bi-directional, so if Emily is friends with Ngoc,
 * Ngoc is friends with Emily.
 * The file contains one friend relationship per line, with names separated by a single space.
 */
Map<string, Set<string>> friendList(string filename) {
    Map<string, Set<string>> friends;
    Vector<string> lines = readFileLines(filename);
    
    // TODO: Implement this function
    // Process each line and add bidirectional friendships
    
    return friends;
}

/*
 * Function: mutualFriends
 * -----------------------
 * Takes in the friendList and two strings representing two friends,
 * and returns the names of the mutual friends they have in common.
 */
Set<string> mutualFriends(Map<string, Set<string>>& friendList, string friend1, string friend2) {
    Set<string> mutual;
    // TODO: Implement this function
    return mutual;
}

int main() {
    // Test friendList
    Map<string, Set<string>> friends = friendList("buddies.txt");
    
    Map<string, Set<string>> expected;
    expected["Emily"] = {"Ngoc", "Kavel"};
    expected["Ngoc"] = {"Emily"};
    expected["Kavel"] = {"Emily"};
    
    EXPECT_EQUAL(friends, expected);
    
    // Test mutualFriends
    Set<string> mutual = mutualFriends(friends, "Ngoc", "Kavel");
    Set<string> expectedMutual = {"Emily"};
    EXPECT_EQUAL(mutual, expectedMutual);
    
    // Test with no mutual friends
    Set<string> mutual2 = mutualFriends(friends, "Ngoc", "Kavel");
    // Ngoc and Kavel both have Emily as a friend, so mutual should be {Emily}
    EXPECT_EQUAL(mutual2.size(), 1);
    EXPECT_EQUAL(mutual2.contains("Emily"), true);
    
    return 0;
}
`
    },
    {
        id: 'twice',
        title: 'Twice',
        group: 'Section 2',
        description: 'Practice with Sets: find numbers that appear exactly twice.',
        starterCode: `#include "stanford.h"

/*
 * Function: twice
 * ---------------
 * Takes a vector of integers and returns a set containing all the numbers
 * in the vector that appear exactly twice.
 * Example: passing {1, 3, 1, 4, 3, 7, -2, 0, 7, -2, -2, 1} returns {3, 7}.
 */
Set<int> twice(Vector<int>& v) {
    Set<int> result;
    // TODO: Implement this function
    return result;
}

int main() {
    // Test case from handout
    Vector<int> v1 = {1, 3, 1, 4, 3, 7, -2, 0, 7, -2, -2, 1};
    Set<int> expected1 = {3, 7};
    EXPECT_EQUAL(twice(v1), expected1);
    
    // Test with no numbers appearing twice
    Vector<int> v2 = {1, 2, 3, 4, 5};
    Set<int> expected2 = {};
    EXPECT_EQUAL(twice(v2), expected2);
    
    // Test with all numbers appearing twice
    Vector<int> v3 = {1, 1, 2, 2, 3, 3};
    Set<int> expected3 = {1, 2, 3};
    EXPECT_EQUAL(twice(v3), expected3);
    
    // Test with numbers appearing once, twice, and three times
    Vector<int> v4 = {5, 5, 5, 10, 10, 20};
    Set<int> expected4 = {10};
    EXPECT_EQUAL(twice(v4), expected4);
    
    return 0;
}
`
    },
    {
        id: 'check-balance',
        title: 'Check Balance',
        group: 'Section 2',
        description: 'Practice with Stacks: check for balanced parentheses/braces.',
        starterCode: `#include "stanford.h"

/*
 * Function: checkBalance
 * ----------------------
 * Checks whether the braces/parentheses are balanced.
 * Return the index at which an imbalance occurs, or -1 if the string is balanced.
 * If any ( or { are never closed, return the string’s length.
 */
int checkBalance(string code) {
    // TODO: Implement this function
    return -1;
}

int main() {
    // Test case 1: Balanced string
    // index:    0123456789012345678901234567
    string s1 = "if (a(4) > 9) { foo(a(2)); }";
    EXPECT_EQUAL(checkBalance(s1), -1);
    
    // Test case 2: } is out of order (returns 15)
    // index:    01234567890123456789012345678901
    string s2 = "for (i=0;i<a;(3};i++) { foo{); )";
    EXPECT_EQUAL(checkBalance(s2), 15);
    
    // Test case 3: } doesn't match any { (returns 20)
    // index:    0123456789012345678901234
    string s3 = "while (true) foo(); }{ ()";
    EXPECT_EQUAL(checkBalance(s3), 20);
    
    // Test case 4: { is never closed (returns 8)
    // index:    01234567
    string s4 = "if (x) {";
    EXPECT_EQUAL(checkBalance(s4), 8);
    
    // Additional test: Empty string
    EXPECT_EQUAL(checkBalance(""), -1);
    
    // Additional test: Only opening
    EXPECT_EQUAL(checkBalance("((("), 3);
    
    // Additional test: Only closing
    EXPECT_EQUAL(checkBalance(")))"), 0);
    
    return 0;
}
`
    },
    {
        id: 'oh-no-big-o',
        title: 'Oh No, Big-O',
        group: 'Section 2',
        description: 'Give a tight bound of the nearest runtime complexity class for each code fragment.',
        starterCode: `#include "stanford.h"

int main() {
    cout << "--- Oh No, Big-O ---" << endl;
    
    // Code Snippet A
    // int sum = 0;
    // for (int i = 1; i <= N + 2; i++) {
    //     sum++;
    // }
    // for (int j = 1; j <= N * 2; j++) {
    //     sum++;
    // }
    // cout << sum << endl;
    cout << "Snippet A: O(?)" << endl;

    // Code Snippet B
    // int sum = 0;
    // for (int i = 1; i <= N - 5; i++) {
    //     for (int j = 1; j <= N - 5; j += 2) {
    //         sum++;
    //     }
    // }
    // cout << sum << endl;
    cout << "Snippet B: O(?)" << endl;

    // Code Snippet C
    // int sum = 0;
    // for (int i = 0; i < 1000000; i++) {
    //     for (int j = 1; j <= i; j++) {
    //         sum += N;
    //     }
    //     for (int j = 1; j <= i; j++) {
    //         sum += N;
    //     }
    //     for (int j = 1; j <= i; j++) {
    //         sum += N;
    //     }
    // }
    // cout << sum << endl;
    cout << "Snippet C: O(?)" << endl;

    return 0;
}
`
    },
    {
        id: 'more-big-o',
        title: 'More Big O',
        group: 'Section 2',
        description: 'Determine the big-O runtime of each function.',
        starterCode: `#include "stanford.h"

void function1(int n) {
    for (int i = 0; i < n; i++) {
        cout << '*' << endl;
    }
}

void function2(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            cout << '*' << endl;
        }
    }
}

void function3(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            cout << '*' << endl;
        }
    }
}

void function4(int n) {
    for (int i = 1; i <= n; i *= 2) {
        cout << '*' << endl;
    }
}

/*
int squigglebah(Vector<int>& v) {
    int result = 0;
    for (int i = 0; i < v.size(); i++) {
        Vector<int> values = v.subList(0, i);
        for (int j = 0; j < values.size(); j++) {
            result += values[j];
        }
    }
    return result;
}
*/

int main() {
    cout << "--- More Big O ---" << endl;
    cout << "function1: O(?)" << endl;
    cout << "function2: O(?)" << endl;
    cout << "function3: O(?)" << endl;
    cout << "function4: O(?)" << endl;
    cout << "squigglebah: O(?)" << endl;
    return 0;
}
`
    },
    {
        id: 'recursion-mystery',
        title: 'Recursion Mystery',
        group: 'Section 2',
        description: 'Topic: recursive function calls, return value tracing',
        starterCode: `#include "stanford.h"

int recursionMystery(int x, int y) {
    if (x < y) {
        return x;
    } else {
        return recursionMystery(x - y, y);
    }
}

int main() {
    // Test cases from handout
    EXPECT_EQUAL(recursionMystery(6, 13), 6);
    EXPECT_EQUAL(recursionMystery(14, 10), 4);
    EXPECT_EQUAL(recursionMystery(37, 12), 1);
    
    // Additional test cases
    EXPECT_EQUAL(recursionMystery(5, 3), 2);
    EXPECT_EQUAL(recursionMystery(10, 5), 0);
    EXPECT_EQUAL(recursionMystery(1, 5), 1);
    
    return 0;
}
`
    },
    {
        id: 'recursion-tracing',
        title: 'Recursion Tracing',
        group: 'Section 2',
        description: 'Topic: Recursion, strings, recursion tracing',
        starterCode: `#include "stanford.h"

string reverseOf(string s) {
    if (s.empty()) {
        return "";
    } else {
        return reverseOf(s.substr(1)) + s[0];
    }
}

int main() {
    cout << "Tracing reverseOf(\\"stop\\")" << endl;
    // Trace through the execution in your mind or on paper!
    string result = reverseOf("stop");
    cout << "Result: " << result << endl;
    
    // Test cases
    EXPECT_EQUAL(reverseOf("stop"), "pots");
    EXPECT_EQUAL(reverseOf(""), "");
    EXPECT_EQUAL(reverseOf("a"), "a");
    EXPECT_EQUAL(reverseOf("hello"), "olleh");
    EXPECT_EQUAL(reverseOf("recursion"), "noisrucer");
    
    return 0;
}
`
    }
];

// Append to the main FILES array
FILES.push(...SECTION_2_FILES);

