import { useEffect, useState } from "react";

const GRID_SIZE = 12;

type Cell = {
  pit: boolean;
  wumpus: boolean;
  gold: boolean;
  breeze: boolean;
  stench: boolean;

  visited: boolean;
  safe: boolean;

  suspectedPit: boolean;
  confirmedPit: boolean;

  suspectedWumpus: boolean;
  confirmedWumpus: boolean;

  deadWumpus: boolean;
};



function generateBoard(): Cell[][] {
  const board: Cell[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() =>
      Array(GRID_SIZE)
        .fill(null)
        .map(() => ({
          pit: false,
          wumpus: false,
          gold: false,
          breeze: false,
          stench: false,
          visited: false,
          safe: false,
          suspectedPit: false,
          confirmedPit: false,
          suspectedWumpus: false,
          confirmedWumpus: false,
          deadWumpus: false,
        }))
    );

  const pits = [
    [5, 2],
    [3, 7],
    [6, 4]
  ];
  const wumpuses = [
    [8, 2],
    [5, 5]
  ];
  const gold = [6, 6];

  pits.forEach(([x, y]) => {
    board[x][y].pit = true;
  });

  wumpuses.forEach(([x, y]) => {
    board[x][y].wumpus = true;
  });


  board[gold[0]][gold[1]].gold = true;

  [...getNeighbors(5, 2), ...getNeighbors(3, 7), ...getNeighbors(6, 4)].forEach(({ x, y }) => {
    board[x][y].breeze = true;
  });

  //  اطراف ومپوس‌ها
  [...getNeighbors(8, 2), ...getNeighbors(5, 5)].forEach(({ x, y }) => {
    board[x][y].stench = true;
  });

  return board;
}

function getNeighbors(x: number, y: number) {
  const dirs = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];

  return dirs
    .map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
    .filter(({ x, y }) => x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE);
}

function App() {
  const [board, setBoard] = useState(generateBoard());
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [flag, setflag] = useState<boolean | null>(null);
  const [counter, setCounter] = useState(0);
  const handleMove = (x: number, y: number) => {
    // فقط خانه‌های مجاور و در گرید
    const dx = Math.abs(x - position.x);
    const dy = Math.abs(y - position.y);
    if ((dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0)) {
      setPosition({ x, y });

      const newBoard = board.map((row, i) =>
        row.map((cell, j) => {
          if (i === x && j === y) {
            return { ...cell, visited: true };
          }
          return cell;
        })
      );

      setBoard(newBoard);
    }

    if (dx > 1 && dy > 1) {
      let flag = false;
      getNeighbors(x, y).forEach(({ x, y }) => {
        const cell = board[x][y];
        if (cell.visited) {
          flag = true;
        }

      });
      if (flag) {
        setPosition({ x, y });

        const newBoard = board.map((row, i) =>
          row.map((cell, j) => {
            if (i === x && j === y) {
              return { ...cell, visited: true };
            }
            return cell;
          })
        );

        setBoard(newBoard);
      }
    };
  }

  useEffect(() => {
    let current = board[position.x][position.y];
    let location= { x: position.x, y: position.y };
    if (flag) {
      const unvisitedSafeCells: { x: number; y: number }[] = [];
      board.forEach((row, i) => {
        row.forEach((cell, j) => {
          if (cell.safe && !cell.visited) {
            unvisitedSafeCells.push({ x: i, y: j });
          }
        });
      });
      console.log(unvisitedSafeCells);
      getNeighbors(unvisitedSafeCells[counter].x, unvisitedSafeCells[counter].y).forEach(({ x, y }) => {
        if (board[x][y].visited === true) {
          current = board[x][y];
          location = { x, y };
        }
      });
      setPosition(location);
      setCounter(counter + 1);
      setflag(false);
    }

    if (current.gold) {
      alert("طلا پیدا شد");
      return;
    }

    // علامت‌ گذاری خانه فعلی
    const newBoard = board.map((row, i) =>
      row.map((cell, j) => {
        if (i === position.x && j === position.y) {
          return { ...cell, visited: true };
        }
        return { ...cell };
      })
    );

    if (!current.breeze && !current.stench) {
      getNeighbors(position.x, position.y).forEach(({ x, y }) => {
        newBoard[x][y].safe = true;
      });
    }

    // استنتاج ساده: breeze → suspectedPit
    if (current.breeze) {
      getNeighbors(position.x, position.y).forEach(({ x, y }) => {
        const neighbor = newBoard[x][y];
        if (!neighbor.visited && !neighbor.safe) {
          neighbor.suspectedPit = true;
        }
      });
    }

    // استنتاج ساده: stench → suspectedWumpus
    if (current.stench) {
      getNeighbors(position.x, position.y).forEach(({ x, y }) => {
        const neighbor = newBoard[x][y];
        if (!neighbor.visited && !neighbor.safe) {
          neighbor.suspectedWumpus = true;
        }
      });
    }
    const safeMoves = getNeighbors(position.x, position.y).filter(({ x, y }) => {
      const cell = newBoard[x][y];
      return !cell.visited && cell.safe;
    });
    function moves() {
      // اگر گزینه امن نبود → برگشت به خانه قبلی
      if (safeMoves.length > 0) {
        const next = safeMoves[0]; 
        setTimeout(() => {
          setPosition({ x: next.x, y: next.y });
          setBoard(newBoard);
        }, 300);
      }
      if (safeMoves.length === 0) {
        setflag(true);
      }
    }
    moves();
  }, [board, position, flag]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold mb-2">Wumpus World</h1>

      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 2.5rem)` }}>
        {board.map((row, i) =>
          row.map((cell, j) => {
            const isAgent = i === position.x && j === position.y;
            const className = `
                w-10 h-10 text-sm rounded flex items-center justify-center
                border cursor-pointer
                ${isAgent ? "bg-blue-300" :
                !cell.visited ? "bg-gray-300" :
                  cell.gold ? "bg-yellow-300" :
                    cell.pit ? "bg-black text-white" :
                      cell.wumpus ? "bg-red-500 text-white" :
                        "bg-green-100"}
              `;
            const icon = cell.visited
              ? cell.gold ? "💰"
                : cell.pit ? "🕳️"
                  : cell.wumpus ? "👹"
                    : cell.breeze && cell.stench ? "💨👃"
                      : cell.breeze ? "💨"
                        : cell.stench ? "👃"
                          : isAgent ? "🤖"
                            : ""
              : "❔";
            return (
              <div
                key={`${i}-${j}`}
                className={className}
                onClick={() => handleMove(i, j)}
              >
                {icon}
              </div>
            );
          })
        )}
      </div>

      <p className="mt-2 text-sm text-gray-600">
        موقعیت عامل: ({position.x}, {position.y})
      </p>
    </div>
  );
}


export default App;


