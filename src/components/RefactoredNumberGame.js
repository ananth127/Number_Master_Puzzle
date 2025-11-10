import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet, Dimensions, Animated } from 'react-native';

// Import reusable components
import { GameHeader } from './GameHeader';
import { GameControls } from './GameControls';
import { GameGrid } from './GameGrid';
import { ActionButton, ActionButtonsRow } from './ActionButtons';
import { LevelUpOverlay, NumberPickerModal, ModeOverlay } from './Modals';

// Import hooks
import { useGameTimer, useGameAnimations, useGameState, useResourceCounter } from './GameHooks';

// Import utilities
import {
    generateRandomGrid,
    generateSmartValues,
    getPlayableCells,
    getCellColor,
    removeRows,
    getCompleteRows,
    areAdjacent,
    checkHeadToTailConnection,
    isStraightPathClear,
    checkSnakeWrapAround,
    isDiagonalPathClear,
} from './GameUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_COLS = 9;
const GRID_WIDTH = SCREEN_WIDTH - 20;
const CELL_SIZE = (GRID_WIDTH - (GRID_COLS - 1) * 7) / GRID_COLS;

// ============================================================================
// STRATEGY PATTERN: Cell Connection Strategies
// ============================================================================

/**
 * Interface for connection checking strategies
 */
class ConnectionStrategy {
    check(r1, c1, r2, c2, grid, matchedCells, gridCols) {
        throw new Error('Method must be implemented by subclass');
    }
}

class AdjacentConnectionStrategy extends ConnectionStrategy {
    check(r1, c1, r2, c2) {
        return areAdjacent(r1, c1, r2, c2);
    }
}

class StraightPathConnectionStrategy extends ConnectionStrategy {
    check(r1, c1, r2, c2, grid, matchedCells) {
        return isStraightPathClear(r1, c1, r2, c2, grid, matchedCells);
    }
}

class DiagonalPathConnectionStrategy extends ConnectionStrategy {
    check(r1, c1, r2, c2, grid, matchedCells) {
        return isDiagonalPathClear(r1, c1, r2, c2, grid, matchedCells);
    }
}

class SnakeWrapConnectionStrategy extends ConnectionStrategy {
    check(r1, c1, r2, c2, grid, matchedCells, gridCols) {
        return checkSnakeWrapAround(r1, c1, r2, c2, grid, matchedCells, gridCols);
    }
}

class HeadToTailConnectionStrategy extends ConnectionStrategy {
    check(r1, c1, r2, c2, grid, matchedCells, gridCols) {
        return checkHeadToTailConnection(r1, c1, r2, c2, grid, matchedCells, gridCols);
    }
}

/**
 * Connection Checker using multiple strategies
 */
class ConnectionChecker {
    constructor() {
        this.strategies = [
            new AdjacentConnectionStrategy(),
            new StraightPathConnectionStrategy(),
            new DiagonalPathConnectionStrategy(),
            new SnakeWrapConnectionStrategy(),
            new HeadToTailConnectionStrategy(),
        ];
    }

    checkConnection(r1, c1, r2, c2, grid, matchedCells, gridCols) {
        if (!grid[r1] || !grid[r2]) return { connected: false };
        if (r1 === r2 && c1 === c2) return { connected: false };
        if (grid[r1][c1] === null || grid[r2][c2] === null) return { connected: false };

        const num1 = grid[r1][c1];
        const num2 = grid[r2][c2];

        const isMatch = num1 === num2 || num1 + num2 === 10;
        if (!isMatch) return { connected: false };

        // Try each strategy in order
        for (let i = 0; i < this.strategies.length; i++) {
            const strategy = this.strategies[i];
            if (strategy.check(r1, c1, r2, c2, grid, matchedCells, gridCols)) {
                return { connected: true, isAdjacent: i === 0 };
            }
        }

        return { connected: false };
    }
}

// ============================================================================
// STRATEGY PATTERN: Game Action Strategies
// ============================================================================

