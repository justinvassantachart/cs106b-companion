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
    EXPECT_EQUAL(results, {"Zelenski","Szumlanski"});

    results = filter("AmbaTi,Szumlanski,Tadimeti", "TI");
    Vector<string> expected = {"AmbaTi", "Tadimeti"};
    EXPECT_EQUAL(results, expected);

    results = filter("Zelenski,Szumlanski,Alonso", "nso");
    EXPECT_EQUAL(results, {"Alonso"});

    results = filter("Szumlanski,Coronado", "AaS");
    EXPECT_EQUAL(results, {});

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

    pigLatinReference(name);
    cout << name << endl; // now prints "asmineyay", since name is passed by reference here
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

void deduplicate(Vector<string> vec) {
    for (int i = 0; i < vec.size(); i++) {
        if (vec[i] == vec[i + 1]) { 
            vec.remove(i);
        }
    }
}

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
    // hiddenFigures = ["Katherine Johnson", "Mary Jackson", "Dorothy Vaughan”]
    
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

void helper() {
    int* p = new int(42);
    // p goes out of scope, but heap object should persist
}

int main() {
    cout << "--- Heap Test ---" << endl;
    
    helper();
    
    Node* list = new Node;
    list->val = 1;
    list->next = new Node;
    list->next->val = 2;
    list->next->next = nullptr;
    
    cout << "Check Heap Visualization now." << endl;
    
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
    }
];
