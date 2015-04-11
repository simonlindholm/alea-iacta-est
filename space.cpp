#include <bits/stdc++.h>

using namespace std;

struct Thing {

    string name;
    int cost;
    int value;

};

pair<int, int> parseInt(string& s, int start){
    int val = 0;
    int i;
    for(i = start; i < s.size() && s[i] != ','; ++i){
        val = val * 10 + s[i] - '0';
    }
    return make_pair(val, i + 1);
}

const int SIZE = 10000;

int main(){
    vector<Thing> things;
    string s;
    while(getline(cin, s)){
        Thing t;
        for(int i = 0; i < s.size() && s[i] != ','; ++i){
            t.name += s[i];
        }
        pair<int, int> cost = parseInt(s, t.name.size() + 1);
        pair<int, int> importance = parseInt(s, cost.second);
        pair<int, int> amount = parseInt(s, importance.second);
        t.cost = cost.first;
        t.value = importance.first;
        cout << "Type " << t.name << " Amount " << amount.first << endl;
        for(int i = 0; i < amount.first; ++i){
            things.push_back(t);
        }
    }

    vector<pair<int, vector<int>>> best(SIZE + 1);

    
    for(int i = 0; i < things.size(); ++i){
        for(int j = SIZE; j >= 0; --j){
            Thing t = things[i];
            if(j < t.cost || (best[j - t.cost].first == 0 && j - t.cost != 0)) continue;

            int newValue = best[j - t.cost].first + t.value;
            if(newValue > best[j].first){
                vector<int> newUse = best[j - t.cost].second;
                newUse.push_back(i);
                best[j] = make_pair(newValue, newUse);
            }
        }
    }

    int whichCost;
    pair<int, vector<int>> mx;

    for(int i = 0; i < best.size(); ++i){
        if(best[i].first >= mx.first){
            mx = best[i];
            whichCost = i;
        }
    }

    cout << "Best value: " << best[whichCost].first << endl;
    cout << "Best cost: " << whichCost << endl;

    int realValue = 0, realCost = 0;
    for(auto i : best[whichCost].second){
        cout << things[i].name << endl;
        realValue += things[i].value;
        realCost += things[i].cost;
    }
    cout << "Real " << realValue << " " << realCost << endl;
}

