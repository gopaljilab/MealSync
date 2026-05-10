import { gsap, ScrollTrigger } from './gsap';

export const initCounterAnimations = () => {
  const counters = document.querySelectorAll('.counter');

  counters.forEach((counter) => {
    const targetValue = parseInt(counter.getAttribute('data-target') || '0', 10);
    const suffix = counter.getAttribute('data-suffix') || '';
    const obj = { value: 0 };

    gsap.to(obj, {
      value: targetValue,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: counter,
        start: 'top 90%',
        toggleActions: 'play none none none',
        once: true,
      },
      onUpdate: () => {
        counter.textContent = Math.floor(obj.value).toLocaleString() + suffix;
      },
    });
  });
};
