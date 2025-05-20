export function businessDaysBetween(target: Date): number {
    const today = new Date();
    // zero out time
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let count = 0;
    const cursor = new Date(start);
    while (cursor < target) {
      cursor.setDate(cursor.getDate() + 1);
      const day = cursor.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
    }
    return count;
  }