#include <iostream>
#include <cassert>
#include <bitset>
#include <map>
#include <unistd.h>
#include <ctime>
#include <cstdlib>
#include <vector>
using namespace std;

enum { W = 5, H = 3 };
enum { RANDOM = 0, SMART = 1 };

typedef bitset<H * W> Board;
struct Move {
	int y, x;
	int toInt() const { return y * W + x; }
};

Board use(Board board, Move m) {
	for (int i = m.y; i < H; ++i) {
		for (int j = m.x; j < W; ++j) {
			Move m2; m2.y = i; m2.x = j;
			board[m2.toInt()] = 0;
		}
	}
	return board;
}

Move moveRandom(const Board& board) {
	for (;;) {
		Move m;
		m.y = rand() % H;
		m.x = rand() % W;
		if (board[m.toInt()] == 0) continue;
		return m;
	}
}

map<unsigned long, bool> memoized;
bool winning(const Board& board) {
	if (memoized.count(board.to_ulong()))
		return memoized[board.to_ulong()];
	bool& out = memoized[board.to_ulong()];
	if (!board.any())
		return out = true;
	for (int i = 0; i < H*W; ++i) {
		if (!board[i]) continue;
		Move m;
		m.y = i / W;
		m.x = i % W;
		Board b2 = use(board, m);
		if (!winning(b2))
			return out = true;
	}
	return out = false;
}

Move moveSmart(const Board& board) {
	for (int i = 0; i < H*W; ++i) {
		if (!board[i]) continue;
		Move m;
		m.y = i / W;
		m.x = i % W;
		Board b2 = use(board, m);
		if (!winning(b2)) {
			return m;
		}
	}
	// Losing :(
	return moveRandom(board);
}

void move(Board& board, int strat) {
	Move m;
	if (strat == RANDOM) m = moveRandom(board);
	else if (strat == SMART) m = moveSmart(board);
	else assert(0);
	assert(board[m.toInt()]);
	board = use(board, m);
}

void drawBoard(const Board& board) {
	for (int i = 0; i < H; ++i) {
		for (int j = 0; j < W; ++j) {
			Move m; m.y = i; m.x = j;
			cout << (board[m.toInt()] ? 'x' : '.');
		}
		cout << endl;
	}
	cout << endl;
	usleep(100000);
}

int main() {
	srand((int)time(0));
	Board board;
	for (int i = 0; i < H * W; ++i)
		board[i] = 1;
	int strat1 = SMART;
	int strat2 = RANDOM;
	drawBoard(board);
	while (true) {
		if (!board.any()) {
			cout << "Player 1 won!" << endl;
			return 0;
		}
		move(board, strat1);
		drawBoard(board);
		if (!board.any()) {
			cout << "Player 2 won!" << endl;
			return 0;
		}
		move(board, strat2);
		drawBoard(board);
	}
}
