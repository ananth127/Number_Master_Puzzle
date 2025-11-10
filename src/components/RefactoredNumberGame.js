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

export default function RefactoredNumberGame() {
    const MAX_ACTIONS = 5;
    const INITIAL_TIME = 420;

    // Game state using custom hook
    const gameState = useGameState({
        level: 1,
        score: 0,
        isPlaying: false,
    });

    // Animations using custom hook
    const animations = useGameAnimations();
    const [initialRows, setInitialRows] = useState(4); // default 4 rows

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

    // Initialize grid on mount and when initialRows changes
    useEffect(() => {
        initializeGrid();
    }, [initialRows]);

    // When level changes, update timer and ensure it continues
    useEffect(() => {
        if (gameState.level > 1) {
            const newTime = Math.max(120, INITIAL_TIME - (gameState.level - 1) * 30);
            timer.resetTimer(newTime);
            // Ensure game is playing after level up
            if (!gameState.isPlaying) {
                gameState.setIsPlaying(true);
            }
        }
    }, [gameState.level]);

    const initializeGrid = () => {
        const newGrid = generateRandomGrid(initialRows, GRID_COLS);
        setGrid(newGrid);
        setMatchedCells(new Set());
        console.log('Grid initialized with rows:', initialRows, newGrid);
    };

    // Check for no moves after grid or matchedCells changes
    useEffect(() => {
        if (!gameState.isPlaying || grid.length === 0) return;

        const checkForMoves = () => {
            const playableCells = getPlayableCells(grid, matchedCells);

            // Check if there are any valid moves
            let hasValidMove = false;
            for (let i = 0; i < playableCells.length && !hasValidMove; i++) {
                for (let j = i + 1; j < playableCells.length; j++) {
                    const cell1 = playableCells[i];
                    const cell2 = playableCells[j];
                    const result = areCellsConnected(cell1.row, cell1.col, cell2.row, cell2.col);

                    if (result.connected) {
                        hasValidMove = true;
                        break;
                    }
                }
            }

            // Only show no moves if there are no actions available
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

        // Small delay to avoid checking during animations
        const timeout = setTimeout(checkForMoves, 300);
        return () => clearTimeout(timeout);
    }, [grid, matchedCells, gameState.isPlaying, addCounter.count, changeCounter.count]);

    const areCellsConnected = (r1, c1, r2, c2) => {
        if (!grid[r1] || !grid[r2]) return { connected: false };
        if (r1 === r2 && c1 === c2) return { connected: false };
        if (grid[r1][c1] === null || grid[r2][c2] === null) return { connected: false };

        const num1 = grid[r1][c1];
        const num2 = grid[r2][c2];

        const isMatch = num1 === num2 || num1 + num2 === 10;
        if (!isMatch) return { connected: false };

        if (areAdjacent(r1, c1, r2, c2)) {
            return { connected: true, isAdjacent: true };
        }
        if (isStraightPathClear(r1, c1, r2, c2, grid, matchedCells)) {
            return { connected: true, isAdjacent: false };
        }
        if (isDiagonalPathClear(r1, c1, r2, c2, grid, matchedCells)) {
            return { connected: true, isAdjacent: false };
        }
        if (checkSnakeWrapAround(r1, c1, r2, c2, grid, matchedCells, GRID_COLS)) {
            return { connected: true, isAdjacent: false };
        }
        if (checkHeadToTailConnection(r1, c1, r2, c2, grid, matchedCells, GRID_COLS)) {
            return { connected: true, isAdjacent: false };
        }

        return { connected: false };
    };

    const handleCellPress = (row, col) => {
        if (!gameState.isPlaying) return;

        // Change mode handling
        if (isChangeMode) {
            setSelectedCellForChange({ row, col });
            setShowNumberPicker(true);
            setIsChangeMode(false);
            return;
        }

        if (grid[row][col] === null) return;
        if (matchedCells.has(`${row},${col}`)) return;

        setHintCells([]);

        if (selected === null) {
            setSelected({ row, col });
            animations.animateScale(1.1).start();
            return;
        }

        const { row: r1, col: c1 } = selected;
        const connectionResult = areCellsConnected(r1, c1, row, col);

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
                // Store current playing state
                const wasPlaying = gameState.isPlaying;

                setTimeout(() => {
                    gameState.incrementLevel();
                    setShowLevelUp(true);
                    animations.animateLevelUp(() => setShowLevelUp(false));

                    // Increment rows for next level
                    const newRowCount = initialRows + 1;
                    setInitialRows(newRowCount);
                    console.log('Level up! New rows:', newRowCount);

                    // Reset counters
                    addCounter.reset();
                    hintCounter.reset();
                    changeCounter.reset();
                    setNoMovesAvailable(false);

                    // Ensure game continues playing if it was playing before
                    if (wasPlaying) {
                        setTimeout(() => {
                            gameState.setIsPlaying(true);
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

    const handleAddValues = () => {
        if (!gameState.isPlaying) {
            Alert.alert("Notice", "Start the game first!");
            return;
        }

        if (!addCounter.canUse) {
            Alert.alert("Limit Reached", `You can only add values ${MAX_ACTIONS} times!`);
            return;
        }

        const playableCells = getPlayableCells(grid, matchedCells);
        const newValues = generateSmartValues(playableCells.length, playableCells.map(c => c.value));

        const updatedGrid = [...grid];
        let valueIndex = 0;

        // Fill nulls first
        for (let row = 0; row < updatedGrid.length && valueIndex < newValues.length; row++) {
            for (let col = 0; col < GRID_COLS && valueIndex < newValues.length; col++) {
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
                if (tempRow.length === GRID_COLS || i === remainingValues.length - 1) {
                    while (tempRow.length < GRID_COLS) tempRow.push(null);
                    updatedGrid.push(tempRow);
                    tempRow = [];
                }
            }
        }

        setGrid(updatedGrid);
        addCounter.increment();
        setNoMovesAvailable(false);
    };

    const handleHint = () => {
        if (!gameState.isPlaying) {
            Alert.alert("Notice", "Start the game first!");
            return;
        }

        if (!hintCounter.canUse) {
            Alert.alert("No Hints Left", "You've used all available hints!");
            return;
        }

        // Find valid move
        const playableCells = getPlayableCells(grid, matchedCells);

        for (let i = 0; i < playableCells.length; i++) {
            for (let j = i + 1; j < playableCells.length; j++) {
                const cell1 = playableCells[i];
                const cell2 = playableCells[j];

                const result = areCellsConnected(cell1.row, cell1.col, cell2.row, cell2.col);

                if (result.connected) {
                    setHintCells([
                        { row: cell1.row, col: cell1.col },
                        { row: cell2.row, col: cell2.col }
                    ]);
                    console.log('Hint found:', cell1, cell2);
                    hintCounter.increment();
                    animations.startHintPulse().start();
                    setNoMovesAvailable(false);
                    return;
                }
            }
        }

        // No moves found
        setNoMovesAvailable(true);
        Alert.alert("No Moves", "No valid moves available! Use Add or Change actions.");
    };

    const handleChangeNumber = () => {
        if (!gameState.isPlaying) {
            Alert.alert("Notice", "Start the game first!");
            return;
        }

        if (!changeCounter.canUse) {
            Alert.alert("Limit Reached", `You can only change numbers ${MAX_ACTIONS} times!`);
            return;
        }

        setIsChangeMode(true);
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
                    // Reset all state
                    gameState.resetGame();
                    addCounter.reset();
                    hintCounter.reset();
                    changeCounter.reset();
                    setSelected(null);
                    setHintCells([]);
                    setNoMovesAvailable(false);
                    setIsChangeMode(false);
                    setMatchedCells(new Set());

                    // Reset rows which will trigger grid initialization
                    setInitialRows(4);
                    initializeGrid();
                    // Reset timer after a brief delay to ensure state is updated
                    setTimeout(() => {
                        timer.resetTimer(INITIAL_TIME);
                    }, 100);
                },
            },
        ]);
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
                    onCancel={() => setIsChangeMode(false)}
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
                        onPlayPause={() => gameState.setIsPlaying(!gameState.isPlaying)}
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
                            disabled={!gameState.isPlaying || addCounter.isExhausted}
                            highlight={noMovesAvailable && addCounter.canUse}
                            animValue={noMovesAvailable ? animations.pulseAnim : null}
                        />

                        <ActionButton
                            onPress={handleHint}
                            label="Hint"
                            icon="💡"
                            count={hintCounter.count}
                            maxCount={MAX_ACTIONS}
                            disabled={!gameState.isPlaying || hintCounter.isExhausted}
                            backgroundColor="#00ff88"
                        />

                        <ActionButton
                            onPress={handleChangeNumber}
                            label="Change"
                            icon="🔄"
                            count={changeCounter.count}
                            maxCount={MAX_ACTIONS}
                            disabled={!gameState.isPlaying || changeCounter.isExhausted}
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