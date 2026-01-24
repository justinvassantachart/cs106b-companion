#pragma once
#include "common.h"
#include "vector.h"

// Prototypes with default arguments where applicable
string integerToString(int n, int radix = 10);
string longToString(long n, int radix = 10);
string realToString(double d);
string boolToString(bool b);
string charToString(char c);
bool stringIsInteger(const string &str, int radix = 10);
bool stringIsReal(const string &str);
bool stringIsBool(const string &str);
int stringToInteger(const string &str, int radix = 10);
long stringToLong(const string &str, int radix = 10);
double stringToReal(const string &str);
bool stringToBool(const string &str);
char stringToChar(const string &str);
string toLowerCase(const string &str);
string toUpperCase(const string &str);
void toLowerCaseInPlace(string &str);
void toUpperCaseInPlace(string &str);
string trim(const string &str);
void trimInPlace(string &str);
string trimStart(const string &str);
void trimStartInPlace(string &str);
string trimEnd(const string &str);
void trimEndInPlace(string &str);
bool startsWith(const string &str, const string &prefix);
bool startsWith(const string &str, char prefix);
bool endsWith(const string &str, const string &suffix);
bool endsWith(const string &str, char suffix);
bool equalsIgnoreCase(const string &s1, const string &s2);
string stringReplace(const string &str, const string &old,
                     const string &replacement, int limit = -1);
string stringReplace(const string &str, char old, char replacement,
                     int limit = -1);
int stringReplaceInPlace(string &str, const string &old,
                         const string &replacement, int limit = -1);
int stringReplaceInPlace(string &str, char old, char replacement,
                         int limit = -1);
Vector<string> stringSplit(const string &str, const string &delimiter,
                           int limit = -1);
Vector<string> stringSplit(const string &str, char delimiter, int limit = -1);
string stringJoin(const Vector<string> &v, const string &delimiter = "");
string stringJoin(const Vector<string> &v, char delimiter);
string htmlDecode(const string &s);
string htmlEncode(const string &s);
string urlDecode(const string &str);
void urlDecodeInPlace(string &str);
string urlEncode(const string &str);
void urlEncodeInPlace(string &str);
bool stringContains(const string &s, char ch);
bool stringContains(const string &s, const string &substring);
int stringIndexOf(const string &s, char ch, int startIndex = 0);
int stringIndexOf(const string &s, const string &substring, int startIndex = 0);
int stringLastIndexOf(const string &s, char ch, int startIndex = string::npos);
int stringLastIndexOf(const string &s, const string &substring,
                      int startIndex = string::npos);

// ============================================================
// Additional string functions from Stanford Library
// ============================================================

// Character-to-integer conversion: '0'-'9' -> 0-9
int charToInteger(char c);
// Integer-to-character conversion: 0-9 -> '0'-'9'
char integerToChar(int n);

// Aliases for real/double naming consistency
string doubleToString(double d);
double stringToDouble(const string &str);
bool stringIsDouble(const string &str);
bool stringIsLong(const string &str, int radix = 10);

// Pointer to hex string
string pointerToString(void *p);

// Single character case conversion
char toLowerCase(char ch);
char toUpperCase(char ch);

// ============================================================
// std:: namespace extensions
// ============================================================
namespace std {
bool stob(const string &str);
char stoc(const string &str);
string to_string(bool b);
string to_string(char c);
string to_string(void *p);
} // namespace std

// ============================================================
// Implementations
// ============================================================

string boolToString(bool b) { return (b ? "true" : "false"); }

/*
 * Implementation notes: numeric conversion
 */
string integerToString(int n, int radix) {
  if (radix <= 0)
    error("integerToString: Illegal radix");
  ostringstream stream;
  if (radix != 10)
    stream << setbase(radix);
  stream << n;
  return stream.str();
}

string longToString(long n, int radix) {
  if (radix <= 0)
    error("longToString: Illegal radix");
  ostringstream stream;
  if (radix != 10)
    stream << setbase(radix);
  stream << n;
  return stream.str();
}

string realToString(double d) {
  ostringstream stream;
  stream << uppercase << d;
  return stream.str();
}

string charToString(char c) {
  string s;
  s += c;
  return s;
}

bool stringIsInteger(const string &str, int radix) {
  if (radix <= 0)
    error("stringIsInteger: Illegal radix");
  istringstream stream(trim(str));
  stream >> setbase(radix);
  int value;
  stream >> value;
  return !(stream.fail() || !stream.eof());
}

bool stringIsReal(const string &str) {
  istringstream stream(trim(str));
  double value;
  stream >> value;
  return !(stream.fail() || !stream.eof());
}

bool stringIsBool(const string &str) { return str == "true" || str == "false"; }

