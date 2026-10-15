import { useState } from "react";
import Exercise1 from "./exercises/Exercise1.jsx";
import Exercise2 from "./exercises/Exercise2.jsx";
import Exercise3 from "./exercises/Exercise3.jsx";

const EXERCISES = [
  { id: 1, label: "Bài 1: Components & Props", Component: Exercise1 },
  { id: 2, label: "Bài 2: useState & useEffect", Component: Exercise2 },
  { id: 3, label: "Bài 3: Public API (DummyJSON)", Component: Exercise3 },
];

export default function App() {
  const [current, setCurrent] = useState(1);
  const { Component } = EXERCISES.find((e) => e.id === current);

  return (
    <>
      <nav>
        {EXERCISES.map((e) => (
          <button
            key={e.id}
            className={e.id === current ? "active" : ""}
            onClick={() => setCurrent(e.id)}
          >
            {e.label}
          </button>
        ))}
      </nav>
      <div className="container">
        <Component />
      </div>
    </>
  );
}
