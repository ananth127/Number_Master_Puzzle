# 🎮 Number_Master_Puzzle

A fun logic-based puzzle game where players match cells based on two main rules:
1. **Same Value Rule** – Match cells that have the same number.
2. **Sum-10 Rule** – Match cells whose values add up to 10.

The twist? You can only match cells following a **Z-pattern** across the board — no mirrored or reverse Z allowed!

---

## 🧠 Game Rules

### ✅ Valid Match Rules
- Match only in **Z-pattern** (normal Z, not mirrored).
- Can match if:
  - Both cells have the **same value**, OR
  - The **sum of both values = 10**.
- Validation always checks **head-to-tail order**, even if the user selects tail first.
- When wrapping to the next row, checking starts from the **first playable cell** in that row.
- For 5 rows, only compare the **first value of row 1** and the **last value of row 5** for edge wrap validation.

### ❌ Invalid Match Rules
- Reverse or mirrored Z-patterns are not considered valid.
- Random connections between non-adjacent rows are ignored.

---

## ⚙️ Project Setup

### Prerequisites
Make sure you have the following installed:
- Node.js ≥ 18.x
- React Native CLI or Expo
- Android Studio / Xcode (for emulator)

### Setup Steps
```bash
# Clone the repository
git clone https://github.com/ananth127/Number_Master_Puzzle.git

# Navigate to the project directory
cd Number_Master_Puzzle

# Install dependencies
npm install

# Run the app
npx react-native run-android
# or
npm start
# or
npx react-native run-ios
```

---

## 🏗️ Architecture Overview

```
src/
├── AppNavigator.js      # Page Navigation to Game Screen
├── GameScreen.js        # Game Screen UI
└── App.js               # Entry point
```

---

## 🧩 Game Flow

1. Player selects two cells.
2. System checks if the connection forms a valid **Z-pattern**.
3. Valid if **same value** or **sum = 10**.
4. Non-valid patterns are rejected with a shake animation.
5. Score updates and matched cells disappear.





## 👨‍💻 Author
**Ananth S**  
React Native Developer | Puzzle Game Enthusiast

📧 Email: ananths12704@gmail.com  
🔗 GitHub: [ananth127](https://github.com/ananth127/Number_Master_Puzzle)

---

> 🕹️ “Think smart, connect sharp — only the real Z wins!”
