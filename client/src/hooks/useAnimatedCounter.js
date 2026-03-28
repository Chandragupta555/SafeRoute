import { useState, useEffect, useRef } from 'react';

export default function useAnimatedCounter(targetValue, duration = 600) {
  const [value, setValue] = useState(targetValue);
  const prevTargetRef = useRef(targetValue);
  const reqRef = useRef();

  useEffect(() => {
    if (targetValue === prevTargetRef.current) return;
    
    if (reqRef.current) {
      cancelAnimationFrame(reqRef.current);
    }
    
    const startValue = prevTargetRef.current;
    const endValue = targetValue;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      const currentVal = startValue + (endValue - startValue) * easeProgress;
      setValue(Math.round(currentVal));
      
      if (progress < 1) {
        reqRef.current = requestAnimationFrame(animate);
      } else {
        prevTargetRef.current = endValue;
        setValue(endValue);
      }
    };
    
    reqRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [targetValue, duration]);

  return value;
}