int stringToInteger(const string &str, int radix) {
  if (radix <= 0)
    error("stringToInteger: Illegal radix");
  istringstream stream(trim(str));
  stream >> setbase(radix);
  int value;
  stream >> value;
  if (stream.fail() || !stream.eof())
    error("stringToInteger: Illegal integer format");
  return value;
}

long stringToLong(const string &str, int radix) {
  if (radix <= 0)
    error("stringToLong: Illegal radix");
  istringstream stream(trim(str));
  stream >> setbase(radix);
  long value;
  stream >> value;
  if (stream.fail() || !stream.eof())
    error("stringToLong: Illegal long format");
  return value;
}

double stringToReal(const string &str) {
  istringstream stream(trim(str));
  double value;
  stream >> value;
  if (stream.fail() || !stream.eof())
    error("stringToReal: Illegal floating-point format");
  return value;
}

bool stringToBool(const string &str) {
  if (str == "true" || str == "1")
    return true;
  if (str == "false" || str == "0")
    return false;
  istringstream stream(trim(str));
  bool value;
  stream >> boolalpha >> value;
  if (stream.fail() || !stream.eof())
    error("stringToBool: Illegal bool format");
  return value;
}

char stringToChar(const string &str) {
  if (str.length() != 1)
    error("stringToChar: string must contain exactly 1 character");
  return str[0];
}

void toLowerCaseInPlace(string &str) {
  for (size_t i = 0; i < str.length(); i++)
    str[i] = tolower(str[i]);
}

string toLowerCase(const string &str) {
  string s = str;
  toLowerCaseInPlace(s);
  return s;
}

void toUpperCaseInPlace(string &str) {
  for (size_t i = 0; i < str.length(); i++)
    str[i] = toupper(str[i]);
}

string toUpperCase(const string &str) {
  string s = str;
  toUpperCaseInPlace(s);
  return s;
}

void trimEndInPlace(string &str) {
  int finish = (int)str.length();
  while (finish > 0 && isspace(str[finish - 1]))
    finish--;
  if (finish < (int)str.length())
    str.erase(finish);
}

string trimEnd(const string &str) {
  string s = str;
  trimEndInPlace(s);
  return s;
}

void trimStartInPlace(string &str) {
  int start = 0;
  while (start < (int)str.length() && isspace(str[start]))
    start++;
  if (start > 0)
    str.erase(0, start);
}

string trimStart(const string &str) {
  string s = str;
  trimStartInPlace(s);
  return s;
}

void trimInPlace(string &str) {
  trimEndInPlace(str);
  trimStartInPlace(str);
}

string trim(const string &str) {
  string s = str;
  trimInPlace(s);
  return s;
}

bool startsWith(const string &str, const string &prefix) {
  return str.size() >= prefix.size() && str.substr(0, prefix.size()) == prefix;
}

bool startsWith(const string &str, char prefix) {
  return !str.empty() && str[0] == prefix;
}

bool endsWith(const string &str, const string &suffix) {
  return str.size() >= suffix.size() &&
         str.substr(str.size() - suffix.size()) == suffix;
}

bool endsWith(const string &str, char suffix) {
  return !str.empty() && str.back() == suffix;
}

bool equalsIgnoreCase(const string &s1, const string &s2) {
  if (s1.size() != s2.size())
    return false;
  for (size_t i = 0; i < s1.size(); i++) {
    if (tolower(s1[i]) != tolower(s2[i]))
      return false;
  }
  return true;
}

int stringReplaceInPlace(string &str, const string &old,
                         const string &replacement, int limit) {
  int count = 0;
  size_t start = 0;
  while (limit < 0 || count < limit) {
    size_t pos = str.find(old, start);
    if (pos == string::npos)
      break;
    str.replace(pos, old.length(), replacement);
    start = pos + replacement.length();
    count++;
  }
  return count;
}

int stringReplaceInPlace(string &str, char old, char replacement, int limit) {
  int count = 0;
  for (size_t i = 0; i < str.length(); i++) {
    if (str[i] == old) {
      str[i] = replacement;
      count++;
      if (limit > 0 && count >= limit)
        break;
    }
  }
  return count;
}

string stringReplace(const string &str, const string &old,
                     const string &replacement, int limit) {
  string s = str;
  stringReplaceInPlace(s, old, replacement, limit);
  return s;
}

string stringReplace(const string &str, char old, char replacement, int limit) {
  string s = str;
  stringReplaceInPlace(s, old, replacement, limit);
  return s;
}

Vector<string> stringSplit(const string &str, const string &delimiter,
                           int limit) {
  Vector<string> result;
  if (delimiter.empty()) {
    result.add(str);
    return result;
  }
  string s = str;
  size_t pos = 0;
  int count = 0;
  while ((limit < 0 || count < limit) &&
         (pos = s.find(delimiter)) != string::npos) {
    result.add(s.substr(0, pos));
    s.erase(0, pos + delimiter.length());
    count++;
  }
  result.add(s);
  return result;
}