/**
 * Base class for game actions
 */
class GameAction {
    constructor(name, icon, maxActions) {
        this.name = name;
        this.icon = icon;
        this.maxActions = maxActions;
    }

    canExecute(counter, isPlaying) {
        return isPlaying && counter.canUse;
    }

    getErrorMessage() {
        return `You can only use ${this.name} ${this.maxActions} times!`;
    }

    execute(context) {
        throw new Error('Method must be implemented by subclass');
    }
}

class AddValuesAction extends GameAction {
    constructor(maxActions) {
        super('Add', '➕', maxActions);
    }

    execute(context) {
        const { grid, matchedCells, gridCols, setGrid, counter } = context;

        const playableCells = getPlayableCells(grid, matchedCells);
        const newValues = generateSmartValues(playableCells.length, playableCells.map(c => c.value));

        const updatedGrid = [...grid];
        let valueIndex = 0;

        // Fill nulls first
        for (let row = 0; row < updatedGrid.length && valueIndex < newValues.length; row++) {
            for (let col = 0; col < gridCols && valueIndex < newValues.length; col++) {
                if (updatedGrid[row][col] === null) {
                    updatedGrid[row][col] = newValues[valueIndex];
                    valueIndex++;
                }
            }
        }

        // Add new rows if needed
        if (valueIndex < newValues.length) {
            const remainingValues = newValues.slice(valueIndex);
            let tempRow = [];

            for (let i = 0; i < remainingValues.length; i++) {
                tempRow.push(remainingValues[i]);
                if (tempRow.length === gridCols || i === remainingValues.length - 1) {
                    while (tempRow.length < gridCols) tempRow.push(null);
                    updatedGrid.push(tempRow);
                    tempRow = [];
                }
            }
        }

        setGrid(updatedGrid);
        counter.increment();

        return { success: true };
    }
}

class HintAction extends GameAction {
    constructor(maxActions) {
        super('Hint', '💡', maxActions);
    }

    execute(context) {
        const { grid, matchedCells, connectionChecker, setHintCells, counter, animations } = context;

        const playableCells = getPlayableCells(grid, matchedCells);

        for (let i = 0; i < playableCells.length; i++) {
            for (let j = i + 1; j < playableCells.length; j++) {
                const cell1 = playableCells[i];
                const cell2 = playableCells[j];

                const result = connectionChecker.checkConnection(
                    cell1.row, cell1.col, cell2.row, cell2.col,
                    grid, matchedCells, context.gridCols
                );

                if (result.connected) {
                    setHintCells([
                        { row: cell1.row, col: cell1.col },
                        { row: cell2.row, col: cell2.col }
                    ]);
                    counter.increment();
                    animations.startHintPulse().start();
                    return { success: true };
                }
            }
        }

        Alert.alert("No Moves", "No valid moves available! Use Add or Change actions.");
        return { success: false, noMoves: true };
    }
}

class ChangeNumberAction extends GameAction {
    constructor(maxActions) {
        super('Change', '🔄', maxActions);
    }

    execute(context) {
        const { setIsChangeMode } = context;
        setIsChangeMode(true);
        return { success: true };
    }
}

// ============================================================================
// STATE PATTERN: Game States
// ============================================================================

/**
 * Base class for game states
 */
class GameState {
    constructor(context) {
        this.context = context;
    }

    handleCellPress(row, col) {
        throw new Error('Method must be implemented by subclass');
    }

    handlePlayPause() {
        throw new Error('Method must be implemented by subclass');
    }

    canExecuteAction() {
        return false;
    }
}

class IdleGameState extends GameState {
    handleCellPress(row, col) {
        // Do nothing in idle state
    }

    handlePlayPause() {
        this.context.setState(new PlayingGameState(this.context));
        this.context.gameState.setIsPlaying(true);
    }

    canExecuteAction() {
        return false;
    }
}

