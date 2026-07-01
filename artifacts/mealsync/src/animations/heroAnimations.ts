import { gsap } from './gsap';

export const initHeroAnimations = () => {
  const isMobile = window.innerWidth < 768;
  const tl = gsap.timeline({ 
    defaults: { 
      ease: 'power3.out',
      clearProps: 'all' 
    } 
  });

  tl.from('.hero-badge', {
    y: 15,
    opacity: 0,
    duration: 0.6,
  })
    .from('.hero-title', {
      y: 20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.05,
    }, '-=0.4')
    .from('.hero-description', {
      y: 15,
      opacity: 0,
      duration: 0.6,
    }, '-=0.6')
    .from('.hero-buttons', {
      y: 15,
      opacity: 0,
      duration: 0.6,
      stagger: 0.05,
    }, '-=0.4')
    .from('.hero-social', {
      opacity: 0,
      duration: 0.8,
    }, '-=0.4')
    .from('.hero-3d', {
      scale: 0.9,
      opacity: 0,
      duration: 1,
    }, '-=1');

  // Floating animation - only on desktop or reduced intensity
  gsap.to('.floating-element', {
    y: isMobile ? -5 : -15,
    duration: 2.5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
    stagger: {
      each: 0.3,
      from: 'random',
    },
  });

  return tl;
};
