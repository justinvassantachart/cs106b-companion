export interface Assignment {
    id: string;
    title: string;
    description: string;
    starterCode: string;
}

export const ASSIGNMENTS: Assignment[] = [
    {
        id: 'vector-basics',
        title: 'Vector Basics',
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