class PlayingGameState extends GameState {
    handleCellPress(row, col) {
        this.context.processCellPress(row, col);
    }

    handlePlayPause() {
        this.context.setState(new PausedGameState(this.context));
        this.context.gameState.setIsPlaying(false);
    }

    canExecuteAction() {
        return true;
    }
}

class PausedGameState extends GameState {
    handleCellPress(row, col) {
        // Do nothing when paused
    }

    handlePlayPause() {
        this.context.setState(new PlayingGameState(this.context));
        this.context.gameState.setIsPlaying(true);
    }

    canExecuteAction() {
        return false;
    }
}

class ChangeModeGameState extends GameState {
    handleCellPress(row, col) {
        this.context.handleChangeModePress(row, col);
    }

    handlePlayPause() {
        // Cannot pause in change mode
    }

    canExecuteAction() {
        return false;
    }
}

// ============================================================================
// MAIN GAME CONTROLLER (Context for State Pattern)
// ============================================================================

class GameController {
    constructor() {
        this.state = new IdleGameState(this);
        this.connectionChecker = new ConnectionChecker();
        this.actions = null;
    }

    setState(newState) {
        this.state = newState;
    }

    initializeActions(maxActions) {
        this.actions = {
            add: new AddValuesAction(maxActions),
            hint: new HintAction(maxActions),
            change: new ChangeNumberAction(maxActions),
        };
    }

    handleCellPress(row, col) {
        this.state.handleCellPress(row, col);
    }

    handlePlayPause() {
        this.state.handlePlayPause();
    }

    canExecuteAction() {
        return this.state.canExecuteAction();
    }

    executeAction(actionName, context) {
        const action = this.actions[actionName];
        if (!action) return { success: false };

        const counter = context.counters[actionName];
        if (!action.canExecute(counter, this.canExecuteAction())) {
            if (!this.canExecuteAction()) {
                Alert.alert("Notice", "Start the game first!");
            } else {
                Alert.alert("Limit Reached", action.getErrorMessage());
            }
            return { success: false };
        }

        return action.execute(context);
    }
}

// ============================================================================
// REACT COMPONENT
// ============================================================================

