import { gsap, ScrollTrigger } from './gsap';

export const initScrollReveal = () => {
  const revealElements = document.querySelectorAll('.reveal');

  revealElements.forEach((el) => {
    const direction = el.getAttribute('data-reveal-direction') || 'up';
    const delay = parseFloat(el.getAttribute('data-reveal-delay') || '0');
    
    let vars: gsap.TweenVars = {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      clearProps: 'all',
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
        toggleActions: 'play none none none',
        once: true,
      },
      delay: delay,
    };

    if (direction === 'up') vars.y = 40;
    else if (direction === 'down') vars.y = -40;
    else if (direction === 'left') vars.x = 40;
    else if (direction === 'right') vars.x = -40;
    else if (direction === 'scale') vars.scale = 0.9;

    gsap.from(el, vars);
  });

  // Staggered reveals
  const staggerContainers = document.querySelectorAll('.stagger-reveal');
  staggerContainers.forEach((container) => {
    const children = container.children;
    gsap.from(children, {
      opacity: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: container,
        start: 'top 80%',
        toggleActions: 'play none none none',
        once: true,
      },
    });
  });

  // Parallax effects
  const parallaxElements = document.querySelectorAll('.parallax');
  parallaxElements.forEach((el) => {
    const speed = parseFloat(el.getAttribute('data-parallax-speed') || '0.1');
    gsap.to(el, {
      y: (i, target) => -ScrollTrigger.maxScroll(window) * speed,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });
};
