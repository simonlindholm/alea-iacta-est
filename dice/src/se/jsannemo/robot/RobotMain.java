package se.jsannemo.robot;


import javax.swing.*;

public class RobotMain {
    public static void main(String[] args) {
        JFrame frame = new JFrame();
        frame.setSize(700, 700);
        GameFrame gameFrame = new GameFrame(new Game());
        frame.add(gameFrame);
        gameFrame.init();
        frame.setVisible(true);

    }
}
