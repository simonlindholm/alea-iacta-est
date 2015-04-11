#include <bits/stdc++.h>

using namespace std;

#define RIGHT 0
#define DOWN 1

typedef tuple<int, int, int> edge;

bool taken[2][5][5];
set<edge> movesLeft;

int score1, score2;

void makeMove(int player, int type, int row, int col){
    bool score = false;
    if(type == RIGHT){
        if(row != 4 && taken[RIGHT][row + 1][col] && taken[DOWN][row][col] && taken[DOWN][row][col+1]) score = true;
        if(row != 0 && taken[RIGHT][row - 1][col] && taken[DOWN][row-1][col] && taken[DOWN][row-1][col+1]) score = true;
    } else if(type == DOWN){
        if(col != 4 && taken[RIGHT][row][col] && taken[RIGHT][row+1][col] && taken[DOWN][row][col+1]) score = true;
        if(col != 0 && taken[RIGHT][row][col] && taken[RIGHT][row+1][col] && taken[DOWN][row][col-1]) score = true;
    }
    if(score && player == 1) score1++;
    if(score && player == 2) score2++;
}

void makeRandom(int who){
    int take = rand()%movesLeft.size();
    for(edge e : movesLeft){
        if(take == 0){
            movesLeft.erase(e);
            int which, row, col;
            tie(which, row, col) = e;
            taken[which][row][col] = true;
            makeMove(who, which, row, col);
            break;
        }
        take--;
    }
}

void makeRandomIfNotScore(){
    for(edge e : movesLeft){
        int which, row, col;
        tie(which, row, col) = e;
        int curScore = score2;
        makeMove(2, which, row, col);
        if(score2 > curScore){
            taken[which][row][col] = true;
            movesLeft.erase(e);
            return;
        }
    }
    makeRandom(2);
}


void init(){
    for(int row = 0; row < 5; ++row){
        for(int col = 0; col < 5; ++col){
            if(row != 4) movesLeft.insert(make_tuple(DOWN, row, col));
            if(col != 4) movesLeft.insert(make_tuple(RIGHT, row, col));
        }
    }
}

int main(){
    srand(time(NULL));
    init();
    while(movesLeft.size() > 0){
        while(movesLeft.size() > 0){
            int cur = score1;
            makeRandom(1);
            if(score1 == cur) break;
        }

        while(movesLeft.size() > 0){
            int cur = score2;
            makeRandomIfNotScore();
            if(score2 == cur) break;
        }
    }
    cout << "Us: " << score2 << " Them: " << score1 << endl;
}