Vector<string> stringSplit(const string &str, char delimiter, int limit) {
  return stringSplit(str, string(1, delimiter), limit);
}

string stringJoin(const Vector<string> &v, const string &delimiter) {
  ostringstream oss;
  for (int i = 0; i < v.size(); ++i) {
    if (i > 0)
      oss << delimiter;
    oss << v[i];
  }
  return oss.str();
}

string stringJoin(const Vector<string> &v, char delimiter) {
  return stringJoin(v, string(1, delimiter));
}

bool stringContains(const string &s, const string &substring) {
  return s.find(substring) != string::npos;
}

bool stringContains(const string &s, char ch) {
  return s.find(ch) != string::npos;
}

int stringIndexOf(const string &s, const string &substring, int startIndex) {
  size_t pos = s.find(substring, startIndex);
  return (pos == string::npos) ? -1 : (int)pos;
}

int stringIndexOf(const string &s, char ch, int startIndex) {
  size_t pos = s.find(ch, startIndex);
  return (pos == string::npos) ? -1 : (int)pos;
}

int stringLastIndexOf(const string &s, const string &substring,
                      int startIndex) {
  size_t pos =
      s.rfind(substring,
              (startIndex == string::npos) ? string::npos : (size_t)startIndex);
  return (pos == string::npos) ? -1 : (int)pos;
}

int stringLastIndexOf(const string &s, char ch, int startIndex) {
  size_t pos = s.rfind(ch, (startIndex == string::npos) ? string::npos
                                                        : (size_t)startIndex);
  return (pos == string::npos) ? -1 : (int)pos;
}

string htmlEncode(const string &s) {
  string res = s;
  stringReplaceInPlace(res, "&", "&amp;");
  stringReplaceInPlace(res, "<", "&lt;");
  stringReplaceInPlace(res, ">", "&gt;");
  stringReplaceInPlace(res, "\"", "&quot;");
  return res;
}

string htmlDecode(const string &s) {
  string res = s;
  stringReplaceInPlace(res, "&lt;", "<");
  stringReplaceInPlace(res, "&gt;", ">");
  stringReplaceInPlace(res, "&quot;", "\"");
  stringReplaceInPlace(res, "&amp;", "&");
  return res;
}

// Minimal URL encode/decode
string urlEncode(const string &str) {
  ostringstream escaped;
  escaped.fill('0');
  escaped << hex << uppercase;
  for (char c : str) {
    if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~' ||
        c == '*') {
      escaped << c;
    } else if (c == ' ') {
      escaped << '+';
    } else {
      escaped << '%' << setw(2) << (int)(unsigned char)c << setw(0);
    }
  }
  return escaped.str();
}

void urlEncodeInPlace(string &str) { str = urlEncode(str); }

string urlDecode(const string &str) {
  // simplified for brevity
  string res;
  for (size_t i = 0; i < str.length(); ++i) {
    if (str[i] == '%') {
      if (i + 2 < str.length()) {
        int val;
        istringstream is(str.substr(i + 1, 2));
        if (is >> hex >> val) {
          res += (char)val;
          i += 2;
        } else {
          res += '%';
        }
      } else {
        res += '%';
      }
    } else if (str[i] == '+') {
      res += ' ';
    } else {
      res += str[i];
    }
  }
  return res;
}

void urlDecodeInPlace(string &str) { str = urlDecode(str); }

// ============================================================
// Additional function implementations
// ============================================================

int charToInteger(char c) {
  if (c < '0' || c > '9')
    error("charToInteger: character is not a digit");
  return c - '0';
}

char integerToChar(int n) {
  if (n < 0 || n > 9)
    error("integerToChar: number must be 0-9");
  return '0' + n;
}

string doubleToString(double d) { return realToString(d); }

double stringToDouble(const string &str) { return stringToReal(str); }

bool stringIsDouble(const string &str) { return stringIsReal(str); }

bool stringIsLong(const string &str, int radix) {
  if (radix <= 0)
    error("stringIsLong: Illegal radix");
  istringstream stream(trim(str));
  stream >> setbase(radix);
  long value;
  stream >> value;
  return !(stream.fail() || !stream.eof());
}

string pointerToString(void *p) {
  if (p == nullptr)
    return "nullptr";
  ostringstream stream;
  stream << p;
  return stream.str();
}

char toLowerCase(char ch) { return (char)tolower(ch); }

char toUpperCase(char ch) { return (char)toupper(ch); }

// ============================================================
// std:: namespace implementations
// ============================================================

namespace std {

bool stob(const string &str) { return stringToBool(str); }

char stoc(const string &str) { return stringToChar(str); }

string to_string(bool b) { return boolToString(b); }

string to_string(char c) { return charToString(c); }

string to_string(void *p) { return pointerToString(p); }

} // namespace std
