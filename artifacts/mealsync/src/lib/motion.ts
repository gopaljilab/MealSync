/* Framer Motion Presets & Transitions for MealSync */

import { Transition, Variants } from "framer-motion";

// Standard Spring Transition inspired by Linear/Stripe
export const transitionSpring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 30,
};

// Slightly softer spring for larger panels or drawers
export const transitionSpringSoft: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 24,
};

// Smooth ease-out for standard animations
export const transitionEase: Transition = {
  type: "tween",
  ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier
  duration: 0.6,
};

// Fade In Variant
export const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: transitionEase,
  },
};

// Stagger Container Variant
export const staggerContainerVariants = (staggerChildren = 0.08): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
    },
  },
});

// Card Hover Variant (For Desktop only)
export const cardHoverVariants: Variants = {
  initial: {
    y: 0,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  hover: {
    y: -4,
    borderColor: "rgba(16, 185, 129, 0.2)",
    boxShadow: "0 12px 30px -10px rgba(0, 0, 0, 0.4)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

// Scale-up on tap for buttons
export const buttonTapVariants = {
  hover: { scale: 1.015, y: -1 },
  tap: { scale: 0.985, y: 0 },
};
