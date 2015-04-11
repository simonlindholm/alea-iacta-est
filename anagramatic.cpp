#include <bits/stdc++.h>
using namespace std;

int main() {
	ifstream fin("unixdict.txt");
	map<pair<int, string>, vector<string> > groups;
	string word, sorted_word;
	while (getline(fin, word)) {
		sorted_word = word;
		sort(sorted_word.begin(), sorted_word.end());
		groups[make_pair((int)-word.size(), sorted_word)].push_back(word);
	}

	for (const auto& pa : groups) {
		if (pa.second.size() == 1) continue;
		cout << "Length " << -pa.first.first << ":";
		for (const auto& w : pa.second)
			cout << ' ' << w;
		cout << endl;
	}
}
