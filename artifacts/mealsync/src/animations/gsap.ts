import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugins
gsap.registerPlugin(ScrollTrigger);

// Global GSAP defaults
gsap.config({
  nullTargetWarn: false,
});

export { gsap, ScrollTrigger };
