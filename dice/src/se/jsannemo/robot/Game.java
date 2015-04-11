package se.jsannemo.robot;


import java.util.Random;

public class Game {

    private Random random = new Random();

    public static final int BLANK = 0;
    public static final int PLAYER = 1;
    public static final int ROBOT = 2;
    public static final int SCRAP = 3;
    public static final int CRASH = 4;

    private int level;
    private int[][] grid;
    private int pr, pc;

    public Game(){
        level = 1;
        resetLevel();
    }

    public int getType(int row, int col){
        return grid[row][col];
    }

    public void resetLevel() {
        grid = new int[100][100];
        grid[49][49] = PLAYER;
        pr = 49;
        pc = 49;
        for(int i = 0; i < 10*level; ++i){
            int x = 49, y = 49;
            while(grid[x][y] != BLANK){
                x = random.nextInt(100);
                y = random.nextInt(100);
            }
            grid[x][y] = ROBOT;
        }
    }

    private void randomMove(){
        grid[pr][pc] = BLANK;
        while(true){
            pr = random.nextInt(100);
            pc = random.nextInt(100);
            if(grid[pr][pc] == BLANK){
                grid[pr][pc] = PLAYER;
                break;
            }
        }
    }

    public void makeMove(int dr, int dc) {
        if(dr == -2){
            randomMove();
            moveRobots();
            return;
        }
        if(!walkable(pr + dr, pc + dc)) return;
        grid[pr][pc] = BLANK;
        pr += dr;
        pc += dc;
        if(grid[pr][pc] == ROBOT || grid[pr][pc] == SCRAP){
            die();
            return;
        }
        grid[pr][pc] = PLAYER;
        moveRobots();
    }

    private void moveRobots(){
        int robotCount = 0;
        int[][] newRobots = new int[100][100];
        for(int i = 0; i < 100; ++i)
            for(int j = 0; j < 100; ++j){
                if(grid[i][j] == ROBOT){
                    int ni = i;
                    int nj = j;
                    if(ni > pr) ni--;
                    if(ni < pr) ni++;
                    if(nj > pc) nj--;
                    if(nj < pc) nj++;
                    newRobots[ni][nj]++;
                    grid[i][j] = BLANK;
                }
            }
        for(int i = 0; i < 100; ++i){
            for(int j = 0; j < 100; ++j){
                if(newRobots[i][j] > 1){
                    grid[i][j] = SCRAP;
                } else if(newRobots[i][j] == 1) {
                    if(grid[i][j] == BLANK || grid[i][j] == PLAYER){
                        grid[i][j] = ROBOT;
                        robotCount++;
                    }
                }
            }
        }
        if(grid[pr][pc] != PLAYER){
            grid[pr][pc] = CRASH;
            die();
        }
        if(robotCount == 0) win();
    }

    private void win() {
        System.out.println("Win!");
        level++;
        resetLevel();
    }

    private void die() {
        grid[pr][pc] = CRASH;
        System.out.println("Lose!");
    }

    private boolean walkable(int i, int j) {
        return i >= 0 && j >= 0 && i < 100 && j < 100;
    }
}
