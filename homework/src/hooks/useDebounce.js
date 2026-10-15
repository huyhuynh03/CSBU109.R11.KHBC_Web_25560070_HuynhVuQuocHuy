import { useEffect, useState } from "react";

// Trả về giá trị sau khi người dùng ngừng thay đổi `value` trong `delay` ms
export default function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
