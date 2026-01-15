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
        description: 'Learn how to use EXPECT_EQUALS to write simple tests.',
        starterCode: `#include "stanford.h"

int main() {
    cout << "--- Testing Framework ---" << endl;
    
    // Pass cases
    EXPECT_EQUALS(1 + 1, 2);
    
    Vector<int> v;
    v.add(10);
    EXPECT_EQUALS(v.size(), 1);
    EXPECT_EQUALS(v[0], 10);
    
    // Fail case (demonstration)
    cout << "Demonstrating failure:" << endl;
    EXPECT_EQUALS(v.size(), 0);
    
    return 0;
}
`
    }
];
