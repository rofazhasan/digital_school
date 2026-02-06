# Compound/Complex FBD Usage Guide

## Overview
You can now create **compound FBDs** that combine multiple physics elements! These are perfect for advanced physics problems.

## Available Compound Diagrams

### 1. Spring-Loaded Projectile
**Combines:** Spring mechanics + Projectile motion

**Syntax:**
```
##PRESET:spring-projectile(springConstant,mass,angle)##
```

**Example:**
```
##PRESET:spring-projectile(100,2,45)##
```
Shows a projectile launched by a compressed spring at 45°.

**Use Cases:**
- Spring-loaded cannons
- Catapult mechanics
- Energy conversion problems

---

### 2. Spring Pendulum (Elastic Pendulum)
**Combines:** Spring oscillation + Pendulum swing

**Syntax:**
```
##PRESET:spring-pendulum(restLength,mass,angle,extension)##
```

**Example:**
```
##PRESET:spring-pendulum(100,2,20,20)##
```
Shows a pendulum with an elastic string that can stretch.

**Use Cases:**
- Elastic pendulum problems
- Combined oscillations
- Energy in elastic systems

---

### 3. Double Pendulum
**Combines:** Two pendulums in series

**Syntax:**
```
##PRESET:double-pendulum(length1,length2,angle1,angle2)##
```

**Example:**
```
##PRESET:double-pendulum(100,80,30,45)##
```
Shows two pendulums connected end-to-end.

**Use Cases:**
- Chaotic motion
- Coupled oscillations
- Advanced dynamics

---

### 4. Incline with Spring
**Combines:** Inclined plane + Spring force

**Syntax:**
```
##PRESET:incline-spring(angle,mass,compression)##
```

**Example:**
```
##PRESET:incline-spring(30,5,0.2)##
```
Shows a block on an incline connected to a spring.

**Use Cases:**
- Spring on ramps
- Energy conservation on inclines
- Friction with springs

---

### 5. Coupled Oscillators
**Combines:** Two masses connected by springs

**Syntax:**
```
##PRESET:coupled-oscillators(mass1,mass2)##
```

**Example:**
```
##PRESET:coupled-oscillators(3,5)##
```
Shows two masses connected by a spring between them.

**Use Cases:**
- Normal modes
- Coupled harmonic motion
- Wave propagation basics

---

### 6. Projectile with Air Resistance
**Combines:** Projectile motion + Drag force

**Syntax:**
```
##PRESET:projectile-drag(velocity,angle)##
```

**Example:**
```
##PRESET:projectile-drag(30,45)##
```
Shows projectile motion with air resistance forces.

**Use Cases:**
- Realistic projectile motion
- Terminal velocity
- Drag force analysis

---

### 7. Conical Pendulum
**Combines:** Pendulum + Circular motion

**Syntax:**
```
##PRESET:conical-pendulum(length,angle)##
```

**Example:**
```
##PRESET:conical-pendulum(100,30)##
```
Shows a pendulum moving in a horizontal circle.

**Use Cases:**
- Centripetal force
- Circular motion
- Tension analysis

---

## Excel Usage Examples

### Example 1: Spring Projectile Problem
```
| Question Text |
|---------------|
| A 2kg ball is launched by a spring (k=100 N/m) at 45°. ##PRESET:spring-projectile(100,2,45)## Calculate the maximum height. |
```

### Example 2: Spring Pendulum
```
| Question Text |
|---------------|
| An elastic pendulum has rest length 1m and extends by 20cm. ##PRESET:spring-pendulum(100,2,20,20)## Find the period. |
```

### Example 3: Multiple Diagrams
```
| Question Text |
|---------------|
| Compare simple pendulum ##PRESET:pendulum(100,30)## with spring pendulum ##PRESET:spring-pendulum(100,2,30,15)##. |
```

### Example 4: In Options
```
| Option A | Option B |
|----------|----------|
| ##PRESET:spring-projectile(100,2,30)## | ##PRESET:projectile-drag(30,30)## |
```

---

## Combining with Regular Presets

You can mix compound and simple presets:

```
Question: A system has three components:
1. Simple spring: ##PRESET:spring(5,vertical)##
2. Spring projectile: ##PRESET:spring-projectile(100,5,45)##
3. Regular projectile: ##PRESET:projectile(45,20)##

Compare their behaviors.
```

---

## Custom Compound Diagrams

If you need a custom combination not in presets, use the custom format:

```
##P1(300,200) | P2(400,150) | F1@P1(80,45,F_spring,applied) | F2@P1(60,270,mg,weight) | F3@P2(70,0,v,applied)##
```

This creates a fully custom compound diagram with multiple points and forces.

---

## Summary

**Total Compound Presets: 7**
- spring-projectile
- spring-pendulum
- double-pendulum
- incline-spring
- coupled-oscillators
- projectile-drag
- conical-pendulum

**Total System Presets: 59** (52 basic + 7 compound)

All compound diagrams work with the same `## ##` syntax and can be embedded anywhere in your questions!
