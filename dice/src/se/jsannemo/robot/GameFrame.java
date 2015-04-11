package se.jsannemo.robot;


import javax.swing.*;
import java.awt.*;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;

public class GameFrame extends JPanel {

    private static final int GRID_SIZE = 100;
    private static final int AREA_SIZE = 700;
    private static final int TILE_SIZE = AREA_SIZE / GRID_SIZE;

    private Game game;
    private boolean lost;

    public GameFrame(final Game game) {
        super();
        this.game = game;
    }

    private int getDeltaCol(KeyEvent e) {

        switch (e.getKeyChar()) {
            case 'q':
            case 'w':
            case 'e':
                return -1;
            case 'a':
            case 'd':
                return 0;
            case 'z':
            case 'x':
            case 'c':
                return 1;
            case 's':
                return -2;
        }
        return 2;
    }

    private int getDeltaRow(KeyEvent e) {
        switch (e.getKeyChar()) {
            case 'q':
            case 'a':
            case 'z':
                return -1;
            case 'w':
            case 'x':
                return 0;
            case 'e':
            case 'd':
            case 'c':
                return 1;
            case 's':
                return -2;
        }
        return 2;
    }

    private static final Color[] TILE_COLOR = {
            Color.WHITE,
            Color.CYAN,
            Color.BLACK,
            Color.LIGHT_GRAY,
            Color.RED,
    };


    @Override
    public void paint(Graphics graph) {
        Graphics2D g = (Graphics2D) graph;
        for (int i = 0; i < GRID_SIZE; ++i)
            for (int j = 0; j < GRID_SIZE; ++j) {
                if(game.getType(i, j) == Game.CRASH) lost = true;
                g.setColor(TILE_COLOR[game.getType(i, j)]);
                g.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
    }

    public void init() {
        this.setFocusable(true);
        this.requestFocus();
        this.addKeyListener(new KeyAdapter() {
            @Override
            public void keyTyped(KeyEvent e) {
                if(GameFrame.this.lost) return;
                System.out.println(e.getKeyChar());
                int dr = getDeltaRow(e);
                int dc = getDeltaCol(e);
                if (dr != 2)
                    game.makeMove(dr, dc);
                GameFrame.this.repaint();
            }
        });
    }
}
