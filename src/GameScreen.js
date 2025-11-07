import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Animated, Dimensions, Modal } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_COLS = 9;
let INITIAL_ROWS = 4;
const GRID_WIDTH = SCREEN_WIDTH - 20;
const CELL_SIZE = (GRID_WIDTH - (GRID_COLS - 1) * 7) / GRID_COLS;
const GRID_HEIGHT = SCREEN_HEIGHT * 0.55;

export default function NumberMasterGame() {
  const maxChance = 5;
  const [grid, setGrid] = useState([]);
  const [selected, setSelected] = useState(null);
  const [addCount, setAddCount] = useState(0);
  const [maxAdds, setMaxAdds] = useState(maxChance);
  const [timeLeft, setTimeLeft] = useState(420);
  const [isPlaying, setIsPlaying] = useState(false);
  const [matchedCells, setMatchedCells] = useState(new Set());
  const [invalidCell, setInvalidCell] = useState(null);
  const [level, setLevel] = useState(1);
  const [points, setPoints] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);
  const [hintCells, setHintCells] = useState([]);
  const [hintCount, setHintCount] = useState(0);
  const [noMovesAvailable, setNoMovesAvailable] = useState(false);
  const [changeCount, setChangeCount] = useState(0);
  const [showNumberPicker, setShowNumberPicker] = useState(false);
  const [selectedCellForChange, setSelectedCellForChange] = useState(null);
  const [isChangeMode, setIsChangeMode] = useState(false);

  const intervalRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const levelAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(1)).current;
  const hintAnim = useRef(new Animated.Value(1)).current;
  const addButtonAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    generateGrid();
  }, []);

  useEffect(() => {
    INITIAL_ROWS = level + 3;
    setTimeLeft(420 - (level - 1) * 30 >= 120 ? 420 - (level - 1) * 30 : 120);
  }, [level]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            Alert.alert("Time's Up!", `Final Score: ${totalScore}\nLevel Reached: ${level}`);
            resetGame();
            return 420;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (noMovesAvailable && addCount < maxAdds) {
      const blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(addButtonAnim, {
            toValue: 1.15,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(addButtonAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      blinkAnimation.start();
      return () => blinkAnimation.stop();
    } else {
      addButtonAnim.setValue(1);
    }
  }, [noMovesAvailable, addCount, maxAdds]);

  const generateGrid = () => {
    const newGrid = Array.from({ length: INITIAL_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => Math.floor(Math.random() * 9) + 1)
    );
    setGrid(newGrid);
    setMatchedCells(new Set());
  };

  const animateScore = () => {
    Animated.sequence([
      Animated.timing(scoreAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scoreAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showLevelUpAnimation = () => {
    setShowLevelUp(true);
    Animated.sequence([
      Animated.timing(levelAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(levelAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowLevelUp(false));
  };

  const startHintAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(hintAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(hintAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const playErrorSound = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const addPoints = (pointsToAdd, isAdjacent, isRowComplete = false, isLevelComplete = false) => {
    let finalPoints = pointsToAdd;

    if (isRowComplete) {
      finalPoints = 10 + pointsToAdd;
    }

    if (isLevelComplete) {
      finalPoints = 20 + pointsToAdd;
    }

    setPoints(prev => prev + finalPoints);
    setLastPoints(finalPoints);
    animateScore();

    const scoreToAdd = finalPoints * level;
    setTotalScore(prev => prev + scoreToAdd);
  };

  const getPlayableValuesCount = () => {
    return grid.flat().filter((cell, index) => {
      const row = Math.floor(index / GRID_COLS);
      const col = index % GRID_COLS;
      return cell !== null && !matchedCells.has(`${row},${col}`);
    }).length;
  };

  const checkDiagonalFlow = (r1, c1, r2, c2, currentGrid) => {
    const diffR = r2 - r1;
    const diffC = c2 - c1;

    if (Math.abs(diffR) !== Math.abs(diffC)) return false;

    const dr = diffR > 0 ? 1 : -1;
    const dc = diffC > 0 ? 1 : -1;

    let r = r1 + dr;
    let c = c1 + dc;

    while (r !== r2 && c !== c2) {
      const cellKey = `${r},${c}`;
      if (!matchedCells.has(cellKey) && currentGrid[r] && currentGrid[r][c] !== null) {
        return false;
      }
      r += dr;
      c += dc;
    }

    return true;
  };

  const checkSnakeWrapAround = (r1, c1, r2, c2, currentGrid) => {
    if (r1 === r2) return false;

    let rightWrapClear = true;

    for (let col = c1 + 1; col < GRID_COLS; col++) {
      const cellKey = `${r1},${col}`;
      if (!matchedCells.has(cellKey) && currentGrid[r1] && currentGrid[r1][col] !== null) {
        rightWrapClear = false;
        break;
      }
    }

    if (rightWrapClear) {
      const startRow = r1 < r2 ? r1 + 1 : r2 + 1;
      const endRow = r1 < r2 ? r2 : r1;

      for (let row = startRow; row < endRow; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const cellKey = `${row},${col}`;
          if (!matchedCells.has(cellKey) && currentGrid[row] && currentGrid[row][col] !== null) {
            rightWrapClear = false;
            break;
          }
        }
        if (!rightWrapClear) break;
      }

      if (rightWrapClear) {
        for (let col = 0; col < c2; col++) {
          const cellKey = `${r2},${col}`;
          if (!matchedCells.has(cellKey) && currentGrid[r2] && currentGrid[r2][col] !== null) {
            rightWrapClear = false;
            break;
          }
        }
        if (rightWrapClear) return true;
      }
    }

    let leftWrapClear = true;

    for (let col = c1 - 1; col >= 0; col--) {
      const cellKey = `${r1},${col}`;
      if (!matchedCells.has(cellKey) && currentGrid[r1] && currentGrid[r1][col] !== null) {
        leftWrapClear = false;
        break;
      }
    }

    if (leftWrapClear) {
      const startRow = r1 > r2 ? r1 - 1 : r2 - 1;
      const endRow = r1 > r2 ? r2 : r1;

      for (let row = startRow; row > endRow; row--) {
        for (let col = GRID_COLS - 1; col >= 0; col--) {
          const cellKey = `${row},${col}`;
          if (!matchedCells.has(cellKey) && currentGrid[row] && currentGrid[row][col] !== null) {
            leftWrapClear = false;
            break;
          }
        }
        if (!leftWrapClear) break;
      }

      if (leftWrapClear) {
        for (let col = GRID_COLS - 1; col > c2; col--) {
          const cellKey = `${r2},${col}`;
          if (!matchedCells.has(cellKey) && currentGrid[r2] && currentGrid[r2][col] !== null) {
            leftWrapClear = false;
            break;
          }
        }
        if (leftWrapClear) return true;
      }
    }

    return false;
  };

  const checkHeadToTailConnection = (r1, c1, r2, c2, currentGrid) => {
    let headPos = -1;
    let headRow = -1;
    let headCol = -1;

    for (let i = 0; i < currentGrid.length * GRID_COLS; i++) {
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      const cellKey = `${row},${col}`;

      if (currentGrid[row] && currentGrid[row][col] !== null && !matchedCells.has(cellKey)) {
        headPos = i;
        headRow = row;
        headCol = col;
        break;
      }
    }

    let tailPos = -1;
    let tailRow = -1;
    let tailCol = -1;

    for (let i = currentGrid.length * GRID_COLS - 1; i >= 0; i--) {
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      const cellKey = `${row},${col}`;

      if (currentGrid[row] && currentGrid[row][col] !== null && !matchedCells.has(cellKey)) {
        tailPos = i;
        tailRow = row;
        tailCol = col;
        break;
      }
    }

    const isCell1Head = (r1 === headRow && c1 === headCol);
    const isCell1Tail = (r1 === tailRow && c1 === tailCol);
    const isCell2Head = (r2 === headRow && c2 === headCol);
    const isCell2Tail = (r2 === tailRow && c2 === tailCol);

    const isHeadToTail = (isCell1Head && isCell2Tail) || (isCell1Tail && isCell2Head);

    if (!isHeadToTail) return false;

    let clockwiseClear = true;
    for (let i = headPos + 1; i < tailPos; i++) {
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      const cellKey = `${row},${col}`;

      if (currentGrid[row] && currentGrid[row][col] !== null && !matchedCells.has(cellKey)) {
        clockwiseClear = false;
        break;
      }
    }

    if (clockwiseClear) return true;

    let anticlockwiseClear = true;

    for (let i = tailPos + 1; i < currentGrid.length * GRID_COLS; i++) {
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      const cellKey = `${row},${col}`;

      if (currentGrid[row] && currentGrid[row][col] !== null && !matchedCells.has(cellKey)) {
        anticlockwiseClear = false;
        break;
      }
    }

    if (anticlockwiseClear) {
      for (let i = 0; i < headPos; i++) {
        const row = Math.floor(i / GRID_COLS);
        const col = i % GRID_COLS;
        const cellKey = `${row},${col}`;

        if (currentGrid[row] && currentGrid[row][col] !== null && !matchedCells.has(cellKey)) {
          anticlockwiseClear = false;
          break;
        }
      }
    }

    return anticlockwiseClear;
  };

  const areAdjacent = (r1, c1, r2, c2) => {
    const rowDiff = Math.abs(r1 - r2);
    const colDiff = Math.abs(c1 - c2);
    return rowDiff <= 1 && colDiff <= 1 && (rowDiff !== 0 || colDiff !== 0);
  };

  const isStraightPathClear = (r1, c1, r2, c2, currentGrid) => {
    if (r1 === r2) {
      const minCol = Math.min(c1, c2);
      const maxCol = Math.max(c1, c2);
      for (let col = minCol + 1; col < maxCol; col++) {
        const cellKey = `${r1},${col}`;
        if (!matchedCells.has(cellKey) && currentGrid[r1] && currentGrid[r1][col] !== null) return false;
      }
      return true;
    } else if (c1 === c2) {
      const minRow = Math.min(r1, r2);
      const maxRow = Math.max(r1, r2);
      for (let row = minRow + 1; row < maxRow; row++) {
        const cellKey = `${row},${c1}`;
        if (!matchedCells.has(cellKey) && currentGrid[row] && currentGrid[row][c1] !== null) return false;
      }
      return true;
    }
    return false;
  };

  const areCellsConnected = (r1, c1, r2, c2, currentGrid = grid) => {
    // Safety checks for grid bounds
    if (!currentGrid[r1] || !currentGrid[r2]) return { connected: false };
    if (r1 === r2 && c1 === c2) return { connected: false };
    if (currentGrid[r1][c1] === null || currentGrid[r2][c2] === null) return { connected: false };

    const num1 = currentGrid[r1][c1];
    const num2 = currentGrid[r2][c2];

    const isMatch = num1 === num2 || (num1 + num2 === 10);
    if (!isMatch) return { connected: false };

    if (areAdjacent(r1, c1, r2, c2)) return { connected: true, isAdjacent: true, type: 'adjacent' };
    if (isStraightPathClear(r1, c1, r2, c2, currentGrid)) return { connected: true, isAdjacent: false, type: 'straight' };
    if (checkDiagonalFlow(r1, c1, r2, c2, currentGrid)) return { connected: true, isAdjacent: false, type: 'diagonal' };
    if (checkSnakeWrapAround(r1, c1, r2, c2, currentGrid)) return { connected: true, isAdjacent: false, type: 'snake' };
    if (checkHeadToTailConnection(r1, c1, r2, c2, currentGrid)) return { connected: true, isAdjacent: false, type: 'headtotail' };

    return { connected: false };
  };

  const checkForValidMoves = (currentGrid = grid, currentMatched = matchedCells) => {
    const playableCells = [];

    for (let r = 0; r < currentGrid.length; r++) {
      if (!currentGrid[r]) continue; // Safety check
      for (let c = 0; c < GRID_COLS; c++) {
        const cellKey = `${r},${c}`;
        if (currentGrid[r][c] !== null && !currentMatched.has(cellKey)) {
          playableCells.push({ row: r, col: c, value: currentGrid[r][c] });
        }
      }
    }

    for (let i = 0; i < playableCells.length; i++) {
      for (let j = i + 1; j < playableCells.length; j++) {
        const cell1 = playableCells[i];
        const cell2 = playableCells[j];

        const result = areCellsConnected(cell1.row, cell1.col, cell2.row, cell2.col, currentGrid);

        if (result.connected) {
          return true;
        }
      }
    }

    return false;
  };

  const showHint = () => {
    const playableCells = [];

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cellKey = `${r},${c}`;
        if (grid[r][c] !== null && !matchedCells.has(cellKey)) {
          playableCells.push({ row: r, col: c, value: grid[r][c] });
        }
      }
    }

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
          setNoMovesAvailable(false);
          startHintAnimation();
          return true;
        }
      }
    }

    setHintCells([]);
    setNoMovesAvailable(true);
    return false;
  };

  const generateSmartValues = (count, currentGrid, currentMatched) => {
    const playableCells = [];

    for (let r = 0; r < currentGrid.length; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cellKey = `${r},${c}`;
        if (currentGrid[r][c] !== null && !currentMatched.has(cellKey)) {
          playableCells.push({ row: r, col: c, value: currentGrid[r][c] });
        }
      }
    }

    if (playableCells.length === 0) {
      return Array.from({ length: count }, () => Math.floor(Math.random() * 9) + 1);
    }

    const values = [];
    const existingValues = playableCells.map(cell => cell.value);

    for (let i = 0; i < count; i++) {
      if (count <= 3 && playableCells.length > 0) {
        const randomExisting = playableCells[Math.floor(Math.random() * playableCells.length)];

        if (Math.random() < 0.7) {
          if (Math.random() < 0.5) {
            values.push(randomExisting.value);
          } else {
            values.push(10 - randomExisting.value);
          }
        } else {
          values.push(Math.floor(Math.random() * 9) + 1);
        }
      } else {
        if (Math.random() < 0.4 && existingValues.length > 0) {
          const randomExisting = existingValues[Math.floor(Math.random() * existingValues.length)];
          values.push(randomExisting);
        } else if (Math.random() < 0.6 && existingValues.length > 0) {
          const randomExisting = existingValues[Math.floor(Math.random() * existingValues.length)];
          values.push(10 - randomExisting);
        } else {
          values.push(Math.floor(Math.random() * 9) + 1);
        }
      }
    }

    return values;
  };

  const handleCellPress = (row, col) => {
    if (!isPlaying) return;
    
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
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        useNativeDriver: true,
      }).start();
      return;
    }

    const { row: r1, col: c1 } = selected;
    const connectionResult = areCellsConnected(r1, c1, row, col);

    if (connectionResult.connected) {
      const newMatched = new Set(matchedCells);
      newMatched.add(`${r1},${c1}`);
      newMatched.add(`${row},${col}`);

      const updatedGrid = [...grid];
      const rowsToRemove = [];

      for (let r = 0; r < updatedGrid.length; r++) {
        let allCellsMatched = true;
        for (let c = 0; c < GRID_COLS; c++) {
          const cellKey = `${r},${c}`;
          if (!newMatched.has(cellKey)) {
            allCellsMatched = false;
            break;
          }
        }
        if (allCellsMatched) {
          rowsToRemove.push(r);
        }
      }

      const isRowComplete = rowsToRemove.length > 0;

      for (let i = rowsToRemove.length - 1; i >= 0; i--) {
        updatedGrid.splice(rowsToRemove[i], 1);
      }

      const updatedMatched = new Set();
      newMatched.forEach(cellKey => {
        const [oldRow, col] = cellKey.split(',').map(Number);

        if (rowsToRemove.includes(oldRow)) {
          return;
        }

        const rowsRemovedBefore = rowsToRemove.filter(r => r < oldRow).length;
        const newRow = oldRow - rowsRemovedBefore;

        if (newRow >= 0 && newRow < updatedGrid.length) {
          updatedMatched.add(`${newRow},${col}`);
        }
      });

      setGrid(updatedGrid);
      setMatchedCells(updatedMatched);

      const playableCells = updatedGrid.flat().filter((cell, index) => {
        const r = Math.floor(index / GRID_COLS);
        const c = index % GRID_COLS;
        return cell !== null && !updatedMatched.has(`${r},${c}`);
      }).length;

      const basePoints = connectionResult.isAdjacent ? 1 : 4;

      if (playableCells <= 0 || updatedGrid.length === 0) {
        addPoints(basePoints, connectionResult.isAdjacent, isRowComplete, true);
        setTimeout(() => {
          setLevel(prev => prev + 1);
          showLevelUpAnimation();
          generateGrid();
          setAddCount(0);
          setPoints(0);
          setHintCells([]);
          setNoMovesAvailable(false);
          setHintCount(0);
          setChangeCount(0);
        }, 500);
      } else {
        addPoints(basePoints, connectionResult.isAdjacent, isRowComplete, false);

        setTimeout(() => {
          const hasValidMoves = checkForValidMoves(updatedGrid, updatedMatched);
          if (!hasValidMoves && changeCount > 0) {
            Alert.alert("Notice", "Consider using Change Number to create new possibilities!");
          }
          if (!hasValidMoves) {
            setNoMovesAvailable(true);
            if (addCount >= maxAdds) {
              setTimeout(() => {
                Alert.alert(
                  "Game Over!",
                  `No more moves!\nFinal Score: ${totalScore}\nLevel Reached: ${level}`,
                  [{ text: "OK", onPress: resetGame }]
                );
              }, 500);
            }
          } else {
            setNoMovesAvailable(false);
          }
        }, 100);
      }
    } else {
      playErrorSound();

      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setInvalidCell({ row, col });
      setTimeout(() => {
        setInvalidCell(null);
      }, 500);
    }

    setSelected(null);
    Animated.timing(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const addValuesBasedOnGrid = () => {
    if (!isPlaying) {
      Alert.alert("Notice", "Start the game first!");
      return;
    }

    if (addCount >= maxAdds) {
      Alert.alert("Limit Reached", `You can only add values ${maxAdds} times!`);
      return;
    }

    const currentPlayableCount = getPlayableValuesCount();
    const valuesToAdd = currentPlayableCount;

    const newValues = generateSmartValues(valuesToAdd, grid, matchedCells);

    const updatedGrid = grid.map(row => [...row]);
    let valueIndex = 0;

    for (let row = 0; row < updatedGrid.length && valueIndex < newValues.length; row++) {
      for (let col = 0; col < GRID_COLS && valueIndex < newValues.length; col++) {
        if (updatedGrid[row][col] === null) {
          updatedGrid[row][col] = newValues[valueIndex];
          valueIndex++;
        }
      }
    }

    if (valueIndex < newValues.length) {
      const remainingValues = newValues.slice(valueIndex);
      const newRows = [];
      let tempRow = [];

      for (let i = 0; i < remainingValues.length; i++) {
        tempRow.push(remainingValues[i]);

        if (tempRow.length === GRID_COLS || i === remainingValues.length - 1) {
          while (tempRow.length < GRID_COLS) {
            tempRow.push(null);
          }
          newRows.push(tempRow);
          tempRow = [];
        }
      }

      updatedGrid.push(...newRows);
    }

    setGrid(updatedGrid);
    setAddCount(prev => prev + 1);
    setNoMovesAvailable(false);
    setHintCells([]);

    setTimeout(() => {
      const hasValidMoves = checkForValidMoves(updatedGrid, matchedCells);
      if (!hasValidMoves) {
        setNoMovesAvailable(true);
      }
    }, 100);
  };

  const useHint = () => {
    if (!isPlaying) {
      Alert.alert("Notice", "Start the game first!");
      return;
    }
    if (hintCount >= maxChance && totalScore < 10) {
      Alert.alert("No Hints Left", "You've used all available hints! Need at least 10 points to use more.");
      return;
    }
    if (hintCount >= maxChance && totalScore >= 10) {
      Alert.alert(
        "No Hints Left!",
        "Using a hint now will cost you 10 points.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "OK",
            onPress: () => {
              setTotalScore(prev => prev - 10);
              setHintCount(4);
              const hintFound = showHint();
              if (hintFound) {
                setHintCount(prev => prev + 1);
              }
            }
          }
        ]
      );
      return;
    }
    if (hintCells.length > 0) {
      return;
    }
    const hintFound = showHint();
    if (hintFound) {
      setHintCount(prev => prev + 1);
    }
  };

  const handleChangeNumber = () => {
    if (!isPlaying) {
      Alert.alert("Notice", "Start the game first!");
      return;
    }

    if (changeCount >= maxChance) {
      Alert.alert("Limit Reached", `You can only change numbers ${maxChance} times!`);
      return;
    }
    
    setIsChangeMode(true);
    Alert.alert("Change Mode", "Tap any cell to change its number");
  };

  const confirmNumberChange = (newNumber) => {
    if (!selectedCellForChange) return;

    const { row, col } = selectedCellForChange;
    const updatedGrid = grid.map((r, rIdx) =>
      r.map((cell, cIdx) => {
        if (rIdx === row && cIdx === col) {
          return newNumber;
        }
        return cell;
      })
    );

    const newMatched = new Set(matchedCells);
    newMatched.delete(`${row},${col}`);

    setGrid(updatedGrid);
    setMatchedCells(newMatched);
    setChangeCount(prev => prev + 1);
    setShowNumberPicker(false);
    setSelectedCellForChange(null);
    setNoMovesAvailable(false);
    setHintCells([]);
  };

  const resetGame = () => {
    const currstate = isPlaying;
    if (isPlaying) {
      setIsPlaying(false);
    }
    Alert.alert(
      "Reset Game",
      "Are you sure you want to reset the game? Your current progress will be lost.",
      [
        { 
          text: "Cancel", 
          style: "cancel",
          onPress: () => {
            if (currstate) setIsPlaying(true);
          }
        },
        { 
          text: "OK", 
          onPress: () => {
            generateGrid();
            setSelected(null);
            setAddCount(0);
            setTimeLeft(420);
            setIsPlaying(false);
            setLevel(1);
            setLastPoints(0);
            setPoints(0);
            setTotalScore(0);
            setHintCount(0);
            setChangeCount(0);
            if (intervalRef.current) clearInterval(intervalRef.current);
            setMatchedCells(new Set());
            setInvalidCell(null);
            setHintCells([]);
            setMaxAdds(maxChance);
            setNoMovesAvailable(false);
            setIsChangeMode(false);
            INITIAL_ROWS = 4;
          } 
        }
      ]
    );
  };

  const getCellColor = (num) => {
    const colors = {
      1: '#f33838ff',
      2: '#3be9ddff',
      3: '#e7c831ff',
      4: '#56be98ff',
      5: '#d04651ff',
      6: '#ef8f4fff',
      7: '#c9706bff',
      8: '#427fe8ff',
      9: '#fb4fe4ff',
    };
    return colors[num] || '#3b82f6';
  };

  const getOpacityForRow = (rowIndex) => {
    const totalRows = grid.length;
    const minOpacity = 1;
    const maxOpacity = 1;
    return maxOpacity - ((totalRows - 1 - rowIndex) / (totalRows - 1)) * (maxOpacity - minOpacity);
  };

  const getCellStyle = (row, col) => {
    const cellKey = `${row},${col}`;
    const isMatched = matchedCells.has(cellKey);
    const isInvalid = invalidCell && invalidCell.row === row && invalidCell.col === col;
    const isSelected = selected && selected.row === row && selected.col === col;
    const isHint = hintCells.some(hint => hint.row === row && hint.col === col);
    const isSelectedForChange = selectedCellForChange && selectedCellForChange.row === row && selectedCellForChange.col === col;

    const baseOpacity = getOpacityForRow(row);

    if (grid[row][col] === null) {
      return { opacity: baseOpacity * 0.3 };
    }

    if (isMatched) {
      return { opacity: 0.2 };
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

    if (isSelected) {
      return {
        opacity: 1,
        borderWidth: 0,
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
        shadowColor: '#ffd700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 8
      };
    }

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

    if (isHint) {
      return {
        opacity: 1,
        borderWidth: 0,
        borderColor: '#00ff88',
        backgroundColor: 'rgba(0, 255, 136, 0.2)',
        shadowColor: '#00ff88',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
      };
    }
    return { opacity: baseOpacity };
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LEVEL {level}</Text>
        </View>
        <Animated.View style={[styles.scoreContainer, { transform: [{ scale: scoreAnim }] }]}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{totalScore}</Text>
          {lastPoints > 0 && (
            <Text style={styles.pointsAdded}>+{lastPoints * level}</Text>
          )}
        </Animated.View>
      </View>

      {showLevelUp && (
        <Animated.View
          style={[
            styles.levelUpOverlay,
            {
              opacity: levelAnim,
              transform: [{
                scale: levelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                })
              }]
            }
          ]}
        >
          <Text style={styles.levelUpText}>🎉 LEVEL {level} 🎉</Text>
        </Animated.View>
      )}

      {isChangeMode && (
        <View style={styles.changeModeOverlay}>
          <View style={styles.changeModeBox}>
            <Text style={styles.changeModeText}>🔄 Tap any cell to change</Text>
            <TouchableOpacity
              onPress={() => setIsChangeMode(false)}
              style={styles.cancelChangeButton}
            >
              <Text style={styles.cancelChangeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        visible={showNumberPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowNumberPicker(false);
          setSelectedCellForChange(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.numberPickerContainer}>
            <Text style={styles.numberPickerTitle}>Choose a Number</Text>
            <View style={styles.numberGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[styles.numberButton, { backgroundColor: getCellColor(num) }]}
                  onPress={() => confirmNumberChange(num)}
                >
                  <Text style={styles.numberButtonText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowNumberPicker(false);
                setSelectedCellForChange(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.contentContainer}>
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() => setIsPlaying(!isPlaying)}
            style={[styles.button, styles.buttonPlay]}
          >
            <Text style={styles.buttonText}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </Text>
          </View>
          <TouchableOpacity onPress={resetGame} style={[styles.button, styles.buttonReset]}>
            <Text style={styles.buttonText}>↻</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridContainer}>
          <ScrollView style={styles.gridScroll} showsVerticalScrollIndicator={false}>
            {grid.map((row, rIdx) => (
              <View key={rIdx} style={styles.row}>
                {row.map((num, cIdx) => {
                  const isHint = hintCells.some(hint => hint.row === rIdx && hint.col === cIdx);
                  const cellColor = num !== null ? getCellColor(num) : 'transparent';
                  const cellStyle = getCellStyle(rIdx, cIdx);

                  return (
                    <Animated.View
                      key={`${rIdx}-${cIdx}`}
                      style={[
                        isHint ? { transform: [{ scale: hintAnim }] } : {},
                        cellStyle
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.cell}
                        onPress={() => handleCellPress(rIdx, cIdx)}
                      >
                        {num !== null && (
                          <Text style={[
                            styles.cellText,
                            { color: cellColor }
                          ]}>
                            {num}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.buttonRow}>
          <Animated.View style={[styles.actionButton, { transform: [{ scale: addButtonAnim }] }]}>
            <TouchableOpacity
              onPress={addValuesBasedOnGrid}
              style={[
                styles.addButton,
                noMovesAvailable && addCount < maxAdds && styles.addButtonPulse
              ]}
              disabled={!isPlaying || addCount >= maxAdds}
            >
              <Text style={styles.addButtonText}>
                {noMovesAvailable && addCount < maxAdds ? '⚠️ ' : '➕ '}
                Add ({maxAdds - addCount})
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.actionButton}>
            <TouchableOpacity
              onPress={useHint}
              style={[
                styles.hintButton,
                hintCount >= maxChance && styles.hintButtonDisabled
              ]}
            >
              <Text style={styles.hintButtonText}>
                💡 Hint ({maxChance - hintCount})
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionButton}>
            <TouchableOpacity
              onPress={handleChangeNumber}
              style={[
                styles.changeButton,
                changeCount >= maxChance && styles.changeButtonDisabled
              ]}
              disabled={!isPlaying || changeCount >= maxChance}
            >
              <Text style={styles.changeButtonText}>
                🔄 Change ({maxChance - changeCount})
              </Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: SCREEN_HEIGHT * 0.01,
    paddingBottom: 16,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  levelBadge: {
    backgroundColor: '#e94560',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  levelText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    color: '#94a3b8',
    fontSize: SCREEN_WIDTH * 0.03,
    fontWeight: '600',
    letterSpacing: 1,
  },
  scoreValue: {
    color: '#ffd700',
    fontSize: SCREEN_WIDTH * 0.08,
    fontWeight: '900',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  pointsAdded: {
    color: '#00ff88',
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: '700',
    marginTop: -4,
  },
  levelUpOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
  },
  levelUpText: {
    fontSize: SCREEN_WIDTH * 0.12,
    fontWeight: '900',
    color: '#ffd700',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  changeModeOverlay: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.60,
    left: 0,
    right: 0,
    zIndex: 998,
    alignItems: 'center',
  },
  changeModeBox: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#9d4edd',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 49,
  },
  changeModeText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.05,
    fontWeight: '800',
    marginBottom: 12,
  },
  cancelChangeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  cancelChangeText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberPickerContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH * 0.85,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  numberPickerTitle: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.055,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: 1,
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  numberButton: {
    width: SCREEN_WIDTH * 0.22,
    height: SCREEN_WIDTH * 0.22,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  numberButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.08,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cancelButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 4,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '800',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: SCREEN_HEIGHT * 0.02,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  button: {
    width: SCREEN_WIDTH * 0.14,
    height: SCREEN_WIDTH * 0.14,
    borderRadius: SCREEN_WIDTH * 0.07,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  buttonPlay: {
    backgroundColor: '#00ff88',
    shadowColor: '#00ff88',
  },
  buttonReset: {
    backgroundColor: '#e94560',
    shadowColor: '#e94560',
  },
  buttonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.07,
    fontWeight: '700',
  },
  timerContainer: {
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.065,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  gridContainer: {
    backgroundColor: 'rgba(20, 20, 20, 0.5)',
    borderRadius: 20,
    padding: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: GRID_HEIGHT,
    overflow: 'hidden',
  },
  gridScroll: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 3,
    justifyContent: 'center',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cellText: {
    fontSize: CELL_SIZE * 0.6,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
    paddingHorizontal: 5,
  },
  actionButton: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#9d4edd',
    paddingVertical: SCREEN_HEIGHT * 0.02,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#9d4edd',
    shadowOffset: { width: 10, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  addButtonPulse: {
    backgroundColor: '#e94560',
    shadowColor: '#e94560',
  },
  addButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hintButton: {
    backgroundColor: '#00ff88',
    paddingVertical: SCREEN_HEIGHT * 0.01,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  hintButtonDisabled: {
    backgroundColor: '#475569',
    shadowColor: '#475569',
  },
  hintButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  changeButton: {
    backgroundColor: '#9d4edd',
    paddingVertical: SCREEN_HEIGHT * 0.01,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#9d4edd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  changeButtonDisabled: {
    backgroundColor: '#475569',
    shadowColor: '#475569',
  },
  changeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});