export default function RefactoredNumberGame() {
    const MAX_ACTIONS = 5;
    const INITIAL_TIME = 420;

    // Initialize game controller
    const [gameController] = useState(() => {
        const controller = new GameController();
        controller.initializeActions(MAX_ACTIONS);
        return controller;
    });

    // Game state using custom hook
    const gameState = useGameState({
        level: 1,
        score: 0,
        isPlaying: false,
    });

    // Animations using custom hook
    const animations = useGameAnimations();
    const [initialRows, setInitialRows] = useState(4);

    // Timer using custom hook
    const timer = useGameTimer(INITIAL_TIME, gameState.level, gameState.isPlaying, () => {
        Alert.alert(
            "Time's Up!",
            `Final Score: ${gameState.score}\nLevel: ${gameState.level}`,
            [{ text: "OK", onPress: handleReset }]
        );
    });

    // Resource counters
    const addCounter = useResourceCounter(MAX_ACTIONS);
    const hintCounter = useResourceCounter(MAX_ACTIONS);
    const changeCounter = useResourceCounter(MAX_ACTIONS);

    // Grid state
    const [grid, setGrid] = useState([]);
    const [selected, setSelected] = useState(null);
    const [matchedCells, setMatchedCells] = useState(new Set());
    const [hintCells, setHintCells] = useState([]);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [showNumberPicker, setShowNumberPicker] = useState(false);
    const [selectedCellForChange, setSelectedCellForChange] = useState(null);
    const [isChangeMode, setIsChangeMode] = useState(false);
    const [noMovesAvailable, setNoMovesAvailable] = useState(false);
    const [invalidCell, setInvalidCell] = useState([]);

    // Attach controller context
    useEffect(() => {
        gameController.gameState = gameState;
        gameController.processCellPress = processCellPress;
        gameController.handleChangeModePress = handleChangeModePress;
    }, [gameState, grid, matchedCells, selected]);

    // Update controller state when isChangeMode changes
    useEffect(() => {
        if (isChangeMode) {
            gameController.setState(new ChangeModeGameState(gameController));
        } else if (gameState.isPlaying) {
            gameController.setState(new PlayingGameState(gameController));
        }
    }, [isChangeMode, gameState.isPlaying]);

    // Initialize grid on mount and when initialRows changes
    useEffect(() => {
        initializeGrid();
    }, [initialRows]);

    // When level changes, update timer and ensure it continues
    useEffect(() => {
        if (gameState.level > 1) {
            const newTime = Math.max(120, INITIAL_TIME - (gameState.level - 1) * 30);
            timer.resetTimer(newTime);
            if (!gameState.isPlaying) {
                gameState.setIsPlaying(true);
                gameController.setState(new PlayingGameState(gameController));
            }
        }
    }, [gameState.level]);

    const initializeGrid = () => {
        const newGrid = generateRandomGrid(initialRows, GRID_COLS);
        setGrid(newGrid);
        setMatchedCells(new Set());
    };

    // Check for no moves after grid or matchedCells changes
    useEffect(() => {
        if (!gameState.isPlaying || grid.length === 0) return;

        const checkForMoves = () => {
            const playableCells = getPlayableCells(grid, matchedCells);

            let hasValidMove = false;
            for (let i = 0; i < playableCells.length && !hasValidMove; i++) {
                for (let j = i + 1; j < playableCells.length; j++) {
                    const cell1 = playableCells[i];
                    const cell2 = playableCells[j];
                    const result = gameController.connectionChecker.checkConnection(
                        cell1.row, cell1.col, cell2.row, cell2.col,
                        grid, matchedCells, GRID_COLS
                    );

                    if (result.connected) {
                        hasValidMove = true;
                        break;
                    }
                }
            }

            if (!hasValidMove && !addCounter.canUse && !changeCounter.canUse) {
                setNoMovesAvailable(true);
                Alert.alert(
                    "No Moves Available!",
                    "Game Over - No possible moves remaining.",
                    [{ text: "OK", onPress: handleReset }]
                );
            } else if (!hasValidMove) {
                setNoMovesAvailable(true);
            } else {
                setNoMovesAvailable(false);
            }
        };

        const timeout = setTimeout(checkForMoves, 300);
        return () => clearTimeout(timeout);
    }, [grid, matchedCells, gameState.isPlaying, addCounter.count, changeCounter.count]);

    const handleChangeModePress = (row, col) => {
        setSelectedCellForChange({ row, col });
        setShowNumberPicker(true);
        setIsChangeMode(false);
        gameController.setState(new PlayingGameState(gameController));
    };

    const processCellPress = (row, col) => {
        if (grid[row][col] === null) return;
        if (matchedCells.has(`${row},${col}`)) return;

        setHintCells([]);

        if (selected === null) {
            setSelected({ row, col });
            animations.animateScale(1.1).start();
            return;
        }

        const { row: r1, col: c1 } = selected;
        const connectionResult = gameController.connectionChecker.checkConnection(
            r1, c1, row, col, grid, matchedCells, GRID_COLS
        );

        if (connectionResult.connected) {
            const newMatched = new Set(matchedCells);
            newMatched.add(`${r1},${c1}`);
            newMatched.add(`${row},${col}`);

            const completeRows = getCompleteRows(grid, newMatched);
            const { grid: updatedGrid, matchedCells: updatedMatched } = removeRows(
                grid,
                completeRows,
                newMatched
            );

            setGrid(updatedGrid);
            setMatchedCells(updatedMatched);

            const basePoints = connectionResult.isAdjacent ? 1 : 4;
            const bonusPoints = completeRows.length > 0 ? 10 : 0;
            gameState.addPoints(basePoints + bonusPoints, gameState.level);
            animations.animateScore();

            const playableCount = getPlayableCells(updatedGrid, updatedMatched).length;

            if (playableCount <= 0 || updatedGrid.length === 0) {
                const wasPlaying = gameState.isPlaying;

                setTimeout(() => {
                    gameState.incrementLevel();
                    setShowLevelUp(true);
                    animations.animateLevelUp(() => setShowLevelUp(false));

                    const newRowCount = initialRows + 1;
                    setInitialRows(newRowCount);

                    addCounter.reset();
                    hintCounter.reset();
                    changeCounter.reset();
                    setNoMovesAvailable(false);

                    if (wasPlaying) {
                        setTimeout(() => {
                            gameState.setIsPlaying(true);
                            gameController.setState(new PlayingGameState(gameController));
                        }, 100);
                    }
                }, 500);
            }
        } else {
            setInvalidCell({ row, col });
            animations.animateShake();
            setTimeout(() => {
                setInvalidCell([]);
            }, 200);
        }

        setSelected(null);
        animations.animateScale(1).start();
    };

    const handleCellPress = (row, col) => {
        gameController.handleCellPress(row, col);
    };

    const handleAddValues = () => {
        const result = gameController.executeAction('add', {
            grid,
            matchedCells,
            gridCols: GRID_COLS,
            setGrid,
            counter: addCounter,
            counters: { add: addCounter, hint: hintCounter, change: changeCounter }
        });

        if (result.success) {
            setNoMovesAvailable(false);
        }
    };

    const handleHint = () => {
        const result = gameController.executeAction('hint', {
            grid,
            matchedCells,
            connectionChecker: gameController.connectionChecker,
            setHintCells,
            counter: hintCounter,
            animations,
            gridCols: GRID_COLS,
            counters: { add: addCounter, hint: hintCounter, change: changeCounter }
        });

        if (result.success) {
            setNoMovesAvailable(false);
        } else if (result.noMoves) {
            setNoMovesAvailable(true);
        }
    };

    const handleChangeNumber = () => {
        const result = gameController.executeAction('change', {
            setIsChangeMode,
            counter: changeCounter,
            counters: { add: addCounter, hint: hintCounter, change: changeCounter }
        });
    };

    const confirmNumberChange = (newNumber) => {
        if (!selectedCellForChange) return;

        const { row, col } = selectedCellForChange;
        const updatedGrid = grid.map((r, rIdx) =>
            r.map((cell, cIdx) => (rIdx === row && cIdx === col ? newNumber : cell))
        );

        setGrid(updatedGrid);
        changeCounter.increment();
        setShowNumberPicker(false);
        setSelectedCellForChange(null);
        setNoMovesAvailable(false);
    };

    const handleReset = () => {
        Alert.alert("Reset Game", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "OK",
                onPress: () => {
                    gameState.resetGame();
                    addCounter.reset();
                    hintCounter.reset();
                    changeCounter.reset();
                    setSelected(null);
                    setHintCells([]);
                    setNoMovesAvailable(false);
                    setIsChangeMode(false);
                    setMatchedCells(new Set());
                    setInitialRows(4);
                    initializeGrid();

                    gameController.setState(new IdleGameState(gameController));

                    setTimeout(() => {
                        timer.resetTimer(INITIAL_TIME);
                    }, 100);
                },
            },
        ]);
    };

    const handlePlayPause = () => {
        gameController.handlePlayPause();
    };

    const getCellStyle = (row, col) => {
        const cellKey = `${row},${col}`;
        const isMatched = matchedCells.has(cellKey);
        const isInvalid = invalidCell && invalidCell.row === row && invalidCell.col === col;
        const isSelected = selected && selected.row === row && selected.col === col;
        const isHint = hintCells.some(hint => hint.row === row && hint.col === col);
        const isSelectedForChange = selectedCellForChange && selectedCellForChange.row === row && selectedCellForChange.col === col;

        if (isMatched) return { opacity: 0.2 };
        if (isSelected) return {
            opacity: 1,
            backgroundColor: 'rgba(255, 215, 0, 0.3)',
            shadowColor: '#ffd700',
            shadowOpacity: 0.8,
        };
        if (isSelectedForChange) {
            return {
                opacity: 1,
                borderWidth: 0,
                backgroundColor: 'rgba(157, 78, 221, 0.4)',
                shadowColor: '#9d4edd',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 10,
                elevation: 8
            };
        }
        if (isInvalid) {
            return {
                opacity: 1,
                borderWidth: 0,
                backgroundColor: 'rgba(176, 56, 29, 0.3)',
                shadowColor: '#ff0000ff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 10,
                elevation: 8
            };
        }
        if (isHint) return {
            opacity: 1,
            backgroundColor: 'rgba(0, 255, 136, 0.2)',
            shadowColor: '#00ff88',
            shadowOpacity: 0.6,
        };

        return { opacity: 1 };
    };

    return (
        <Animated.View style={[styles.container, { transform: [{ translateX: animations.shakeAnim }] }]}>
            <View style={styles.container}>
                <GameHeader
                    level={gameState.level}
                    score={gameState.score}
                    lastPoints={gameState.lastPoints}
                    scoreAnim={animations.scoreAnim}
                />

                <LevelUpOverlay
                    visible={showLevelUp}
                    level={gameState.level}
                    animValue={animations.levelAnim}
                />

                <ModeOverlay
                    visible={isChangeMode}
                    message="Tap any cell to change"
                    icon="🔄"
                    onCancel={() => {
                        setIsChangeMode(false);
                        gameController.setState(new PlayingGameState(gameController));
                    }}
                    position="bottom"
                />

                <NumberPickerModal
                    visible={showNumberPicker}
                    onClose={() => {
                        setShowNumberPicker(false);
                        setSelectedCellForChange(null);
                    }}
                    onSelectNumber={confirmNumberChange}
                    getNumberColor={getCellColor}
                />

                <View style={styles.content}>
                    <GameControls
                        isPlaying={gameState.isPlaying}
                        onPlayPause={handlePlayPause}
                        onReset={handleReset}
                        timeLeft={timer.timeLeft}
                    />

                    <GameGrid
                        grid={grid}
                        onCellPress={handleCellPress}
                        getCellStyle={getCellStyle}
                        getCellColor={getCellColor}
                        cellSize={CELL_SIZE}
                        gridHeight={SCREEN_HEIGHT * 0.55}
                        hintCells={hintCells}
                        invalidCell={invalidCell}
                        invalidCellAnim={invalidCell.length > 0 ? animations.shakeAnim : null}
                        cellAnim={hintCells.length > 0 ? animations.hintAnim : null}
                    />

                    <ActionButtonsRow>
                        <ActionButton
                            onPress={handleAddValues}
                            label="Add"
                            icon="➕"
                            count={addCounter.count}
                            maxCount={MAX_ACTIONS}
                            disabled={!gameController.canExecuteAction() || addCounter.isExhausted}
                            highlight={noMovesAvailable && addCounter.canUse}
                            animValue={noMovesAvailable ? animations.pulseAnim : null}
                        />

                        <ActionButton
                            onPress={handleHint}
                            label="Hint"
                            icon="💡"
                            count={hintCounter.count}
                            maxCount={MAX_ACTIONS}
                            disabled={!gameController.canExecuteAction() || hintCounter.isExhausted}
                            backgroundColor="#00ff88"
                        />

                        <ActionButton
                            onPress={handleChangeNumber}
                            label="Change"
                            icon="🔄"
                            count={changeCounter.count}
                            maxCount={MAX_ACTIONS}
                            disabled={!gameController.canExecuteAction() || changeCounter.isExhausted}
                        />
                    </ActionButtonsRow>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    content: {
        flex: 1,
        padding: 16,
    },
});