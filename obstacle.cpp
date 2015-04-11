#include <iostream>
#include <sstream>
#include <cassert>
#include <fstream>
#include <vector>
#include <string>
#include <cstdlib>
#include <algorithm>
#include <experimental/optional>
#include <unistd.h> // for rmdir
using namespace std;

static int livecount = 0;
static int diam_index;
static string tempDir;

vector<string> splitCsv(const string& line) {
	int ind = 0, sz = (int)line.size();
	vector<string> ret;
	for (;;) {
		int ind2;
		string part;
		if (ind < sz && line[ind] == '"') {
			++ind;
			ind2 = ind;
			// Ignore escaping of quotes etc., since that's rather underdefined...
			while (ind2 < sz && line[ind2] != '"')
				++ind2;
			assert(ind2 < sz);
			part = line.substr(ind, ind2-ind);
			ind = ind2 + 1;
		}
		else {
			ind2 = ind;
			while (ind2 < sz && line[ind2] != ',')
				++ind2;
			part = line.substr(ind, ind2-ind);
			ind = ind2;
		}
		ret.push_back(part);
		if (ind < sz) {
			assert(line[ind] == ',');
			ind++;
		}
		else
			break;
	}
	return ret;
}

struct Entry {
	string line;
	double diam;

	Entry(const string& line) : line(line) {
		incrLive(1);
		vector<string> values = splitCsv(line);
		istringstream iss(values[diam_index]);
		if (iss.str().empty())
			this->diam = 0;
		else
			iss >> this->diam;
		assert(iss);
	}

	Entry(const Entry& other) : line(other.line), diam(other.diam) { incrLive(1); }

	~Entry() { incrLive(-1); }

private:
	void incrLive(int a) {
		livecount += a;
		assert(livecount <= 1000);
	}
};

bool operator<(const Entry& a, const Entry& b) {
	return a.diam < b.diam;
}

string addPartial(vector<string>& partials) {
	ostringstream tempName;
	tempName << tempDir << "/" << partials.size();
	partials.push_back(tempName.str());
	return tempName.str();
}

void outputPartials(vector<Entry>& entries, vector<string>& partials) {
	string name = addPartial(partials);
	ofstream fout(name);
	sort(entries.begin(), entries.end());
	for (Entry& e : entries)
		fout << e.line << '\n';
	entries.clear();
}

void mergePartials(int ind1, int ind2, vector<string>& partials) {
	{
		string name = addPartial(partials);
		ofstream fout(name);
		ifstream fin1(partials[ind1]);
		ifstream fin2(partials[ind2]);
		std::experimental::optional<Entry> e1, e2;
		string line;
		if (getline(fin1, line)) e1.emplace(line);
		if (getline(fin2, line)) e2.emplace(line);
		while (e1 || e2) {
			bool use1 = (!e2 || (e1 && (*e1) < (*e2)));
			fout << (use1 ? e1->line : e2->line) << '\n';
			if (use1) {
				if (getline(fin1, line)) e1.emplace(line);
				else e1 = std::experimental::nullopt;
			} else {
				if (getline(fin2, line)) e2.emplace(line);
				else e2 = std::experimental::nullopt;
			}
		}
	}
	remove(partials[ind1].c_str());
	remove(partials[ind2].c_str());
}

int main() {
	// Setup
	char dirTpl[] = "/tmp/sortXXXXXX";
	if (!mkdtemp(dirTpl)) {
		cerr << "not able to create temporary directory!" << endl;
		return 1;
	}
	tempDir = dirTpl;
	ifstream resultsFile("results.csv");
	string headerLine;
	getline(resultsFile, headerLine);
	{
		vector<string> headerValues = splitCsv(headerLine);
		auto it = find(headerValues.begin(), headerValues.end(), "diameter");
		if (it == headerValues.end()) {
			cerr << "diameter column not found!" << endl;
			return 1;
		}
		::diam_index = (int)(it - headerValues.begin());
	}

	// Phase 1: sorting small parts
	vector<string> partials;
	{
		vector<Entry> entries;
		const int lim = 900;
		entries.reserve(lim);
		string line;
		while (getline(resultsFile, line)) {
			if (entries.size() == lim)
				outputPartials(entries, partials);
			entries.emplace_back(line);
		}

		// Output the last part (even if it's empty, so as to ensure we always
		// have a partial).
		if (partials.empty())
			outputPartials(entries, partials);
	}

	// Phase 2: merge sort the small parts
	{
		int i = 0;
		while (i + 1 < (int)partials.size()) {
			// Merge i and i+1 together, outputting another partial at the end.
			mergePartials(i, i+1, partials);
			i += 2;
		}
	}

	// Phase 3: output the result of the merge as the output file.
	{
		ofstream fout("results-sorted.csv");
		ifstream fin(partials.back());
		fout << headerLine << '\n';
		string line;
		while (getline(fin, line)) {
			fout << line << '\n';
			cout << Entry(line).diam << ' ' << splitCsv(line)[1] << endl;
		}
	}

	// Clean up.
	remove(partials.back().c_str());
	rmdir(dirTpl);
}
