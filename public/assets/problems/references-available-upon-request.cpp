#include "stanford.h"

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
