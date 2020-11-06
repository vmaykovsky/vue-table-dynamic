export const toFixed = (num, s) => {
  let times = Math.pow(10, s)
  let des = num * times + (num >= 0 || -1) * 0.5
  return parseInt(des, 10) / times
}

export const isPercentage = (p) => {
  return (typeof p === 'string') && /^\d+(\.\d+)?%$/.test(p)
}

export function debounce(func, wait, immediate) {
  let timeout, args, context, timestamp, result;
  if (wait === null) { wait = 100; }

  function later() {
    const last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        context = args = null;
      }
    }
  };

  const debounced = function () {
    context = this;
    args = arguments;
    timestamp = Date.now();
    const callNow = immediate && !timeout;
    if (!timeout) { timeout = setTimeout(later, wait); }
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };

  debounced.clear = function () {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  debounced.flush = function () {
    if (timeout) {
      result = func.apply(context, args);
      context = args = null;

      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
};